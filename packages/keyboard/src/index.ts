import { makeEventListener } from "@solid-primitives/event-listener";
import { createSingletonRoot } from "@solid-primitives/rootless";
import { arrayEquals } from "@solid-primitives/utils";
import { type Accessor, createEffect, createMemo, createSignal, on, untrack } from "solid-js";
import { isServer } from "solid-js/web";

export type ModifierKey = "Alt" | "Control" | "Meta" | "Shift";
export type KbdKey = ModifierKey | (string & {});

function equalsKeyHoldSequence(sequence: string[][], model: string[]): boolean {
  for (let i = sequence.length - 1; i >= 0; i--) {
    const _model = model.slice(0, i + 1);
    if (!arrayEquals(sequence[i]!, _model)) return false;
  }
  return true;
}

/**
 * Provides a signal with the last keydown event.
 *
 * The signal is `null` initially, and is reset to that after a timeout.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useKeyDownEvent
 *
 * @returns
 * Returns a signal of the last keydown event
 * ```ts
 * Accessor<KeyboardEvent | null>
 * ```
 *
 * @example
 * ```ts
 * const event = useKeyDownEvent();
 *
 * createEffect(() => {
 *   const e = event();
 *   console.log(e) // => KeyboardEvent | null
 *
 *   if (e) {
 *     console.log(e.key) // => "Q" | "ALT" | ... or null
 *     e.preventDefault(); // prevent default behavior or last keydown event
 *   }
 * })
 * ```
 */
export const useKeyDownEvent = /*#__PURE__*/ createSingletonRoot<Accessor<KeyboardEvent | null>>(
  () => {
    if (isServer) {
      return () => null;
    }

    const [event, setEvent] = createSignal<KeyboardEvent | null>(null);

    makeEventListener(window, "keydown", e => {
      setEvent(e);
      setTimeout(() => setEvent(null));
    });

    return event;
  },
);

type OldPressedKeys = [Accessor<string[]>, { event: Accessor<KeyboardEvent | null> }];

/**
 * Provides a signal with the list of currently held keys, ordered from least recent to most recent.
 *
 * This is a [singleton root primitive](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot). *(signals and event-listeners are reused across dependents)*
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useKeyDownList
 *
 * @returns
 * Returns a signal of a list of keys
 * ```ts
 * Accessor<string[]>
 * ```
 *
 * @example
 * ```ts
 * const keys = useKeyDownList();
 * createEffect(() => {
 *    console.log(keys()) // => ["ALT", "CONTROL", "Q", "A"]
 * })
 * ```
 */
export const useKeyDownList = /*#__PURE__*/ createSingletonRoot<Accessor<string[]>>(() => {
  if (isServer) {
    const keys = () => [];
    // this is for backwards compatibility
    // TODO remove in the next major version
    (keys as any as OldPressedKeys)[0] = keys;
    (keys as any as OldPressedKeys)[1] = { event: () => null };
    (keys as any as OldPressedKeys)[Symbol.iterator] = function* () {
      yield (keys as any as OldPressedKeys)[0];
      yield (keys as any as OldPressedKeys)[1];
    } as any;
    return keys;
  }

  const [pressedKeys, setPressedKeys] = createSignal<string[]>([]),
    reset = () => setPressedKeys([]),
    event = useKeyDownEvent();

  makeEventListener(window, "keydown", e => {
    // e.key may be undefined when used with <datalist> el
    // gh issue: https://github.com/solidjs-community/solid-primitives/issues/246
    if (e.repeat || typeof e.key !== "string") return;

    const key = e.key.toUpperCase(),
      currentKeys = pressedKeys();

    if (currentKeys.includes(key)) return;

    const keys = [...currentKeys, key];

    // if the modifier is pressed before we start listening
    // we should add it to the list
    if (
      currentKeys.length === 0 &&
      key !== "ALT" &&
      key !== "CONTROL" &&
      key !== "META" &&
      key !== "SHIFT"
    ) {
      if (e.shiftKey) keys.unshift("SHIFT");
      if (e.altKey) keys.unshift("ALT");
      if (e.ctrlKey) keys.unshift("CONTROL");
      if (e.metaKey) keys.unshift("META");
    }

    setPressedKeys(keys);
  });

  makeEventListener(window, "keyup", e => {
    if (typeof e.key !== "string") return;
    const key = e.key.toUpperCase();
    // macOS never fires keyup for other keys held down together with Meta —
    // only Meta's own keyup arrives — so its release must clear everything,
    // or the other keys' stale state corrupts the next press.
    // See https://github.com/solidjs-community/solid-primitives/issues/269
    if (key === "META") {
      reset();
    } else {
      setPressedKeys(prev => prev.filter(_key => _key !== key));
    }
  });

  makeEventListener(window, "blur", reset);
  makeEventListener(window, "contextmenu", e => {
    e.defaultPrevented || reset();
  });

  // this is for backwards compatibility
  // TODO remove in the next major version
  (pressedKeys as any as OldPressedKeys)[0] = pressedKeys;
  (pressedKeys as any as OldPressedKeys)[1] = { event };

  (pressedKeys as any as OldPressedKeys)[Symbol.iterator] = function* () {
    yield (pressedKeys as any as OldPressedKeys)[0];
    yield (pressedKeys as any as OldPressedKeys)[1];
  } as any;

  return pressedKeys;
});

