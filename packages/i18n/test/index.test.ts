import { describe, expect, expectTypeOf, test } from "vitest";
import * as i18n from "../src/index.js";
import { createEffect, createResource, createRoot, createSignal } from "solid-js";
import { Locale, en_dict, pl_dict } from "./setup.jsx";

describe("dict", () => {
  test("flatten", () => {
    const flat = i18n.flatten(en_dict);

    expect(flat).toEqual({
      ...en_dict,
      "numbers.1": "one",
      "numbers.2": "two",
      "numbers.3": "three",
      "data.class": en_dict.data.class,
      "data.currency": en_dict.data.currency,
      "data.currency.name": "dollar",
      "data.currency.symbol": "$",
      "data.currency.iso": "USD",
      "data.currency.to.usd": 1,
      "data.users": en_dict.data.users,
      "data.users.0": en_dict.data.users[0],
      "data.users.0.name": "John",
      "data.users.1": en_dict.data.users[1],
      "data.users.1.name": "Kate",
      "data.formatList": en_dict.data.formatList,
    } satisfies typeof flat);
  });

  test("prefix", () => {
    const dict = {
      "data.a": 123,
      "data.b": { foo: "bar" },
      c: "d",
    };
    const prefixed = i18n.prefix(dict, "prefix");

    expect(prefixed).toEqual({
      "prefix.data.a": 123,
      "prefix.data.b": { foo: "bar" },
      "prefix.c": "d",
    });
  });
});

describe("template", () => {
  test("identity template resolver", () => {
    expect(i18n.identityResolveTemplate("hello!")).toBe("hello!");

    expect(i18n.identityResolveTemplate("hello {{name}}!", { name: "Tester" })).toBe(
      "hello {{name}}!",
    );
  });

  test("default template resolver", () => {
    expect(i18n.resolveTemplate("hello!")).toBe("hello!");

    expect(i18n.resolveTemplate("hello {{name}}!", { name: "Tester" })).toBe("hello Tester!");

    expect(i18n.resolveTemplate("hello {{ name }}!", { name: "Tester" })).toBe("hello Tester!");

    expect(
      i18n.resolveTemplate("hello {{name}} and {{extra}}!", { name: "Tester", extra: "John" }),
    ).toBe("hello Tester and John!");

    expect(
      i18n.resolveTemplate("hello {{ name }} and {{ extra }}!", { name: "Tester", extra: "John" }),
    ).toBe("hello Tester and John!");

    expect(i18n.resolveTemplate("hello {{name}} and {{extra}}!")).toBe(
      "hello {{name}} and {{extra}}!",
    );
  });
});

describe("translator", () => {
  let flat_dict = i18n.flatten(en_dict);

  const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);

  test("initial", () => {
    expect(t("hello", { name: "Tester", thing: "day" })).toBe("Hello Tester! How is your day?");
    expect(t("numbers.1")).toBe("one");
    expect(t("data.class")).toBe(en_dict.data.class);
    expect(t("data.currency.name")).toBe("dollar");
    expect(t("data.currency.to.usd")).toBe(1);
    expect(t("data.users")).toEqual(en_dict.data.users);
    expect(t("data.formatList", ["John", "Kate", "Tester"])).toBe("John, Kate and Tester");
    expect(t("jsx", "Tester")).toEqual(en_dict.jsx("Tester"));
  });

  test("after change", () => {
    flat_dict = i18n.flatten(pl_dict);

    expect(t("hello", { name: "Tester", thing: "dzień" })).toBe("Cześć Tester!");
    expect(t("numbers.1")).toBe("jeden");
    expect(t("data.class")).toBe(pl_dict.data.class);
    expect(t("data.currency.name")).toBe("złoty");
    expect(t("data.currency.to.usd")).toBe(0.27);
    expect(t("data.users")).toEqual(pl_dict.data.users);
    expect(t("data.formatList", ["John", "Kate", "Tester"])).toBe("John, Kate i Tester");
    expect(t("jsx", "Tester")).toEqual(pl_dict.jsx("Tester"));
  });
});

