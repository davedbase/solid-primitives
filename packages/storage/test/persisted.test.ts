import { describe, expect, it } from "vitest";
import {
  createEffect,
  createRoot,
  createSignal,
  createStore,
  createOptimistic,
  flush,
  latest,
  refresh,
} from "solid-js";
import { makePersisted, messageSync, multiplexSync, storageSync, wsSync, type PersistenceSyncData } from "../src/persisted.js";
import { type AsyncStorage } from "../src/index.js";

describe("makePersisted", () => {
  let data: Record<string, string> = {};
  const mockStorage: Storage = {
    getItem: (key: string): string | null => data[key] ?? null,
    setItem: (key: string, value: string): void => {
      const oldValue = data[key];
      data[key] = value;
      window.dispatchEvent(
        Object.assign(new Event("storage"), {
          key,
          newValue: value,
          oldValue,
          storageArea: mockStorage,
          url: window.document.URL,
        }),
      );
    },
    clear: () => {
      data = {};
    },
    removeItem: (key: string): void => {
      delete data[key];
    },
    key: (index: number): string => Object.keys(data)[index] || "",
    get length(): number {
      return Object.keys(data).length;
    },
  };

  let asyncData: Record<string, string> = {};
  const mockAsyncStorage: AsyncStorage = {
    getItem: (key: string) => Promise.resolve(asyncData[key] ?? null),
    setItem: (key: string, value: string) => {
      asyncData[key] = value;
      return Promise.resolve();
    },
    clear: () => {
      asyncData = {};
    },
    removeItem: (key: string) => {
      delete asyncData[key];
      return Promise.resolve();
    },
    key: (index: number) => Promise.resolve(Object.keys(asyncData)[index] || ""),
    get length(): number {
      return Object.keys(asyncData).length;
    },
  };

  it("persists a signal", () => {
    const [signal, setSignal] = makePersisted(createSignal(), {
      storage: mockStorage,
      name: "test1",
    });
    setSignal("persisted");
    flush();
    expect(mockStorage.getItem("test1")).toBe('"persisted"');
    expect(latest(signal)).toBe("persisted");
  });

  it("persists an optimistic signal", async () => {
    const DataServer = {
      data: "server",
      get: () => Promise.resolve(DataServer.data),
      set: (next: string) => new Promise((res) => setTimeout(() => res(DataServer.data = next), 50)),
    };
    const [signal, setSignal] = makePersisted(
      createRoot(() => createOptimistic(() => DataServer.get())),
      {
        storage: mockStorage,
        name: "test-optimistic",
        action: ([getter, setter]) => function*(next) {
          setter(next);
          yield DataServer.set(next);
          refresh(getter);
        }
      }
    );
    // let the initial server fetch settle before the optimistic write
    await new Promise(res => setTimeout(res, 0));
    flush();
    await setSignal("persisted");
    flush();
    expect(mockStorage.getItem("test-optimistic")).toBe('"persisted"');
    expect(latest(signal)).toBe("persisted")
  })

  it("reads the persisted value from a synchronous storage into the signal", () => {
    mockStorage.setItem("test2", '"persistence"');
    const [signal] = makePersisted(createSignal(), { storage: mockStorage, name: "test2" });
    flush();
    expect(latest(signal)).toBe("persistence");
  });

  it("removes a nulled signal's storage item", () => {
    const [signal, setSignal] = makePersisted(createSignal<string>(), {
      storage: mockStorage,
      name: "test3",
    });
    setSignal("test");
    flush();
    expect(mockStorage.getItem("test3")).toBe('"test"');
    expect(latest(signal)).toBe("test");
    setSignal(undefined);
    flush();
    expect(mockStorage.getItem("test3")).toBeNull();
  });

  it("persists a store", () => {
    const [store, setStore] = makePersisted(createStore({ test: "test" }), {
      storage: mockStorage,
      name: "test4",
    });
    setStore((s) => { s.test = "persisted" });
    flush();
    expect(store.test).toBe("persisted");
    expect(mockStorage.getItem("test4")).toBe(JSON.stringify({ test: "persisted" }));
  });
  
  it("only updates the leaves in initialization", async () => {
    mockAsyncStorage.setItem("test4a", JSON.stringify({ a: { b: { c: 1 } } }));
    const triggered = { a: 0, b: 0, c: 0 };
    await createRoot(async (dispose) => {
      const [state, setState] = createStore({ a: { b: { c: 0 } } });
      createEffect(() => state.a, (_) => { triggered.a++; });
      createEffect(() => state.a.b, (_) => { triggered.b++; });
      createEffect(() => state.a.b.c, (_) => { triggered.c++; });
      const [store, _setStore] = makePersisted(
        [state, setState],
        { storage: mockAsyncStorage, name: "test4a" }
      );
      await new Promise(r => setTimeout(r, 50));
      flush();
      expect(store).toEqual({ a: { b: { c: 1 } } });
      expect(triggered).toEqual({ a: 1, b: 1, c: 2 });
      queueMicrotask(dispose);;
    });
  });

  it("persists a signal in an async storage", async () => {
    const [signal, setSignal] = makePersisted(createSignal(), {
      storage: mockAsyncStorage,
      name: "test5",
    });
    setSignal("async");
    flush();
    expect(latest(signal)).toBe("async");
    expect(await mockAsyncStorage.getItem("test5")).toBe('"async"');
  });

  it("reads the persisted value from an asynchronous storage into the signal", async () => {
    await mockAsyncStorage.setItem("test6", '"predefined"');
    const [signal, setSignal] = makePersisted(createSignal(), {
      storage: mockAsyncStorage,
      name: "test6",
    });
    await Promise.resolve();
    flush();
    expect(latest(signal)).toBe("predefined");
    setSignal("overwritten");
    flush();
    await Promise.resolve();
    expect(await mockAsyncStorage.getItem("test6")).toBe('"overwritten"');
  });

  it("does not overwrite a written value from a slower async storage", () => {
    const slowMockAsyncStorage = { ...mockAsyncStorage };
    let resolve: (value: string | PromiseLike<string>) => void = () => undefined;
    slowMockAsyncStorage.getItem = (_key: string) =>
      new Promise<string>(r => {
        resolve = r;
      });
    const [signal, setSignal] = makePersisted(createSignal("init"), {
      storage: slowMockAsyncStorage,
      name: "test7",
    });
    flush();
    expect(latest(signal)).toBe("init");
    setSignal("overwritten");
    flush();
    resolve("persisted");
    expect(latest(signal)).toBe("overwritten");
  });

  it("exposes the initial value as third part of the return tuple", () => {
    const anotherMockAsyncStorage = { ...mockAsyncStorage };
    const promise = Promise.resolve('"init"');
    anotherMockAsyncStorage.getItem = () => promise;
    const [_signal, _setSignal, init] = makePersisted(createSignal("default"), {
      storage: anotherMockAsyncStorage,
      name: "test8",
    });
    expect(init).toBe(promise);
  });
  
  it("keeps early writes and explicitly disposes sync and deferred init", async () => {
    mockStorage.setItem("cleanup", '"init"');
    const [value, setValue, , dispose] = createRoot(disposeRoot => {
      const persisted = makePersisted(createSignal("default"), {
        storage: mockStorage,
        name: "cleanup",
        hydrated: true,
        sync: multiplexSync(messageSync(window), storageSync),
      });
      disposeRoot();
      return persisted;
    });
    const send = (newValue: string) => window.dispatchEvent(new MessageEvent("message", {
      data: { key: "cleanup", newValue: JSON.stringify(newValue) },
    }));
    send("synced");
    flush();
    expect(value()).toBe("synced");
    window.dispatchEvent(new StorageEvent("storage", { key: "cleanup", newValue: '"stored"' }));
    flush();
    expect(value()).toBe("stored");
    setValue("user write");
    const [cancelled, , , cancel] = makePersisted(createSignal("default"), {
      storage: mockStorage,
      name: "cleanup",
      hydrated: true,
    });
    cancel();
    await new Promise(r => setTimeout(r, 100));
    flush();
    expect(value()).toBe("user write");
    expect(cancelled()).toBe("default");
    dispose();
    send("ignored");
    window.dispatchEvent(new StorageEvent("storage", { key: "cleanup", newValue: '"ignored"' }));
    flush();
    expect(value()).toBe("user write");
  });
  it("defers the initialization if the hydrated option is set", async () => {
    const anotherMockStorage = { ...mockStorage };
    anotherMockStorage.setItem("test18", '"init"');
    const [signal, _setSignal] = makePersisted(
      createSignal("default"), 
      { storage: anotherMockStorage, name: "test18", hydrated: true }
    );
    flush();
    expect(signal()).toBe("default");
    await new Promise(r => setTimeout(r, 200));
    flush();
    expect(signal()).toBe("init"); 
  });
});

