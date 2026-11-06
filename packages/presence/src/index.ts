/*

MIT License (MIT)
Inspired by & directly forked from use-presence by Jan Amann @amannn
See https://github.com/amannn/react-hooks/tree/main/packages/use-presence

*/

import {
  createSignal,
  createEffect,
  type Accessor,
  createMemo,
  untrack,
  onFlush,
  isPending,
} from "solid-js";
import { type MaybeAccessor, asAccessor, INTERNAL_OPTIONS } from "@solid-primitives/utils";

export type SharedTransitionConfig = {
  /** Duration in milliseconds used both for enter and exit transitions. */
  transitionDuration: MaybeAccessor<number>;
};

export type SeparateTransitionConfig = {
  /** Duration in milliseconds used for enter transitions (overrides `transitionDuration` if provided). */
  enterDuration: MaybeAccessor<number>;
  /** Duration in milliseconds used for exit transitions (overrides `transitionDuration` if provided). */
  exitDuration: MaybeAccessor<number>;
};

export type Options = (
  | SharedTransitionConfig
  | SeparateTransitionConfig
  | (SharedTransitionConfig & SeparateTransitionConfig)
) & {
  /** Opt-in to animating the entering of an element if `isVisible` is `true` during the initial mount. */
  initialEnter?: boolean;
};

/**
 * Animates the appearance of its children.
 *
 * @internal - to be combined with `createPresence` in the future
 */
function createPresenceBase(
  /** Indicates whether the component that the resulting values will be used upon should be visible to the user. */
  source: Accessor<boolean>,
  options: Options,
  /** Called from the exit timer, right after it has written that the exit is over (`isMounted` turns false). */
  onExited?: VoidFunction,
) {
  const exitDuration = asAccessor(
    "exitDuration" in options ? options.exitDuration : options.transitionDuration,
  );
  const enterDuration = asAccessor(
    "enterDuration" in options ? options.enterDuration : options.transitionDuration,
  );

  const initialSource = untrack(source);
  const initialState = options.initialEnter ? false : initialSource;

  // Everything below is derived from `source`, except the time-driven facts ("the exit finished",
  // "the next frame arrived", "the enter timer fired"). Those can only be learned from a timer or
  // an animation frame, so they are written from those callbacks and nowhere else.
  //
  // `generation` counts the changes of `source`, and each time-driven fact records the generation
  // it was reached in. Any later change of `source` therefore invalidates it without anything
  // having to reset it, so no effect has to copy `source` into other signals (which Solid 2
  // reports as EFFECT_RELAY_TEAR: the first frame would show the new `source` with stale state).
  const generation = createMemo<number>(previous => {
    source();
    return (previous ?? -1) + 1;
  });
  // Written from timer / animation frame callbacks only, which run outside any owner, so these
  // deliberately do not opt in to `ownedWrite`: a write from an owned scope should still be flagged.
  const [exitedIn, setExitedIn] = createSignal<number>(0);
  const [visibleIn, setVisibleIn] = createSignal<number>(initialState ? 0 : -1);
  const [enteredIn, setEnteredIn] = createSignal<number>(initialState ? 0 : -1);

  const isMounted = createMemo(() => source() || exitedIn() !== generation());
  const isVisible = createMemo(() => source() && visibleIn() === generation());
  const hasEntered = createMemo(() => source() && enteredIn() === generation());

  const isExiting = createMemo(() => isMounted() && !source());
  const isEntering = createMemo(() => source() && !hasEntered());
  const isAnimating = createMemo(() => isEntering() || isExiting());

  // Exit: unmount once the exit duration is over, unless `source` came back in the meantime.
  createEffect(
    () => (source() ? undefined : generation()),
    exitingIn => {
      if (exitingIn === undefined) return;
      const timeoutId = setTimeout(() => {
        if (untrack(exitedIn) === exitingIn) return;
        setExitedIn(exitingIn);
        onExited?.();
      }, exitDuration());
      return () => clearTimeout(timeoutId);
    },
  );

  // Enter, step 1: become visible on the frame after mounting.
  createEffect(
    () => source() && !isVisible(),
    shouldAnimate => {
      if (!shouldAnimate) return;
      // Force reflow so the initial invisible state is painted before
      // isVisible becomes true, enabling CSS transitions to fire.
      document.body.offsetHeight;
      const enteringIn = untrack(generation);
      const animationFrameId = requestAnimationFrame(() => setVisibleIn(enteringIn));
      return () => cancelAnimationFrame(animationFrameId);
    },
  );

  // Enter, step 2: the enter transition is over once enter duration has passed since becoming visible.
  createEffect(
    () => isVisible() && !hasEntered(),
    shouldTrackEnter => {
      if (!shouldTrackEnter) return;
      const enteringIn = untrack(generation);
      const timeoutId = setTimeout(() => setEnteredIn(enteringIn), enterDuration());
      return () => clearTimeout(timeoutId);
    },
  );

  return {
    isMounted,
    isVisible,
    isAnimating,
    isEntering,
    isExiting,
  };
}

