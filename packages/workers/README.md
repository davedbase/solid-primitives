<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Workers" alt="Solid Primitives Workers">
</p>

# @solid-primitives/workers

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/workers?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/workers)
[![size](https://img.shields.io/npm/v/@solid-primitives/workers?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/workers)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

A set of utility to support using Web Workers and Shared Workers:

`createWorker` - Provides a getter and setter for the primitive.

`createWorkerPool` - Creates a pool of workers and round-robins requests between each.

`createSignaledWorker` - Creates a work with that reads and writes to signals.

## How to use it

### createWorker

Create a basic web worker:

```ts
const [worker, start, stop] = createWorker(function add(a, b) {
  return a + b;
});
console.log(await worker.add(1, 2));
// output: 3
```

### createWorkerPool

Create a worker pool with a set concurrency:

```ts
const [pool, start, stop] = createWorkerPool(4, function add(a, b) {
  return a + b;
});
console.log(await pool.add(1, 2));
// output: 3
```

### createSignaledWorker

Create a more advanced worker that accepts multiple instructional inputs:

```ts
const [input, setInput] = createSignal([1, 1]);
const [output, setOutput] = createSignal([1, 1]);
createSignaledWorker({
  input,
  output: setOutput,
  func: function add([a, b]) {
    return a + b;
  },
});
setInput([1, 2]);
console.log(output());
// output: 3
```

## Demo

You may view a working example here: [ link to Stackblize or CodeSandBox ]

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Inspiration

Inspired by Jason Miller's worker function. Borrows the RPC and function export method.
