type SSEReadyState = 0 | 1 | 2;

declare global {
  // eslint-disable-next-line no-var
  var SSEInstances: MockEventSource[];
}

(global as any).SSEInstances = [] as MockEventSource[];

export class MockEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;

  readyState: SSEReadyState = 0;
  withCredentials: boolean;
  url: string;

  constructor(url: string, options?: EventSourceInit) {
    super();
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
    SSEInstances.push(this);

    setTimeout(() => {
      if (this.readyState === 0) {
        this.readyState = 1;
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
    this.readyState = 2;
    this.dispatchEvent(new Event("error"));
  }

  /** Simulate a transient error — browser is retrying, `readyState` stays `CONNECTING`. */
  simulateTransientError() {
    this.readyState = 0;
    this.dispatchEvent(new Event("error"));
  }

  close() {
    this.readyState = 2;
    const idx = SSEInstances.indexOf(this);
    if (idx !== -1) SSEInstances.splice(idx, 1);
  }
}

(global as any).EventSource = MockEventSource;