/**
 * Provides a signal with the currently held single key. Pressing any other key at the same time will reset the signal to `null`.
 *
 * This is a [singleton root primitive](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot). *(signals and event-listeners are reused across dependents)*
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useCurrentlyHeldKey
 *
 * @returns
 * ```ts
 * Accessor<string | null>
 * ```
 *
 * @example
 * ```ts
 * const key = useCurrentlyHeldKey();
 * createEffect(() => {
 *    console.log(key()) // => "Q" | "ALT" | ... or null
 * })
 * ```
 */
export const useCurrentlyHeldKey = /*#__PURE__*/ createSingletonRoot<Accessor<string | null>>(
  () => {
    if (isServer) {
      return () => null;
    }

    const keys = useKeyDownList();
    let prevKeys = untrack(keys);

    return createMemo(() => {
      const _keys = keys();
      const prev = prevKeys;
      prevKeys = _keys;
      if (prev.length === 0 && _keys.length === 1) return _keys[0]!;
      return null;
    });
  },
);

/**
 * Provides a signal with a sequence of currently held keys, as they were pressed down and up.
 *
 * This is a [singleton root primitive](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless#createSingletonRoot). *(signals and event-listeners are reused across dependents)*
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#useKeyDownSequence
 *
 * @returns
 * ```ts
 * Accessor<string[][]>
 * // [["CONTROL"], ["CONTROL", "Q"], ["CONTROL", "Q", "A"]]
 * ```
 *
 * @example
 * ```ts
 * const sequence = useKeyDownSequence();
 * createEffect(() => {
 *    console.log(sequence()) // => string[][]
 * })
 * ```
 */
export const useKeyDownSequence = /*#__PURE__*/ createSingletonRoot<Accessor<string[][]>>(() => {
  if (isServer) {
    return () => [];
  }

  const keys = useKeyDownList();

  return createMemo(prev => {
    if (keys().length === 0) return [];
    return [...prev, keys()];
  }, []);
});

/**
 * Provides a `boolean` signal indicating if provided {@link key} is currently being held down.
 * Holding multiple keys at the same time will return `false` — holding only the specified one will return `true`.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#createKeyHold
 *
 * @param key The key to check for.
 * @options The options for the key hold.
 * - `preventDefault` — Controlls in the keydown event should have it's default action prevented. Enabled by default.
 * @returns
 * ```ts
 * Accessor<boolean>
 * ```
 *
 * @example
 * ```ts
 * const isHeld = createKeyHold("ALT");
 * createEffect(() => {
 *    console.log(isHeld()) // => boolean
 * })
 * ```
 */
export function createKeyHold(
  key: KbdKey,
  options: { preventDefault?: boolean } = {},
): Accessor<boolean> {
  if (isServer) {
    return () => false;
  }

  key = key.toUpperCase();
  const { preventDefault = true } = options,
    event = useKeyDownEvent(),
    heldKey = useCurrentlyHeldKey();

  return createMemo(() => heldKey() === key && (preventDefault && event()?.preventDefault(), true));
}

/**
 * Creates a keyboard shotcut observer. The provided {@link callback} will be called when the specified {@link keys} are pressed.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard#createShortcut
 *
 * @param keys The sequence of keys to watch for.
 * @param callback The callback to call when the keys are pressed.
 * @options The options for the shortcut.
 * - `preventDefault` — Controlls in the keydown event should have it's default action prevented. Enabled by default.
 * - `requireReset` — If `true`, the shortcut will only be triggered once until all of the keys stop being pressed. Disabled by default.
 *
 * @example
 * ```ts
 * createShortcut(["CONTROL", "SHIFT", "C"], () => {
 *    console.log("Ctrl+Shift+C was pressed");
 * });
 * ```
 */
export function createShortcut(
  keys: KbdKey[],
  callback: (event: KeyboardEvent | null) => void,
  options: {
    preventDefault?: boolean;
    requireReset?: boolean;
  } = {},
): void {
  if (isServer || !keys.length) {
    return;
  }

  keys = keys.map(key => key.toUpperCase());
  const { preventDefault = true } = options,
    event = useKeyDownEvent(),
    sequence = useKeyDownSequence();

  let reset = false;
  // allow to check the sequence only once the user has released all keys
  const handleSequenceWithReset = (sequence: string[][]) => {
    if (!sequence.length) return (reset = false);
    if (reset) return;
    const e = event();

    if (sequence.length < keys.length) {
      // optimistically preventDefault behavior if we yet don't have enough keys
      if (equalsKeyHoldSequence(sequence, keys.slice(0, sequence.length))) {
        preventDefault && e && e.preventDefault();
      } else {
        reset = true;
      }
    } else {
      reset = true;
      if (equalsKeyHoldSequence(sequence, keys)) {
        preventDefault && e && e.preventDefault();
        callback(e);
      }
    }
  };

  // allow checking the sequence even if the user is still holding down keys
  const handleSequenceWithoutReset = (sequence: string[][]) => {
    const last = sequence.at(-1);
    if (!last) return;
    const e = event();

    // optimistically preventDefault behavior if we yet don't have enough keys
    if (preventDefault && last.length < keys.length) {
      if (arrayEquals(last, keys.slice(0, keys.length - 1))) {
        e && e.preventDefault();
      }
      return;
    }
    if (arrayEquals(last, keys)) {
      const prev = sequence.at(-2);
      if (!prev || arrayEquals(prev, keys.slice(0, keys.length - 1))) {
        preventDefault && e && e.preventDefault();
        callback(e);
      }
    }
  };

  createEffect(
    on(sequence, options.requireReset ? handleSequenceWithReset : handleSequenceWithoutReset),
  );
}
