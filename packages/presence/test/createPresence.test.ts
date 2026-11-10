import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from "vitest";
import {
  type Accessor,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  flush,
  OBSERVE,
} from "solid-js";
import { attribution } from "solid-js/attribution";
import { createPresence } from "../src/index.js";

beforeAll(() => {
  vi.useFakeTimers();
});

beforeEach(() => {
  vi.clearAllTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// The state transitions often take an extra ~20ms to changeover
// because the transition currently has an awaited animation frame
// which Vitest seems to just assume is (1 / 60Hz) seconds
// So 50 is added onto wait times for safety
const transitionTimeOffset = 50;

describe("createPresence", () => {
  it("initially marks the element's mounted & visibility status based on the initial state", () =>
    createRoot(dispose => {
      const [shouldRender] = createSignal(true);
      const first = createPresence(shouldRender, {
        transitionDuration: 50,
      });
      expect(first.isMounted()).toBe(true);
      expect(first.isVisible()).toBe(true);

      const [shouldNotRender] = createSignal(false);
      const second = createPresence(shouldNotRender, {
        transitionDuration: 50,
      });
      expect(second.isMounted()).toBe(false);
      expect(second.isVisible()).toBe(false);
      dispose();
    }));

  it("initially is never animating by default", () =>
    createRoot(dispose => {
      const [shouldRender] = createSignal(true);
      const first = createPresence(shouldRender, {
        transitionDuration: 50,
      });
      expect(first.isAnimating()).toBe(false);

      const [shouldNotRender] = createSignal(false);
      const second = createPresence(shouldNotRender, {
        transitionDuration: 50,
      });
      expect(second.isAnimating()).toBe(false);
      dispose();
    }));

  it("is animating if the initial render state is true and the initialEnter option is provided as true", () =>
    createRoot(dispose => {
      const [shouldRender] = createSignal(true);
      const first = createPresence(shouldRender, {
        transitionDuration: 50,
        initialEnter: true,
      });
      expect(first.isAnimating()).toBe(true);

      const [shouldNotRender] = createSignal(false);
      const second = createPresence(shouldNotRender, {
        transitionDuration: 50,
        initialEnter: true,
      });
      // not animating because it doesn't exist initially
      expect(second.isAnimating()).toBe(false);
      dispose();
    }));

  it("is in a mounted & animating state for the transitionDuration and then it is only in a mounted state", async () => {
    const [shouldRender, setShouldRender] = createSignal(false);
    const transitionDuration = 50;

    let isMounted!: Accessor<boolean>;
    let isAnimating!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ isMounted, isAnimating } = createPresence(shouldRender, { transitionDuration }));
      return d;
    });

    expect(isMounted()).toBe(false);
    expect(isAnimating()).toBe(false);
    setShouldRender(true);
    flush();
    expect(isMounted()).toBe(true);
    expect(isAnimating()).toBe(true);
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isMounted()).toBe(true);
    expect(isAnimating()).toBe(false);
    setShouldRender(false);
    flush();
    expect(isMounted()).toBe(true);
    expect(isAnimating()).toBe(true);
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isMounted()).toBe(false);
    expect(isAnimating()).toBe(false);
    dispose();
  });

  it("swaps between a mounted & unmounted state based on unique enter & exit transition states", async () => {
    const [shouldRender, setShouldRender] = createSignal(false);
    // using longer durations to ensure that the transitionTimeOffset
    // doesn't play into the test timings
    const enterDuration = 300;
    const exitDuration = 150;

    let isMounted!: Accessor<boolean>;
    let isAnimating!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ isMounted, isAnimating } = createPresence(shouldRender, { enterDuration, exitDuration }));
      return d;
    });

    expect(isMounted()).toBe(false);
    expect(isAnimating()).toBe(false);
    setShouldRender(true);
    flush();
    expect(isMounted()).toBe(true);
    expect(isAnimating()).toBe(true);
    // ensure that we're not done animating after the shorter time
    await vi.advanceTimersByTimeAsync(exitDuration + transitionTimeOffset);
    expect(isAnimating()).toBe(true);
    await vi.advanceTimersByTimeAsync(exitDuration + transitionTimeOffset);
    expect(isMounted()).toBe(true);
    expect(isAnimating()).toBe(false);
    setShouldRender(false);
    flush();
    expect(isMounted()).toBe(true);
    expect(isAnimating()).toBe(true);
    await vi.advanceTimersByTimeAsync(exitDuration + transitionTimeOffset);
    expect(isMounted()).toBe(false);
    expect(isAnimating()).toBe(false);
    dispose();
  });

  // data switching tests

  type Data = "foo" | "bar" | "baz" | undefined;

  it("initially identifies as not mounted if the initial data is undefined", () =>
    createRoot(dispose => {
      const [data] = createSignal<Data>();
      const { mountedItem, isMounted } = createPresence(data, {
        transitionDuration: 50,
      });
      expect(mountedItem()).toBe(undefined);
      expect(isMounted()).toBe(false);
      dispose();
    }));

  it("initially identifies as mounted if the initial data is defined", () =>
    createRoot(dispose => {
      const [data] = createSignal<Data>("foo");
      const { mountedItem, isMounted } = createPresence(data, {
        transitionDuration: 50,
      });
      expect(mountedItem()).toBe("foo");
      expect(isMounted()).toBe(true);
      dispose();
    }));

  it("initially animates if the initial data is defined", () =>
    createRoot(async dispose => {
      const [data] = createSignal<Data>("foo");
      const transitionDuration = 50;
      const { mountedItem, isAnimating } = createPresence(data, {
        transitionDuration,
        initialEnter: true,
      });
      expect(mountedItem()).toBe("foo");
      expect(isAnimating()).toBe(true);
      await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
      expect(isAnimating()).toBe(false);
      dispose();
    }));

  it("initially exchanges the data over the transition time", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    let mountedItem!: Accessor<Data | undefined>;
    let isAnimating!: Accessor<boolean>;
    let isEntering!: Accessor<boolean>;
    let isExiting!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ mountedItem, isAnimating, isEntering, isExiting } = createPresence(data, {
        transitionDuration,
      }));
      return d;
    });

    expect(isAnimating()).toBe(false);
    setData("bar");
    flush();
    expect(isAnimating()).toBe(true);
    expect(mountedItem()).toBe("foo");
    expect(isExiting()).toBe(true);
    expect(isEntering()).toBe(false);
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isAnimating()).toBe(true);
    expect(mountedItem()).toBe("bar");
    expect(isEntering()).toBe(true);
    expect(isExiting()).toBe(false);
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isAnimating()).toBe(false);
    expect(isEntering()).toBe(false);
    expect(isExiting()).toBe(false);
    dispose();
  });

  it("keeps showing the latest item when the item changes again during the exit", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    let mountedItem!: Accessor<Data | undefined>;
    const dispose = createRoot(d => {
      ({ mountedItem } = createPresence(data, { transitionDuration }));
      return d;
    });

    setData("bar");
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration / 2);
    // still exiting "foo": the swap only happens once the exit has finished
    expect(mountedItem()).toBe("foo");
    setData("baz");
    flush();
    expect(mountedItem()).toBe("foo");
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(mountedItem()).toBe("baz");
    dispose();
  });

  it("unmounts when the item is cleared and mounts the next item afterwards", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    let mountedItem!: Accessor<Data | undefined>;
    let isMounted!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ mountedItem, isMounted } = createPresence(data, { transitionDuration }));
      return d;
    });

    expect(isMounted()).toBe(true);
    setData(undefined);
    flush();
    expect(isMounted()).toBe(true);
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isMounted()).toBe(false);

    setData("baz");
    flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(mountedItem()).toBe("baz");
    expect(isMounted()).toBe(true);
    dispose();
  });

  it("cancels the exit when the item comes back before the exit has finished", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    let mountedItem!: Accessor<Data | undefined>;
    let isMounted!: Accessor<boolean>;
    let isExiting!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ mountedItem, isMounted, isExiting } = createPresence(data, { transitionDuration }));
      return d;
    });

    setData(undefined);
    flush();
    expect(isExiting()).toBe(true);
    await vi.advanceTimersByTimeAsync(transitionDuration / 2);
    setData("foo");
    flush();
    expect(isExiting()).toBe(false);
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    // the old exit timer must not unmount it afterwards
    expect(isMounted()).toBe(true);
    expect(mountedItem()).toBe("foo");
    dispose();
  });

  it("never becomes visible when it is hidden again before the first frame", async () => {
    const [shouldRender, setShouldRender] = createSignal(false);
    const transitionDuration = 150;

    let isMounted!: Accessor<boolean>;
    let isVisible!: Accessor<boolean>;
    const visibleStates: boolean[] = [];
    const dispose = createRoot(d => {
      ({ isMounted, isVisible } = createPresence(shouldRender, { transitionDuration }));
      return d;
    });

    setShouldRender(true);
    flush();
    expect(isMounted()).toBe(true);
    expect(isVisible()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    visibleStates.push(isVisible());
    setShouldRender(false);
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    visibleStates.push(isVisible());
    expect(visibleStates).toEqual([false, false]);
    expect(isMounted()).toBe(false);
    dispose();
  });

  it("unmounts the old item before it mounts the next one", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    // what a consumer renders from: the committed values after every flush
    const committed: Array<[boolean, Data | undefined]> = [];
    let mountedItem!: Accessor<Data | undefined>;
    const dispose = createRoot(d => {
      let isMounted!: Accessor<boolean>;
      ({ isMounted, mountedItem } = createPresence(data, { transitionDuration }));
      createEffect(
        () => [isMounted(), mountedItem()] as const,
        ([mounted, item]) => void committed.push([mounted, item]),
      );
      return d;
    });
    flush();

    setData("bar");
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(mountedItem()).toBe("bar");
    // `<Show when={isMounted()}>` has to see the gap, otherwise it patches the old subtree in
    // place instead of disposing it and creating a fresh one for the new item
    const mountedStates = committed.map(([mounted]) => mounted);
    const gap = mountedStates.indexOf(false);
    expect(gap).toBeGreaterThan(0);
    expect(committed[gap - 1]).toEqual([true, "foo"]);
    expect(mountedStates.lastIndexOf(true)).toBeGreaterThan(gap);
    expect(committed.at(-1)).toEqual([true, "bar"]);
    dispose();
  });

  it("does not let an exit that was cancelled cut a later exit short", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    let mountedItem!: Accessor<Data | undefined>;
    let isExiting!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ mountedItem, isExiting } = createPresence(data, { transitionDuration }));
      return d;
    });

    setData("bar"); // the first exit would finish at 150ms
    flush();
    await vi.advanceTimersByTimeAsync(50);
    setData("foo"); // cancels it
    flush();
    await vi.advanceTimersByTimeAsync(50);
    setData("baz"); // second exit, finishes at 250ms
    flush();
    await vi.advanceTimersByTimeAsync(80); // 180ms: past the cancelled timer
    expect(mountedItem()).toBe("foo");
    expect(isExiting()).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(mountedItem()).toBe("baz");
    dispose();
  });

  it("starts invisible again when it is shown again after a full exit", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 150;

    let isMounted!: Accessor<boolean>;
    let isVisible!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ isMounted, isVisible } = createPresence(data, { transitionDuration }));
      return d;
    });

    expect(isVisible()).toBe(true);
    setData(undefined);
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isMounted()).toBe(false);

    setData("foo");
    flush();
    // visible only on the next frame, so that CSS transitions have a start state to leave from
    expect(isMounted()).toBe(true);
    expect(isVisible()).toBe(false);
    await vi.advanceTimersByTimeAsync(transitionTimeOffset);
    expect(isVisible()).toBe(true);
    dispose();
  });

  it("starts invisible and becomes visible on the next frame with initialEnter", async () => {
    const [shouldRender] = createSignal(true);
    let isVisible!: Accessor<boolean>;
    let isMounted!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ isVisible, isMounted } = createPresence(shouldRender, {
        transitionDuration: 50,
        initialEnter: true,
      }));
      return d;
    });

    flush();
    expect(isMounted()).toBe(true);
    expect(isVisible()).toBe(false);
    await vi.advanceTimersByTimeAsync(transitionTimeOffset);
    expect(isVisible()).toBe(true);
    dispose();
  });

  it("stays unmounted, invisible and idle for an item that is initially undefined", async () => {
    let isMounted!: Accessor<boolean>;
    let isVisible!: Accessor<boolean>;
    let isAnimating!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ isMounted, isVisible, isAnimating } = createPresence<Data>(() => undefined, {
        transitionDuration: 50,
      }));
      return d;
    });

    flush();
    await vi.advanceTimersByTimeAsync(200);
    expect(isMounted()).toBe(false);
    expect(isVisible()).toBe(false);
    expect(isAnimating()).toBe(false);
    dispose();
  });

  it("mounts the latest item when it is written in the same task as the exit finishing", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const transitionDuration = 100;

    const mounted: Array<Data | undefined> = [];
    let mountedItem!: Accessor<Data | undefined>;
    const dispose = createRoot(d => {
      ({ mountedItem } = createPresence(data, { transitionDuration }));
      createEffect(mountedItem, item => void mounted.push(item));
      return d;
    });
    flush();

    setData("bar");
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration - 1);
    setData("baz"); // not flushed yet when the exit timer fires
    vi.advanceTimersByTime(1);
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(mountedItem()).toBe("baz");
    // "bar" was superseded before it was ever mounted
    expect(mounted).not.toContain("bar");
    dispose();
  });

  it("does not throw from the exit timer when the item has errored in the meantime", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const [broken, setBroken] = createSignal(false);
    const transitionDuration = 100;

    let mountedItem!: Accessor<Data | undefined>;
    const dispose = createRoot(d => {
      const item = createMemo(() => {
        if (broken()) throw new Error("item failed");
        return data();
      });
      ({ mountedItem } = createPresence(item, { transitionDuration }));
      return d;
    });

    setData("bar");
    flush();
    setBroken(true);
    flush();
    let thrown: unknown;
    try {
      await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
      flush();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeUndefined();
    expect(mountedItem()).toBe("foo");
    try {
      dispose();
    } catch {}
  });

  it("keeps working after the item has errored while the exit timer was pending", async () => {
    const [data, setData] = createSignal<Data>("foo");
    const [broken, setBroken] = createSignal(false);
    const transitionDuration = 100;

    let mountedItem!: Accessor<Data | undefined>;
    const dispose = createRoot(d => {
      const item = createMemo(() => {
        if (broken()) throw new Error("item failed");
        return data();
      });
      ({ mountedItem } = createPresence(item, { transitionDuration }));
      return d;
    });

    setData("bar");
    flush();
    setBroken(true);
    flush();
    try {
      await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
      flush();
    } catch {}
    // an error escaping the exit timer would halt the reactive system for good
    setBroken(false);
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    flush();
    expect(mountedItem()).toBe("bar");
    try {
      dispose();
    } catch {}
  });

  it("waits for a pending item instead of mounting its stale value", async () => {
    const [source, setSource] = createSignal("foo");
    const transitionDuration = 100;

    const mounted: Array<string | undefined> = [];
    let mountedItem!: Accessor<string | undefined>;
    const dispose = createRoot(d => {
      // "c" takes a while to arrive; until then the memo keeps its previous value
      const item = createMemo(() => {
        const value = source();
        return value === "c"
          ? new Promise<string>(resolve => setTimeout(() => resolve(value), 300))
          : value;
      });
      ({ mountedItem } = createPresence(item, { transitionDuration }));
      createEffect(mountedItem, value => void mounted.push(value));
      return d;
    });
    flush();

    setSource("bar"); // starts the exit of "foo"
    flush();
    await vi.advanceTimersByTimeAsync(50);
    setSource("c"); // still pending when the exit finishes at 100ms
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset + 300);
    flush();
    expect(mountedItem()).toBe("c");
    expect(mounted).not.toContain("bar");
    dispose();
  });

  it("does not leave timers or animation frames behind when it is disposed", async () => {
    for (const [initial, change, elapsed] of [
      [true, false, 5], // mid exit
      [false, true, 5], // entering, the first frame is still pending
      [false, true, 40], // entering, the frame has passed and the enter timer is running
    ] as const) {
      const [shouldRender, setShouldRender] = createSignal(initial);
      const dispose = createRoot(d => {
        createPresence(shouldRender, { transitionDuration: 150 });
        return d;
      });
      flush();
      setShouldRender(change);
      flush();
      await vi.advanceTimersByTimeAsync(elapsed);
      dispose();
      expect(vi.getTimerCount()).toBe(0);
    }
  });

  it("keeps function items as they are instead of calling them", async () => {
    // e.g. components: a signal would call a function it is given, so these must never be called
    const callFoo = vi.fn(() => "foo");
    const callBar = vi.fn(() => "bar");
    const Foo = () => callFoo();
    const Bar = () => callBar();
    const [Item, setItem] = createSignal<(() => string) | undefined>(() => Foo);
    const transitionDuration = 100;

    let mountedItem!: Accessor<(() => string) | undefined>;
    let isMounted!: Accessor<boolean>;
    const dispose = createRoot(d => {
      ({ mountedItem, isMounted } = createPresence(Item, { transitionDuration }));
      return d;
    });
    flush();

    expect(isMounted()).toBe(true);
    expect(mountedItem()).toBe(Foo);
    setItem(() => Bar);
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(mountedItem()).toBe(Bar);
    setItem(undefined);
    flush();
    await vi.advanceTimersByTimeAsync(transitionDuration + transitionTimeOffset);
    expect(isMounted()).toBe(false);
    expect(callFoo).not.toHaveBeenCalled();
    expect(callBar).not.toHaveBeenCalled();
    dispose();
  });
});

