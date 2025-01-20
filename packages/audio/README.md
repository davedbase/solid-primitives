<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Audio" alt="Solid Primitives Audio">
</p>

# @solid-primitives/audio

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/audio?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/audio)
[![size](https://img.shields.io/npm/v/@solid-primitives/audio?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/audio)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitive to manage audio playback in the browser. The primitives are easily composable and extended. To create your own audio element, consider using makeAudioPlayer which allows you to supply a player instance that matches the built-in standard Audio API.

Each primitive also exposes the audio instance for further custom extensions. Within an SSR context this audio primitive performs noops but never interrupts the process. Time values and durations are zero'd and in LOADING state.

## Installation

```
npm install @solid-primitives/audio
# or
yarn add @solid-primitives/audio
```

## How to use it

### makeAudio

A foundational primitive with no player controls but exposes the raw player object.

```ts
const player = makeAudio("example.mp3");
```

#### Definition

```ts
function makeAudio(src: AudioSource, handlers: AudioEventHandlers = {}): HTMLAudioElement;
```

### makeAudioPlayer

Provides a very basic interface for wrapping listeners to a supplied or default audio player.

```ts
const { play, pause, seek } = makeAudioPlayer("example.mp3");
```

#### Definition

```ts
function makeAudioPlayer(
  src: AudioSource,
  handlers: AudioEventHandlers = {},
): {
  play: VoidFunction;
  pause: VoidFunction;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  player: HTMLAudioElement;
};
```

The seek function falls back to fastSeek when on [supporting browsers](https://caniuse.com/?search=fastseek).

### createAudio

Creates a very basic audio/sound player with reactive properties to control the audio. Be careful not to destructure the value properties provided by the primitive as it will likely break reactivity.

```ts
const [playing, setPlaying] = createSignal(false);
const [volume, setVolume] = createSignal(false);
const [audio, controls] = createAudio("sample.mp3", playing, volume);
setPlaying(true); // or controls.play()
controls.seek(4000);
```

The audio primitive exports an reactive properties that provides you access to state, duration and current time.

_Note:_ Initializing the primitive with `playing` as true works, however note that the user has to interact with the page first (on a fresh page load).

```ts
function makeAudioPlayer(
  src: AudioSource | Accessor<AudioSource>,
  playing?: Accessor<boolean>,
  volume?: Accessor<number>,
): [
  {
    state: AudioState;
    currentTime: number;
    duration: number;
    volume: number;
    player: HTMLAudioElement;
  },
  {
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    play: VoidFunction;
    pause: VoidFunction;
  },
];
```

#### Dynamic audio changes

The source property can be a signal as well as a media source. Upon switching the source via a signal it will continue playing from the head.

```ts
const [src, setSrc] = createSignal("sample.mp3");
const audio = createAudio(src);
setSrc("sample2.mp3");
```

### Audio Source

`createAudio` as well as `makeAudio` and `makeAudioPlayer` all accept MediaSource as a property.

```ts
const media = new MediaSource();
const audio = createAudio(URL.createObjectURL(media));
```

This allows you to managed streamed or Blob supplied media. In essence the primitives in this package are very flexible and allow direct access to the base browser API.

## Demo

You may view a working example here: https://stackblitz.com/edit/vitejs-vite-zwfs6h?file=src%2Fmain.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
