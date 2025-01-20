<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Devices" alt="Solid Primitives Devices">
</p>

# @solid-primitives/devices

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/devices?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/devices)
[![size](https://img.shields.io/npm/v/@solid-primitives/devices?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/devices)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates a primitive to get a list of media devices (microphones, speakers, cameras). There are filtered primitives for convenience reasons.

## Installation

```
npm install @solid-primitives/devices
# or
yarn add @solid-primitives/devices
```

## How to use it

### Media Devices

```ts
const devices = createDevices();

const microphones = createMicrophones();
const speakers = createSpeakers();
const cameras = createCameras();
```

The filtered primitives are build so that they only triggered if the devices of their own kind changed.

### Device Motion

```ts
const accelerometer = createAccelerometer();
const gyroscope = createGyroscope();
```

## Demo

You may view a working example here:
https://primitives.solidjs.community/playground/devices/

## Reference

`createAccelerometer` : [devicemotion event](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event)
`createGyroscope` : [deviceorientation event](https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
