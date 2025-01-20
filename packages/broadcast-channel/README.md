<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=broadcast-channel" alt="Solid Primitives broadcast-channel">
</p>

# @solid-primitives/broadcast-channel

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/broadcast-channel?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/broadcast-channel)
[![version](https://img.shields.io/npm/v/@solid-primitives/broadcast-channel?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/broadcast-channel)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitive to manage [Broadcast Channel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API). The Broadcast Channel is a browser API that allows basic communication between [browsing contexts](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context) (that is, windows, tabs, frames, or iframes) on the same [origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin).

## Installation

```bash
npm install @solid-primitives/broadcast-channel
# or
yarn add @solid-primitives/broadcast-channel
# or
pnpm add @solid-primitives/broadcast-channel
```

## Available primitives

- [`makeBroadcastChannel`](#makebroadcastchannel)
- [`createBroadcastChannel`](#createbroadcastchannel)

### `makeBroadcastChannel`

Creates a new [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) instance for cross-tab communication.

The channel name is used to identify the channel. If a channel with the same name already exists, it will be returned instead of creating a new one.

Channel attempt closing the channel when the on owner cleanup. If there are multiple connected instances, the channel will not be closed until the last owner is removed.

Returns an object with the following properties:

- `onMessage` - a function to subscribe to messages from other tabs
- `postMessage` - a function to send messages to other tabs
- `close` - a function to close the channel
- `channelName` - the name of the channel
- `instance` - the underlying [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) instance

```ts
const { postMessage } = makeBroadcastChannel("test_channel");

postMessage({ id: 2, message: "hi" });

// Another browsing context
const { onMessage } = makeBroadcastChannel("test_channel");

onMessage(({ data }) => {
  console.log(data); // { id: 2, message: "hi" }
});
```

You can use the same channel easily across different components in the same context

```ts
const Component_1 = () => {
  const { postMessage } = makeBroadcastChannel("river");

  const onClick = () => {
    postMessage("hi");
  };

  return <button onClick={onClick}>Send Message</button>;
};

const Component_2 = () => {
  const { onMessage } = makeBroadcastChannel("river");
  const [message, setMessage] = createSignal("");

  onMessage(({ data }) => {
    setMessage(data);
  });

  return <div>{message()}</div>;
};

const App = () => {
  const { onMessage } = makeBroadcastChannel("river");

  onMessage(({ data }) => {
    console.log(data);
  });

  return (
    <>
      <Component_1 />
      <Component_2 />
    </>
  );
};
```

### `createBroadcastChannel`

Provedes the same functionality as [`makeBroadcastChannel`](#makebroadcastchannel) but instead of returning `onMessage` function, it returns a `message` signal accessor that updates when postMessage is fired from other contexts.

```ts
const { postMessage } = createBroadcastChannel("test_channel");

postMessage({ id: 2, message: "hi" });

// Another browsing context
const { message } = createBroadcastChannel("test_channel");

createEffect(
  on(
    message,
    data => {
      console.log(data); // { id: 2, message: "hi" }
    },
    { defer: true },
  ),
);
```

## Type Safety

`makeBroadcastChannel` and `createBroadcastChannel` allows you to pass type which determines what should be passed to `postMessage` and what values `message()` or event.data from `onMessage` callback are.

```ts
const { onMessage, postMessage } = makeBroadcastChannel<string>("test_channel");

onMessage(({ data }) => {
  data; // Type 'string'
});
postMessage("hi");
```

```ts
type TData = { id: number; message: string };

const { message, postMessage } = createBroadcastChannel<TData>("test_channel");

postMessage({ id: "wrong type", message: "hi" }); // ❌
//            ^^^
// (property) id: number
// Type 'string' is not assignable to type 'number'.

postMessage({ id: 5, message: "hi" }); // ✅

createEffect(
  on(
    message,
    data => {
      consumeDataIncorrect(data!); // ❌
      //                    ^^^
      // Argument of type 'TData' is not assignable to parameter of type '{ id: string; message: string; }'.
      // Types of property 'id' are incompatible.
      // Type 'number' is not assignable to type 'string'.

      consumeDataCorrect(data!); // ✅
    },
    { defer: true },
  ),
);

const consumeDataIncorrect = (data: { id: string; message: string }) => {
  console.log(data);
};
const consumeDataCorrect = (data: { id: number; message: string }) => {
  console.log(data);
};
```

## Demo

Here's a working example here: https://stackblitz.com/edit/vitejs-vite-5xren3?file=src%2Fmain.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
