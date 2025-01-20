<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=idle" alt="Solid Primitives idle">
</p>

# @solid-primitives/idle

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/idle?style=for-the-badge&label=size)](https://bundlephobia.com/package/@solid-primitives/idle)
[![version](https://img.shields.io/npm/v/@solid-primitives/idle?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/idle)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

`createIdleTimer` - A primitive to track the user's idle status and take appropriate action.

## Installation

```bash
npm install @solid-primitives/idle
# or
yarn add @solid-primitives/idle
# or
pnpm add @solid-primitives/idle
```

## How to use it

`createIdleTimer` provides different accessors and methods to observe the user's idle status and react to its changing.

### Basic example

```ts
const App: Component = () => {
  const { isIdle, isPrompted, reset } = createIdleTimer({
    onIdle: logout,
    idleTimeout: 300_000,
    promptTimeout: 60_000,
  });
  return (
    <Switch fallback={<ClientPage />}>
      <Match when={isIdle()}>
        <LoggedOut />
      </Match>
      <Match when={isPrompted()}>
        <PromptPopup onConfirm={reset /*or stop*/} />
      </Match>
    </Switch>
  );
};
```

### Accessors and methods

To interact with the timers, `createIdleTimer` provides:

- **isIdle** and **isPrompted**: `Accessor<boolean>`; these two accessors report the user status. They do not concur.
- **start**, **stop** and **reset**: `() => void`; allow rispectively to start and stop the timers, and to reset them. `start` and `reset`, create a custom `manualstart` and `manualreset` event, that will be passed to the `onIdle` and `onPrompt` callbacks if no oher activity occurs (there's another custom event, `mount`, created when timers start automatically). Finally `stop` and `reset` don't trigger `onActive`.
- **triggerIdle**: `() => void`; manually sets `isIdle` to true, and triggers the `onIdle` callback, passing a custom `manualidle` event. It doesn't trigger `onActive` or `onPrompt`.

### Configuration options

`createIdleTimer` takes as an optional argument an object with the timer's configuration options. Each key has a default value.
The options are:

- **idleTimeout**: `number`; time of user's inactivity in milliseconds before the idle status changes to idle. This time is extended by the `promptTimeout` option. It defaults to 15 minutes.
- **promptTimeout**: `number`; to meet the typical usecase when we want to prompt the user to check if we they are still active, an additional timer starts running right after the idleTimeout expires. In this time slot, the user is in the prompt phase, whose duration is decided by `promptTimout`. It defaults to 0.
- **onIdle**: `(evt: Event) => void`; callback triggered when the user status passes to idle. When invoked, the last event fired before the prompt phase will be passed as parameter. Events fired in the prompt phase will not count. It defaults to an empty function.
- **onPrompt**: `(evt: Event) => void`; when the `idleTimeout` expires, before declaring the idle status, `onPrompt` callback is fired, starting the prompt timer. When invoked, the last event fired before the prompt phase will be passed as a parameter. It defaults to an empty function.
- **onActive**: `(evt: Event) => void`; callback called when the user resumes activity after having been idle (resuming from prompt phase doesn't trigger `onActive`). The event that triggered the return to activity is passed as a parameter. It defaults to an empty function.
- **startManually**: `boolean`; requires the event-listeners to be bound manually by using the `start` method, instead of on mount. It defaults to false.
- **events**: `EventTypeName[]`; a list of the DOM events that will be listened to in order to monitor the user's activity. The events must be of `EventTypeName` type (it can be imported). The list defaults to `['mousemove', 'keydown', 'wheel', 'resize', 'mousewheel', 'mousedown', 'pointerdown', 'touchstart', 'touchmove', 'visibilitychange']`
- **element**: `HTMLElement`; DOM element to which the event listeners will be attached. It defaults to `document`.

## Demo

Here is a working example: https://stackblitz.com/edit/vitejs-vite-dwxlhp?file=src/App.tsx

## Acknowledgments

This primitive is inspired by [react-idle-timer](https://idletimer.dev/)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
