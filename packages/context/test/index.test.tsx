import { describe, test, expect, expectTypeOf } from "vitest";
import {
  createContext,
  createRoot,
  createSignal,
  flush,
  type FlowComponent,
  type Element,
  untrack,
  useContext,
} from "solid-js";
import { render } from "@solidjs/web";
import {
  createContextProvider,
  createOptionalContextProvider,
  createLayeredContext,
  MultiProvider,
  ContextConsumer,
} from "../src/index.js";

type TestContextValue = {
  message: string;
  children: Element;
};

const TEST_MESSAGE = "Hello, Context!";
const FALLBACK: TestContextValue = { message: "FALLBACK", children: undefined };

const [TestProvider, useTestContext] = createContextProvider(
  (props: { text?: string; children: Element }): TestContextValue => {
    return {
      message: props.text ?? TEST_MESSAGE,
      get children() {
        return props.children;
      },
    };
  },
  FALLBACK,
);
const TestChild = () => <div>{useTestContext().message}</div>;

describe("createContextProvider", () => {
  test("renders the context message", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const unmount = render(
      () => (
        <TestProvider>
          <TestChild />
        </TestProvider>
      ),
      container,
    );

    expect(container.innerHTML, "Not correctly rendered").toBe(`<div>${TEST_MESSAGE}</div>`);

    unmount();
    document.body.removeChild(container);
  });

  test("returns fallback if context is not provided", () => {
    let ctx!: TestContextValue;
    const unmount = render(() => {
      ctx = useTestContext();
      return "";
    }, document.createElement("div"));
    expect(ctx.message).toBe(FALLBACK.message);
    unmount();
  });

  test("returns fallback if context is not provided", () => {
    let ctx!: TestContextValue;

    const TextComp = () => {
      ctx = useTestContext();
      return "";
    };

    const unmount = render(
      () => <TestProvider text="REPLACE">{TextComp as any}</TestProvider>,
      document.createElement("div"),
    );
    expect(ctx.message).toBe("REPLACE");
    expect(ctx.children).toBe(TextComp);
    unmount();
  });

  test("accepts a debug name without affecting behavior", () => {
    const [NamedProvider, useNamed] = createContextProvider(
      () => ({ value: 1 }),
      { value: 0 },
      {
        name: "Named",
      },
    );
    let captured = -1;
    const unmount = render(() => {
      captured = useNamed().value;
      return "";
    }, document.createElement("div"));
    expect(captured).toBe(0);
    unmount();

    const unmount2 = render(
      () => (
        <NamedProvider>
          {untrack(() => {
            captured = useNamed().value;
            return "";
          })}
        </NamedProvider>
      ),
      document.createElement("div"),
    );
    expect(captured).toBe(1);
    unmount2();
  });

  test("throws if context is not provided and no fallback is provided", () => {
    const [, useRequired] = createContextProvider(() => ({ value: 1 }));
    expect(() =>
      render(() => {
        useRequired();
        return "";
      }, document.createElement("div")),
    ).toThrow();
  });

  test("uses the non-undefined context type", () => {
    const [, useRequired] = createContextProvider((): { value: number } | undefined => ({
      value: 1,
    }));
    expectTypeOf<ReturnType<typeof useRequired>>().toEqualTypeOf<{ value: number }>();
  });
});

