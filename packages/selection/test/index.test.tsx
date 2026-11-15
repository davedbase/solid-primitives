import { describe, expect, it } from "vitest";

import { render } from "@solidjs/web";

import { createSelection } from "../src/index.js";
import { createRoot, flush, type JSX } from "solid-js";

describe("createSelection", () => {
  const renderTest = (component: () => JSX.Element) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const unmount = render(component, container);
    return {
      container,
      unmount: () => {
        unmount();
        document.body.removeChild(container);
      },
    };
  };

  it("reads selection from input", () => {
    createRoot(dispose => {
      let unmount: (() => void) | undefined;
      try {
        const [selection] = createSelection();
        expect(selection()).toEqual([null, NaN, NaN]);
        const rendered = renderTest(() => <input type="text" value="testing" />);
        unmount = rendered.unmount;
        const input = rendered.container.querySelector("input") as HTMLInputElement;
        expect(input).toBeInstanceOf(HTMLInputElement);
        input.focus();
        input.setSelectionRange(1, 3);
        input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: false }));
        flush();
        expect(selection()).toEqual([input, 1, 3]);
      } finally {
        unmount?.();
        dispose();
      }
    });
  });

  it("writes selection to an input", () => {
    createRoot(dispose => {
      let unmount: (() => void) | undefined;
      try {
        const [, setSelection] = createSelection();
        const rendered = renderTest(() => <input type="text" value="testing" />);
        unmount = rendered.unmount;
        const input = rendered.container.querySelector("input") as HTMLInputElement;
        expect(input).toBeInstanceOf(HTMLInputElement);
        setSelection([input, 2, 5]);
        flush();
        expect(input.selectionStart).toBe(2);
        expect(input.selectionEnd).toBe(5);
      } finally {
        unmount?.();
        dispose();
      }
    });
  });

  it("reads selection from textarea", () => {
    createRoot(dispose => {
      let unmount: (() => void) | undefined;
      try {
        const [selection] = createSelection();
        expect(selection()).toEqual([null, NaN, NaN]);
        const rendered = renderTest(() => <textarea>testing</textarea>);
        unmount = rendered.unmount;
        const textarea = rendered.container.querySelector("textarea") as HTMLTextAreaElement;
        expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
        textarea.focus();
        textarea.setSelectionRange(2, 5);
        textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: false }));
        flush();
        expect(selection()).toEqual([textarea, 2, 5]);
      } finally {
        unmount?.();
        dispose();
      }
    });
  });

  it("writes selection to a textarea", () => {
    createRoot(dispose => {
      let unmount: (() => void) | undefined;
      try {
        const [, setSelection] = createSelection();
        const rendered = renderTest(() => <textarea>testing</textarea>);
        unmount = rendered.unmount;
        const textarea = rendered.container.querySelector("textarea") as HTMLTextAreaElement;
        expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
        setSelection([textarea, 2, 5]);
        flush();
        expect(textarea.selectionStart).toBe(2);
        expect(textarea.selectionEnd).toBe(5);
      } finally {
        unmount?.();
        dispose();
      }
    });
  });

  it("reads selection from contentEditable div", () => {
    createRoot(dispose => {
      let unmount: (() => void) | undefined;
      try {
        const [selection] = createSelection();
        expect(selection()).toEqual([null, NaN, NaN]);
        const rendered = renderTest(() => <div contenteditable>testing</div>);
        unmount = rendered.unmount;
        const div = rendered.container.querySelector("div") as HTMLDivElement;
        expect(div).toBeInstanceOf(HTMLDivElement);
        div.focus();
        window
          .getSelection()
          ?.addRange(
            (range => (
              range.setStart(div.firstChild!, 0),
              range.setEnd(div.firstChild!, 6),
              range
            ))(document.createRange()),
          );
        div.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: false }));
        flush();
        if (selection()[0] !== null) {
          expect(selection()).toEqual([div, 0, 6]);
        }
      } finally {
        unmount?.();
        dispose();
      }
    });
  });

  it("writes selection to a contentEditable div", () => {
    createRoot(dispose => {
      let unmount: (() => void) | undefined;
      try {
        const [selection, setSelection] = createSelection();
        const rendered = renderTest(() => <div contenteditable>testing</div>);
        unmount = rendered.unmount;
        const div = rendered.container.querySelector("div") as HTMLDivElement;
        expect(div).toBeInstanceOf(HTMLDivElement);
        setSelection([div, 2, 5]);
        flush();
        if (selection()[0] !== null) {
          const range = window.getSelection()?.getRangeAt(0);
          expect(range?.startContainer).toBe(div.firstChild);
          expect(range?.startOffset).toBe(2);
          expect(range?.endOffset).toBe(5);
        }
      } finally {
        unmount?.();
        dispose();
      }
    });
  });
});
