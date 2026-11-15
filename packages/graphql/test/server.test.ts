import { createComponent, Loading } from "solid-js";
import { renderToStream } from "@solidjs/web";
import { describe, expect, test } from "vitest";
import { createGraphQLClient, gql } from "../src/index.js";

const echoFetcher = (async (_url: string, init: RequestInit) =>
  new Response(
    JSON.stringify({ data: { echo: JSON.parse(init.body as string).variables } }),
  )) as any;

const render = (code: () => any): Promise<string> =>
  renderToStream(code) as unknown as Promise<string>;

describe("createGraphQLClient (SSR)", () => {
  test("renders the resolved query result behind <Loading>", async () => {
    const html = await render(() => {
      const query = createGraphQLClient("/api", { fetcher: echoFetcher });
      const data = query<{ echo: { id: string } }>(
        gql`
          query {
            a
          }
        `,
        { id: "hello" },
      );
      return createComponent(Loading, {
        fallback: "loading",
        get children() {
          return (() => data()?.echo.id) as any;
        },
      });
    });
    expect(html).toContain("hello");
  });

  test("never requests while variables are falsy", async () => {
    let called = false;
    const fetcher = (async () => {
      called = true;
      return new Response("{}");
    }) as any;
    const html = await render(() => {
      const query = createGraphQLClient("/api", { fetcher });
      const data = query<{ a: string }>(
        gql`
          query {
            a
          }
        `,
        false,
      );
      return createComponent(Loading, {
        fallback: "loading",
        get children() {
          return (() => String(data())) as any;
        },
      });
    });
    expect(html).toContain("undefined");
    expect(called).toBe(false);
  });
});

describe("createGraphQLMutation (SSR)", () => {
  test("is importable and callable on the server", async () => {
    const { createGraphQLMutation } = await import("../src/index.js");
    const mutate = createGraphQLMutation("/api", { fetcher: echoFetcher });
    expect(typeof mutate).toBe("function");
  });
});