describe("createOptionalContextProvider", () => {
  test("returns undefined if context is not provided", () => {
    const [, useOptional] = createOptionalContextProvider(() => ({ value: 1 }));
    let ctx: { value: number } | undefined = { value: 0 };

    const unmount = render(() => {
      ctx = useOptional();
      return "";
    }, document.createElement("div"));

    expect(ctx).toBeUndefined();
    unmount();
  });

  test("returns fallback if context is not provided", () => {
    const [, useOptional] = createOptionalContextProvider(() => ({ value: 1 }), { value: 0 });
    let ctx: { value: number } | undefined;

    const unmount = render(() => {
      ctx = useOptional();
      return "";
    }, document.createElement("div"));

    expect(ctx).toEqual({ value: 0 });
    unmount();
  });

  test("returns undefined if provider value is undefined", () => {
    const [OptionalProvider, useOptional] = createOptionalContextProvider(
      (props: { value?: string; children: Element }) => props.value,
    );
    let ctx: string | undefined = "initial";

    const unmount = render(
      () => (
        <OptionalProvider>
          {untrack(() => {
            ctx = useOptional();
            return "";
          })}
        </OptionalProvider>
      ),
      document.createElement("div"),
    );

    expect(ctx).toBeUndefined();
    unmount();
  });

  test("returns undefined if provider value is undefined and fallback exists", () => {
    const [OptionalProvider, useOptional] = createOptionalContextProvider(
      (props: { value?: string; children: Element }) => props.value,
      "fallback",
    );
    let ctx: string | undefined = "initial";

    const unmount = render(
      () => (
        <OptionalProvider>
          {untrack(() => {
            ctx = useOptional();
            return "";
          })}
        </OptionalProvider>
      ),
      document.createElement("div"),
    );

    expect(ctx).toBeUndefined();
    unmount();
  });

  test("returns provided values", () => {
    const [OptionalProvider, useOptional] = createOptionalContextProvider(
      (props: { value: string; children: Element }) => props.value,
    );
    let ctx: string | undefined;

    const unmount = render(
      () => (
        <OptionalProvider value="provided">
          {untrack(() => {
            ctx = useOptional();
            return "";
          })}
        </OptionalProvider>
      ),
      document.createElement("div"),
    );

    expect(ctx).toBe("provided");
    unmount();
  });

  test("uses the optional context type", () => {
    const [, useOptional] = createOptionalContextProvider(() => ({ value: 1 }));
    expectTypeOf<ReturnType<typeof useOptional>>().toEqualTypeOf<{ value: number } | undefined>();
  });
});

