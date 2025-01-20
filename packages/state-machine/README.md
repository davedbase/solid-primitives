<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=state-machine" alt="Solid Primitives state-machine">
</p>

# @solid-primitives/state-machine

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/state-machine?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/state-machine)
[![version](https://img.shields.io/npm/v/@solid-primitives/state-machine?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/state-machine)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A primitive for creating a reactive state machine. For expressing possible exclusive states and transitions, and bounding reactive computations to the lifecycle of those states.

## Installation

```bash
npm install @solid-primitives/state-machine
# or
yarn add @solid-primitives/state-machine
# or
pnpm add @solid-primitives/state-machine
```

## How to use it

`createMachine` is a simple primitive for creating a reactive state machine. It takes a configuration object with the following properties:

- `initial` - The initial state of the machine.

- `states` - Implementation of the states of the machine. Each state implements a callback called when the machine enters that state with parameters received from the transition. Value returned from the callback will be available as the value of the state.

`createMachine` requires passing a type parameter defining the states. It expects an object with keys being the names of the states and values being objects with the following properties:

- `input` - Value to be passed to the state callback when the machine enters that state.

- `value` - Value returned from the state callback.

- `to` - Union of state names that can be transitioned to from this state. If not provided, any state can be transitioned to from this state. `never` will create a terminal state.

```ts
import { createMachine } from "@solid-primitives/state-machine";

const state = createMachine<{
  idle: {
    value: "foo";
  };
  loading: {
    input: number;
    value: "bar";
  };
}>({
  initial: "idle",
  states: {
    idle(input, to) {
      return "foo";
    },
    loading(input, to) {
      setTimeout(() => to("idle"), input);
      return "bar";
    },
  },
});
```

Value returned from `createMachine` is a signal with the following properties:

- `type` - Current state of the machine.

- `value` - Value returned from the state callback.

- `to` - Function for transitioning to another state. It takes a state name and optional input for the state callback.

```ts
const v = state();
v.type; // "idle"
v.value; // "foo"

if (v.type === "idle") {
  v.to.loading(1000);

  v.type; // "loading"
  v.value; // "bar"
}
```

The state properties are also implemented as getters on the function itself:

```ts
state.type; // "idle"
state.value; // "foo"

if (state.type === "idle") {
  state.to.loading(1000);
}
```

### Lifecycle

`createMachine` is implemented using `createMemo`, which reruns when the state is changed. This means that any reactive computations can be used inside the state callbacks and they will be disposed when the state changes. (owner context will be available in the callbacks)

```tsx
const state = createMachine({
  initial: "counter",
  states: {
    counter() {
      const [count, setCount] = createSignal(0);
      const interval = setInterval(() => setCount(c => c + 1), 1000);

      createEffect(() => {
        console.log(count());
      });

      // will be disposed when the state changes
      onCleanup(() => clearInterval(interval));

      // can return a JSX element
      return <span>{count()}</span>;
    },
    disabled() {
      return "disabled";
    },
  },
});

return (
  <>
    <div>Count: {state.value}</div>
    <button
      disabled={state.type === "disabled"}
      onClick={() => {
        if (state.type === "counter") {
          state.to.disabled();
        }
      }}
    >
      Disable
    </button>
  </>
);
```

### JSX Elements

`createMachine` can be used like a `<Switch/>` component, and used for rendering different JSX elements based on the current state.

```tsx
function TodoItem(props: TodoProps) {
  const state = createMachine<{
    Reading: {
      value: JSX.Element;
    };
    Editing: {
      value: JSX.Element;
    };
  }>({
    initial: "Reading",
    states: {
      Reading(_, next) {
        return (
          <>
            <input type="checkbox" checked={props.todo.done} onChange={props.onToggle} />
            <div onClick={() => next.Editing()}>{props.todo.title}</div>
            <button onClick={() => props.onRemove()}>x</button>
          </>
        );
      },
    },
    Editing(_, next) {
      function commit() {
        onEdit(input.value);
        next.Reading();
      }

      let input!: HTMLInputElement;
      return <input ref={input} type="text" value={props.todo.title} onChange={commit} />;
    },
  });

  return <div>{state.value}</div>;
}
```

### Events

`createMachine` can be used for handling events in a declarative way. Although it doesn't implement anything special for handling events, any function can be returned from the state callback and it will be called when the event is triggered.

```tsx
type Events = {
  NEXT: () => void;
  // make events optional to not have to
  // implement them in every state
  RESET?: () => void;
};

const state = createMachine<{
  red: {
    value: Events;
    // you can limit the states that can be transitioned to
    to: "yellow";
  };
  yellow: {
    value: Events;
    to: "green" | "red";
  };
  green: {
    value: Events;
    to: "red";
  };
}>({
  initial: "red",
  states: {
    red(_, next) {
      return {
        NEXT: () => next.yellow(),
      };
    },
    yellow(_, next) {
      return {
        NEXT: () => next.green(),
        RESET: () => next.red(),
      };
    },
    green(_, next) {
      return {
        NEXT: () => next.red(),
        RESET: () => next.red(),
      };
    },
  },
});

state.value.NEXT(); // transition to the next state

state.value.RESET?.(); // reset to the initial state
```

### Hoisting

To avoid recreating the state machine callbacks each time, the state implementation object can be hoisted outside of the `createMachine` call.

Then to define a way for the machine to communicate with the outside world, declate a shared type for the state inputs (kinda like component props), and use it when initializing the machine.

```tsx
type TodoProps = {
  todo: Todo;
};

const todo_states: MachineStates<{
  Reading: {
    input: TodoProps;
    value: JSX.Element;
  };
  Editing: {
    input: TodoProps;
    value: JSX.Element;
  };
}> = {
  Reading(props, next) {
    return (
      <>
        <input type="checkbox" checked={props.todo.done} onChange={props.onToggle} />
        <div onClick={() => next.Editing(props)}>{props.todo.title}</div>
        <button onClick={props.onRemove}>x</button>
      </>
    );
  },
  Editing(props, next) {
    function commit() {
      onEdit(input.value);
      next.Reading(props);
    }

    let input!: HTMLInputElement;
    return <input ref={input} type="text" value={props.todo.title} onChange={commit} />;
  },
};

function TodoItem(props: TodoProps) {
  // generic will be inferred from the input type
  const state = createMachine({
    initial: {
      type: "Reading",
      // input is required
      input: props,
    },
    states: todo_states,
  });

  return <div>{state.value}</div>;
}
```

### Typing expected state

If you expect a specific state, e.g. in component props, you can use the `MachineState` type:

```ts
import { MachineState } from "@solid-primitives/state-machine";

// states definition passed to createMachine
type MyStates = {
  idle: {
    value: string;
  };
  loading: {
    value: number;
  };
};

type IdleState = MachineState<MyStates, "idle">;

type Props = {
  state: IdleState;
};

function MyComponent(props: Props) {
  props.state.type; // "idle"
  props.state.value; // string
}
```

### Using name references

Using strings as state names is easy, but won't let you use your TypeScript's LSP to its full potential for refactoring and looking up usages.

As an alternative you can make use of `const` variables or TypeScript `enums`:

```ts
const states = {
  idle: {/* ... */};
  loading: {/* ... */};
};

type States = keyof typeof states;

state.to.idle();

//
// or with const variables
//

const IDLE = "idle";
const LOADING = "loading";

const states = {
  [IDLE]: {/* ... */};
  [LOADING]: {/* ... */};
};

type States = typeof IDLE | typeof LOADING;

state.to(IDLE);

//
// or with TypeScript enums
//

enum States {
  Idle = "idle",
  Loading = "loading",
}

const states = {
  [States.Idle]: {/* ... */};
  [States.Loading]: {/* ... */};
};

state.to(States.Idle);
```

## Demo

You may see the working example here: https://primitives.solidjs.community/playground/state-machine/

Source code: https://github.com/solidjs-community/solid-primitives/blob/main/packages/state-machine/dev/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
