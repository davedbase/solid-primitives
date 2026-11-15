import {
  createOptimistic,
  createRoot,
  createSignal,
  flush,
  isPending,
  refresh,
  resolve,
  runWithOwner,
} from "solid-js";
import {
  createGraphQLClient,
  createGraphQLMutation,
  GraphQLError,
  multipartRequest,
  gql,
  makeMultipartBody,
  request,
} from "../src/index.js";
import { describe, test, expect, vi } from "vitest";

const respond = (body: object) => new Response(JSON.stringify(body));

/** A fetcher answering with `{ data: { echo: <variables> } }`, recording each call. */
const makeFetcher = () => {
  const calls: { url: string; init: RequestInit; variables: any }[] = [];
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const { variables } = JSON.parse(init!.body as string);
    calls.push({ url: String(url), init: init!, variables });
    return respond({ data: { echo: variables } });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
};

describe("request", () => {
  test("posts the query and resolves with data", async () => {
    const { fetcher, calls } = makeFetcher();
    const data = await request("/api", "query { a }", { fetcher, variables: { x: 1 } });
    expect(data).toEqual({ echo: { x: 1 } });
    expect(calls[0]!.init.method).toBe("POST");
  });

  test("throws a GraphQLError on response errors", async () => {
    const fetcher = (async () =>
      respond({ errors: [{ message: "boom", locations: [{ line: 1, column: 2 }] }] })) as any;
    const err = await request("/api", "query { a }", { fetcher }).catch(e => e);
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.message).toBe("boom");
    expect(err.locations).toEqual([{ line: 1, column: 2 }]);
  });
});

describe("multipartRequest", () => {
  const record = () => {
    const seen: RequestInit[] = [];
    const fetcher = (async (_u: string, init: RequestInit) => {
      seen.push(init);
      return respond({ data: { ok: true } });
    }) as any;
    return { seen, fetcher };
  };

  test("does not set a content-type, so fetch can add the multipart boundary", async () => {
    const { seen, fetcher } = record();
    await multipartRequest("/api", "mutation { a }", {
      fetcher,
      variables: { f: new Blob(["x"]) },
    });
    expect(seen[0]!.body).toBeInstanceOf(FormData);
    const headers = new Headers(seen[0]!.headers);
    expect(headers.has("content-type")).toBe(false);
  });

  test("preserves caller-provided headers", async () => {
    const { seen, fetcher } = record();
    await multipartRequest("/api", "mutation { a }", {
      fetcher,
      headers: { authorization: "Bearer x", "content-type": "multipart/mixed" },
    });
    const headers = new Headers(seen[0]!.headers);
    expect(headers.get("authorization")).toBe("Bearer x");
    expect(headers.get("content-type")).toBe("multipart/mixed");
  });
});