describe("storageSync", () => {
  it("receives messages", () => {
    const [message, subscriber] = createSignal<PersistenceSyncData>();
    storageSync[0](subscriber);
    const event = new StorageEvent(
      "storage",
      { key: "test9", newValue: "received", timeStamp: Date.now(), url: "https://storage.solid-primitives.org" }
    );
    window.dispatchEvent(event);
    flush();
    expect(message()).toEqual(event);
  });
});

describe("messageSync", () => {
  it("sends and receives messages", async () => {
    const [message, subscriber] = createSignal<PersistenceSyncData>();
    const sync = messageSync(window, "https://storage.solid-primitives.org");
    sync[0](subscriber);
    sync[1]("test10", "sent and received");
    await new Promise(r => setTimeout(r, 100));
    flush();
    expect(message()).toEqual({
      key: "test10",
      newValue: "sent and received",
      timeStamp: expect.any(Number),
      url: "https://storage.solid-primitives.org",
    });
  });
});

describe("wsSync", () => {
  it("sends and receives messages", async () => {
    const mockWs = {
      addEventListener: (name: string, handler: (ev: unknown) => void) => { 
        expect(name).toBe("message");
        mockWs.send = (data) => handler(new MessageEvent("message", { data }));
      },
    };
    const [message, subscriber] = createSignal<PersistenceSyncData>();
    const sync = wsSync(mockWs, true, "https://storage.solid-primitives.org");
    sync[0](subscriber);
    sync[1]("test11", "sent and received");
    await new Promise(r => setTimeout(r, 100));
    flush();
    expect(message()).toEqual({
      key: "test11",
      newValue: "sent and received",
      timeStamp: expect.any(Number),
      url: "https://storage.solid-primitives.org",
    });
  });
});
