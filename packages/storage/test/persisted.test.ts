import { describe, expect, it } from "vitest";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { makePersisted } from "../src/persisted.js";
import { AsyncStorage } from "../src/index.js";
import * as localforage from "localforage";

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
    expect(mockStorage.getItem("test1")).toBe('"persisted"');
    expect(signal()).toBe("persisted");
  });

  it("reads the persisted value from a synchronous storage into the signal", () => {
    mockStorage.setItem("test2", '"persistence"');
    const [signal] = makePersisted(createSignal(), { storage: mockStorage, name: "test2" });
    expect(signal()).toBe("persistence");
  });

  it("removes a nulled signal's storage item", () => {
    const [signal, setSignal] = makePersisted(createSignal(), {
      storage: mockStorage,
      name: "test3",
    });
    setSignal("test");
    expect(mockStorage.getItem("test3")).toBe('"test"');
    expect(signal()).toBe("test");
    setSignal(undefined);
    expect(mockStorage.getItem("test3")).toBeNull();
  });

  it("persists a store", () => {
    const [store, setStore] = makePersisted(createStore({ test: "test" }), {
      storage: mockStorage,
      name: "test4",
    });
    setStore("test", "persisted");
    expect(store.test).toBe("persisted");
    expect(mockStorage.getItem("test4")).toBe(JSON.stringify({ test: "persisted" }));
  });

  it("persists a signal in an async storage", async () => {
    const [signal, setSignal] = makePersisted(createSignal(), {
      storage: mockAsyncStorage,
      name: "test5",
    });
    setSignal("async");
    expect(signal()).toBe("async");
    expect(await mockAsyncStorage.getItem("test5")).toBe('"async"');
  });

  it("reads the persisted value from an asynchronous storage into the signal", async () => {
    await mockAsyncStorage.setItem("test6", '"predefined"');
    const [signal, setSignal] = makePersisted(createSignal(), {
      storage: mockAsyncStorage,
      name: "test6",
    });
    await Promise.resolve();
    expect(signal()).toBe("predefined");
    setSignal("overwritten");
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
    expect(signal()).toBe("init");
    setSignal("overwritten");
    resolve("persisted");
    expect(signal()).toBe("overwritten");
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
});

describe("makePersisted and localforage", () => {
  it("saves into a signal and reads from localforage", async () => {
    const [test, setTest] = makePersisted(createSignal("initial"), {
      storage: localforage,
      name: "test9",
    });
    expect(test()).toBe("initial");
    setTest("overwritten");
    let count = 0;
    while (test() === "initial" && count++ < 10) {
      await new Promise(r => setTimeout(r, 100));
    }
    const [test2] = makePersisted(
      createSignal("initial"),
      { storage: localforage, name: "test9" }
    );
    count = 0;
    while (test2() === "initial" && count++ < 10) {
      await new Promise(r => setTimeout(r, 100));
    }
    expect(test2()).toBe("overwritten");
  });

  it("saves into a store with getters and reads from localforage", async () => {
    localforage.setItem("test10", '{"x":"foo","y":"foobar"}');
    const [test, setTest] = makePersisted(
      createStore({
        x: "foo",
        get y() {
          return this.x + "bar";
        },
      }),
      { storage: localforage, name: "test10" },
    );
    setTest("x", "boo");
    let count = 0;
    while (test.y === "foobar" && count++ < 10) {
      await new Promise(r => setTimeout(r, 100));
    }
    expect(test.y).toBe("boobar");
  });

  it("reads into a store from previously saved data from localforage", async () => {
    localforage.setItem("test11", JSON.stringify({ x: "zoo", y: "zoobar" }));
    const [test] = makePersisted(
      createStore({
        x: "foo",
        get y() {
          return this.x + "bar";
        },
      }),
      { storage: localforage, name: "test11" },
    );
    let count = 0;
    while (test.y === "foobar" && count++ < 10) {
      await new Promise(r => setTimeout(r, 100));
    }
    expect(test.y).toBe("zoobar");
  });
});
