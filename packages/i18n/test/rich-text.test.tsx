import { describe, expect, test, vi } from "vitest";
import { DEV } from "solid-js";
import * as i18n from "../src/index.js";

describe("resolveRichTemplate", () => {
  test("matches resolveTemplate when every value is a string", () => {
    expect(i18n.resolveRichTemplate("hello {{ name }}!", { name: "Tester" })).toBe("hello Tester!");
    expect(i18n.resolveRichTemplate("hello!")).toBe("hello!");
    expect(i18n.resolveRichTemplate("hello {{name}}!")).toBe("hello {{name}}!");
  });

  test("stays a plain string when a placeholder has no matching arg", () => {
    expect(i18n.resolveRichTemplate("hello {{name}} and {{extra}}!", { name: "Tester" })).toBe(
      "hello Tester and {{extra}}!",
    );
  });

  test("returns JSX when a value isn't a string", () => {
    const link = <a href="/info">click here</a>;

    const result = i18n.resolveRichTemplate("For more information, {{ clickHere }}", {
      clickHere: link,
    }) as unknown as unknown[];

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(["For more information, ", link, ""]);
  });

  test("splices multiple values, mixed string and JSX, in order", () => {
    const bold = <b>world</b>;

    const result = i18n.resolveRichTemplate("{{ greeting }}, {{ name }}!", {
      greeting: "hello",
      name: bold,
    }) as unknown as unknown[];

    expect(result).toEqual(["", "hello", ", ", bold, "!"]);
  });
});

describe("richText", () => {
  test("calls the tag renderer with the tag's inner content", () => {
    const dict = { message: "Please refer to <guidelines>the guidelines</guidelines>" };
    const t = i18n.translator(() => dict, i18n.resolveTemplate);

    const result = i18n.richText(t("message"), {
      guidelines: text => <a href="/guidelines">{text}</a>,
    }) as unknown as unknown[];

    expect(result).toEqual(["Please refer to ", <a href="/guidelines">the guidelines</a>, ""]);
  });

  test("composes with resolveTemplate for {{ }} variables inside a tag", () => {
    const dict = { message: "See <guidelines>{{ name }}</guidelines> for details." };
    const t = i18n.translator(() => dict, i18n.resolveTemplate);

    const result = i18n.richText(t("message", { name: "the guidelines" }), {
      guidelines: text => <a href="/guidelines">{text}</a>,
    }) as unknown as unknown[];

    expect(result).toEqual(["See ", <a href="/guidelines">the guidelines</a>, " for details."]);
  });

  test("plain string with no tags is passed through untouched", () => {
    const result = i18n.richText("just plain text", {}) as unknown as unknown[];
    expect(result).toEqual(["just plain text"]);
  });

  test("unmapped tag renders its contents as plain text", () => {
    const result = i18n.richText("hello <b>world</b>!", {}) as unknown as unknown[];
    expect(result).toEqual(["hello ", "world", "!"]);
  });

  test("unmapped tag warns in dev", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    i18n.richText("hello <b>world</b>!", {});

    if (DEV) {
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]![0]).toContain("<b>");
    } else {
      expect(warn).not.toHaveBeenCalled();
    }

    warn.mockRestore();
  });
});
