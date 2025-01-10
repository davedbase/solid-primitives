import { Observable, Subject } from "rxjs";
import { Accessor, createComputed, createMemo, createSignal, onCleanup, untrack } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";

export type Handler<E> = (<O>(transform: (e: E) => Promise<O> | O) => Handler<O>) & {
  $: Observable<E>;
};
export type Emitter<E> = (e: E) => void;

function makeHandler<E>($: Observable<E>): Handler<E> {
  function handler<O>(transform: (e: E) => Promise<O> | O): Handler<O> {
    const next$ = new Subject<O>();
    const sub = $.subscribe(e => {
      try {
        const res = transform(e);
        if (res instanceof Promise) res.then(o => next$.next(o));
        else next$.next(res);
      } catch (e) {
        if (!(e instanceof HaltError)) throw e;
        console.info(e.message);
      }
    });
    onCleanup(() => sub.unsubscribe());
    return makeHandler<O>(next$);
  }

  handler.$ = $;
  return handler;
}

export function createEvent<E = any>(): [Handler<E>, Emitter<E>] {
  const $ = new Subject<E>();
  return [makeHandler($), e => $.next(e)] as const;
}

export function createTopic<T>(...args: Handler<T>[]): Handler<T> {
  const [onEvent, emitEvent] = createEvent<T>();
  args.forEach(h => h(emitEvent));
  return onEvent;
}

export function createSubject<T>(
  init: T,
  ...events: Array<Handler<T | ((prev: T) => T)>>
): Accessor<T>;
export function createSubject<T>(
  init: () => T,
  ...events: Array<Handler<T | ((prev: T) => T)>>
): Accessor<T>;
export function createSubject<T>(
  init: undefined,
  ...events: Array<Handler<T | ((prev: T) => T)>>
): Accessor<T | undefined>;
export function createSubject<T>(
  init: T | undefined,
  ...events: Array<Handler<T | ((prev: T) => T)>>
): Accessor<T | undefined>;
export function createSubject<T>(
  init: (() => T) | T | undefined,
  ...events: Array<Handler<T | ((prev: T) => T)>>
) {
  if (typeof init === "function") {
    const memoSubject = createMemo(() => createSubject((init as () => T)(), ...events));
    return () => memoSubject()();
  } else {
    const [signal, setSignal] = createSignal(init);
    events.forEach(h => h(setSignal));
    return signal;
  }
}

export function createSubjectStore<T extends object = {}>(
  init: () => T,
  ...events: Array<Handler<(prev: T) => void>>
): T;
export function createSubjectStore<T extends object = {}>(
  init: (() => T) | T | undefined,
  ...events: Array<Handler<(prev: T) => void>>
) {
  if (typeof init === "function") {
    const [store, setStore] = createStore<T>(untrack(init));
    createComputed(() => setStore(reconcile(init())));
    const event = createTopic(...events);
    event(mutation => setStore(produce(mutation)));
    return store;
  } else {
    const [store, setStore] = init ? createStore<T>(init) : createStore();
    const event = createTopic(...events);
    event(mutation => setStore(produce(mutation)));
    return store;
  }
}

export class HaltError extends Error {
  constructor(public reason?: string) {
    super(reason ? "Event propogation halted: " + reason : "Event propogation halted");
  }
}

export function halt(reason?: string): never {
  throw new HaltError(reason);
}

export function createPartition<T>(handler: Handler<T>, predicate: (arg: T) => boolean) {
  const trueHandler = handler(p => (predicate(p) ? p : halt()));
  const falseHandler = handler(p => (predicate(p) ? halt() : p));
  return [trueHandler, falseHandler] as const;
}
