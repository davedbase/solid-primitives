<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=animation" alt="Solid Primitives animation">
</p>

# @solid-primitives/animation

[![version](https://img.shields.io/npm/v/@solid-primitives/animation?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/animation)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Solid primitives for the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) (WAAPI).

## Installation

```bash
npm install @solid-primitives/animation
# or
pnpm add @solid-primitives/animation
```

## Primitives

| Primitive                                                              | Description                                              |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| [`makeAnimate`](#makeanimate--createanimate)                           | Imperative `element.animate()` wrapper                   |
| [`createAnimate`](#makeanimate--createanimate)                         | Reactive `makeAnimate`                                   |
| [`makeScrollAnimation`](#makescrollanimation--createscrollanimation)   | Scroll-driven animation via `ScrollTimeline`             |
| [`createScrollAnimation`](#makescrollanimation--createscrollanimation) | Reactive `makeScrollAnimation`                           |
| [`makeViewAnimation`](#makeviewanimation--createviewanimation)         | Viewport-driven animation via `ViewTimeline`             |
| [`createViewAnimation`](#makeviewanimation--createviewanimation)       | Reactive `makeViewAnimation`                             |
| [`makeFlip`](#makeflip)                                                | FLIP layout animation                                    |
| [`makeStagger`](#makestagger--createstagger)                           | Staggered animations across a list of elements           |
| [`createStagger`](#makestagger--createstagger)                         | Reactive `makeStagger`                                   |
| [`makeAnimationGroup`](#makeanimationgroup--createanimationgroup)      | Coordinate multiple animations as a unit                 |
| [`createAnimationGroup`](#makeanimationgroup--createanimationgroup)    | Reactive `makeAnimationGroup`                            |
| [`makeMotionPath`](#makemotionpath--createmotionpath)                  | Animate an element along a CSS Motion Path               |
| [`createMotionPath`](#makemotionpath--createmotionpath)                | Reactive `makeMotionPath`                                |
| [`makeSequence`](#makesequence)                                        | Chain animation factories into a sequential playlist     |
| [`createPresenceAnimation`](#createpresenceanimation)                  | Mount/unmount lifecycle with WAAPI enter/exit animations |

---

## `makeAnimate` / `createAnimate`

`makeAnimate` is a thin wrapper around `element.animate()` with TypeScript types. `createAnimate` replays the animation whenever `target`, `keyframes`, or `options` change reactively, and cancels it when the owner disposes.

```tsx repl
import { render } from "@solidjs/web";
import { makeAnimate } from "@solid-primitives/animation";

function Demo() {
  let box!: HTMLDivElement;
  const spin = () =>
    makeAnimate(box, [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], {
      duration: 600,
      easing: "ease-in-out",
    });
  return (
    <>
      <button onClick={spin}>Spin</button>
      <div
        ref={box}
        style={{ width: "60px", height: "60px", margin: "20px", background: "tomato" }}
      />
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createAnimate } from "@solid-primitives/animation";

function Demo() {
  const [box, setBox] = createSignal<HTMLDivElement>();
  const [scale, setScale] = createSignal(1.5);
  // restarts whenever scale() changes
  const anim = createAnimate(
    box,
    () => [{ transform: "scale(1)" }, { transform: `scale(${scale()})` }],
    { duration: 800, iterations: Infinity, direction: "alternate" },
  );
  return (
    <>
      <button onClick={() => setScale(s => (s === 1.5 ? 0.5 : 1.5))}>scale: {scale()}</button>
      <button onClick={() => anim()?.pause()}>Pause</button>
      <button onClick={() => anim()?.play()}>Play</button>
      <div
        ref={setBox}
        style={{ width: "60px", height: "60px", margin: "30px", background: "tomato" }}
      />
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Imperative
const anim = makeAnimate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
anim.pause();

// Reactive
const anim = createAnimate(() => ref, [{ opacity: 0 }, { opacity: 1 }], {
  duration: 300,
  fill: "forwards",
});
// anim() is the current Animation instance, or undefined while ref is unset
anim()?.pause();
```

```ts
function makeAnimate(
  el: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: KeyframeAnimationOptions,
): Animation;

function createAnimate(
  target: Accessor<Element | null | undefined>,
  keyframes: MaybeAccessor<Keyframe[] | PropertyIndexedKeyframes | null>,
  options?: MaybeAccessor<KeyframeAnimationOptions>,
): Accessor<Animation | undefined>;
```

---

## `makeScrollAnimation` / `createScrollAnimation`

Plays a WAAPI animation whose progress is driven by scroll position via [`ScrollTimeline`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollTimeline). No scroll listeners or RAF loops needed.

```tsx repl
import { render } from "@solidjs/web";
import { onSettled } from "solid-js";
import { makeScrollAnimation } from "@solid-primitives/animation";

function Demo() {
  let scroller!: HTMLDivElement;
  let bar!: HTMLDivElement;
  const supported = "ScrollTimeline" in window;
  onSettled(() => {
    if (!supported) return;
    makeScrollAnimation(bar, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      fill: "both",
      source: scroller,
    });
  });
  return (
    <>
      <p>
        {supported ? "Scroll the box below" : "ScrollTimeline is not supported in this browser"}
      </p>
      <div
        ref={bar}
        style={{ height: "6px", background: "royalblue", "transform-origin": "left" }}
      />
      <div ref={scroller} style={{ height: "150px", overflow: "auto", border: "1px solid #ccc" }}>
        <div style={{ height: "600px", padding: "8px" }}>Scroll me</div>
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createScrollAnimation } from "@solid-primitives/animation";

function Demo() {
  const [scroller, setScroller] = createSignal<HTMLDivElement>();
  const [box, setBox] = createSignal<HTMLDivElement>();
  const supported = "ScrollTimeline" in window;
  createScrollAnimation(
    () => (supported ? box() : undefined),
    [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }],
    () => ({ fill: "both", source: scroller() }),
  );
  return (
    <>
      <p>
        {supported
          ? "Scroll to rotate the square"
          : "ScrollTimeline is not supported in this browser"}
      </p>
      <div
        ref={setBox}
        style={{ width: "40px", height: "40px", margin: "10px", background: "royalblue" }}
      />
      <div
        ref={setScroller}
        style={{ height: "150px", overflow: "auto", border: "1px solid #ccc" }}
      >
        <div style={{ height: "600px", padding: "8px" }}>Scroll me</div>
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Fade + rise as the user scrolls down the page
const anim = createScrollAnimation(
  () => ref,
  [
    { opacity: 0, transform: "translateY(20px)" },
    { opacity: 1, transform: "none" },
  ],
  { fill: "both" },
);

// Tie progress to a specific scroll container
const anim = createScrollAnimation(() => ref, keyframes, {
  fill: "both",
  source: scrollContainerEl,
  axis: "block",
});
```

```ts
type ScrollAnimationOptions = Omit<KeyframeAnimationOptions, "timeline"> & {
  source?: Element; // scroll container — defaults to document root scroller
  axis?: "block" | "inline" | "x" | "y";
};

function makeScrollAnimation(
  el: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: ScrollAnimationOptions,
): Animation;

function createScrollAnimation(
  target: Accessor<Element | null | undefined>,
  keyframes: MaybeAccessor<Keyframe[] | PropertyIndexedKeyframes | null>,
  options?: MaybeAccessor<ScrollAnimationOptions>,
): Accessor<Animation | undefined>;
```

---

## `makeViewAnimation` / `createViewAnimation`

Plays a WAAPI animation whose progress is driven by an element's intersection with the scroll port via [`ViewTimeline`](https://developer.mozilla.org/en-US/docs/Web/API/ViewTimeline). Replaces the IntersectionObserver + class-toggle pattern.

```tsx repl
import { render } from "@solidjs/web";
import { For, onSettled } from "solid-js";
import { makeViewAnimation } from "@solid-primitives/animation";

function Demo() {
  const cards: HTMLDivElement[] = [];
  const supported = "ViewTimeline" in window;
  onSettled(() => {
    if (!supported) return;
    for (const el of cards)
      makeViewAnimation(
        el,
        [
          { opacity: 0, transform: "scale(0.6)" },
          { opacity: 1, transform: "none" },
        ],
        {
          fill: "both",
        },
      );
  });
  return (
    <>
      <p>{supported ? "Scroll the list" : "ViewTimeline is not supported in this browser"}</p>
      <div style={{ height: "200px", overflow: "auto", border: "1px solid #ccc" }}>
        <For each={[1, 2, 3, 4, 5, 6, 7, 8]}>
          {n => (
            <div
              ref={el => cards.push(el)}
              style={{ margin: "40px 8px", padding: "20px", background: "gold" }}
            >
              Card {n}
            </div>
          )}
        </For>
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createViewAnimation } from "@solid-primitives/animation";

function Demo() {
  const [card, setCard] = createSignal<HTMLDivElement>();
  const [spin, setSpin] = createSignal(false);
  const supported = "ViewTimeline" in window;
  createViewAnimation(
    () => (supported ? card() : undefined),
    () => [
      { opacity: 0, transform: spin() ? "rotate(-180deg)" : "translateX(-100px)" },
      { opacity: 1, transform: "none" },
    ],
    { fill: "both" },
  );
  return (
    <>
      <button onClick={() => setSpin(s => !s)}>Effect: {spin() ? "spin" : "slide"}</button>
      <p>{supported ? "Scroll the box below" : "ViewTimeline is not supported in this browser"}</p>
      <div style={{ height: "200px", overflow: "auto", border: "1px solid #ccc" }}>
        <div style={{ height: "250px" }}>Scroll down</div>
        <div ref={setCard} style={{ width: "120px", padding: "20px", background: "gold" }}>
          Hello!
        </div>
        <div style={{ height: "250px" }} />
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Animate the element itself as it enters the viewport
const anim = createViewAnimation(
  () => ref,
  [
    { opacity: 0, transform: "translateY(16px)" },
    { opacity: 1, transform: "none" },
  ],
  { fill: "both" },
);

// Observe a different element than the one being animated
const anim = createViewAnimation(() => animatedEl, keyframes, {
  fill: "both",
  subject: triggerEl,
  inset: "0px 0px -100px 0px",
});
```

```ts
type ViewAnimationOptions = Omit<KeyframeAnimationOptions, "timeline"> & {
  subject?: Element; // element to observe — defaults to target
  axis?: "block" | "inline" | "x" | "y";
  inset?: string | string[]; // shrinks/expands the intersection root
  rangeStart?: string; // default: "entry 0%" — element starts entering the scroll port
  rangeEnd?: string; // default: "entry 100%" — element has fully entered the scroll port
};

function makeViewAnimation(
  el: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: ViewAnimationOptions,
): Animation;

function createViewAnimation(
  target: Accessor<Element | null | undefined>,
  keyframes: MaybeAccessor<Keyframe[] | PropertyIndexedKeyframes | null>,
  options?: MaybeAccessor<ViewAnimationOptions>,
): Accessor<Animation | undefined>;
```

---

## `makeFlip`

FLIP (First–Last–Invert–Play) layout animation. Call `snapshot()` before the DOM change to record the element's current geometry, then call `flip()` after to animate from the old position/size to the new one.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { makeFlip } from "@solid-primitives/animation";

function Demo() {
  const [right, setRight] = createSignal(false);
  let flipper: ReturnType<typeof makeFlip> | undefined;
  const move = () => {
    flipper?.snapshot();
    setRight(r => !r);
    flush(); // apply the DOM change synchronously before measuring again
    flipper?.flip();
  };
  return (
    <>
      <button onClick={move}>Move</button>
      <div
        style={{
          display: "flex",
          "justify-content": right() ? "flex-end" : "flex-start",
          width: "300px",
        }}
      >
        <div
          ref={el => (flipper = makeFlip(el, { duration: 400, easing: "ease-out" }))}
          style={{ width: "50px", height: "50px", background: "seagreen" }}
        />
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx
let el!: HTMLUListElement;
const { snapshot, flip } = makeFlip(el, { duration: 300, easing: "ease" });

const handleReorder = () => {
  snapshot();
  setItems(prev => [...prev].reverse()); // DOM updates synchronously
  flip();
};

return <ul ref={el}>...</ul>;
```

`flip()` is a no-op if `snapshot()` was never called or if the geometry didn't change. It resets the captured rect after each call, so a second `flip()` without a new `snapshot()` is always a no-op.

> **Note:** geometry is measured via `getBoundingClientRect` (viewport coordinates). Elements inside `position: fixed` or `position: absolute` ancestors may need coordinate adjustment.

```ts
function makeFlip(
  el: Element,
  options?: KeyframeAnimationOptions,
): { snapshot: () => void; flip: () => Animation | undefined };
```

---

## `makeStagger` / `createStagger`

Applies a WAAPI animation to a list of elements with a per-element delay offset. The `stagger` option is added on top of the base `delay`.

```tsx repl
import { render } from "@solidjs/web";
import { For } from "solid-js";
import { makeStagger } from "@solid-primitives/animation";

function Demo() {
  const items: HTMLDivElement[] = [];
  const play = () =>
    makeStagger(
      items,
      [
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 400,
        stagger: 80,
        fill: "both",
      },
    );
  return (
    <>
      <button onClick={play}>Play</button>
      <For each={["One", "Two", "Three", "Four", "Five"]}>
        {label => (
          <div
            ref={el => items.push(el)}
            style={{ margin: "4px", padding: "8px", background: "plum" }}
          >
            {label}
          </div>
        )}
      </For>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createStagger } from "@solid-primitives/animation";

function Demo() {
  const [list, setList] = createSignal<HTMLUListElement>();
  const [stagger, setStagger] = createSignal(100);
  // re-runs whenever the list element or the stagger option changes
  createStagger(
    () => Array.from(list()?.children ?? []),
    [
      { opacity: 0, transform: "translateX(-20px)" },
      { opacity: 1, transform: "none" },
    ],
    () => ({ duration: 400, stagger: stagger(), fill: "both" }),
  );
  return (
    <>
      <button onClick={() => setStagger(s => (s === 100 ? 300 : 100))}>
        stagger: {stagger()}ms
      </button>
      <ul ref={setList}>
        <li>One</li>
        <li>Two</li>
        <li>Three</li>
        <li>Four</li>
      </ul>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Imperative — animate a static list of elements
makeStagger(listItems, [{ opacity: 0 }, { opacity: 1 }], {
  duration: 400,
  stagger: 60,
});

// Reactive — re-runs (cancelling previous animations) when the target list changes
const itemRefs: HTMLLIElement[] = [];

const anims = createStagger(
  () => itemRefs,
  [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "none" },
  ],
  { duration: 400, stagger: 60, easing: "ease-out" },
);
```

```ts
type StaggerOptions = KeyframeAnimationOptions & {
  stagger?: number; // ms added per element on top of `delay`
};

function makeStagger(
  els: Element[],
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: StaggerOptions,
): Animation[];

function createStagger(
  targets: Accessor<(Element | null | undefined)[]>,
  keyframes: MaybeAccessor<Keyframe[] | PropertyIndexedKeyframes | null>,
  options?: MaybeAccessor<StaggerOptions>,
): Accessor<Animation[]>;
```

---

## `makeAnimationGroup` / `createAnimationGroup`

Coordinates a list of `Animation` objects as a single unit. All five control methods are forwarded to every non-null animation simultaneously. Pairs naturally with `makeAnimate` and `makeStagger`.

```tsx repl
import { render } from "@solidjs/web";
import { For, onSettled } from "solid-js";
import { makeAnimate, makeAnimationGroup } from "@solid-primitives/animation";

function Demo() {
  const boxes: HTMLDivElement[] = [];
  let group = makeAnimationGroup([]);
  onSettled(() => {
    group = makeAnimationGroup(
      boxes.map((el, i) =>
        makeAnimate(el, [{ transform: "none" }, { transform: "translateX(200px)" }], {
          duration: 1000 + i * 500,
          iterations: Infinity,
          direction: "alternate",
        }),
      ),
    );
  });
  return (
    <>
      <button onClick={() => group.pause()}>Pause all</button>
      <button onClick={() => group.play()}>Play all</button>
      <button onClick={() => group.reverse()}>Reverse all</button>
      <For each={["tomato", "gold", "seagreen"]}>
        {color => (
          <div
            ref={el => boxes.push(el)}
            style={{ width: "30px", height: "30px", background: color }}
          />
        )}
      </For>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createAnimate, createAnimationGroup } from "@solid-primitives/animation";

function Demo() {
  const [a, setA] = createSignal<HTMLDivElement>();
  const [b, setB] = createSignal<HTMLDivElement>();
  const [distance, setDistance] = createSignal(200);
  const slide = () => [{ transform: "none" }, { transform: `translateX(${distance()}px)` }];
  const animA = createAnimate(a, slide, {
    duration: 1000,
    iterations: Infinity,
    direction: "alternate",
  });
  const animB = createAnimate(b, slide, {
    duration: 1600,
    iterations: Infinity,
    direction: "alternate",
  });
  // always controls the latest animations, even after they are recreated
  const group = createAnimationGroup(() => [animA(), animB()]);
  return (
    <>
      <button onClick={() => setDistance(d => (d === 200 ? 100 : 200))}>
        distance: {distance()}px
      </button>
      <button onClick={() => group.pause()}>Pause all</button>
      <button onClick={() => group.play()}>Play all</button>
      <div ref={setA} style={{ width: "30px", height: "30px", background: "tomato" }} />
      <div ref={setB} style={{ width: "30px", height: "30px", background: "gold" }} />
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

`makeAnimationGroup` takes a static array. `createAnimationGroup` takes an accessor and re-derives the group whenever the list changes — each control method always operates on the most recent set of animations.

```ts
// Imperative — static list
const header = makeAnimate(headerEl, fadeIn, { duration: 300 });
const body = makeAnimate(bodyEl, fadeIn, { duration: 300, delay: 100 });
const footer = makeAnimate(footerEl, fadeIn, { duration: 300, delay: 200 });

const group = makeAnimationGroup([header, body, footer]);

group.pause();
group.play();
group.cancel();
```

```tsx
// Reactive — list changes when items() changes
const itemRefs: HTMLLIElement[] = [];
const [items, setItems] = createSignal(data);

const anims = createStagger(
  () => itemRefs,
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 300, stagger: 40 },
);

// group.play() / pause() always targets the animations from the latest render
const group = createAnimationGroup(anims);

return (
  <button onClick={() => group.play()}>Play all</button>
  <ul>
    <For each={items()}>
      {(item, i) => <li ref={itemRefs[i()]}>{item.name}</li>}
    </For>
  </ul>
);
```

```ts
type AnimationGroupControls = {
  play: () => void;
  pause: () => void;
  cancel: () => void;
  reverse: () => void;
  finish: () => void;
};

function makeAnimationGroup(animations: (Animation | null | undefined)[]): AnimationGroupControls;

function createAnimationGroup(
  animations: Accessor<(Animation | null | undefined)[]>,
): AnimationGroupControls;
```

---

## `makeMotionPath` / `createMotionPath`

Animates an element along a [CSS Motion Path](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_motion_path) using WAAPI — sets `offset-path` and `offset-rotate` on the element and animates `offsetDistance` from `0%` to `100%`. The path/rotation styles are left in place after the animation so `fill: "forwards"` works correctly.

```tsx repl
import { render } from "@solidjs/web";
import { makeMotionPath } from "@solid-primitives/animation";

const path = "M 10,60 C 80,-20 160,140 240,60";

function Demo() {
  let dot!: HTMLDivElement;
  return (
    <>
      <button onClick={() => makeMotionPath(dot, path, { duration: 1500, easing: "ease-in-out" })}>
        Play
      </button>
      <div style={{ position: "relative", width: "260px", height: "120px" }}>
        <svg width="260" height="120" style={{ position: "absolute" }}>
          <path d={path} fill="none" stroke="#ccc" />
        </svg>
        <div
          ref={dot}
          style={{ position: "absolute", width: "16px", height: "16px", background: "crimson" }}
        />
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```tsx repl
import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { createMotionPath } from "@solid-primitives/animation";

const paths = { wave: "M 10,60 C 80,-20 160,140 240,60", line: "M 10,100 L 240,20" };

function Demo() {
  const [dot, setDot] = createSignal<HTMLDivElement>();
  const [shape, setShape] = createSignal<keyof typeof paths>("wave");
  // restarts along the new path whenever shape() changes
  createMotionPath(dot, () => paths[shape()], { duration: 1500, iterations: Infinity });
  return (
    <>
      <button onClick={() => setShape(s => (s === "wave" ? "line" : "wave"))}>
        path: {shape()}
      </button>
      <div style={{ position: "relative", width: "260px", height: "120px" }}>
        <svg width="260" height="120" style={{ position: "absolute" }}>
          <path d={paths[shape()]} fill="none" stroke="#ccc" />
        </svg>
        <div
          ref={setDot}
          style={{ position: "absolute", width: "16px", height: "16px", background: "crimson" }}
        />
      </div>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

```ts
// Imperative — path is an SVG path string, passed to path("…")
const anim = makeMotionPath(dotEl, "M0,0 C50,100 150,0 200,100", {
  duration: 2000,
  fill: "forwards",
});

// Any valid offset-path value also works, e.g. a shape function
makeMotionPath(dotEl, "circle(50%)", { duration: 1500, iterations: Infinity });

// Reactive — re-runs whenever target, path, or options change
const anim = createMotionPath(
  () => dotRef,
  () => currentPath(),
  { duration: 2000, rotate: "auto" },
);
anim()?.pause();
```

```ts
type MotionPathOptions = KeyframeAnimationOptions & {
  rotate?: string; // offset-rotate — "auto", "0deg", "reverse", etc. Default: "auto"
};

function makeMotionPath(el: HTMLElement, path: string, options?: MotionPathOptions): Animation;

function createMotionPath(
  target: Accessor<HTMLElement | null | undefined>,
  path: MaybeAccessor<string>,
  options?: MaybeAccessor<MotionPathOptions>,
): Accessor<Animation | undefined>;
```

---

## `makeSequence`

Chains animation factories into a sequential playlist: each factory is called and its animation allowed to finish before the next factory runs. Factories are invoked **lazily** — each is called only when its turn arrives, so animations are created and started just in time rather than all upfront. A factory returning `null`/`undefined` skips that step without breaking the chain.

```tsx repl
import { render } from "@solidjs/web";
import { For } from "solid-js";
import { makeAnimate, makeSequence } from "@solid-primitives/animation";

function Demo() {
  const steps: HTMLDivElement[] = [];
  const done: Animation[] = [];
  const fadeIn = [
    { opacity: 0, transform: "translateX(-30px)" },
    { opacity: 1, transform: "none" },
  ];
  // factories run lazily, one after the previous animation finishes
  const seq = makeSequence(
    [0, 1, 2].map(i => () => {
      const anim = makeAnimate(steps[i]!, fadeIn, { duration: 500, fill: "forwards" });
      done.push(anim);
      return anim;
    }),
  );
  const play = () => {
    done.splice(0).forEach(a => a.cancel()); // hide the steps again before replaying
    seq.play();
  };
  return (
    <>
      <button onClick={play}>Play</button>
      <button onClick={() => seq.cancel()}>Cancel</button>
      <For each={["First", "Second", "Third"]}>
        {(label, i) => (
          <div
            ref={el => (steps[i()] = el)}
            style={{ opacity: 0, margin: "4px", padding: "8px", background: "skyblue" }}
          >
            {label}
          </div>
        )}
      </For>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

Calling `play()` while a sequence is already running discards the current run and starts fresh from the beginning.

```ts
const seq = makeSequence([
  () => makeAnimate(headerEl, fadeIn, { duration: 300 }),
  () => makeAnimate(bodyEl, slideIn, { duration: 400 }),
  () => makeAnimate(footerEl, fadeIn, { duration: 300 }),
]);

seq.play(); // header → body → footer, each starts after the last finishes
seq.cancel(); // stops immediately
seq.play(); // restart from the beginning
```

```ts
type AnimationFactory = () => Animation | null | undefined;

type SequenceControls = {
  play: () => void; // starts from the first factory, discarding any in-progress run
  cancel: () => void; // stops the sequence; the currently-playing animation is cancelled
};

function makeSequence(factories: AnimationFactory[]): SequenceControls;
```

---

## `createPresenceAnimation`

Manages mount/unmount lifecycle with WAAPI enter and exit animations. Pass a `target` ref accessor, a `show` signal, and enter/exit keyframes. The returned `isMounted` accessor should gate the element's presence in the DOM — the element stays mounted until its exit animation finishes.

```tsx repl
import { render } from "@solidjs/web";
import { createSignal, Show } from "solid-js";
import { createPresenceAnimation } from "@solid-primitives/animation";

function Demo() {
  const [show, setShow] = createSignal(false);
  let el: HTMLDivElement | undefined;
  const { isMounted } = createPresenceAnimation(() => el, show, {
    enter: [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "none" },
    ],
    enterOptions: { duration: 250, easing: "ease-out" },
    // exit defaults to the reversed enter keyframes
  });
  return (
    <>
      <button onClick={() => setShow(v => !v)}>{show() ? "Hide" : "Show"}</button>
      <Show when={isMounted()}>
        <div ref={el} style={{ margin: "10px 0", padding: "12px", background: "lavender" }}>
          Hello!
        </div>
      </Show>
    </>
  );
}

render(() => <Demo />, document.getElementById("app")!);
```

Exit keyframes default to the enter keyframes reversed. If `show` toggles back to `true` while an exit is in progress, the exit is cancelled and the enter restarts.

```tsx
const [show, setShow] = createSignal(false);
let el!: HTMLDivElement;

const { isMounted } = createPresenceAnimation(() => el, show, {
  enter: [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "none" },
  ],
  enterOptions: { duration: 250, easing: "ease-out" },
  // exit defaults to reversed enter — fade out and slide down
});

return (
  <>
    <button onClick={() => setShow(v => !v)}>Toggle</button>
    <Show when={isMounted()}>
      <div ref={el}>Hello</div>
    </Show>
  </>
);
```

```tsx
// Separate enter and exit keyframes + options
const { isMounted } = createPresenceAnimation(() => el, show, {
  enter: [
    { opacity: 0, transform: "scale(0.95)" },
    { opacity: 1, transform: "none" },
  ],
  exit: [
    { opacity: 1, transform: "none" },
    { opacity: 0, transform: "scale(0.95)" },
  ],
  enterOptions: { duration: 200, easing: "ease-out" },
  exitOptions: { duration: 150, easing: "ease-in" },
});
```

```ts
type PresenceAnimationOptions = {
  enter: Keyframe[] | PropertyIndexedKeyframes | null;
  exit?: Keyframe[] | PropertyIndexedKeyframes | null; // defaults to reversed enter
  enterOptions?: KeyframeAnimationOptions;
  exitOptions?: KeyframeAnimationOptions; // defaults to enterOptions
  initialEnter?: boolean; // animate on first mount (default: false)
};

function createPresenceAnimation(
  target: Accessor<HTMLElement | null | undefined>,
  show: MaybeAccessor<boolean>,
  options: PresenceAnimationOptions,
): { isMounted: Accessor<boolean> };
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## Related

- [`@solid-primitives/presence`](https://www.npmjs.com/package/@solid-primitives/presence) — mount/unmount lifecycle coordination for CSS transitions
- [`@solid-primitives/transition-group`](https://www.npmjs.com/package/@solid-primitives/transition-group) — `<TransitionGroup>` for lists
- [`@solid-primitives/spring`](https://www.npmjs.com/package/@solid-primitives/spring) — spring-physics value interpolation
- [`@solid-primitives/tween`](https://www.npmjs.com/package/@solid-primitives/tween) — tween value interpolation
