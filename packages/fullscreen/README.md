<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Fullscreen" alt="Solid Primitives Fullscreen">
</p>

# @solid-primitives/fullscreen

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/fullscreen?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/fullscreen)
[![size](https://img.shields.io/npm/v/@solid-primitives/fullscreen?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/fullscreen)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates a primitive wrapper around the Fullscreen API that can either be used as a directive or a primitive.

## Installation

```
npm install @solid-primitives/fullscreen
# or
yarn add @solid-primitives/fullscreen
```

## How to use it

### createFullScreen

```ts
const MyComponent2: Component = () => {
  const [fs, setFs] = createSignal(false);
  let [ref, setRef] = createSignal<HTMLDivElement>();
  const active: Accessor<boolean> = createFullscreen(ref, fs);
  return (
    <div ref={setRef} onClick={() => setFs(fs => !fs)}>
      {!active() ? "click to fullscreen" : "click to exit fullscreen"}
    </div>
  );
};
```

This variant requires the ref to be a signal, otherwise the not-yet-filled ref will be captured in the closure of the primitive.

You can either put the options into the second argument accessor output (useful for the directive use case) or as a third argument.

### Directive

```ts
const isActive: Accessor<boolean> = createFullscreen(
  ref: HTMLElement | undefined,
  active?: Accessor<FullscreenOptions | boolean>,
  options?: FullscreenOptions
);

// can be used as a directive

const MyComponent: Component = () => {
  const [fs, setFs] = createSignal(false);
  return (<div use:createFullScreen={fs} onClick={() => setFs(fs => !fs)}>
    {!fs() ? 'click to fullscreen' : 'click to exit fullscreen'}
  </div>);
}
```

## Demo

TODO

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
