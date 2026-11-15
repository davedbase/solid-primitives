import {
  children,
  createContext,
  createRoot,
  createSignal,
  flush,
  For,
  Show,
  useContext,
} from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it, vi } from "vitest";
import {
  createObjectToken,
  createTokenizer,
  createToken,
  isToken,
  type JSXTokenizerData,
  resolveTokens,
  type TokenElement,
} from "../src/index.js";

describe("jsx-tokenizer", () => {
  const parser1 = createTokenizer<{
    type: "my-token";
    props: { text: string };
  }>();

  const MyToken1 = createToken(parser1, (props: { text: string }) => ({
    type: "my-token",
    props,
  }));

  it("should resolve tokens", () => {
    createRoot(() => {
      const tokens = resolveTokens(
        parser1,
        () => (
          <>
            <div />
            <MyToken1 text="foo" />
            <MyToken1 text="bar" />
          </>
        ),
        { includeJSXElements: true },
      );

      expect(tokens()).toHaveLength(3);

      expect(tokens()[0]).toBeInstanceOf(HTMLDivElement);
      expect(isToken(parser1, tokens()[0])).toBe(false);
      expect(
        (tokens()[1] as unknown as TokenElement<JSXTokenizerData<typeof parser1>>).data.props.text,
      ).toBe("foo");
      expect(isToken(parser1, tokens()[1])).toBe(true);
      expect(
        (tokens()[2] as unknown as TokenElement<JSXTokenizerData<typeof parser1>>).data.props.text,
      ).toBe("bar");
      expect(isToken(parser1, tokens()[2])).toBe(true);

      // shouldn't throw
      <>{tokens()}</>;
    });
  });

  it("should resolve data", () => {
    createRoot(() => {
      const tokens = resolveTokens(parser1, () => (
        <>
          <div />
          <MyToken1 text="foo" />
          <MyToken1 text="bar" />
        </>
      ));

      expect(tokens()).toHaveLength(2);
      tokens().forEach(token => expect(token.data.type).toBe("my-token"));
      expect(tokens()[0]!.data.props.text).toBe("foo");
      expect(tokens()[1]!.data.props.text).toBe("bar");
    });
  });

  it("handled reactive children", () => {
    const [show, setShow] = createSignal(true);

    const { tokens, dispose } = createRoot(dispose => ({
      tokens: resolveTokens(parser1, () => (
        <>
          <Show when={show()}>
            <MyToken1 text="foo" />
          </Show>
          <MyToken1 text="bar" />
        </>
      )),
      dispose,
    }));

    expect(tokens()).toHaveLength(2);

    setShow(false);
    flush();
    expect(tokens()).toHaveLength(1);

    dispose();
  });

  it("should render tokens", () => {
    createRoot(() => {
      const parser = createTokenizer();

      const MyToken = createToken(
        parser,
        () => ({}),
        (props: { text: string }) => <div>{props.text}</div>,
      );

      const rendered1 = children(() => <MyToken text="foo" />);
      const rendered2 = children(() => <MyToken text="bar" />);

      expect((rendered1() as HTMLElement).outerHTML).toBe("<div>foo</div>");
      expect((rendered2() as HTMLElement).outerHTML).toBe("<div>bar</div>");
    });
  });

  it("uses props as data if no data function is provided", () => {
    createRoot(() => {
      const parser = createTokenizer<{ text: string }>();
      const MyToken = createToken(parser);

      const tokens = resolveTokens(parser, () => (
        <>
          <MyToken text="foo" />
          <MyToken text="bar" />
        </>
      ));

      expect(tokens()).toHaveLength(2);
      expect(tokens()[0]!.data.text).toBe("foo");
      expect(tokens()[1]!.data.text).toBe("bar");
    });
  });

  it("data object can have getters", () => {
    createRoot(() => {
      let count = 0;
      const parser = createTokenizer<{ n: number }>();
      const MyToken = createToken(parser, (_: { text: string }) => ({
        get n() {
          return count++;
        },
      }));

      const tokens = resolveTokens(parser, () => <MyToken text="foo" />);

      expect(tokens()[0]!.data.n).toBe(0);
      expect(tokens()[0]!.data.n).toBe(1);
    });
  });

  it("can create tokens without a parser", () => {
    const MyToken = createToken((props: { text: string }): { text: string; id: number } => ({
      text: props.text,
      id: 1,
    }));

    createRoot(dispose => {
      const tokens = resolveTokens(MyToken, () => (
        <>
          <p>hello</p>
          <MyToken text="foo" />
        </>
      ));

      expect(tokens()).toHaveLength(1);
      expect(tokens()[0]!.data.text).toBe("foo");
      expect(tokens()[0]!.data.id).toBe(1);

      dispose();
    });
  });

  it("can create tokens without a parser and data function", () => {
    const MyToken = createToken<{ text: string; id: number }>();

    const Ingored = createToken(() => ({
      type: "ignored",
    }));

    createRoot(dispose => {
      const tokens = resolveTokens(MyToken, () => (
        <>
          Ignored
          <MyToken text="foo" id={2} />
          <Ingored />
        </>
      ));

      expect(tokens()).toHaveLength(1);
      expect(tokens()[0]!.data.text).toBe("foo");
      expect(tokens()[0]!.data.id).toBe(2);

      dispose();
    });
  });

  it("can resolve tokens from multiple parsers", () => {
    const parser1 = createTokenizer<{ type: "parser-token"; props: { text: string } }>();

    const MyToken1 = createToken(parser1, (props: { text: string }) => ({
      type: "parser-token",
      props,
    }));

    const MyToken2 = createToken((props: { text: string }) => ({
      type: "my-token",
      props,
    }));

    const Ingored = createToken(() => ({
      type: "ignored",
    }));

    createRoot(() => {
      const tokens = resolveTokens([parser1, MyToken2], () => (
        <>
          <div />
          <MyToken1 text="foo" />
          <MyToken2 text="bar" />
          <Ingored />
        </>
      ));

      expect(tokens()).toHaveLength(2);
      expect(tokens()[0]!.data.type).toBe("parser-token");
      expect(tokens()[0]!.data.props.text).toBe("foo");
      expect(tokens()[1]!.data.type).toBe("my-token");
      expect(tokens()[1]!.data.props.text).toBe("bar");
    });
  });

  describe("createObjectToken", () => {
    const tokenizer = createTokenizer<{ text: string }>();
    const ObjToken = createObjectToken(tokenizer, (props: { text: string }) => ({
      text: props.text,
    }));

    it("resolves object tokens with resolveTokens", () => {
      createRoot(dispose => {
        const tokens = resolveTokens(
          tokenizer,
          () => (
            <>
              <div />
              <ObjToken text="foo" />
              <MyToken1 text="ignored" />
              <ObjToken text="bar" />
            </>
          ),
          { includeJSXElements: true },
        );

        expect(tokens()).toHaveLength(4);
        expect(tokens()[0]).toBeInstanceOf(HTMLDivElement);
        expect(isToken(tokenizer, tokens()[1])).toBe(true);
        expect((tokens()[1] as TokenElement<{ text: string }>).data.text).toBe("foo");
        // function tokens of other tokenizers are rendered (no fallback => "")
        expect(tokens()[2]).toBe("");
        expect((tokens()[3] as TokenElement<{ text: string }>).data.text).toBe("bar");

        dispose();
      });
    });

    it("survives children() resolution", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      createRoot(dispose => {
        const resolved = children(() => (
          <>
            <ObjToken text="foo" />
            <ObjToken text="bar" />
          </>
        ));
        const tokens = resolveTokens(tokenizer, resolved);

        expect(tokens()).toHaveLength(2);
        expect(tokens()[0]!.data.text).toBe("foo");
        expect(tokens()[1]!.data.text).toBe("bar");
        expect(resolved.toArray().every(el => isToken(tokenizer, el))).toBe(true);

        dispose();
      });
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it("can be passed through a context provider", () => {
      const Ctx = createContext("default");
      const CtxToken = createObjectToken(tokenizer, (_: {}) => ({ text: useContext(Ctx) }));

      createRoot(dispose => {
        const tokens = resolveTokens(tokenizer, () => (
          <Ctx value="provided">
            <CtxToken />
            <ObjToken text="foo" />
          </Ctx>
        ));

        expect(tokens()).toHaveLength(2);
        expect(tokens()[0]!.data.text).toBe("provided");
        expect(tokens()[1]!.data.text).toBe("foo");

        dispose();
      });
    });

    it("handles reactive children", () => {
      const [show, setShow] = createSignal(true);

      const { tokens, dispose } = createRoot(dispose => ({
        tokens: resolveTokens(tokenizer, () => (
          <>
            <Show when={show()}>
              <ObjToken text="foo" />
            </Show>
            <ObjToken text="bar" />
          </>
        )),
        dispose,
      }));

      expect(tokens()).toHaveLength(2);

      setShow(false);
      flush();
      expect(tokens()).toHaveLength(1);
      expect(tokens()[0]!.data.text).toBe("bar");

      dispose();
    });

    it("uses props as data and can be created without a tokenizer", () => {
      const Standalone = createObjectToken<{ id: number }>();

      createRoot(dispose => {
        const tokens = resolveTokens([Standalone, tokenizer], () => (
          <>
            <Standalone id={1} />
            <ObjToken text="foo" />
          </>
        ));

        expect(tokens()).toHaveLength(2);
        expect(isToken(Standalone, tokens()[0])).toBe(true);
        expect((tokens()[0] as TokenElement<{ id: number }>).data.id).toBe(1);
        expect(isToken(Standalone, tokens()[1])).toBe(false);

        dispose();
      });
    });

    it("can be mixed with function tokens of the same tokenizer", () => {
      const FnToken = createToken(tokenizer, (props: { text: string }) => ({ text: props.text }));

      createRoot(dispose => {
        const tokens = resolveTokens(tokenizer, () => (
          <>
            <FnToken text="fn" />
            <ObjToken text="obj" />
          </>
        ));

        expect(tokens().map(t => t.data.text)).toEqual(["fn", "obj"]);

        dispose();
      });
    });

    it("is skipped (with a dev warning) when inserted alone into the DOM", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const container = document.createElement("div");
      const dispose = render(() => <ObjToken text="foo" />, container);
      flush();
      expect(container.innerHTML).toBe("");
      expect(
        warn.mock.calls.some(args => String(args[0]).includes("UNRECOGNIZED_INSERT_VALUE")),
      ).toBe(true);
      dispose();
      warn.mockRestore();
    });

    it("isToken rejects non-token values and object tokens of other tokenizers", () => {
      expect(isToken(tokenizer, null)).toBe(false);
      expect(isToken(tokenizer, {})).toBe(false);
      expect(isToken(tokenizer, { data: { text: "x" } })).toBe(false);
      expect(isToken(tokenizer, 5)).toBe(false);
      expect(isToken(tokenizer, () => 1)).toBe(false);

      const Other = createObjectToken<{ a: number }>();
      createRoot(dispose => {
        const el = <Other a={1} />;
        expect(isToken(Other, el)).toBe(true);
        expect(isToken(tokenizer, el)).toBe(false);
        dispose();
      });
    });

    it("leaves out object tokens of other tokenizers", () => {
      const Other = createObjectToken<{ a: number }>();
      createRoot(dispose => {
        const tokens = resolveTokens(tokenizer, () => (
          <>
            <Other a={1} />
            <ObjToken text="foo" />
          </>
        ));
        expect(tokens().map(t => t.data.text)).toEqual(["foo"]);
        dispose();
      });
    });

    it("stays reactive through a provider resolved with children()", () => {
      const Ctx = createContext("default");
      const CtxToken = createObjectToken(tokenizer, (_: {}) => ({ text: useContext(Ctx) }));
      const [list, setList] = createSignal(["a", "b"]);
      const [show, setShow] = createSignal(true);

      const { tokens, dispose } = createRoot(dispose => {
        const resolved = children(() => (
          <Ctx value="provided">
            <For each={list()}>{text => <ObjToken text={text} />}</For>
            <Show when={show()}>
              <CtxToken />
            </Show>
          </Ctx>
        ));
        return { tokens: resolveTokens(tokenizer, resolved), dispose };
      });

      expect(tokens().map(t => t.data.text)).toEqual(["a", "b", "provided"]);

      setList(["c"]);
      setShow(false);
      flush();
      expect(tokens().map(t => t.data.text)).toEqual(["c"]);

      dispose();
    });

    it("survives a provider where a function token of the same tokenizer is rendered away", () => {
      const Ctx = createContext("default");
      const FnToken = createToken(tokenizer, (props: { text: string }) => ({ text: props.text }));
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      createRoot(dispose => {
        const tokens = resolveTokens(tokenizer, () => (
          <Ctx value="provided">
            <FnToken text="fn" />
            <ObjToken text="obj" />
          </Ctx>
        ));
        expect(tokens().map(t => t.data.text)).toEqual(["obj"]);
        dispose();
      });
      warn.mockRestore();
    });
  });
});
