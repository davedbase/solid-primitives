import {
  type Accessor,
  createComputed,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";
import { isServer } from "solid-js/web";
import { access, type MaybeAccessor } from "@solid-primitives/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Options shared between `makeSSE` and `createSSE`.
 */
export type SSEOptions = {
  /** Pass credentials with request (same as EventSourceInit.withCredentials) */
  withCredentials?: boolean;
  /** Called when the connection opens */
  onOpen?: (event: Event) => void;
  /** Called on every unnamed `"message"` event */
  onMessage?: (event: MessageEvent) => void;
  /** Called on error */
  onError?: (event: Event) => void;
  /** Handlers for custom named SSE event types, e.g. `{ update: handler }` */
  events?: Record<string, (event: MessageEvent) => void>;
};

export type SSEReconnectOptions = {
  /** Maximum number of reconnect attempts. Default: `Infinity` */
  retries?: number;
  /** Delay in milliseconds between reconnect attempts. Default: `3000` */
  delay?: number;
};

export type CreateSSEOptions<T> = SSEOptions & {
  /** Initial value of the `data` signal before any message arrives */
  initialValue?: T;
  /**
   * Transform raw string data from each message event.
   * Use this to parse JSON: `{ transform: JSON.parse }`
   */
  transform?: (raw: string) => T;
  /**
   * App-level reconnect behavior on terminal errors (readyState → CLOSED).
   *
   * - `false` (default): no app-level reconnect
   * - `true`: reconnect with defaults (Infinity retries, 3000ms delay)
   * - object: custom `{ retries?, delay? }`
   *
   * Note: `EventSource` already reconnects natively for transient network
   * drops. This option handles cases where the browser gives up entirely.
   */
  reconnect?: boolean | SSEReconnectOptions;
};

export type SSEReturn<T> = {
  /** The raw `EventSource` instance. `undefined` on SSR or before first connect. */
  source: Accessor<EventSource | undefined>;
  /** The latest message data, parsed through `transform` if provided. */
  data: Accessor<T | undefined>;
  /** The latest error event, `undefined` when no error has occurred. */
  error: Accessor<Event | undefined>;
  /**
   * The current connection state:
   * - `0` CONNECTING
   * - `1` OPEN
   * - `2` CLOSED
   */
  readyState: Accessor<0 | 1 | 2>;
  /** Close the connection. */
  close: VoidFunction;
  /** Force-close the current connection and open a new one. */
  reconnect: VoidFunction;
};

// ─── makeSSE ─────────────────────────────────────────────────────────────────

/**
 * Creates a raw `EventSource` connection without Solid lifecycle management.
 * Event handlers are attached immediately; cleanup must be called manually.
 *
 * ```ts
 * const [source, cleanup] = makeSSE("https://api.example.com/events", {
 *   onMessage: (e) => console.log(e.data),
 *   onError: (e) => console.error("error", e),
 * });
 * // Later:
 * cleanup();
 * ```
 *
 * @param url The SSE endpoint URL
 * @param options Event handlers and `EventSource` options
 * @returns Tuple of `[EventSource, cleanup]`
 */
export const makeSSE = (
  url: string | URL,
  options: SSEOptions = {},
): [source: EventSource, cleanup: VoidFunction] => {
  const source = new EventSource(url, { withCredentials: options.withCredentials });

  if (options.onOpen) source.addEventListener("open", options.onOpen);
  if (options.onMessage) source.addEventListener("message", options.onMessage);
  if (options.onError) source.addEventListener("error", options.onError);
  if (options.events) {
    for (const [name, handler] of Object.entries(options.events))
      source.addEventListener(name, handler as EventListener);
  }

  const cleanup = () => {
    source.close();
    if (options.onOpen) source.removeEventListener("open", options.onOpen);
    if (options.onMessage) source.removeEventListener("message", options.onMessage);
    if (options.onError) source.removeEventListener("error", options.onError);
    if (options.events) {
      for (const [name, handler] of Object.entries(options.events))
        source.removeEventListener(name, handler as EventListener);
    }
  };

  return [source, cleanup];
};

// ─── createSSE ───────────────────────────────────────────────────────────────

/**
 * Creates a reactive SSE (Server-Sent Events) connection that integrates with
 * the Solid reactive system and owner lifecycle.
 *
 * - Accepts a reactive URL — reconnects automatically when the URL signal changes
 * - Closes the connection on owner disposal via `onCleanup`
 * - SSR-safe: returns static stubs on the server
 *
 * ```ts
 * const { data, readyState, error, close, reconnect } = createSSE<{ msg: string }>(
 *   "https://api.example.com/events",
 *   { transform: JSON.parse, reconnect: { retries: 3, delay: 2000 } },
 * );
 *
 * return <p>{data()?.msg}</p>;
 * ```
 *
 * @param url Static URL string or reactive `Accessor<string>`
 * @param options Configuration including handlers, transform, and reconnect policy
 */
export const createSSE = <T = string>(
  url: MaybeAccessor<string>,
  options: CreateSSEOptions<T> = {},
): SSEReturn<T> => {
  // ── SSR stub ──────────────────────────────────────────────────────────────
  if (isServer) {
    return {
      source: () => undefined,
      data: () => options.initialValue,
      error: () => undefined,
      readyState: () => 2,
      close: () => void 0,
      reconnect: () => void 0,
    };
  }

  // ── Reactive state ────────────────────────────────────────────────────────
  const [source, setSource] = createSignal<EventSource | undefined>(undefined);
  const [data, setData] = createSignal<T | undefined>(options.initialValue);
  const [error, setError] = createSignal<Event | undefined>(undefined);
  const [readyState, setReadyState] = createSignal<0 | 1 | 2>(0);

  // ── Reconnect config ──────────────────────────────────────────────────────
  const reconnectConfig: SSEReconnectOptions =
    options.reconnect === true
      ? { retries: Infinity, delay: 3000 }
      : !options.reconnect
        ? { retries: 0, delay: 0 }
        : options.reconnect;

  let retriesLeft = reconnectConfig.retries ?? 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  };

  // ── Connection management ─────────────────────────────────────────────────
  let currentCleanup: VoidFunction | undefined;

  /** Open a fresh connection, resetting the retry counter. */
  const connect = (resolvedUrl: string) => {
    retriesLeft = reconnectConfig.retries ?? 0;
    _open(resolvedUrl);
  };

  /** Internal: open connection, decrement retries on terminal errors. */
  const _open = (resolvedUrl: string) => {
    clearReconnectTimer();

    const handleOpen = (e: Event) => {
      setReadyState(1);
      setError(undefined);
      options.onOpen?.(e);
    };

    const handleMessage = (e: MessageEvent) => {
      const value = options.transform ? options.transform(e.data as string) : (e.data as T);
      setData(() => value);
      options.onMessage?.(e);
    };

    const handleError = (e: Event) => {
      const es = e.target as EventSource;
      setReadyState(es.readyState as 0 | 1 | 2);
      setError(() => e);
      options.onError?.(e);

      // Only app-level reconnect when the browser has given up (CLOSED).
      // When readyState is still CONNECTING the browser is handling retries.
      if (es.readyState === EventSource.CLOSED && retriesLeft > 0) {
        retriesLeft--;
        reconnectTimer = setTimeout(() => _open(resolvedUrl), reconnectConfig.delay ?? 3000);
      }
    };

    const [es, cleanup] = makeSSE(resolvedUrl, {
      withCredentials: options.withCredentials,
      onOpen: handleOpen,
      onMessage: handleMessage,
      onError: handleError,
      events: options.events,
    });

    setSource(() => es);
    setReadyState(es.readyState as 0 | 1 | 2);
    currentCleanup = cleanup;
  };

  const disconnect = () => {
    clearReconnectTimer();
    retriesLeft = 0;
    currentCleanup?.();
    currentCleanup = undefined;
    setSource(undefined);
    setReadyState(2);
  };

  const manualReconnect = () => {
    const currentUrl = untrack(() => access(url));
    disconnect();
    connect(currentUrl);
  };

  // ── Initial connection (synchronous) ─────────────────────────────────────
  // createEffect is deferred until after the current synchronous code block,
  // so we connect immediately here to ensure signals are populated as soon as
  // createSSE returns.
  connect(untrack(() => access(url)));

  // ── Reactive URL handling ─────────────────────────────────────────────────
  // Only needed when url is an accessor. `createComputed` runs synchronously
  // on creation (unlike `createEffect`, which is deferred), so the reactive
  // subscription to `url` is established immediately. The `prevUrl` guard
  // prevents a redundant reconnect on the first pass (we already connected).
  if (typeof url === "function") {
    let prevUrl = untrack(url as Accessor<string>);
    createComputed(() => {
      const resolvedUrl = (url as Accessor<string>)();
      if (resolvedUrl !== prevUrl) {
        prevUrl = resolvedUrl;
        untrack(() => {
          currentCleanup?.();
          currentCleanup = undefined;
        });
        connect(resolvedUrl);
      }
    });
  }

  // ── Lifecycle cleanup ─────────────────────────────────────────────────────
  onCleanup(() => {
    clearReconnectTimer();
    currentCleanup?.();
    currentCleanup = undefined;
  });

  return { source, data, error, readyState, close: disconnect, reconnect: manualReconnect };
};