describe("createLayeredContext", () => {
  test("factory receives defaults as parent at the root level", () => {
    const [LayeredProvider, useLayered] = createLayeredContext(
      (props: { extra?: number }, parent) => ({ ...parent, extra: props.extra ?? parent.extra }),
      { base: "root", extra: 0 },
    );

    let captured: { base: string; extra: number } | undefined;
    const unmount = render(
      () => (
        <LayeredProvider extra={7}>
          {untrack(() => {
            captured = useLayered();
            return "";
          })}
        </LayeredProvider>
      ),
      document.createElement("div"),
    );
    expect(captured?.base).toBe("root");
    expect(captured?.extra).toBe(7);
    unmount();
  });

  test("nested providers extend the parent context value", () => {
    const [LayeredProvider, useLayered] = createLayeredContext(
      (props: { level?: number; tag?: string }, parent) => ({
        ...parent,
        level: props.level ?? parent.level,
        tag: props.tag ?? parent.tag,
      }),
      { level: 0, tag: "default" },
    );

    let capturedInner: { level: number; tag: string } | undefined;
    let capturedOuter: { level: number; tag: string } | undefined;

    const unmount = render(
      () => (
        <LayeredProvider level={1} tag="outer">
          {
            untrack(() => {
              capturedOuter = useLayered();
            }) as any
          }
          <LayeredProvider level={2}>
            {untrack(() => {
              capturedInner = useLayered();
              return "";
            })}
          </LayeredProvider>
        </LayeredProvider>
      ),
      document.createElement("div"),
    );

    expect(capturedOuter?.level).toBe(1);
    expect(capturedOuter?.tag).toBe("outer");
    expect(capturedInner?.level).toBe(2);
    expect(capturedInner?.tag).toBe("outer"); // inherited from outer provider
    unmount();
  });

  test("returns defaults when used outside any provider", () => {
    const [, useLayered] = createLayeredContext((_props, parent) => parent, { value: 99 });
    let captured = -1;
    const unmount = render(() => {
      captured = useLayered().value;
      return "";
    }, document.createElement("div"));
    expect(captured).toBe(99);
    unmount();
  });
});

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

    const container = document.createElement("div");
    const unmount = render(
      () => (
        <MultiProvider
          values={[[Ctx1, "Ignored"], [Ctx1, "Hello"], [Ctx2, "World"], BoundProvider]}
        >
          {untrack(() => {
            runs++;
            capture1 = useContext(Ctx1);
            capture2 = useContext(Ctx2);
            capture3 = useTestContext().message;
            return "";
          })}
        </MultiProvider>
      ),
      container,
    );

    expect(runs).toBe(1);
    expect(capture1).toBe("Hello");
    expect(capture2).toBe("World");
    expect(capture3).toBe(TEST_MESSAGE);

    unmount();
  });

  /** Renders `values` through MultiProvider and returns what `read` captured inside it. */
  function captureInside<T>(values: any, read: () => T): T {
    let capture!: T;
    const unmount = render(
      () => (
        <MultiProvider values={values}>
          {untrack(() => {
            capture = read();
            return "";
          })}
        </MultiProvider>
      ),
      document.createElement("div"),
    );
    unmount();
    return capture;
  }

  test("passes props to providers from createContextProvider", () => {
    expect(
      captureInside(
        [[TestProvider, { text: "Provided through MultiProvider" }]],
        () => useTestContext().message,
      ),
    ).toBe("Provided through MultiProvider");
  });

  test("passes props to providers from createOptionalContextProvider and createLayeredContext", () => {
    const [OptionalProvider, useOptional] = createOptionalContextProvider(
      (props: { id: string }) => props.id,
    );
    const [ThemeProvider, useTheme] = createLayeredContext(
      (props: { primary?: string }, parent) => ({
        ...parent,
        primary: props.primary ?? parent.primary,
      }),
      { primary: "blue", secondary: "gray" },
    );

    expect(
      captureInside(
        [
          [OptionalProvider, { id: "user-1" }],
          [ThemeProvider, { primary: "red" }],
          [ThemeProvider, { primary: "green" }],
        ],
        () => ({ id: useOptional(), theme: useTheme() }),
      ),
    ).toEqual({ id: "user-1", theme: { primary: "green", secondary: "gray" } });
  });

  test("keeps object values as `value` for raw contexts", () => {
    const ObjectContext = createContext<{ message: string }>();

    expect(
      captureInside([[ObjectContext, { message: "Object context" }]], () =>
        useContext(ObjectContext),
      ),
    ).toEqual({ message: "Object context" });
  });

  test("a factory that reads `props.value` receives it via `{ value }`", () => {
    // Before providers took props, `[Provider, x]` reached the factory as `props.value`.
    const [ValueProvider, useValue] = createContextProvider(
      (props: { value: string }) => props.value,
    );

    expect(captureInside([[ValueProvider, { value: "Wrapped" }]], useValue)).toBe("Wrapped");
  });

  test("keeps getters in provider props reactive", () => {
    const [label, setLabel] = createSignal("first");
    const [LabelProvider, useLabel] = createContextProvider(
      (props: { label: string }) => () => props.label,
    );

    let read!: () => string;
    const unmount = render(
      () => (
        <MultiProvider
          values={[
            [
              LabelProvider,
              {
                get label() {
                  return label();
                },
              },
            ],
          ]}
        >
          {untrack(() => {
            read = useLabel();
            return "";
          })}
        </MultiProvider>
      ),
      document.createElement("div"),
    );

    expect(read()).toBe("first");
    setLabel("second");
    flush();
    expect(read()).toBe("second");
    unmount();
  });

  test("type-checks each entry against its provider", () => {
    const Ctx = createContext<string>();
    const [PropsProvider] = createContextProvider((props: { initial: number }) => props.initial);
    const [BranchProvider] = createContextProvider(
      (props: { kind: "text"; text: string } | { kind: "count"; count: number }) => props.kind,
    );
    const Bound: FlowComponent = props => props.children;

    // Type-only: never rendered.
    const check = () => (
      <>
        <MultiProvider values={[[Ctx, "ok"], [PropsProvider, { initial: 1 }], Bound]}>
          {""}
        </MultiProvider>
        {/* union props keep each branch's own required props */}
        <MultiProvider
          values={[
            [BranchProvider, { kind: "text", text: "a" }],
            [BranchProvider, { kind: "count", count: 1 }],
          ]}
        >
          {""}
        </MultiProvider>
        {/* @ts-expect-error the selected "text" branch is missing its required `text` */}
        <MultiProvider values={[[BranchProvider, { kind: "text" }]]}>{""}</MultiProvider>
        {/* @ts-expect-error a created provider takes its props, not a bare value */}
        <MultiProvider values={[[PropsProvider, 1]]}>{""}</MultiProvider>
        {/* @ts-expect-error wrong prop type */}
        <MultiProvider values={[[PropsProvider, { initial: "1" }]]}>{""}</MultiProvider>
        {/* @ts-expect-error a raw context takes a value of its own type */}
        <MultiProvider values={[[Ctx, 1]]}>{""}</MultiProvider>
      </>
    );
    expectTypeOf(check).toBeFunction();
  });
});

