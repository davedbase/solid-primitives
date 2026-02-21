import { type Component, createSignal, For, Show } from "solid-js";
import { render } from "solid-js/web";
import { createSSE } from "../src/index.js";

const readyStateLabel = ["Connecting", "Open", "Closed"] as const;

const App: Component = () => {
  const [url, setUrl] = createSignal("https://localhost:3000/events");
  const [customUrl, setCustomUrl] = createSignal("");
  const [messages, setMessages] = createSignal<string[]>([]);

  const { data, readyState, error, close, reconnect } = createSSE<string>(url, {
    onMessage: e => setMessages(prev => [e.data, ...prev].slice(0, 20)),
  });

  return (
    <div style={{ "font-family": "monospace", padding: "1rem", "max-width": "600px" }}>
      <h2>@solid-primitives/sse dev</h2>

      <div style={{ "margin-bottom": "1rem" }}>
        <label>
          URL:{" "}
          <input
            value={customUrl()}
            onInput={e => setCustomUrl(e.currentTarget.value)}
            placeholder="https://..."
            style={{ width: "300px" }}
          />
        </label>
        <button onClick={() => setUrl(customUrl())} style={{ "margin-left": "0.5rem" }}>
          Connect
        </button>
      </div>

      <p>
        <strong>Status:</strong>{" "}
        <span
          style={{
            color: readyState() === 1 ? "green" : readyState() === 0 ? "orange" : "red",
          }}
        >
          {readyStateLabel[readyState()]}
        </span>
      </p>

      <Show when={error()}>
        <p style={{ color: "red" }}>Error: connection lost</p>
      </Show>

      <p>
        <strong>Latest data:</strong> {data() ?? "(none)"}
      </p>

      <div style={{ gap: "0.5rem", display: "flex" }}>
        <button onClick={close}>Close</button>
        <button onClick={reconnect}>Reconnect</button>
      </div>

      <h3>Messages</h3>
      <ol style={{ "font-size": "0.85rem" }}>
        <For each={messages()}>{msg => <li>{msg}</li>}</For>
      </ol>
    </div>
  );
};

render(() => <App />, document.getElementById("root")!);
