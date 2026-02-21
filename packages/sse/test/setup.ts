import { SSEReadyState } from "../src/sse.js";

declare global {
  var SSEInstances: MockEventSource[];
}

(global as any).SSEInstances = [] as MockEventSource[];

export class MockEventSource extends EventTarget {
  static readonly CONNECTING = SSEReadyState.CONNECTING;
  static readonly OPEN = SSEReadyState.OPEN;
  static readonly CLOSED = SSEReadyState.CLOSED;
  readonly CONNECTING = SSEReadyState.CONNECTING;
  readonly OPEN = SSEReadyState.OPEN;
  readonly CLOSED = SSEReadyState.CLOSED;

  readyState: SSEReadyState = SSEReadyState.CONNECTING;
  withCredentials: boolean;
  url: string;

  constructor(url: string, options?: EventSourceInit) {
    super();
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
    SSEInstances.push(this);

    setTimeout(() => {
      if (this.readyState === SSEReadyState.CONNECTING) {
        this.readyState = SSEReadyState.OPEN;
        this.dispatchEvent(new Event("open"));
      }
    }, 10);
  }

  /** Simulate a named (or unnamed "message") event arriving from the server. */
  simulateMessage(data: string, eventType = "message") {
    this.dispatchEvent(new MessageEvent(eventType, { data }));
  }

  /** Simulate a terminal error — `readyState` goes to `CLOSED`. */
  simulateError() {
    this.readyState = SSEReadyState.CLOSED;
    this.dispatchEvent(new Event("error"));
  }

  /** Simulate a transient error — browser is retrying, `readyState` stays `CONNECTING`. */
  simulateTransientError() {
    this.readyState = SSEReadyState.CONNECTING;
    this.dispatchEvent(new Event("error"));
  }

  close() {
    this.readyState = SSEReadyState.CLOSED;
    const idx = SSEInstances.indexOf(this);
    if (idx !== -1) SSEInstances.splice(idx, 1);
  }
}

(global as any).EventSource = MockEventSource;
