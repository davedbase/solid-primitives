import { createMemo, createSignal, For, Show } from "solid-js";
import preview from "../../../.storybook/preview.js";
import { createMarker, makeSearchRegex } from "@solid-primitives/marker";
import readme from "../README.md?raw";
import { markStyle } from "./_helpers.js";
import { inputStyle, Container } from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "UI Patterns/Marker",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: readme,
      },
    },
  },
});

export default meta;

const PARAGRAPHS = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How valiantly did Beowulf quaff the mead from his gold cup! The wizard quickly jinxed the gnomes before they vaporized.",
  "Solid.js is a declarative JavaScript library for building user interfaces. It shares a similar surface API with React but uses a fundamentally different reactive model, compiling templates to real DOM nodes and updating them surgically without a virtual DOM.",
];

export const SearchHighlightStory = meta.story({
  name: "createMarker + makeSearchRegex",
  parameters: {
    docs: {
      description: {
        story:
          "`createMarker(mapMatch)` returns a function `(text, regex) => (string | T)[]` that splits a string into plain segments and highlighted match segments. `makeSearchRegex(search)` safely escapes a user-typed query into a case-insensitive regex. Both paragraphs share one marker instance — matches update reactively as you type.",
      },
    },
  },
  render: () => {
    const [search, setSearch] = createSignal("");

    const highlight = createMarker(text => <mark style={markStyle}>{text()}</mark>);

    const regex = createMemo(() => makeSearchRegex(search()));

    return (
      <Container width={400}>
        <h3 style={{ margin: 0 }}>Search highlight</h3>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
          <label style={{ "font-size": "0.85rem", color: "#64748b" }}>Search</label>
          <input
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            placeholder="Type to highlight…"
            style={inputStyle}
          />
        </div>

        <Show when={search()}>
          <p style={{ margin: 0, "font-size": "0.78rem", color: "#94a3b8" }}>
            Matching: <code>{regex().source}</code>
          </p>
        </Show>

        <For each={PARAGRAPHS}>
          {para => (
            <p
              style={{
                margin: 0,
                "font-size": "0.88rem",
                "line-height": "1.65",
                color: "#334155",
                padding: "0.75rem",
                background: "#f8fafc",
                "border-radius": "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              {highlight(para, regex())}
            </p>
          )}
        </For>

        <p style={{ margin: 0, "font-size": "0.8rem", color: "#64748b" }}>
          <code>makeSearchRegex</code> trims input, escapes special chars, and splits on spaces so
          multiple words match independently.
        </p>
      </Container>
    );
  },
});

export const CustomRendererStory = meta.story({
  name: "createMarker — custom renderer",
  parameters: {
    docs: {
      description: {
        story:
          "The `mapMatch` callback receives the matched text as an `Accessor<string>` — the return value is cached and the signal updated in place when the same match position changes. This makes match elements reactive without re-mounting. The demo below cycles through highlight colors to show the cached elements updating in place.",
      },
    },
  },
  render: () => {
    const COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fde68a", "#f5d0fe"];
    const [colorIdx, setColorIdx] = createSignal(0);
    const [search, setSearch] = createSignal("solid");

    const currentColor = () => COLORS[colorIdx() % COLORS.length]!;

    const highlight = createMarker(text => {
      return (
        <mark
          style={{
            background: currentColor(),
            color: "#1e293b",
            "border-radius": "3px",
            padding: "0 2px",
            "font-weight": "600",
            transition: "background 0.25s",
          }}
        >
          {text()}
        </mark>
      );
    });

    const regex = createMemo(() => makeSearchRegex(search()));

    const TEXT =
      "Solid.js uses fine-grained reactivity: Solid signals propagate changes through Solid computations without re-running the whole component. This makes Solid fast even with deeply nested Solid state trees.";

    return (
      <Container width={400}>
        <h3 style={{ margin: 0 }}>Custom renderer</h3>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            placeholder="Search term…"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={() => setColorIdx(i => i + 1)}
            style={{
              padding: "0.4rem 0.85rem",
              "border-radius": "6px",
              border: "1px solid #e2e8f0",
              background: currentColor(),
              cursor: "pointer",
              "font-size": "0.85rem",
              "font-family": "system-ui",
              transition: "background 0.25s",
              "white-space": "nowrap",
            }}
          >
            Next colour
          </button>
        </div>

        <p
          style={{
            margin: 0,
            "font-size": "0.88rem",
            "line-height": "1.65",
            color: "#334155",
            padding: "0.75rem",
            background: "#f8fafc",
            "border-radius": "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          {highlight(TEXT, regex())}
        </p>

        <p style={{ margin: 0, "font-size": "0.8rem", color: "#64748b" }}>
          Cycling colours updates existing <code>&lt;mark&gt;</code> nodes in place — no unmount /
          remount. The <code>text()</code> accessor inside <code>mapMatch</code> lets you build
          fully reactive match renderers.
        </p>
      </Container>
    );
  },
});