describe("scopedTranslator", () => {
  let flat_dict = i18n.flatten(en_dict);

  const _t = i18n.translator(() => flat_dict, i18n.resolveTemplate);
  const t = i18n.scopedTranslator(_t, "data");
  const nt = i18n.scopedTranslator(_t, "data.currency");

  test("initial", () => {
    expect(t("class")).toBe(en_dict.data.class);
    expect(t("currency.name")).toBe("dollar");
    expect(t("currency.to.usd")).toBe(1);
    expect(t("users")).toEqual(en_dict.data.users);
    expect(t("formatList", ["John", "Kate", "Tester"])).toBe("John, Kate and Tester");
  });

  test("after change", () => {
    flat_dict = i18n.flatten(pl_dict);

    expect(t("class")).toBe(pl_dict.data.class);
    expect(t("currency.name")).toBe("złoty");
    expect(t("currency.to.usd")).toBe(0.27);
    expect(t("users")).toEqual(pl_dict.data.users);
    expect(t("formatList", ["John", "Kate", "Tester"])).toBe("John, Kate i Tester");
  });

  test("nested", () => {
    flat_dict = i18n.flatten(pl_dict);

    expect(nt("name")).toBe("złoty");
    expect(nt("to.usd")).toBe(0.27);
  });
});

Object.entries({
  chained: i18n.chainedTranslator,
  proxy: (_, t) => i18n.proxyTranslator(t),
} satisfies Record<string, typeof i18n.chainedTranslator>).forEach(([name, fn]) => {
  describe(name, () => {
    let flat_dict = i18n.flatten(en_dict);

    const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);

    const chained = fn(en_dict, t);

    test("initial", () => {
      expect(chained.hello({ name: "Tester", thing: "day" })).toBe(
        "Hello Tester! How is your day?",
      );
      expect(chained.numbers[1]()).toBe("one");
      expect(chained.data.class()).toBe(en_dict.data.class);
      expect(chained.data.currency.name()).toBe("dollar");
      expect(chained.data.currency["to.usd"]()).toBe(1);
      expect(chained.data.users()).toEqual(en_dict.data.users);
      expect(chained.data.formatList(["John", "Kate", "Tester"])).toBe("John, Kate and Tester");
      expect(chained.jsx("Tester")).toEqual(en_dict.jsx("Tester"));
    });

    test("after change", () => {
      flat_dict = i18n.flatten(pl_dict);

      expect(chained.hello({ name: "Tester", thing: "dzień" })).toBe("Cześć Tester!");
      expect(chained.numbers[1]()).toBe("jeden");
      expect(chained.data.class()).toBe(pl_dict.data.class);
      expect(chained.data.currency.name()).toBe("złoty");
      expect(chained.data.currency["to.usd"]()).toBe(0.27);
      expect(chained.data.users()).toEqual(pl_dict.data.users);
      expect(chained.data.formatList(["John", "Kate", "Tester"])).toBe("John, Kate i Tester");
      expect(chained.jsx("Tester")).toEqual(pl_dict.jsx("Tester"));
    });
  });
});

describe("reactive", () => {
  test("with translator", async () => {
    const [locale, setLocale] = createSignal<Locale>("en");
    let hello = "";
    let to_usd = 0;

    const dispose = createRoot(dispose => {
      const [dict] = createResource(
        locale,
        async locale => {
          const dict = locale === "en" ? en_dict : pl_dict;
          return i18n.flatten(dict);
        },
        { initialValue: i18n.flatten(en_dict) },
      );

      const t = i18n.translator(dict, i18n.resolveTemplate);
      const chained = i18n.chainedTranslator(en_dict, t);

      createEffect(() => {
        hello = t("hello", { name: "Tester", thing: "day" });
        to_usd = chained.data.currency["to.usd"]();
      });

      return dispose;
    });

    expect(hello).toBe("Hello Tester! How is your day?");
    expect(to_usd).toBe(1);

    setLocale("pl");
    await Promise.resolve();
    expect(hello).toBe("Cześć Tester!");
    expect(to_usd).toBe(0.27);

    dispose();
  });
});

describe("resolver custom result", () => {

  const customResolve: i18n.TemplateResolver<number> = (value, ...args) => {
    return value.length
  }

  test("with translator", () => {
    const dict = i18n.flatten(en_dict)
    const t = i18n.translator(() => dict, customResolve)

    const dollar_length = t("data.currency.name")
    const one_length = t("numbers.1")

    expectTypeOf(dollar_length).toEqualTypeOf<number>()
    expectTypeOf(one_length).toEqualTypeOf<number>()

    expect(dollar_length).toBe(6)
    expect(one_length).toBe(3)
  });
});