describe("createGraphQLClient", () => {
  test("returns an async accessor that resolves to the query result", async () => {
    const { fetcher } = makeFetcher();
    const query = createGraphQLClient("/api", { fetcher });
    let result!: ReturnType<typeof query<{ echo: object }>>;
    const dispose = createRoot(d => {
      result = query<{ echo: object }>("query { a }", { id: "1" });
      return d;
    });
    expect(await resolve(result)).toEqual({ echo: { id: "1" } });
    dispose();
  });

  test("refetches when reactive variables change", async () => {
    const { fetcher, calls } = makeFetcher();
    const [code, setCode] = createSignal("BR");
    const query = createGraphQLClient("/api", { fetcher });
    let result!: ReturnType<typeof query<{ echo: { code: string } }>>;
    const dispose = createRoot(d => {
      result = query<{ echo: { code: string } }>("query { a }", () => ({ code: code() }));
      return d;
    });
    expect((await resolve(result))!.echo.code).toBe("BR");
    setCode("US");
    flush();
    expect((await resolve(result))!.echo.code).toBe("US");
    expect(calls.map(c => c.variables.code)).toEqual(["BR", "US"]);
    dispose();
  });

  test("refetches when the url changes", async () => {
    const { fetcher, calls } = makeFetcher();
    const [url, setUrl] = createSignal("/a");
    const query = createGraphQLClient(url, { fetcher });
    let result!: ReturnType<typeof query>;
    const dispose = createRoot(d => {
      result = query("query { a }");
      return d;
    });
    await resolve(result);
    setUrl("/b");
    flush();
    await resolve(result);
    expect(calls.map(c => c.url)).toEqual(["/a", "/b"]);
    dispose();
  });

  test("skips the request while variables are falsy", async () => {
    const { fetcher, calls } = makeFetcher();
    const [vars, setVars] = createSignal<false | { foo: string }>(false);
    const query = createGraphQLClient("/api", { fetcher });
    let result!: ReturnType<typeof query<{ echo: object }, { foo: string }>>;
    const dispose = createRoot(d => {
      result = query<{ echo: object }, { foo: string }>("query { a }", vars);
      return d;
    });
    expect(await resolve(result)).toBeUndefined();
    expect(calls).toHaveLength(0);
    setVars({ foo: "bar" });
    flush();
    expect(await resolve(result)).toEqual({ echo: { foo: "bar" } });
    expect(calls).toHaveLength(1);
    dispose();
  });

  test("omitted variables send the request, an explicit undefined or null skips it", async () => {
    const { fetcher, calls } = makeFetcher();
    const query = createGraphQLClient("/api", { fetcher });
    let omitted!: ReturnType<typeof query>;
    let explicitUndefined!: ReturnType<typeof query>;
    let explicitNull!: ReturnType<typeof query>;
    const dispose = createRoot(d => {
      omitted = query("query { a }");
      explicitUndefined = query("query { b }", undefined);
      explicitNull = query("query { c }", null);
      return d;
    });
    expect(await resolve(omitted)).toEqual({ echo: {} });
    expect(await resolve(explicitUndefined)).toBeUndefined();
    expect(await resolve(explicitNull)).toBeUndefined();
    expect(calls).toHaveLength(1);
    dispose();
  });

  test("refresh() refetches with the same inputs", async () => {
    const { fetcher, calls } = makeFetcher();
    const query = createGraphQLClient("/api", { fetcher });
    let result!: ReturnType<typeof query>;
    const dispose = createRoot(d => {
      result = query("query { a }");
      return d;
    });
    await resolve(result);
    refresh(result);
    flush();
    await resolve(result);
    expect(calls).toHaveLength(2);
    dispose();
  });

  test("aborts the in-flight request when the inputs change and on dispose", async () => {
    const signals: AbortSignal[] = [];
    const fetcher = ((_url: string, init: RequestInit) => {
      signals.push(init.signal!);
      return new Promise<Response>(() => {});
    }) as any;
    const [code, setCode] = createSignal("a");
    const query = createGraphQLClient("/api", { fetcher });
    const dispose = createRoot(d => {
      query("query { a }", () => ({ code: code() }));
      return d;
    });
    flush();
    expect(signals).toHaveLength(1);
    expect(signals[0]!.aborted).toBe(false);

    setCode("b");
    flush();
    expect(signals).toHaveLength(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);

    dispose();
    expect(signals[1]!.aborted).toBe(true);
  });

  test("a client signal is combined with the internal abort", async () => {
    const signals: AbortSignal[] = [];
    const fetcher = ((_url: string, init: RequestInit) => {
      signals.push(init.signal!);
      return new Promise<Response>(() => {});
    }) as any;
    const clientController = new AbortController();
    const [code, setCode] = createSignal("a");
    const query = createGraphQLClient("/api", { fetcher, signal: clientController.signal });
    const dispose = createRoot(d => {
      query("query { a }", () => ({ code: code() }));
      return d;
    });
    flush();
    expect(signals).toHaveLength(1);

    // changing the inputs still aborts the superseded request
    setCode("b");
    flush();
    expect(signals).toHaveLength(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);

    // aborting the client signal aborts the current request
    clientController.abort();
    expect(signals[1]!.aborted).toBe(true);
    dispose();
  });

  test("the client signal listener is removed on dispose", () => {
    const fetcher = (() => new Promise<Response>(() => {})) as any;
    const clientController = new AbortController();
    const remove = vi.spyOn(clientController.signal, "removeEventListener");
    const query = createGraphQLClient("/api", { fetcher, signal: clientController.signal });
    const dispose = createRoot(d => {
      query("query { a }");
      return d;
    });
    flush();
    expect(remove).not.toHaveBeenCalled();
    dispose();
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  test("an already aborted client signal aborts the request immediately", () => {
    const signals: AbortSignal[] = [];
    const fetcher = ((_url: string, init: RequestInit) => {
      signals.push(init.signal!);
      return new Promise<Response>(() => {});
    }) as any;
    const query = createGraphQLClient("/api", { fetcher, signal: AbortSignal.abort() });
    const dispose = createRoot(d => {
      query("query { a }");
      return d;
    });
    flush();
    expect(signals[0]!.aborted).toBe(true);
    dispose();
  });

  test("a failing request surfaces as a thrown GraphQLError", async () => {
    const fetcher = (async () => respond({ errors: [{ message: "nope" }] })) as any;
    const query = createGraphQLClient("/api", { fetcher });
    let result!: ReturnType<typeof query>;
    const dispose = createRoot(d => {
      result = query("query { a }");
      return d;
    });
    await expect(resolve(result)).rejects.toThrow("nope");
    dispose();
  });
});

describe("gql", () => {
  test("creates a GraphQL query string", () => {
    const query = gql`
      query {
        hello
      }
    `;
    expect(query).toEqual("query { hello }");
  });

  test("supports interpolation", () => {
    const name = "world";
    const query = gql`
      query {
        hello(name: ${name})
      }
    `;
    expect(query).toEqual("query { hello(name: world) }");
  });

  test("supports interpolation with variables", () => {
    const name = "world";
    const query = gql`
      query {
        hello(name: ${name})
      }
    `;
    expect(query).toEqual("query { hello(name: world) }");
  });

  test("supports interpolation with variables and fragments", () => {
    const name = "world";
    const query = gql`
      query {
        hello(name: ${name})
      }
      fragment Hello on Query {
        hello
      }
    `;
    expect(query).toEqual("query { hello(name: world) } fragment Hello on Query { hello }");
  });
});

describe("makeMultipartBody", () => {
  test("top-level and nested blobs are correctly replaced", () => {
    const form = makeMultipartBody("", {
      file: new Blob([""], { type: "text/plain" }),
      description: "An empty file",
      nested: {
        file: new File(["DATADATADATA"], "data.jpg"),
      },
    });
    expect(form.get("operations")).toEqual(
      '{"query":"","variables":{"file":null,"description":"An empty file","nested":{"file":null}}}',
    );
    expect(form.get("map")).toEqual('{"0":["variables.file"],"1":["variables.nested.file"]}');
    // We cannot extract the Blob/File objects from the FormData instance
    // but we can check they were added.
    expect([...form.keys()]).toEqual(["operations", "map", "0", "1"]);
  });
  test("blobs arrays are correctly replaced", () => {
    const form = makeMultipartBody("", {
      files: [new Blob([""], { type: "text/plain" }), new Blob([""], { type: "text/plain" })],
      description: "An array of empty files",
    });
    expect(form.get("operations")).toEqual(
      '{"query":"","variables":{"files":[null,null],"description":"An array of empty files"}}',
    );
    expect(form.get("map")).toEqual('{"0":["variables.files.0"],"1":["variables.files.1"]}');
    // We cannot extract the Blob/File objects from the FormData instance
    // but we can check they were added.
    expect([...form.keys()]).toEqual(["operations", "map", "0", "1"]);
  });
});

/** A fetcher whose responses are released manually. */
const makeDeferredFetcher = () => {
  const pending: ((res: Response) => void)[] = [];
  const bodies: any[] = [];
  const fetcher = ((_url: string, init: RequestInit) => {
    bodies.push({ init, body: init.body });
    return new Promise<Response>(r => pending.push(r));
  }) as any as typeof fetch;
  return {
    fetcher,
    bodies,
    respond: (body: object) => pending.shift()!(respond(body)),
  };
};

const tick = () => new Promise<void>(r => setTimeout(r, 0));

describe("createGraphQLMutation", () => {
  test("resolves with the mutation result", async () => {
    const { fetcher, calls } = makeFetcher();
    const mutate = createGraphQLMutation("/api", { fetcher });
    const result = await runWithOwner(null, () =>
      mutate<{ echo: { text: string } }>("mutation { a }", { text: "hi" }),
    );
    expect(result).toEqual({ echo: { text: "hi" } });
    expect(calls[0]!.init.method).toBe("POST");
  });

  test("rejects with a GraphQLError when the mutation fails", async () => {
    const fetcher = (async () => respond({ errors: [{ message: "denied" }] })) as any;
    const mutate = createGraphQLMutation("/api", { fetcher });
    const err = await runWithOwner(null, () => mutate("mutation { a }")).catch((e: Error) => e);
    expect(err).toBeInstanceOf(GraphQLError);
    expect((err as Error).message).toBe("denied");
  });

  test("marks queries pending while in flight, then refreshes them", async () => {
    const { fetcher: queryFetcher, calls } = makeFetcher();
    const query = createGraphQLClient("/api", { fetcher: queryFetcher });
    const deferred = makeDeferredFetcher();
    const mutate = createGraphQLMutation("/api", { fetcher: deferred.fetcher });

    let data!: ReturnType<typeof query>;
    let pending!: () => boolean;
    const dispose = createRoot(d => {
      data = query("query { a }");
      pending = () => isPending(() => data());
      return d;
    });
    await resolve(data);
    expect(calls).toHaveLength(1);
    expect(pending()).toBe(false);

    const done = runWithOwner(null, () => mutate("mutation { a }", {}, { refresh: [data] }));
    flush();
    await tick();
    expect(pending()).toBe(true);
    expect(calls).toHaveLength(1); // not refetched until the mutation succeeds

    deferred.respond({ data: { ok: true } });
    await done;
    flush();
    await resolve(data);
    expect(calls).toHaveLength(2);
    expect(pending()).toBe(false);
    dispose();
  });

  test("optimistic writes show immediately and revert when the mutation fails", async () => {
    const deferred = makeDeferredFetcher();
    const mutate = createGraphQLMutation("/api", { fetcher: deferred.fetcher });
    const [count, setCount] = createOptimistic(0);

    const done = runWithOwner(null, () =>
      mutate("mutation { a }", {}, { optimistic: () => setCount(1) }),
    ).catch(e => e);
    flush();
    expect(count()).toBe(1);

    deferred.respond({ errors: [{ message: "nope" }] });
    expect(await done).toBeInstanceOf(GraphQLError);
    flush();
    expect(count()).toBe(0);
  });

  test("queries are not refreshed when the mutation fails", async () => {
    const { fetcher: queryFetcher, calls } = makeFetcher();
    const query = createGraphQLClient("/api", { fetcher: queryFetcher });
    const mutate = createGraphQLMutation("/api", {
      fetcher: (async () => respond({ errors: [{ message: "nope" }] })) as any,
    });
    let data!: ReturnType<typeof query>;
    const dispose = createRoot(d => {
      data = query("query { a }");
      return d;
    });
    await resolve(data);
    await runWithOwner(null, () => mutate("mutation { a }", {}, { refresh: [data] })).catch(
      () => {},
    );
    flush();
    await tick();
    expect(calls).toHaveLength(1);
    dispose();
  });

  test("multipart sends a FormData body and a per-call signal wins", async () => {
    // a raw recorder, since makeFetcher parses JSON bodies
    const seen: RequestInit[] = [];
    const raw = (async (_u: string, init: RequestInit) => {
      seen.push(init);
      return respond({ data: { ok: true } });
    }) as any;
    const clientController = new AbortController();
    const callController = new AbortController();
    const mutate = createGraphQLMutation("/api", { fetcher: raw, signal: clientController.signal });
    await runWithOwner(null, () =>
      mutate(
        "mutation { a }",
        { file: new Blob(["x"]) },
        { multipart: true, signal: callController.signal },
      ),
    );
    expect(seen[0]!.body).toBeInstanceOf(FormData);
    expect(seen[0]!.signal).toBe(callController.signal);
  });
});

describe("createGraphQLClient options", () => {
  test("loadingValue is shown before the first response without suspending", async () => {
    const deferred = makeDeferredFetcher();
    const query = createGraphQLClient("/api", { fetcher: deferred.fetcher });
    let data!: ReturnType<typeof query<{ n: number }>>;
    const dispose = createRoot(d => {
      data = query<{ n: number }>("query { n }", {}, { loadingValue: { n: -1 } });
      return d;
    });
    flush();
    expect(data()).toEqual({ n: -1 });
    deferred.respond({ data: { n: 1 } });
    await tick();
    flush();
    expect(data()).toEqual({ n: 1 });
    dispose();
  });

  test("keeps the previous result while new variables load (isPending)", async () => {
    const deferred = makeDeferredFetcher();
    const [id, setId] = createSignal(1);
    const query = createGraphQLClient("/api", { fetcher: deferred.fetcher });
    let data!: ReturnType<typeof query<{ id: number }>>;
    let pending!: () => boolean;
    const dispose = createRoot(d => {
      data = query<{ id: number }>("query { a }", () => ({ id: id() }));
      pending = () => isPending(() => data());
      return d;
    });
    flush();
    deferred.respond({ data: { id: 1 } });
    expect(await resolve(data)).toEqual({ id: 1 });

    setId(2);
    flush();
    await tick();
    expect(pending()).toBe(true);
    expect(data()).toEqual({ id: 1 }); // stale value stays readable
    deferred.respond({ data: { id: 2 } });
    expect(await resolve(data)).toEqual({ id: 2 });
    expect(pending()).toBe(false);
    dispose();
  });
});

describe("createGraphQLClient error recovery", () => {
  test("refresh() recovers a query that failed", async () => {
    let fail = true;
    const fetcher = (async () =>
      fail ? respond({ errors: [{ message: "flaky" }] }) : respond({ data: { ok: true } })) as any;
    const query = createGraphQLClient("/api", { fetcher });
    let data!: ReturnType<typeof query<{ ok: boolean }>>;
    const dispose = createRoot(d => {
      data = query<{ ok: boolean }>("query { ok }");
      return d;
    });
    await expect(resolve(data)).rejects.toThrow("flaky");
    fail = false;
    runWithOwner(null, () => refresh(data));
    flush();
    expect(await resolve(data)).toEqual({ ok: true });
    dispose();
  });
});
