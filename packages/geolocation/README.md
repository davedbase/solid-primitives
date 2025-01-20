<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Geolocation" alt="Solid Primitives Geolocation">
</p>

# @solid-primitives/geolocation

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/geolocation?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/geolocation)
[![size](https://img.shields.io/npm/v/@solid-primitives/geolocation?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/geolocation)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives to query and watch geolocation information from within the browser.

## Installation

```
npm install @solid-primitives/geolocation
# or
yarn add @solid-primitives/geolocation
```

## How to use it

### createGeolocation

Used to fetch current geolocation data as a resource. This primitive uses `createResource` to return a location, so `loading`, `error`

```ts
const [location, refetch] = createGeolocation();
```

or with options:

```ts
const [location, refetch] = createGeolocation({
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 200,
});
```

#### Definition

```ts
createGeolocation(
  options: MaybeAccessor<PositionOptions> // these override basic defaults (see Types section)
): [
  location: Resource<GeolocationCoordinates | undefined>,
  refetch: Accessor<void>
]
```

### createGeolocationWatcher

Creates a geolocation watcher and updates a signal with the latest coordinates. This primitive returns two reactive getters: `location` and `error`.

```ts
const watcher = createGeolocationWatcher(true);
console.log(watcher.location);
console.log(watcher.error);
```

#### Definition

```ts
createGeolocationWatcher(
  enabled: MaybeAccessor<boolean>,
  options: MaybeAccessor<PositionOptions>
): {
  location: GeolocationCoordinates | null,
  error: GeolocationPositionError | null
}
```

#### Types

The values returned in the location property are as follows:

```ts
interface GeolocationCoordinates {
  readonly accuracy: number;
  readonly altitude: number | null;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly speed: number | null;
}
```

The options property defaults to the following value unless overwritten:

```ts
const geolocationDefaults: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: Number.POSITIVE_INFINITY,
};
```

## Demo

You may view a working example here: https://stackblitz.com/edit/vitejs-vite-dvk4m4

## Primitive Ideas

We're always looking to enhance our primitives. Some ideas:

- `createDistance` (supply a lat/lng and reactively calculate the difference in km/m)
- `createWithinRadius` (a signal for tracking if a user is within a radius boundary)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
