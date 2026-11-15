<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Connectivity" alt="Solid Primitives Connectivity">
</p>

# @solid-primitives/connectivity

[![size](https://img.shields.io/badge/size-979_B-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/connectivity)
[![version](https://img.shields.io/npm/v/@solid-primitives/connectivity?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/template-primitive)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-2.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Reactive primitives for network connectivity and connection quality. Wraps `navigator.onLine` for basic online/offline detection and the [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) (`navigator.connection`) for adaptive loading strategies.

- [**Docs (Storybook)**](https://primitives.solidjs.community/storybook/?path=/docs/network-connectivity--docs)
- [`makeConnectivityListener`](#makeconnectivitylistener) — low-level callback when online status changes
- [`createConnectivitySignal`](#createconnectivitysignal) — signal for `navigator.onLine`
- [`useConnectivitySignal`](#useconnectivitysignal) — singleton variant of `createConnectivitySignal`
- [`makeNetworkInformation`](#makenetworkinformation) — low-level callback for all network state changes
- [`createNetworkInformation`](#createnetworkinformation) — signals for online status + connection quality metrics
- [`useNetworkInformation`](#usenetworkinformation) — singleton variant of `createNetworkInformation`

## Installation

```bash
npm install @solid-primitives/connectivity
# or
yarn add @solid-primitives/connectivity
# or
pnpm add @solid-primitives/connectivity
```

## `makeConnectivityListener`

Attaches event listeners and fires callback whenever `window.onLine` changes.

```ts
import { makeConnectivityListener } from "@solid-primitives/connectivity";

const clear = makeConnectivityListener(isOnline => {
  console.log(isOnline); // T: boolean
});
// remove event listeners (happens also on cleanup)
clear();
```

### Definition

```ts
function makeConnectivityListener(callback: (isOnline: boolean) => void): VoidFunction;
```

## `createConnectivitySignal`

A signal representing the browser's interpretation of whether it is on- or offline.

```tsx repl
import { render } from "@solidjs/web";
import { createConnectivitySignal } from "@solid-primitives/connectivity";

function Demo() {
  const isOnline = createConnectivitySignal();
  return (
    <>
      <p style={{ color: isOnline() ? "green" : "red" }}>{isOnline() ? "Online" : "Offline"}</p>
      <small>Toggle via DevTools → Network → Offline</small>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
import { createConnectivitySignal } from "@solid-primitives/connectivity";

const isOnline = createConnectivitySignal();
isOnline(); // T: boolean
```

### Definition

```ts
function createConnectivitySignal(): Accessor<boolean>;
```

## `useConnectivitySignal`

This primitive provides a [singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) variant that will reuse event listeners and signals across dependents.

```ts
import { useConnectivitySignal } from "@solid-primitives/connectivity";

const isOnline = useConnectivitySignal();
isOnline(); // T: boolean
```

## `makeNetworkInformation`

Low-level primitive that fires a callback with a full [`NetworkState`](#networkstate) snapshot whenever online status or connection quality changes. Listens to both `window` online/offline events and `navigator.connection` change events.

```ts
import { makeNetworkInformation } from "@solid-primitives/connectivity";

const clear = makeNetworkInformation(state => {
  console.log(state.online, state.effectiveType, state.downlink);
});
clear();
```

### Definition

```ts
function makeNetworkInformation(callback: (state: NetworkState) => void): VoidFunction;
```

## `createNetworkInformation`

Returns independent reactive signals for online status and all [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation) properties. Useful for adaptive loading strategies — adjusting image quality, prefetch behavior, or feature availability based on actual connection conditions.

Network Information API properties (`downlink`, `effectiveType`, etc.) are `undefined` in browsers that don't support the API (Firefox, Safari). Always guard on the value before branching on it.

```ts
import { createNetworkInformation } from "@solid-primitives/connectivity";

const { online, effectiveType, downlink, rtt, saveData, type } = createNetworkInformation();

// adapt asset quality to connection
const imageQuality = () => {
  if (!online() || saveData()) return "low";
  if (effectiveType() === "4g") return "high";
  return "medium";
};
```

```tsx
// show a warning banner when on a slow connection
<Show when={effectiveType() === "2g" || effectiveType() === "slow-2g"}>
  <Banner>Slow connection detected — some features may be limited.</Banner>
</Show>
```

### Definition

```ts
function createNetworkInformation(): NetworkInformationReturn;

type NetworkInformationReturn = {
  online: Accessor<boolean>;
  downlink: Accessor<number | undefined>; // bandwidth estimate in Mbit/s
  downlinkMax: Accessor<number | undefined>; // max downlink speed (non-standard)
  effectiveType: Accessor<EffectiveConnectionType | undefined>; // "slow-2g" | "2g" | "3g" | "4g"
  rtt: Accessor<number | undefined>; // estimated round-trip time in ms
  saveData: Accessor<boolean | undefined>; // user has requested reduced data usage
  type: Accessor<ConnectionType | undefined>; // underlying connection technology
};

type EffectiveConnectionType = "slow-2g" | "2g" | "3g" | "4g";
type ConnectionType =
  "bluetooth" | "cellular" | "ethernet" | "none" | "wifi" | "wimax" | "other" | "unknown";
```

## `useNetworkInformation`

[Singleton root](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot) variant of `createNetworkInformation`. Shares a single set of event listeners across all callers in the same application.

```ts
import { useNetworkInformation } from "@solid-primitives/connectivity";

const { online, effectiveType } = useNetworkInformation();
```

## `NetworkState`

Plain data snapshot type returned by `makeNetworkInformation` callbacks.

```ts
type NetworkState = {
  online: boolean;
  downlink: number | undefined;
  downlinkMax: number | undefined;
  effectiveType: EffectiveConnectionType | undefined;
  rtt: number | undefined;
  saveData: boolean | undefined;
  type: ConnectionType | undefined;
};
```

## Browser Support

| Primitive                                                          | Chrome | Firefox | Safari |
| ------------------------------------------------------------------ | ------ | ------- | ------ |
| `makeConnectivityListener` / `createConnectivitySignal`            | ✅     | ✅      | ✅     |
| Network Information API fields (`effectiveType`, `downlink`, etc.) | ✅     | ❌      | ❌     |

The Network Information API fields return `undefined` where unsupported — no errors are thrown.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
