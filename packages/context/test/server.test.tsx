import { describe, test, expect } from "vitest";
import { createContext, type FlowComponent, type Element, untrack, useContext } from "solid-js";
import { renderToString } from "@solidjs/web";
import {
  ContextConsumer,
  createContextProvider,
  createOptionalContextProvider,
  createLayeredContext,
  MultiProvider,
} from "../src/index.js";

type TestContextValue = {
  message: string;
  children: Element;
};

const TEST_MESSAGE = "Hello, Context!";
const FALLBACK: TestContextValue = { message: "FALLBACK", children: undefined };

const [TestProvider, useTestContext] = createContextProvider(
  (props: { children: Element }): TestContextValue => {
    return {
      message: TEST_MESSAGE,
      get children() {
        return props.children;
      },
    };
  },
  FALLBACK,
);

describe("MultiProvider", () => {
  test("provides multiple contexts", () => {
    const Ctx1 = createContext<string>();
    const Ctx2 = createContext<string>();

    let runs = 0;
    let capture1;
    let capture2;
    let capture3;

    const BoundProvider: FlowComponent = props => {
      expect(useContext(Ctx1)).toBe("Hello");
      expect(useContext(Ctx2)).toBe("World");
      return <TestProvider>{props.children}</TestProvider>;
    };

    renderToString(() => (
      <MultiProvider values={[[Ctx1, "Ignored"], [Ctx1, "Hello"], [Ctx2, "World"], BoundProvider]}>
        {untrack(() => {
          runs++;
          capture1 = useContext(Ctx1);
          capture2 = useContext(Ctx2);
          capture3 = useTestContext().message;
          return "";
        })}
      </MultiProvider>
    ));

    expect(runs).toBe(1);
    expect(capture1).toBe("Hello");
    expect(capture2).toBe("World");
    expect(capture3).toBe(TEST_MESSAGE);
  });

  test("passes props to providers from createContextProvider", () => {
    const [NamedProvider, useNamed] = createContextProvider(
      (props: { name: string }) => props.name,
    );
    let capture;

    renderToString(() => (
      <MultiProvider values={[[NamedProvider, { name: "Provided through MultiProvider" }]]}>
        {untrack(() => {
          capture = useNamed();
          return "";
        })}
      </MultiProvider>
    ));

    expect(capture).toBe("Provided through MultiProvider");
  });

  test("keeps object values as `value` for raw contexts", () => {
    const ObjectContext = createContext<{ message: string }>();
    let capture;

    renderToString(() => (
      <MultiProvider values={[[ObjectContext, { message: "Object context" }]]}>
        {untrack(() => {
          capture = useContext(ObjectContext).message;
          return "";
        })}
      </MultiProvider>
    ));

    expect(capture).toBe("Object context");
  });
});

describe("createLayeredContext (SSR)", () => {
  test("nested providers extend parent value", () => {
    const [LayeredProvider, useLayered] = createLayeredContext(
      (props: { level?: number }, parent) => ({
        ...parent,
        level: props.level ?? parent.level,
      }),
      { level: 0, base: "ssr" },
    );

    let capturedInner: { level: number; base: string } | undefined;
    renderToString(() => (
      <LayeredProvider level={1}>
        <LayeredProvider level={2}>
          {untrack(() => {
            capturedInner = useLayered();
            return "";
          })}
        </LayeredProvider>
      </LayeredProvider>
    ));

    expect(capturedInner?.level).toBe(2);
    expect(capturedInner?.base).toBe("ssr");
  });
});

describe("ContextConsumer (SSR)", () => {
  test("consumes a context directly", () => {
    const Context = createContext<string>("Default");

    let capture;
    renderToString(() => (
      <Context value="Actual">
        <ContextConsumer provider={Context}>{value => (capture = value)}</ContextConsumer>
      </Context>
    ));

    expect(capture).toBe("Actual");
  });

  test("consumes a context via global use-function", () => {
    const Context = createContext<string>("Default");

    let capture;
    renderToString(() => (
      <Context value="Actual">
        <ContextConsumer provider={() => useContext(Context)}>
          {value => (capture = value)}
        </ContextConsumer>
      </Context>
    ));

    expect(capture).toBe("Actual");
  });

  test("consumes a context via its use-function from `createContextProvider`", () => {
    const [Provider, useContext] = createContextProvider(
      (props: { value: string }) => props.value,
      "Default",
    );

    let capture;
    renderToString(() => (
      <Provider value="Actual">
        <ContextConsumer provider={useContext}>{value => (capture = value)}</ContextConsumer>
      </Provider>
    ));

    expect(capture).toBe("Actual");
  });

  test("consumes a context directly without providing context (default value)", () => {
    const Context = createContext<string>("Default");

    let capture;
    renderToString(() => (
      <ContextConsumer provider={Context}>{value => (capture = value)}</ContextConsumer>
    ));

    expect(capture).toBe("Default");
  });

  test("consumes a context via its use-function from `createContextProvider` without provider (default value)", () => {
    const [, useContext] = createContextProvider(
      (props: { value: string }) => props.value,
      "Default",
    );

    let capture;
    renderToString(() => (
      <ContextConsumer provider={useContext}>{value => (capture = value)}</ContextConsumer>
    ));

    expect(capture).toBe("Default");
  });

  test("renders fallback prop when context is undefined", () => {
    const [, useOptional] = createOptionalContextProvider(
      (props: { value?: string }) => props.value,
    );

    let capture;
    renderToString(() => (
      <ContextConsumer provider={useOptional} fallback={() => (capture = "Fallback")}>
        {value => value as any}
      </ContextConsumer>
    ));

    expect(capture).toBe("Fallback");
  });

  test("throws when provider absent and no fallback", () => {
    const [, useRequired] = createContextProvider(() => ({ value: 1 }));
    expect(() =>
      renderToString(() => (
        <ContextConsumer provider={useRequired}>{value => value as any}</ContextConsumer>
      )),
    ).toThrow();
  });
});
