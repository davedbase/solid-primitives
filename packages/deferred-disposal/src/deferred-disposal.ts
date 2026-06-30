import { createMemo, createSignal, onCleanup, type Accessor } from "solid-js";
import { INTERNAL_OPTIONS, isServer } from "@solid-primitives/utils";

export interface DisposalHold {
  readonly label?: string;
  release(): void;
  /** Synchronous disposal — releases the hold. Enables `using hold = removal.hold()`. */
  [Symbol.dispose](): void;
  /** Async disposal — releases the hold and returns a resolved Promise.
   *  Enables `await using hold = removal.hold()` and `AsyncDisposableStack.use(hold)`. */
  [Symbol.asyncDispose](): Promise<void>;
}

export interface DeferredDisposal {
  /** Creates a hold that prevents disposal from settling. Call release() when async work completes. */
  hold(label?: string): DisposalHold;
  /** Convenience: holds disposal until the given Promise settles (resolved or rejected). */
  defer(work: Promise<unknown>): void;
  /** Reactive boolean — true while any hold is active. */
  readonly isHeld: Accessor<boolean>;
  /** Reactive boolean — true once the owning reactive scope has been cleaned up. */
  readonly isDisposing: Accessor<boolean>;
  /**
   * Async memo that settles when all holds are released. Integrates natively with Solid's
   * async reactivity: use `resolve(() => removal.allSettled())` to await settlement, or
   * read it inside a `<Loading>` boundary for declarative pending state.
   */
  readonly allSettled: Accessor<Promise<void>>;
}

/**
 * Creates a deferred disposal coordinator. Holds prevent the `allSettled` promise from
 * resolving, allowing async work (e.g. exit animations) to complete before downstream
 * cleanup proceeds.
 *
 * Automatically registers with `onCleanup` — when the owning reactive scope is disposed,
 * `isDisposing` becomes true and upstream layers can observe this to begin exit sequences.
 *
 * @example
 * ```ts
 * const removal = createDeferredDisposal();
 *
 * // Manual hold/release
 * onExit(({ element, removal }) => {
 *   const hold = removal.hold("exit animation");
 *   animate(element(), keyframes, options).finished.finally(() => hold.release());
 * });
 *
 * // Using explicit resource management
 * onExit(async ({ element, removal }) => {
 *   using hold = removal.hold("exit animation");
 *   await animate(element(), keyframes, options).finished;
 * });
 *
 * // Convenience defer
 * onExit(({ element, removal }) => {
 *   removal.defer(animate(element(), keyframes, options).finished);
 * });
 * ```
 */
export function createDeferredDisposal(): DeferredDisposal {
  const [work, setWork] = createSignal<Promise<void>[]>([], INTERNAL_OPTIONS);
  const [isDisposing, setIsDisposing] = createSignal(false, INTERNAL_OPTIONS);

  // Plain function (not memo) so SSR signal writes are immediately visible on read.
  const isHeld: Accessor<boolean> = () => work().length > 0;

  // Async memo — Solid treats this as pending while any work promise is unresolved.
  // Integrates with resolve(), isPending(), and <Loading> boundaries.
  // In SSR there is no async reactivity, so fall back to an always-resolved accessor.
  // Cast required: createMemo infers `void | Promise<void>` for async memos in Solid 2.0.
  const allSettled = (
    isServer
      ? () => Promise.resolve()
      : createMemo(() => Promise.all(work()).then(() => {}))
  ) as Accessor<Promise<void>>;

  onCleanup(() => setIsDisposing(true));

  function hold(label?: string): DisposalHold {
    let released = false;
    let resolveHold!: () => void;
    const p = new Promise<void>(r => {
      resolveHold = r;
    });

    setWork(prev => [...prev, p]);

    return {
      label,
      release() {
        if (released) return;
        released = true;
        resolveHold();
        setWork(prev => prev.filter(x => x !== p));
      },
      [Symbol.dispose]() {
        this.release();
      },
      [Symbol.asyncDispose]() {
        this.release();
        return Promise.resolve();
      },
    };
  }

  function defer(work: Promise<unknown>): void {
    const h = hold();
    // Use then(release, release) rather than finally() so rejected promises
    // don't propagate as unhandled rejections — the caller already holds the reference.
    work.then(() => h.release(), () => h.release());
  }

  return { hold, defer, isHeld, isDisposing, allSettled };
}
