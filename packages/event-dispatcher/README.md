<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=event-dispatcher" alt="Solid Primitives event-dispatcher">
</p>

# @solid-primitives/event-dispatcher

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/event-dispatcher?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/event-dispatcher)
[![version](https://img.shields.io/npm/v/@solid-primitives/event-dispatcher?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/event-dispatcher)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

`createEventDispatcher` creates a custom-event dispatcher for emitting component events.
SolidJS equivalent of Svelte's [homonymous function](svelte.dev/docs#run-time-svelte-createeventdispatcher).

## Installation

```bash
npm install @solid-primitives/event-dispatcher
# or
yarn add @solid-primitives/event-dispatcher
```

## How to use it

### Exemple: create and dispatch the event

```tsx
import { createEventDispatcher } from "@solid-primitives/event-dispatcher";

interface Props {
  onCustomMessage: (evt: CustomEvent<string>) => void;
}

function ChildComponent(props: Props) {
  const dispatch = createEventDispatcher(props);

  return (
    <button onClick={() => dispatch("customMessage", "yo World!", { cancelable: true })}>
      send
    </button>
  );
}
```

### `createEventDispatcher`

`createEventDispatcher` takes one argument, the component's `props`, and returns an event dispatcher function. `props` must be passed as they are, without changing or spreading spreading them, in order to maintain their reactivity.

### `dispatch` and the created custom event

The resulting event dispatcher is named by convention `dispatch`, and will create a DOM custom event (`CustomEvent<T>`) and call the associated event handler. It takes 3 arguments:

1. the event name (`name: string`), in lower camel case. E.g, `customMessage`. When dispatching the event, the dispatcher will look for the "`on`+ upper camel case name in the props (`onCustomMessage`).
2. the payload (`payload?: any`), the payload associated to the event. This value is optional, and will be accessible in the `CustomEvent.detail` property.
3. custom event options (`dispatcherOptions: { cancelable: boolean }`). The dispatcherOptions is an object with one property, `cancelable`, which determines whether the created custom event is cancelable (meaning its `preventDefault()` method can be called). This arguments is optional and defaults to `{ cancelable: false }`.

To parallel [DOM's `dispatchEvent`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent), `dispatch` will return `false`, if the custom event is cancelable and `preventDefault()` has been called, `true` in all the other cases (even if there is no event handler associated to the event).

```tsx
const submitCustomForm = () => {
  const dispatched = dispatch("customSubmit", data(), { cancelable: true });

  if (!dispatched) return;

  apiPost(url(), data());
};
```

Finally, the custom events created with `dispatch` don't bubble.

### Listening to and handling the component event

```tsx
function ParentComponent() {
  function handleMessage(evt: CustomEvent<string>) {
    console.log("the message is " + evt.detail);
  }

  return <Child onCustomMessage={handleMessage} />;
}
```

The parent component will be able to listen to any event dispatched by its child component as it would listen to any DOM event: by passing a "`on` + capitalized name of the event" prop to the child, with the event handler function.
If the child component dispatched any payload with the event, the handler will be able to access it in `event.detail`. The handler will also be able to call `event.preventDefault()` if the event is cancellable.

### Handling the case of optional event handlers

You won't have to worry about checking if an optional event handler was passed or not in the props, as dispatch will do it under the hood, avoiding the `Uncaught TypeError: props.onOptionalEvent is not a function`.

```tsx
// without createEventDispatcher
<button onClick={() => {
  if (props.onOptionalEvent) {
    props.onOptionalEvent()
  }
}}>emit</button>

// with createEventDispatcher
<button onClick={() => dispatch('optionalEvent')}>emit</button>
```

### TypeScript

`createEventDispatcher` has full TypeScript support (from version 4.1.5, as it uses `template literals types` and the `infer` keyword). In order to benefit from it, you need to type the component props.
With regards to the typing:

1. In the props type or interface, there should be an event listener prop for each component event dispatched. This event listener key corresponds to `on` + capitalized event name.
2. The value of each event listener is an event handler function, which takes one parameter, the `CustomEvent`, or none.
3. The payload type is passed as argument to the component event type.

```tsx
// if we will call dispatch('componentEvent', 'I am in event.detail')
interface Props {
  onComponentEvent: (evt: CustomEvent<string>) => void;
  nonEventProp: string;
}
```

When the dispatcher is created, and you start typing `dispatch()` TypeScript will suggest a list of the available event, which will be inferred by the props. The props that don't begin with `on` will be ignored.

```tsx
interface Props {
  onFirstComponentEvent: (evt: CustomEvent<string>) => void;
  onSecondComponentEvent: (evt: CustomEvent<number>) => void;
  nonEventProp: string;
}

// in the component
dispatch(""); // => will suggest "firstComponentEvent"|"secondComponentEvent" as first parameter
```

Once you have chosen the event, TypeScript will suggest the payload type for that specific event, and show an error if your payload is of the wrong type.

```tsx
interface Props {
  onStringEvent: (evt: CustomEvent<string>) => void;
  onNumberEvent: (evt: CustomEvent<number>) => void;
}

// in the component
dispatch("stringEvent"); // => will suggest "(eventName: "changeStep", payload: string, dispatcherOptions?: DispatcherOptions | undefined) => boolean"
dispatch("numberEvent", "forty-two"); // will throw "Error: Argument of type 'string' is not assignable to parameter of type 'number'."
```

Finally, TypeScript will handle suggestions and errors also according to weather the event is otpional or not, requesting to pass a second argument (the `payload`), when the event is non-nullable.

```tsx
interface Props {
  onMandatoryPayload: (evt: CustomEvent<number>) => void;
  onOptionalPayload: (evt?: CustomEvent<string>) => void;
}

// in the component
dispatch("mandatoryPayload"); // => will throw: "Error: Expected 2-3 arguments, but got 1."
dispatch("optionalPayload"); // will not complain, but suggest "(eventName: "optionalPayload", payload?: number | undefined, ...
```

## Demo

You can use this template for publishing your demo on CodeSandbox: https://codesandbox.io/s/solid-create-event-dispatcher-example-fbj9ge

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
