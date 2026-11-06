import { renderHydrationRoundTrip } from "../../../scripts/test-utils/hydration-harness.ts";
import { dispatchFakeEvent, event_target } from "./setup.js";
import { describe, test, expect } from "vitest";
import { createRoot, createSignal, flush, OBSERVE } from "solid-js";
import { attribution } from "solid-js/attribution";
import {
  createEventListener,
  createEventSignal,
  eventListener,
  EventListenerDirectiveProps,
  makeEventListener,
  makeEventListenerStack,
} from "../src/index.js";

describe("makeEventListener", () => {
  test("listens to events", () =>
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent!: Event;
      makeEventListener<{ test: Event }>(event_target, "test", ev => {
        capturedEvent = ev;
      });
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(testEvent);
      dispose();
    }));

  test("returns clear() function", () =>
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent!: Event;
      const clear = makeEventListener<{ test: Event }>(event_target, "test", ev => {
        capturedEvent = ev;
      });
      clear();
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(undefined);
      dispose();
    }));

  test("clears on cleanup", () =>
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent!: Event;
      makeEventListener<{ test: Event }>(event_target, "test", ev => {
        capturedEvent = ev;
      });
      dispose();
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(undefined);
    }));
});

describe("makeEventListenerStack", () => {
  test("listens to events, and disposes on cleanup", () =>
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent: any;
      const [listen] = makeEventListenerStack<{ test: Event }>(event_target);
      listen("test", ev => (capturedEvent = ev));
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(testEvent);
      capturedEvent = undefined;
      dispose();
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(undefined);
    }));

  test("listens to events, and disposes on cleanup", () =>
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent: any;
      const [listen, clear] = makeEventListenerStack<{ test: Event }>(event_target);
      listen("test", ev => (capturedEvent = ev));
      clear();
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(undefined);
      dispose();
    }));
});

describe("makeEventListenerStack ownership", () => {
  test("disposing the owner clears listeners added to the stack after setup (outside the owner)", () => {
    // makeEventListener only registers its own cleanup under the owner active at listen() time,
    // so a listener added later (e.g. from an event handler) is removed solely by the stack's own cleanup.
    const target = new EventTarget();
    let hits = 0;
    let dispose!: VoidFunction;
    let listen!: ReturnType<typeof makeEventListenerStack<{ test: Event }>>[0];
    createRoot(d => {
      dispose = d;
      [listen] = makeEventListenerStack<{ test: Event }>(target);
    });
    listen("test", () => hits++);
    target.dispatchEvent(new Event("test"));
    expect(hits).toBe(1);
    dispose();
    target.dispatchEvent(new Event("test"));
    expect(hits).toBe(1);
  });

  test("does not warn when called without an owner and clear() works", () => {
    const release = attribution.enable();
    const cap = OBSERVE!.diagnostics.capture();
    let hits = 0;
    const [listen, clear] = makeEventListenerStack<{ test: Event }>(event_target);
    listen("test", () => hits++);
    dispatchFakeEvent("test", new Event("test"));
    expect(hits).toBe(1);
    clear();
    dispatchFakeEvent("test", new Event("test"));
    expect(hits).toBe(1);
    const codes = cap.stop().map(e => e.code);
    release();
    expect(codes).not.toContain("NO_OWNER_CLEANUP");
  });
});

