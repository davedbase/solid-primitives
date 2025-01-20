# Contributing to Solid Primitives

:+1::tada: Thank you for checking out the project and wanting to contribute! :tada::+1:

## Contribution Process

Solid Primitives strives to provide idiomatic Solid principles but also allow room for innovation and experimentation. In a growing community many opinions and patterns merge together to produce a de facto standard. Managing opinions and expectations can be difficult. As a result, in November 2021 Solid Primitives implemented a ratification/approval tracking process roughly modelled on [TC39 Proposal Stage Process](https://tc39.es/process-document/). The following summarizes these stages briefly:

| Stage | Description                 |
| ----- | --------------------------- |
| X     | Deprecated or rejected      |
| 0     | Initial submission          |
| 1     | Demonstrations and examples |
| 2     | General use (experimental)  |
| 3     | Pre-shipping (final effort) |
| 4     | Accepted/shipped            |

Any primitive Stage 0-1 should be used with caution and with the understanding that the design or implementation may change. Beyond Stage 2 we make an effort to mitigate changes. If a primitive reaches Stage 2 it's likely to remain an official package with additional approvement until fully accepted and shipped.

## Design Maxims

Other frameworks have large and extremely well established ecosystems. Notably React which has a vast array of component and hooks. The amount of choice within the ecosystem is great but often these tools are built as one-offs resulting in often un-tested logic or are designed with narrow needs. Over time the less concise these building blocks are the more they tend to repeat themselves. Our goal with Primitives is to bring the community together to contribute, evolve and utilize a powerful centralize primitive foundation.

All our primitives are meant to be consistent and sustain a level of quality. We guarantee that each is created with the utmost care. Our primitives are:

1. Documented and follow a consistent style guide
2. Be well tested
3. Small, concise and practical as possible
4. A single primitive for a single purpose
5. No dependencies or as few as possible
6. SSR safe entries (or short-circuits where needed) provided
7. Wrap base level Browser APIs
8. Should be progressively improved for future features
9. Be focused on composition vs. isolation of logic
10. Community voice and needs guide road map and planning
11. Strong TypeScript support
12. ESM (no more CJS support)
13. Solid performance!

## Basic and Compound Primitives

Each primitive is designed with composition in mind. A major rule in designing our primitives is deciding that the interface of primitives should be composable or segmented. For this reason every API is intricately studied and considered to be composed (stacked with features) or decomposed into smaller units. Designing our primitives in this manner allows for better tree-shaking and extendable complexity only as needed. You should only ship what you have to by picking from existing primitives as your foundational building blocks.

Much of the design decisions in naming are best described in the [7 Lessons to Outlive React](https://www.youtube.com/watch?v=yLgq-Foc1EE&t=502s) talk by [swyx](https://www.swyx.io). We strive to follow a similar design pattern promoted by the React core team.

### `make` (non-reactive) vs `create` (reactive)

Solid uses the `create` prefix to define a primitive that provides reactive utility. Solid Primitives reinforces this pattern but in an effort to enhance composability we have also introduced the `make` prefix for identifying non-reactive foundation primitives. Having a non-reactive alternative means that the primitive does the bare essentials such as cleaning up events or interupting a process. ie. `makeTimer` will create and clean-up the scheduler, providing only a clear method. createTimer provides a properly reactive primitive that composes it.

### Managing Primitive Complexity

Solid Primitives is mostly about supplying 80-90% of the common-use cases for the end-user. We prefer to be less prescriptive than other hook libraries such as VueUse and supply granular solutions as opposed to monolithic primitives. The remaining 10-20% of complex use cases are likely not to be covered with this library. This is on purpose to limit the potential of bloat and extended complexity. This project strives to provide foundations and not cumulative solutions. We expect the broader ecosystem will fill the remaining need as further composition to this projects effort. This allows for just the right amount of prescription and opinion.

## NPM Release and Repository Structure

Solid Primitives is a large and growing project and the way we manage and release updates has been setup to suit the projects scope. The approach we've taken with organizing our packages and npm releases is more granular than other projects such as VueUse which ship all updates in a single release.

There are a number of benefits to this including small download sizes, reducing bloat and not shipping experimental/unnecessary primitives that users don't need or want locally. This does mean a bit more effort to install precisely what you need. As a team we've decided that this tradeoff is beneficial and valuable.

## Tooling

### Package Management

This repository is a monorepo managed by [**pnpm workspaces**](https://pnpm.io/workspaces) which means that you need to install [**pnpm**](https://pnpm.io/installation) to work on it. If you don't have it installed, you can install it with `npm install -g pnpm`.

If this is your first time pulling the repository onto a local branch, then run `pnpm install` to install all the dependencies and build all the local packages — this is important because all of the workspace packages are linked together. Furthermore, you should run `pnpm install` whenever you pull from the main branch. If you experience any further issues, try removing the `node_modules` folder (`rm -Force -Recurse .\node_modules\` or `rm -rf node_modules/`) and reinstalling the dependencies.

### Formatting and Linting

We use [**eslint**](https://eslint.org/) and [**prettier**](https://prettier.io/) to lint and format the code. You can run `pnpm lint` to check for linting errors and `pnpm format` to format the code.

Having them installed and enabled in your editor is not required but should help you in the development process.

### Operating System

This repository should work on any operating system, but if any issues arise, you might try using [**Gitpod**](https://gitpod.io) to quickly spin up a fresh remote development environment.

### Root CLI Helpers

Available node scripts for managing packages and creating new ones:

- `pnpm run new-package name-of-your-package` - A helper to create a new package based on a template.
- `pnpm run build` - Builds all the packages.
- `pnpm run test` - Tests all packages.
- `pnpm run lint` - Lints all packages.
- `pnpm run format` - Formats all packages.
- `pnpm run measure name-of-the-package` - Measures the bundle size of the package.

### Package CLI Helpers

Every package has its own set of scripts that you can run with `pnpm run`:

- `pnpm run dev` - Starts a development playground for the package.
- `pnpm run build` - Builds the package.
- `pnpm run test` - Tests the package.
- `pnpm run test:ssr` - Tests the package in SSR mode.

## Planned Primitives

### Display & Media

- createDragAndDrop

### Device

- createBattery

### Browser

- createHistory
- createWebShare (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- createLocale

### Network

- createNotification
- createPush
- createConnectionObserver

### Inputs

- createGesture ([in progress](https://github.com/solidjs-community/solid-primitives/tree/main/packages/gestures))
- createCompositionObserver (CompositionEvent observer)
- createForm
- createInput
- createTouch

### Utilities

- createWorker ([in progress](https://github.com/solidjs-community/solid-primitives/tree/main/packages/workers))
- createQueue
- createEffectWhen