describe("ContextConsumer", () => {
  test("consumes a context directly", () => {
    const Context = createContext<string>("Default");

    let capture;
    const unmount = render(
      () => (
        <Context value="Actual">
          <ContextConsumer provider={Context}>{value => (capture = value)}</ContextConsumer>
        </Context>
      ),
      document.createElement("div"),
    );

    expect(capture).toBe("Actual");

    unmount();
  });

  test("consumes a context via global use-function", () => {
    const Context = createContext<string>("Default");

    let capture;
    const unmount = render(
      () => (
        <Context value="Actual">
          <ContextConsumer provider={() => useContext(Context)}>
            {value => (capture = value)}
          </ContextConsumer>
        </Context>
      ),
      document.createElement("div"),
    );

    expect(capture).toBe("Actual");

    unmount();
  });

  test("consumes a context via its use-function from `createContextProvider`", () => {
    const [Provider, useContext] = createContextProvider(
      (props: { value: string }) => props.value,
      "Default",
    );

    let capture;
    const unmount = render(
      () => (
        <Provider value="Actual">
          <ContextConsumer provider={useContext}>{value => (capture = value)}</ContextConsumer>
        </Provider>
      ),
      document.createElement("div"),
    );

    expect(capture).toBe("Actual");

    unmount();
  });

  test("consumes a context directly without providing context (default value)", () => {
    const Context = createContext<string>("Default");

    let capture;
    const unmount = render(
      () => <ContextConsumer provider={Context}>{value => (capture = value)}</ContextConsumer>,
      document.createElement("div"),
    );

    expect(capture).toBe("Default");

    unmount();
  });

  test("consumes a context via its use-function from `createContextProvider` without provider (default value)", () => {
    const [, useContext] = createContextProvider(
      (props: { value: string }) => props.value,
      "Default",
    );

    let capture;
    const unmount2 = render(
      () => <ContextConsumer provider={useContext}>{value => (capture = value)}</ContextConsumer>,
      document.createElement("div"),
    );

    expect(capture).toBe("Default");

    unmount2();
  });

  test("renders fallback prop when context is undefined", () => {
    const [, useOptional] = createOptionalContextProvider(
      (props: { value?: string }) => props.value,
    );
    const container = document.createElement("div");
    document.body.appendChild(container);
    const unmount3 = render(
      () => (
        <ContextConsumer provider={useOptional} fallback={() => "Fallback"}>
          {value => value as any}
        </ContextConsumer>
      ),
      container,
    );

    expect(container.innerHTML).toBe("Fallback");

    unmount3();
    document.body.removeChild(container);
  });

  test("throws when provider absent and no fallback", () => {
    const [, useRequired] = createContextProvider(() => ({ value: 1 }));
    expect(() =>
      render(
        () => <ContextConsumer provider={useRequired}>{value => value as any}</ContextConsumer>,
        document.createElement("div"),
      ),
    ).toThrow();
  });

  // Solid doesn't export `ContextNotFoundError`; take its class from a bare `useContext` miss.
  const getContextNotFoundError = () => {
    try {
      createRoot(() => useContext(createContext<string>()));
    } catch (error) {
      return (error as Error).constructor as new (...args: any[]) => Error;
    }
    throw new Error("expected useContext to throw for a missing context");
  };

  test("fallback does not suppress ContextNotFoundError for a missing required context", () => {
    const ContextNotFoundError = getContextNotFoundError();
    const [, useRequired] = createContextProvider(() => ({ value: 1 }));
    const RawContext = createContext<string>();

    for (const provider of [useRequired, RawContext] as const) {
      expect(() =>
        render(
          () => (
            <ContextConsumer provider={provider as () => unknown} fallback={() => "Fallback"}>
              {value => value as any}
            </ContextConsumer>
          ),
          document.createElement("div"),
        ),
      ).toThrow(ContextNotFoundError);
    }
  });

  test("renders nothing when an optional context is undefined and no fallback is given", () => {
    const [, useOptional] = createOptionalContextProvider(
      (props: { value?: string }) => props.value,
    );
    const container = document.createElement("div");
    const unmount = render(
      () => <ContextConsumer provider={useOptional}>{value => value as any}</ContextConsumer>,
      container,
    );

    expect(container.innerHTML).toBe("");
    unmount();
  });
});