const itemShouldBeMounted = <TItem>(item: TItem) => item !== false && item != null;

/**
 * The result of {@link createPresence}.
 */
export type PresenceResult<TItem> = {
  /** Should the component be returned from render? */
  isMounted: Accessor<boolean>;
  /** The item that is currently mounted. */
  mountedItem: Accessor<TItem | undefined>;
  /** Should the component have its visible styles applied? */
  isVisible: Accessor<boolean>;
  /** Is the component either entering or exiting currently? */
  isAnimating: Accessor<boolean>;
  /** Is the component entering currently? */
  isEntering: Accessor<boolean>;
  /** Is the component exiting currently? */
  isExiting: Accessor<boolean>;
};

/**
 * Utility to animate the presence of an element based on the existence of data or lack thereof.
 *
 * @param item a reactive value driving the transition
 * @param options options to configure the transition, see {@link Options}
 * @returns an object with reactive accessors representing the state of the transition. See {@link PresenceResult}.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/presence#createPresence
 *
 * @example
 * ```ts
 * const items = ["foo", "bar", "baz", "qux"];
 * const [activeItem, setActiveItem] = createSignal(items[0]);
 * const presence = createPresence(activeItem);
 * ```
 */
export function createPresence<TItem>(
  item: Accessor<TItem | undefined>,
  options: Options,
): PresenceResult<TItem> {
  const initial = untrack(item);
  // The item lives in a box: a signal cannot hold a function directly (`createSignal(fn)` derives
  // from it, and a setter calls it as an updater), and an item can well be one (a component).
  const [mounted, setMounted] = createSignal<{ item: TItem | undefined }>(
    { item: initial },
    INTERNAL_OPTIONS,
  );
  const mountedItem: Accessor<TItem | undefined> = () => mounted().item;
  const setMountedItem = (item: TItem | undefined) => setMounted({ item });
  const [shouldBeMounted, setShouldBeMounted] = createSignal<boolean>(itemShouldBeMounted(initial), INTERNAL_OPTIONS);
  // Keeps `mountedItem` / `shouldBeMounted` in step with `item`. It runs when `item` changes and
  // when an exit transition has finished (see `onExited`), and nowhere else: a change while still
  // mounted only starts the exit, the swap itself happens once the exit is over.
  //
  // It must not be an effect that also tracks `isMounted`: `isMounted` is derived from
  // `shouldBeMounted`, which is written here, so the effect would feed back into its own inputs
  // (Solid 2: EFFECT_WRITES_OWN_SOURCE / EFFECT_RELAY_TEAR). `isM` is passed in rather than tracked.
  const syncItem = (currentItem: TItem | undefined, isM: boolean) => {
    const mounted = untrack(mountedItem);
    if (mounted !== currentItem) {
      if (isM) {
        setShouldBeMounted(false);
      } else if (itemShouldBeMounted(currentItem)) {
        setMountedItem(currentItem);
        setShouldBeMounted(true);
      }
    } else {
      setShouldBeMounted(itemShouldBeMounted(currentItem));
    }
  };

  const { isMounted, ...rest } = createPresenceBase(shouldBeMounted, options, () =>
    // Runs after the flush in which `isMounted` turned false, so consumers get to see the gap between
    // two items (a `<Show when={isMounted()}>` unmounts the old subtree and mounts a fresh one), and
    // `item` is read as committed rather than as it was before a write that has not been flushed yet.
    onFlush(() => {
      // An item that is pending or errored is left to the effect below, which swaps once it settles.
      if (isPending(item)) return;
      let currentItem: TItem | undefined;
      try {
        currentItem = untrack(item);
      } catch {
        return;
      }
      syncItem(currentItem, untrack(isMounted));
    }),
  );

  createEffect(
    () => item(),
    currentItem => syncItem(currentItem, untrack(isMounted)),
  );

  return {
    ...rest,
    isMounted: () => isMounted() && mountedItem() !== undefined,
    mountedItem,
  };
}
