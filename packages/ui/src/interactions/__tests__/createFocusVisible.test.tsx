import { createRoot } from "solid-js";
import { fireEvent, render, screen } from "solid-testing-library";

import { createFocusVisible, createFocusVisibleListener } from "..";

function Example(props: any) {
  const { isFocusVisible } = createFocusVisible(props);

  return <div id={props.id}>example{isFocusVisible() && "-focusVisible"}</div>;
}

function toggleBrowserTabs() {
  // this describes Chrome behaviour only, for other browsers visibilitychange fires after all focus events.
  // leave tab
  const lastActiveElement = document.activeElement;
  fireEvent(lastActiveElement!, new Event("blur"));
  fireEvent(window, new Event("blur"));

  Object.defineProperty(document, "visibilityState", {
    value: "hidden",
    writable: true,
  });

  Object.defineProperty(document, "hidden", { value: true, writable: true });
  fireEvent(document, new Event("visibilitychange"));

  // return to tab
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    writable: true,
  });

  Object.defineProperty(document, "hidden", { value: false, writable: true });
  fireEvent(document, new Event("visibilitychange"));
  //eslint-disable-next-line
  //@ts-ignore
  fireEvent(window, new Event("focus", { target: window }));
  fireEvent(lastActiveElement!, new Event("focus"));
}

function toggleBrowserWindow() {
  //eslint-disable-next-line
  //@ts-ignore
  fireEvent(window, new Event("blur", { target: window }));

  //eslint-disable-next-line
  //@ts-ignore
  fireEvent(window, new Event("focus", { target: window }));
}

describe("createFocusVisible", () => {
  beforeEach(() => {
    fireEvent.focus(document.body);
  });

  it("returns positive isFocusVisible result after toggling browser tabs after keyboard navigation", async () => {
    render(() => <Example />);

    const el = screen.getByText("example-focusVisible");

    fireEvent.keyDown(el, { key: "Tab" });
    toggleBrowserTabs();

    expect(el.textContent).toBe("example-focusVisible");
  });

  it("returns negative isFocusVisible result after toggling browser tabs without prior keyboard navigation", async () => {
    render(() => <Example />);

    const el = screen.getByText("example-focusVisible");

    fireEvent.mouseDown(el);
    toggleBrowserTabs();

    expect(el.textContent).toBe("example");
  });

  it("returns positive isFocusVisible result after toggling browser window after keyboard navigation", async () => {
    render(() => <Example />);

    const el = screen.getByText("example-focusVisible");

    fireEvent.keyDown(el, { key: "Tab" });
    toggleBrowserWindow();

    expect(el.textContent).toBe("example-focusVisible");
  });

  it("returns negative isFocusVisible result after toggling browser window without prior keyboard navigation", async () => {
    render(() => <Example />);

    const el = screen.getByText("example-focusVisible");

    fireEvent.mouseDown(el);
    toggleBrowserWindow();

    expect(el.textContent).toBe("example");
  });
});

describe("createFocusVisibleListener", function () {
  it("emits on modality change (non-text input)", async () => {
    createRoot(async dispose => {
      const fnMock = jest.fn();

      createFocusVisibleListener(fnMock, () => null);
      await Promise.resolve();

      expect(fnMock).toHaveBeenCalledTimes(0);

      fireEvent.keyDown(document.body, { key: "a" });
      await Promise.resolve();

      fireEvent.keyUp(document.body, { key: "a" });
      await Promise.resolve();

      fireEvent.keyDown(document.body, { key: "Escape" });
      await Promise.resolve();

      fireEvent.keyUp(document.body, { key: "Escape" });
      await Promise.resolve();

      fireEvent.mouseDown(document.body);
      await Promise.resolve();

      fireEvent.mouseUp(document.body); // does not trigger change handlers (but included for completeness)
      await Promise.resolve();

      expect(fnMock).toHaveBeenCalledTimes(5);
      expect(fnMock.mock.calls).toEqual([[true], [true], [true], [true], [false]]);

      dispose();
    });
  });

  it("emits on modality change (text input)", async () => {
    createRoot(async dispose => {
      const fnMock = jest.fn();

      createFocusVisibleListener(fnMock, () => null, { isTextInput: true });
      await Promise.resolve();

      expect(fnMock).toHaveBeenCalledTimes(0);

      fireEvent.keyDown(document.body, { key: "a" });
      await Promise.resolve();

      fireEvent.keyUp(document.body, { key: "a" });
      await Promise.resolve();

      fireEvent.keyDown(document.body, { key: "Escape" });
      await Promise.resolve();

      fireEvent.keyUp(document.body, { key: "Escape" });
      await Promise.resolve();

      fireEvent.mouseDown(document.body);
      await Promise.resolve();

      fireEvent.mouseUp(document.body); // does not trigger change handlers (but included for completeness)
      await Promise.resolve();

      expect(fnMock).toHaveBeenCalledTimes(3);
      expect(fnMock.mock.calls).toEqual([[true], [true], [false]]);

      dispose();
    });
  });
});