// https://github.com/solidjs-community/solid-primitives/issues/1082
// The sync effect in `createPresence` used to track `mountedItem()` while also writing it, and
// `isMounted()`, which is derived from the `shouldBeMounted` signal it writes. Solid 2 reports
// that as EFFECT_WRITES_OWN_SOURCE / EFFECT_RELAY_TEAR (the effect re-ran because of its own write).
// These detectors only run while attribution is enabled; findings are read from the diagnostics
// channel, which lives on `OBSERVE.diagnostics` (not on `DEV`).
describe("createPresence reactivity diagnostics", () => {
  const withDiagnostics = async (scenario: () => Promise<void> | void) => {
    const release = attribution.enable();
    const capture = OBSERVE!.diagnostics.capture();
    try {
      await scenario();
    } finally {
      release();
    }
    return capture.stop().map(event => event.code as string);
  };

  const feedbackLoops = (codes: string[]) =>
    codes.filter(code => code === "EFFECT_WRITES_OWN_SOURCE" || code === "EFFECT_RELAY_TEAR");

  // The detectors need a few runs before they report, so every scenario goes through several cycles.
  it("does not feed its own writes back into itself when opening and closing", async () => {
    // the shape Kobalte's Popover uses
    const [forceMount] = createSignal(false);
    const [open, setOpen] = createSignal(false);
    const codes = await withDiagnostics(async () => {
      const dispose = createRoot(d => {
        createPresence(() => forceMount() || open() || undefined, { transitionDuration: 0 });
        return d;
      });
      flush();
      for (const next of [true, false, true, false, true, false]) {
        setOpen(next);
        flush();
        await vi.advanceTimersByTimeAsync(transitionTimeOffset);
        flush();
      }
      dispose();
    });
    expect(feedbackLoops(codes)).toEqual([]);
  });

  it("does not feed its own writes back into itself when swapping or clearing the item", async () => {
    const [item, setItem] = createSignal<string | undefined>("foo");
    const codes = await withDiagnostics(async () => {
      const dispose = createRoot(d => {
        createPresence(item, { transitionDuration: 50 });
        return d;
      });
      flush();
      for (const next of ["bar", "baz", undefined, "foo", "bar", undefined]) {
        setItem(next);
        flush();
        await vi.advanceTimersByTimeAsync(200);
        flush();
      }
      dispose();
    });
    expect(feedbackLoops(codes)).toEqual([]);
  });
});
