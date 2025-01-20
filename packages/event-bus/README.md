<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Event%20Bus" alt="Solid Primitives Event Bus">
</p>

# @solid-primitives/event-bus

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/event-bus?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/event-bus)
[![size](https://img.shields.io/npm/v/@solid-primitives/event-bus?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/event-bus)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A collection of SolidJS primitives providing various features of a pubsub/event-emitter/event-bus:

- [`createEventBus`](#createeventbus) - Provides a simple way to listen to and emit events.
- [`createEmitter`](#createemitter) - Creates an emitter with which you can listen to and emit various events.
- [`createEventHub`](#createeventhub) - Provides helpers for using a group of buses.
- [`createEventStack`](#createeventstack) - Provides the emitted events as list/history, with tools to manage it.

## Installation

```bash
npm install @solid-primitives/event-bus
# or
pnpm add @solid-primitives/event-bus
# or
yarn add @solid-primitives/event-bus
```

## `createEventBus`

Provides all the base functions of an event-emitter, plus additional functions for managing listeners, it's behavior could be customized with an config object. Good for advanced usage.

### How to use it

```ts
import { createEventBus } from "@solid-primitives/event-bus";

const bus = createEventBus<string>();

// can be used without payload type, if you don't want to send any
createEventBus();

// bus can be destructured:
const { listen, emit, clear } = bus;

const unsub = bus.listen(a => console.log(a));

bus.emit("foo");

// unsub gets called automatically on cleanup
unsub();
```

## `createEmitter`

Creates an emitter with which you can listen to and emit various events.

### How to use it

```ts
import { createEmitter } from "@solid-primitives/event-bus";

const emitter = createEmitter<{
  foo: number;
  bar: string;
}>();
// can be destructured
const { on, emit, clear } = emitter;

emitter.on("foo", e => {});
emitter.on("bar", e => {});

emitter.emit("foo", 0);
emitter.emit("bar", "hello");

// unsub gets called automatically on cleanup
unsub();
```

### `createGlobalEmitter`

Wrapper around `createEmitter`.

Creates an emitter with which you can listen to and emit various events. With this emitter you can also listen to all events.

```ts
import { createGlobalEmitter } from "@solid-primitives/event-bus";

const emitter = createGlobalEmitter<{
  foo: number;
  bar: string;
}>();
// can be destructured
const { on, emit, clear, listen } = emitter;

emitter.on("foo", e => {});
emitter.on("bar", e => {});

emitter.emit("foo", 0);
emitter.emit("bar", "hello");

// global listener - listens to all channels
emitter.listen(e => {
  switch (e.name) {
    case "foo": {
      e.details;
      break;
    }
    case "bar": {
      e.details;
      break;
    }
  }
});
```

## `createEventHub`

Provides helpers for using a group of event buses.

Can be used with `createEventBus`, `createEventStack` or any emitter that has the same api.

### How to use it

#### Creating EventHub

```ts
import { createEventHub } from "@solid-primitives/event-bus";

// by passing an record of Channels
const hub = createEventHub({
  busA: createEventBus(),
  busB: createEventBus<string>(),
  busC: createEventStack<{ text: string }>(),
});

// by passing a function
const hub = createEventHub(bus => ({
  busA: bus<number>(),
  busB: bus<string>(),
  busC: createEventStack<{ text: string }>(),
}));

// hub can be destructured
const { busA, busB, on, emit, listen, value } = hub;
```

#### Listening & Emitting

```ts
const hub = createEventHub({
  busA: createEventBus<void>(),
  busB: createEventBus<string>(),
  busC: createEventStack<{ text: string }>(),
});
// can be destructured
const { busA, busB, on, listen, emit } = hub;

hub.on("busA", e => {});
hub.on("busB", e => {});

hub.emit("busA", 0);
hub.emit("busB", "foo");

// global listener - listens to all channels
hub.listen(e => {
  switch (e.name) {
    case "busA": {
      e.details;
      break;
    }
    case "busB": {
      e.details;
      break;
    }
  }
});
```

#### Accessing values

If a emitter returns an accessor value, it will be available in a `.value` store.

```ts
hub.value.myBus;
// same as
hub.myBus.value();
```

## `createEventStack`

Extends [`createEmitter`](#createemitter). Provides the emitted events in a list/history form, with tools to manage it.

### How to use it

```ts
import { createEventStack } from "@solid-primitives/event-bus";

const bus = createEventStack<string, { message: string }>({
  // toValue parsing function is optional
  toValue: e => ({ message: e })
});
// can be destructured:
const { listen, emit, clear, value } = bus;

const listener: EventStackListener<{ text: string }> = ({ event, stack, remove }) => {
  console.log(event, stack);
  // you can remove the value from stack
  remove();
};
bus.listen(listener);

bus.emit({ text: "foo" });

// a signal accessor:
bus.value() // => { text: string }[]

bus.setValue(stack => stack.filter(item => {...}))
```

## EventBus Utils

### `toPromise`

Turns a stream-like listen function, into a promise resolving when the first event is captured.

```ts
import { toPromise } from "@solid-primitives/event-bus";

const emitter = createEmitter<string>();
const event = await toPromise(emitter.listen);

// can be used together with raceTimeout from @solid-primitives/utils
import { raceTimeout } from "@solid-primitives/utils";
try {
  const event = await raceTimeout(toPromise(emitter.listen), 2000, true, "event was too slow");
  // if event is quicker:
  event; // => string
} catch (err) {
  // if timeouts:
  console.log(err); // => "event was too slow"
}
```

### `once`

Listen to any EventBus/Emitter, but the listener will automatically unsubscribe on the first captured event. So the callback will run only **once**.

```ts
import { once } from "@solid-primitives/event-bus";

const { listen, emit } = createEmitter<string>();
const unsub = once(listen, event => console.log(event));

emit("foo"); // will log "foo" and unsub

emit("bar"); // won't log
```

### `toEffect`

Wraps `emit` calls inside a `createEffect`. It causes that listeners execute having an reactive owner available. It allows for usage of effects, memos and other primitives inside listeners, without having to create a synthetic root.

```ts
import { toEffect } from "@solid-primitives/event-bus";

const { listen, emit } = createEmitter();
const emitInEffect = toEffect(emit);

// owner is needed for creating computations like createEffect
listen(() => console.log(getOwner()));

// ...sometime later (after root initiation):
emit(); // listener will log `null`
emitInEffect(); // listener will log an owner object
```

### `batchEmits`

Wraps `emit` calls inside a `batch` call. It causes that listeners execute in a single batch, so they are not executed in sepatate queue ticks.

```ts
import { createEventBus, batchEmits } from "@solid-primitives/event-bus";

const bus = batchEmits(createEventBus());

const [a, setA] = createSignal(0);
const [b, setB] = createSignal(0);

bus.listen(setA);
bus.listen(setB);

bus.emit(1); // will set both a and b to 1 in a single batch
```

## Demo

https://codesandbox.io/s/solid-primitives-event-bus-6fp4h?file=/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
