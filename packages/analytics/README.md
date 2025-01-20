---
Name: analytics
Stage: 0
Package: "@solid-primitives/analytics"
Primitives: createAnalytics
Category: Utilities
---

<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Analytics" alt="Solid Primitives Analytics">
</p>

# @solid-primitives/analytics

[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Creates a primitive for analytics management.

## How to use it

```ts
const [running, start, stop] = createAnalytics(() => console.log('hi')));
start();
```

## Demo

You may view a working example here: https://codesandbox.io/s/solid-create-analytics?file=/src/index.tsx

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
