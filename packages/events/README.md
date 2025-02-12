<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=events" alt="Solid Primitives events">
</p>

# @solid-primitives/events

[![turborepo](https://img.shields.io/badge/built%20with-turborepo-cc00ff.svg?style=for-the-badge&logo=turborepo)](https://turborepo.org/)
[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/events?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/events)
[![version](https://img.shields.io/npm/v/@solid-primitives/events?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/events)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A set of primitives for declarative event composition and state derivation for solidjs. You can think of it as a much simpler version of Rxjs that integrates well with Solidjs.

[Here is an implementation of the Strello demo that uses `solid-events`](https://github.com/devagrawal09/strello/pull/1/files).

## Contents
- [@solid-primitives/events](#solid-primitivesevents)
  - [Contents](#contents)
  - [Installatiom](#installatiom)
  - [`createEvent`](#createevent)
    - [Tranformation](#tranformation)
    - [Disposal](#disposal)
    - [Halting](#halting)
    - [Async Events](#async-events)
  - [`createSubject`](#createsubject)
    - [`createAsyncSubject`](#createasyncsubject)
    - [`createSubjectStore`](#createsubjectstore)
  - [`createTopic`](#createtopic)
  - [`createPartition`](#createpartition)
  - [Use Cases](#use-cases)

## Installatiom

```bash
npm install solid-events
```
or
```bash
pnpm install solid-events
```
or
```bash
bun install solid-events
```


## `createEvent`

Returns an event handler and an event emitter. The handler can execute a callback when the event is emitted.

```ts
const [onEvent, emitEvent] = createEvent()

onEvent(payload => console.log(`Event emitted:`, payload))

...

emitEvent(`Hello World!`)
// logs "Event emitted: Hello World!"
```

### Tranformation

The handler can return a new handler with the value returned from the callback. This allows chaining transformations.

```ts
const [onIncrement, emitIncrement] = createEvent()

const onMessage = onIncrement((delta) => `Increment by ${delta}`)

onMessage(message => console.log(`Message emitted:`, message))

...

emitIncrement(2)
// logs "Message emitted: Increment by 2"
```

### Disposal
Handlers that are called inside a component are automatically cleaned up with the component, so no manual bookeeping is necesarry.

```tsx
function Counter() {
  const [onIncrement, emitIncrement] = createEvent()

  const onMessage = onIncrement((delta) => `Increment by ${delta}`)

  onMessage(message => console.log(`Message emitted:`, message))

  return <div>....</div>
}
```
Calling `onIncrement` and `onMessage` registers a stateful subscription. The lifecycle of these subscriptions are tied to their owner components. This ensures there's no memory leaks.

### Halting

Event propogation can be stopped at any point using `halt()`

```ts
const [onIncrement, emitIncrement] = createEvent()

const onValidIncrement = onIncrement(delta => delta < 1 ? halt() : delta)
const onMessage = onValidIncrement((delta) => `Increment by ${delta}`)

onMessage(message => console.log(`Message emitted:`, message))

...

emitIncrement(2)
// logs "Message emitted: Increment by 2"

...

emitIncrement(0)
// Doesn't log anything
```

`halt()` returns a `never`, so typescript correctly infers the return type of the handler.

### Async Events

If you return a promise from an event callback, the resulting event will wait to emit until the promise resolves. In other words, promises are automatically flattened by events.

```ts
async function createBoard(boardData) {
  "use server"
  const boardId = await db.boards.create(boardData)
  return boardId
}

const [onCreateBoard, emitCreateBoard] = createEvent()

const onBoardCreated = onCreateBoard(boardData => createBoard(boardData))

onBoardCreated(boardId => navigate(`/board/${boardId}`))
```

## `createSubject`

Events can be used to derive state using Subjects. A Subject is a signal that can be derived from event handlers.

```ts
const [onIncrement, emitIncrement] = createEvent()
const [onReset, emitReset] = createEvent()

const onMessage = onIncrement((delta) => `Increment by ${delta}`)
onMessage(message => console.log(`Message emitted:`, message))

const count = createSubject(
  0,
  onIncrement(delta => currentCount => currentCount + delta),
  onReset(() => 0)
)

createEffect(() => console.log(`count`, count()))

...

emitIncrement(2)
// logs "Message emitted: Increment by 2"
// logs "count 2"

emitReset()
// logs "count 0"
```

To update the value of a subject, event handlers can return a value (like `onReset`), or a function that transforms the current value (like `onIncrement`).

`createSubject` can also accept a signal as the first input instead of a static value. The subject's value resets whenever the source signal updates.

```tsx
function Counter(props) {
  const [onIncrement, emitIncrement] = createEvent()
  const [onReset, emitReset] = createEvent()

  const count = createSubject(
    () => props.count,
    onIncrement(delta => currentCount => currentCount + delta),
    onReset(() => 0)
  )

  return <div>...</div>
}
```

`createSubject` has some compound variations to complete use cases.

### `createAsyncSubject`

This subject accepts a reactive async function as the first argument similar to `createAsync`, and resets whenever the function reruns.

```ts
const getBoards = cache(async () => {
  "use server";
  // fetch from database
}, "get-boards");

export default function HomePage() {
  const [onDeleteBoard, emitDeleteBoard] = createEvent<number>();

  const boards = createAsyncSubject(
    () => getBoards(),
    onDeleteBoard(
      (boardId) => (boards) => boards.filter((board) => board.id !== boardId)
    )
  );

  ...
}
```

### `createSubjectStore`

This subject is a store instead of a regular signal. Event handlers can mutate the current state of the board directly. Uses `produce` under the hood.

```ts
const boardStore = createSubjectStore(
  () => boardData(),
  onCreateNote((createdNote) => (board) => {
    const index = board.notes.findIndex((n) => n.id === note.id);
    if (index === -1) board.notes.push(note);
  }),
  onDeleteNote(([id]) => (board) => {
    const index = board.notes.findIndex((n) => n.id === id);
    if (index !== -1) board.notes.splice(index, 1);
  })
  ...
)
```
Similar to `createSubject`, the first argument can be a signal that resets the value of the store. When this signal updates, the store is updated using `reconcile`.

## `createTopic`

A topic combines multiple events into one. This is simply a more convenient way to merge events than manually iterating through them.

```ts
const [onIncrement, emitIncrement] = createEvent()
const [onDecrement, emitDecrement] = createEvent()

const onMessage = createTopic(
  onIncrement(() => `Increment by ${delta}`),
  onDecrement(() => `Decrement by ${delta}`)
);
onMessage(message => console.log(`Message emitted:`, message))

...

emitIncrement(2)
// logs "Message emitted: Increment by 2"

emitDecrement(1)
// logs "Message emitted: Decrement by 1"
```

## `createPartition`

A partition splits an event based on a conditional. This is simply a more convenient way to conditionally split events than using `halt()`.

```ts
const [onIncrement, emitIncrement] = createEvent()

const [onValidIncrement, onInvalidIncrement] = createPartition(
  onIncrement,
  delta => delta > 0
)

onValidIncrement(delta => console.log(`Valid increment by ${delta}`))

onInvalidIncrement(delta => console.log(`Please use a number greater than 0`))

...

emitIncrement(2)
// logs "Valid increment by 2"

emitIncrement(0)
// logs "Please use a number greater than 0"

```

## Use Cases
