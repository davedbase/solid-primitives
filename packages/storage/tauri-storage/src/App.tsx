import { createSignal, createStore, For, untrack } from "solid-js";
// this would usually be imported from "@solid-primitives/storage":
import { makePersisted } from "../../src/index.js";
import { tauriStorage } from "../../src/tauri.js";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: Record<string, any>;
  }
}

const isFallback = !window.__TAURI_INTERNALS__;
const storage = isFallback ? localStorage : tauriStorage();

function App() {
  const [store, setStore] = makePersisted(
    createStore<Record<string, string | undefined>>({ hello: "from tauri" }),
    { name: "app-store", storage },
  );
  const [keyRef, setKeyRef] = createSignal<HTMLInputElement>();
  const [valueRef, setValueRef] = createSignal<HTMLInputElement>();

  return (
    <div>
      <h1>@solid-primitives/storage tauriStorage demo</h1>
      <p>Using {isFallback ? "localStorage" : "tauriStorage"}</p>
      <ul>
        <For each={Object.keys(store)} fallback={<li>No entries</li>}>
          {(key: string) => (
            <li>
              {key}:
              <input
                value={untrack(() => store[key])}
                onInput={ev => {
                  const value = ev.currentTarget.value;
                  setStore(s => {
                    s[key] = value;
                  });
                }}
              />
              <button
                onClick={() =>
                  setStore(s => {
                    delete s[key];
                  })
                }
                title="delete"
              >
                ✕
              </button>
            </li>
          )}
        </For>
        <li>
          <input placeholder="new key" required ref={setKeyRef} />
          <input placeholder="new value" required ref={setValueRef} />
          <button
            onClick={() => {
              const key = keyRef()?.value,
                value = valueRef()?.value;
              if (key && value) {
                setStore(s => {
                  s[key] = value;
                });
                (keyRef() || { value: 0 }).value = "";
                (valueRef() || { value: 0 }).value = "";
              }
            }}
          >
            ⏎
          </button>
        </li>
      </ul>
    </div>
  );
}

export default App;