describe("createEventListener", () => {
  test("single event_target target", () => {
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent!: Event;
      createEventListener<{ test: Event }>(event_target, "test", ev => {
        capturedEvent = ev;
      });
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(testEvent);
      dispose();
    });
  });

  test("array event_target target", () => {
    createRoot(dispose => {
      const testEvent = new Event("test");
      let capturedEvent!: Event;
      createEventListener<{ test: Event }>(
        [event_target, document.createElement("p")],
        "test",
        ev => {
          capturedEvent = ev;
        },
      );
      dispatchFakeEvent("test", testEvent);
      expect(capturedEvent).toBe(testEvent);
      dispose();
    });
  });

  test("accessor event_target target", () => {
    const [target, setTarget] = createSignal<typeof event_target | []>(event_target, {
      name: "target",
    });
    const testEvent = new Event("test");
    let captured_times = 0;

    const dispose = createRoot(dispose => {
      createEventListener<{ test: Event }>(target, "test", _ => captured_times++);

      dispatchFakeEvent("test", testEvent);
      expect(captured_times, "event listener won't be added yet").toBe(0);

      return dispose;
    });

    flush();
    dispatchFakeEvent("test", testEvent);
    expect(captured_times).toBe(1);

    setTarget([]);
    flush();
    dispatchFakeEvent("test", testEvent);
    expect(captured_times).toBe(1);

    setTarget(event_target);
    flush();
    dispatchFakeEvent("test", testEvent);
    expect(captured_times).toBe(2);
    dispose();
  });

  test("listening multiple events", () => {
    createRoot(dispose => {
      const event1 = new Event("test1");
      const event2 = new Event("test2");
      let capturedEvent!: Event;
      createEventListener<{ test1: Event; test2: Event }>(event_target, ["test1", "test2"], ev => {
        capturedEvent = ev;
      });
      dispatchFakeEvent("test1", event1);
      expect(capturedEvent).toBe(event1);
      dispatchFakeEvent("test1", event2);
      expect(capturedEvent).toBe(event2);
      dispose();
    });
  });

  test("it will only add the event once", () => {
    const testEvent = new Event("test2");
    let count = 0;

    const dispose = createRoot(dispose => {
      createEventListener<{ test2: Event }>(event_target, "test2", _ => {
        count++;
      });
      return dispose;
    });

    dispatchFakeEvent("test2", testEvent);
    expect(count).toBe(1);
    dispose();
  });

  test("disposing on cleanup", () => {
    const testEvent = new Event("test3");
    let count = 0;
    const dispose = createRoot(dispose => {
      createEventListener<{ test3: Event }>(event_target, "test3", () => {
        count++;
      });
      return dispose;
    });

    flush(); // run effect phase → adds the listener
    dispatchFakeEvent("test3", testEvent);
    expect(count, "captured count on mount should be 1").toBe(1);

    dispose();

    dispatchFakeEvent("test3", testEvent);
    expect(count, "captured count after disposing should still be 1").toBe(1);
  });
});

describe("createEventSignal", () => {
  test("return autoupdating signal", () => {
    const testEvent = new Event("sig_test");
    let lastEvent!: () => Event | undefined;
    const dispose = createRoot(dispose => {
      lastEvent = createEventSignal<{ sig_test: Event }>(event_target, "sig_test");
      expect(lastEvent, "returned value is an accessor").toBeTypeOf("function");
      expect(lastEvent(), "returned value is undefined").toBeTypeOf("undefined");
      return dispose;
    });

    flush(); // run effect phase → adds the listener
    dispatchFakeEvent("sig_test", testEvent);
    flush(); // apply the signal write made by the handler
    expect(lastEvent()).toBe(testEvent);
    dispose();
  });
});

describe("eventListener directive", () => {
  test("will work as directive and update the event", () => {
    const testEvent = new Event("load");
    const captured: any[] = [];
    const captured2: any[] = [];
    const [props, setProps] = createSignal<EventListenerDirectiveProps>([
      "load",
      e => captured.push(e),
    ]);

    const dispose = createRoot(dispose => {
      eventListener(event_target as any, props);

      dispatchFakeEvent("load", testEvent);
      expect(captured.length, "event are not listened before the first effect").toBe(0);

      return dispose;
    });

    flush(); // run effect phase → adds event listener
    dispatchFakeEvent("load", testEvent);
    expect(captured.length, "one event after mounted should be captured").toBe(1);
    expect(captured[0], "event after mounted should be captured").toBe(testEvent);

    setProps(["load", e => captured2.push(e)]);
    flush(); // re-run effect → removes old listener, adds new one

    dispatchFakeEvent("load", testEvent);
    expect(captured.length, "events should no longer be captured by the previous handler").toBe(1);
    expect(captured2.length).toBe(1);
    dispose();
  });
});

test("hydrates primitive output and its following sibling", async () => {
  const result = await renderHydrationRoundTrip(
    `
    import { eventListener, createEventListenerMap } from "@solid-primitives/event-listener";
    function Child() { eventListener(["click", () => {}]); createEventListenerMap(() => document, { click: () => {}, keydown: () => {}, focus: undefined }); return <button ref={el => el.dataset.bound = "child"}>child</button>; }
    export default function App() { return <><Child /><span ref={el => el.dataset.bound = "sibling"}>sibling</span></>; }
  `,
    import.meta.dirname,
  );
  try {
    expect(result.consoleMessages).toEqual([]);
    expect(result.container.querySelector("button")).toBe(result.serverNodes[0]);
    expect(result.container.querySelector("span")).toBe(result.serverNodes[1]);
    expect((result.serverNodes[0] as HTMLElement).dataset.bound).toBe("child");
    expect((result.serverNodes[1] as HTMLElement).dataset.bound).toBe("sibling");
  } finally {
    result.cleanup();
  }
});
