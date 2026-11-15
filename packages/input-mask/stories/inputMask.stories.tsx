import { createSignal } from "solid-js";
import preview from "../../../.storybook/preview.js";
import { createInputMask, createMaskPattern } from "@solid-primitives/input-mask";
import readme from "../README.md?raw";
import { inputStyle, Label, ValueDisplay, Container } from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "Forms/Input Mask",
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

export const DateMask = meta.story({
  name: "Date mask (string format)",
  parameters: {
    docs: {
      description: {
        story:
          "`createInputMask` accepts a string mask where `9` matches any digit and fixed characters are inserted automatically. Apply the returned handler to `onInput` and `onPaste` — cursor position is managed for you.",
      },
    },
  },
  render: () => {
    const [value, setValue] = createSignal("");
    const mask = createInputMask("99/99/9999");

    return (
      <Container>
        <h3 style={{ margin: 0 }}>Date — "99/99/9999"</h3>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
          <Label>Type a date (MM/DD/YYYY)</Label>
          <input
            type="text"
            placeholder="MM/DD/YYYY"
            onInput={e => setValue(mask(e))}
            onPaste={e => setValue(mask(e))}
            style={inputStyle}
          />
        </div>

        <ValueDisplay label="value" value={value()} />

        <p style={{ margin: 0, "font-size": "0.8rem", color: "#64748b" }}>
          String mask placeholders: <code>9</code> = digit, <code>a</code> = letter, <code>*</code>{" "}
          = alphanumeric. Fixed characters like <code>/</code> are inserted automatically as you
          type.
        </p>
      </Container>
    );
  },
});

export const PhoneMask = meta.story({
  name: "Phone number mask",
  parameters: {
    docs: {
      description: {
        story:
          "String masks support any fixed-literal characters as separators. This demo formats a US phone number — parentheses, spaces, and the hyphen are inserted automatically while `9` slots accept only digits.",
      },
    },
  },
  render: () => {
    const [value, setValue] = createSignal("");
    const mask = createInputMask("(999) 999-9999");

    return (
      <Container>
        <h3 style={{ margin: 0 }}>Phone — "(999) 999-9999"</h3>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
          <Label>US phone number</Label>
          <input
            type="text"
            placeholder="(555) 123-4567"
            onInput={e => setValue(mask(e))}
            onPaste={e => setValue(mask(e))}
            style={inputStyle}
          />
        </div>

        <ValueDisplay label="value" value={value()} />
      </Container>
    );
  },
});

export const PatternOverlay = meta.story({
  name: "Pattern overlay (createMaskPattern)",
  parameters: {
    docs: {
      description: {
        story:
          "`createMaskPattern` wraps `createInputMask` and sets `data-mask-value` / `data-mask-pattern` attributes on the immediately preceding `<label>`. Paired with CSS `::before`/`::after` pseudo-elements, the remaining pattern is rendered in-place as the user types.",
      },
    },
  },
  render: () => {
    const handler = createMaskPattern(createInputMask("9999-99-99"), () => "YYYY-MM-DD");

    return (
      <Container>
        <style>{`
          .sp-mask-label[data-mask-value] {
            position: absolute;
            inset: 0;
            padding: 0.4rem 0.75rem;
            border: 1px solid transparent;
            font-size: 0.9rem;
            font-family: monospace;
            pointer-events: none;
            white-space: pre;
            border-radius: 6px;
          }
          .sp-mask-label[data-mask-value]::before {
            content: attr(data-mask-value);
            color: transparent;
          }
          .sp-mask-label[data-mask-pattern]::after {
            content: attr(data-mask-pattern);
            color: #94a3b8;
          }
        `}</style>

        <h3 style={{ margin: 0 }}>ISO date with pattern overlay</h3>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
          <Label>ISO date (YYYY-MM-DD)</Label>
          <div style={{ position: "relative" }}>
            <label class="sp-mask-label" />
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              onInput={handler}
              onPaste={handler}
              style={inputStyle}
            />
          </div>
        </div>

        <p style={{ margin: 0, "font-size": "0.8rem", color: "#64748b" }}>
          The empty <code>&lt;label&gt;</code> directly before the input receives{" "}
          <code>data-mask-value</code> and <code>data-mask-pattern</code> attributes. CSS{" "}
          <code>::before</code> renders transparent typed text to push <code>::after</code> (the
          remaining pattern) to the correct position.
        </p>
      </Container>
    );
  },
});

export const ArrayMask = meta.story({
  name: "Array mask (per-character regex)",
  parameters: {
    docs: {
      description: {
        story:
          "An array mask gives you per-slot control: `RegExp` entries match variable characters, string literals are fixed separators inserted automatically. This demo formats a structured `NNN-NNN-NNN` meeting ID.",
      },
    },
  },
  render: () => {
    const [value, setValue] = createSignal("");
    const mask = createInputMask([/\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/]);

    return (
      <Container>
        <h3 style={{ margin: 0 }}>Meeting ID — NNN-NNN-NNN</h3>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
          <Label>Enter a 9-digit meeting ID</Label>
          <input
            type="text"
            placeholder="123-456-789"
            onInput={e => setValue(mask(e))}
            onPaste={e => setValue(mask(e))}
            style={inputStyle}
          />
        </div>

        <ValueDisplay label="value" value={value()} />

        <p style={{ margin: 0, "font-size": "0.8rem", color: "#64748b" }}>
          The array <code>[/\d/, /\d/, /\d/, "-", ...]</code> inserts dashes automatically and
          rejects any non-digit input.
        </p>
      </Container>
    );
  },
});

export const FunctionMask = meta.story({
  name: "IPv4 mask (function format)",
  parameters: {
    docs: {
      description: {
        story:
          "`createInputMask` accepts a function that receives value and selection and returns new value and selection, in this case to block any input that creates an invalid (partial) IPv4 address.",
      },
    },
  },
  render: () => {
    const [value, setValue] = createSignal("");
    let previous: [string, Selection] = ["", [0, 0]];
    const mask = createInputMask((addr, sel) => {
      const isValid = addr
        .split(/\./g)
        .every(num => num === "" || (!/\D/.test(num) && Number(num) < 256));
      if (isValid) {
        previous = [addr, sel];
      }
      return previous;
    });

    return (
      <Container>
        <h3 style={{ margin: 0 }}>IPv44 Address — "127.0.0.1"</h3>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
          <Label>Type an IPv4 Address (0.0.0.0)</Label>
          <input
            type="text"
            placeholder="0.0.0.0"
            onKeyup={e => setValue(mask(e))}
            onInput={e => setValue(mask(e))}
            onPaste={e => setValue(mask(e))}
            style={inputStyle}
          />
        </div>

        <ValueDisplay label="value" value={value()} />
      </Container>
    );
  },
});
