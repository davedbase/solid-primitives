import {
  action,
  affects,
  createMemo,
  onCleanup,
  refresh,
  type MemoOptions,
  type SourceAccessor,
} from "solid-js";
import { print, type DocumentNode } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { asAccessor, type MaybeAccessor, type Modify } from "@solid-primitives/utils";

export type RequestHeaders = { [key: string]: string };

export type RequestOptions<V extends object = {}> = Modify<
  Omit<RequestInit, "body">,
  {
    headers?: RequestHeaders;
    variables?: V;
    fetcher?: typeof fetch;
  }
>;

/**
 A GraphQLError describes an Error found during the parse, validate,
 or execute phases of performing a GraphQL operation.
*/
export class GraphQLError extends Error {
  constructor(
    message: string,
    public locations?: { line: number; column: number }[],
    public extensions?: Record<string, any> | undefined,
  ) {
    super(message);
  }
}

/**
 * Options of a query created by {@link createGraphQLClient}. They are passed on to the underlying async `createMemo`.
 *
 * - `name` - debug name shown in diagnostics
 * - `loadingValue` - value shown until the first response lands (nothing suspends, `isPending` stays `false`)
 * - `ssrSource` / `deferStream` - control server rendering and hydration of the query
 * - `equals` - custom equality of consecutive responses
 */
export type GraphQLQueryOptions<TResult> = Pick<
  MemoOptions<TResult | undefined>,
  "name" | "loadingValue" | "ssrSource" | "deferStream" | "equals"
>;

/**
 * A function returned by {@link createGraphQLClient}.
 * It runs a GraphQL query against the client's endpoint and returns an async, refreshable accessor:
 * reading it suspends (`<Loading>`) while the request is in flight and throws
 * (`<Errored>`) when the request fails.
 *
 * @param query GraphQL query string *(use {@link gql} function or `DocumentNode`/`TypedDocumentNode` type)*
 * @param variables variables for the GraphQL query. Pass `false`, `null` or `undefined` to skip the request.
 * @param options options passed to the underlying `createMemo`, see {@link GraphQLQueryOptions}
 * @returns accessor of the query result, `undefined` while the request is skipped
 */
export type GraphQLClientQuery = <TResult = unknown, TVariables extends object = {}>(
  query: string | DocumentNode | TypedDocumentNode<TResult, TVariables>,
  variables?: MaybeAccessor<TVariables | false | undefined | null>,
  options?: GraphQLQueryOptions<TResult>,
) => SourceAccessor<TResult | undefined>;

/**
 * Creates a reactive GraphQL query client.
 *
 * @param url URL as string or accessor
 * @param options Options that will be applied to all the subsequent requests
 * @returns Returns a query function that produces async accessors for queries
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/graphql#how-to-use-it
 *
 * @example
 * ```ts
 * const newQuery = createGraphQLClient("https://foobar.com/v1/api", { headers: { authorization: "Bearer mytoken" } });
 * const countries = newQuery<{ countries: { name: string }[] }>(gql`query { countries { name } }`);
 * // <Loading fallback="…">{countries()?.countries.length}</Loading>
 * // refresh(countries) refetches
 * ```
 */
export const createGraphQLClient =
  (
    url: MaybeAccessor<string>,
    options: MaybeAccessor<Omit<RequestOptions, "variables">> = {},
  ): GraphQLClientQuery =>
  (query, ...args) => {
    // omitted variables mean "no variables" (`{}`), but an explicit `undefined`/`null`/`false` skips the request
    const variables: any = args.length === 0 ? {} : args[0],
      queryOptions = args[1];
    const getUrl = asAccessor(url),
      getVariables = asAccessor(variables),
      getOptions = asAccessor(options);
    return createMemo(() => {
      // every reactive read happens before the request starts, so all inputs are tracked
      const url = getUrl(),
        variables = getVariables(),
        options = getOptions();
      // a falsy url or variables skips the request
      if (!url || !variables) return undefined;

      // abort the in-flight request when the inputs change or the owner is disposed,
      // or when a signal passed in the client options aborts
      const controller = new AbortController();
      const clientSignal = options.signal;
      const abortFromClient = () => controller.abort(clientSignal?.reason);
      if (clientSignal?.aborted) abortFromClient();
      else clientSignal?.addEventListener("abort", abortFromClient, { once: true });
      onCleanup(() => {
        clientSignal?.removeEventListener("abort", abortFromClient);
        controller.abort();
      });
      return request(url, query, { ...options, signal: controller.signal, variables });
    }, queryOptions as MemoOptions<any>);
  };

/**
 * Options of a single mutation call, see {@link createGraphQLMutation}.
 */
export type GraphQLMutationOptions<TVariables extends object = {}> = {
  /**
   * Runs first, synchronously, inside the mutation's transaction. Put optimistic writes here
   * (`createOptimistic` / `createOptimisticStore` setters) - they are reverted automatically
   * if the request fails, and replaced by the real data once the mutation settles.
   */
  optimistic?: (variables: TVariables) => void;
  /**
   * Queries (accessors returned by a {@link GraphQLClientQuery}) that this mutation changes.
   * They are marked as pending (`isPending` is `true`) while the request is in flight
   * and are refreshed once it succeeds.
   */
  refresh?: SourceAccessor<any>[];
  /** Send the request as `multipart/form-data` (file uploads), see {@link multipartRequest}. */
  multipart?: boolean;
  /** Abort signal for the request. */
  signal?: AbortSignal;
};

/**
 * A function returned by {@link createGraphQLMutation}. It is a Solid `action`, so it must be called
 * from an event handler or other imperative code, never from a component body or computation.
 */
export type GraphQLClientMutation = <TResult = unknown, TVariables extends object = {}>(
  mutation: string | DocumentNode | TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
  options?: GraphQLMutationOptions<TVariables>,
) => Promise<TResult>;

/**
 * Creates a function that performs GraphQL mutations as Solid 2.0 {@link action}s.
 *
 * Every call runs as one transaction: optimistic writes made in `options.optimistic` are shown
 * immediately, queries listed in `options.refresh` read as pending (`isPending`) while the request
 * is in flight, and are refreshed when it succeeds. If the request fails the optimistic writes revert
 * and the returned promise rejects with a {@link GraphQLError}.
 *
 * @param url URL as string or accessor
 * @param options Options that will be applied to all the subsequent requests
 * @returns a function that performs a mutation and resolves with its result
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/graphql#mutations
 *
 * @example
 * ```ts
 * const mutate = createGraphQLMutation("https://foobar.com/v1/api");
 * const data = newQuery(gql`query { todos { id text } }`);
 *
 * const onAdd = (text: string) =>
 *   mutate(gql`mutation($text: String!) { addTodo(text: $text) { id } }`, { text }, {
 *     refresh: [data], // `data` reads as pending, then refetches
 *   });
 * ```
 */
export const createGraphQLMutation = (
  url: MaybeAccessor<string>,
  options: MaybeAccessor<Omit<RequestOptions, "variables">> = {},
): GraphQLClientMutation => {
  const getUrl = asAccessor(url),
    getOptions = asAccessor(options);

  const run = action(function* (
    mutation: string | DocumentNode | TypedDocumentNode<any, any>,
    variables: object = {},
    mutationOptions: GraphQLMutationOptions<any> = {},
  ): Generator<Promise<any>, any, any> {
    const { optimistic, refresh: targets = [], multipart, signal } = mutationOptions;

    // up-front declarations about the mutation: what it changes...
    for (const target of targets) affects(target);
    // ...and what it optimistically shows
    optimistic?.(variables);

    // a per-call signal wins over one set on the client
    const requestOptions = { ...getOptions(), ...(signal && { signal }), variables };
    const result = yield multipart
      ? multipartRequest(getUrl(), mutation, requestOptions)
      : request(getUrl(), mutation, requestOptions);

    // only reached on success - a throw above reverts the optimistic writes
    for (const target of targets) refresh(target);
    return result;
  });

  return run as GraphQLClientMutation;
};

/**
 * Performs a GraphQL fetch to provided endpoint.
 *
 * @param url target api endpoint
 * @param query GraphQL query string *(use `gql` function or `DocumentNode`/`TypedDocumentNode` type)*
 * @param options config object where you can specify query variables, request headers, method, etc.
 * @returns a Promise resolving in JSON value if the request was successful
 */
export async function request<T = any, V extends object = {}>(
  url: string,
  query: string | DocumentNode | TypedDocumentNode<T, V>,
  options: RequestOptions<V> = {},
): Promise<T> {
  const { fetcher = fetch, variables = {}, method = "POST" } = options;
  const query_string = typeof query == "string" ? query : print(query);

  const res = await fetcher(url, {
    ...options,
    method,
    body: JSON.stringify({ query: query_string, variables }),
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (data.errors && data.errors.length) {
    throw new GraphQLError(
      data.errors[0].message,
      data.errors[0].locations,
      data.errors[0].extensions,
    );
  }
  return data.data;
}

/**
 * Performs a multi-part GraphQL fetch to provided endpoint.
 *
 * @param url target api endpoint
 * @param query GraphQL query string *(use `gql` function or `DocumentNode`/`TypedDocumentNode` type)*
 * @param options config object where you can specify query variables, request headers, method, etc.
 * @returns a Promise resolving in JSON value if the request was successful
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/graphql#file-upload-support
 */
export async function multipartRequest<T = any, V extends object = {}>(
  url: string,
  query: string | DocumentNode | TypedDocumentNode<T, V>,
  options: Omit<RequestOptions<V>, "method"> = {},
): Promise<T> {
  const { fetcher = fetch, variables = {} } = options;
  const query_string = typeof query == "string" ? query : print(query);

  const res = await fetcher(url, {
    ...options,
    method: "POST",
    body: makeMultipartBody(query_string, variables),
    // no default `content-type`: `fetch` sets `multipart/form-data` together with the generated
    // boundary for a FormData body. A caller-provided header (from `options.headers`) is preserved.
    headers: options.headers,
  });
  const data = await res.json();
  if (data.errors && data.errors.length) {
    throw new GraphQLError(
      data.errors[0].message,
      data.errors[0].locations,
      data.errors[0].extensions,
    );
  }
  return data.data;
}

/**
 * Converts GraphQL query and variables into a multipart/form-data compatible format.
 *
 * @param query GraphQL query string
 * @param variables variables used in the mutation (File and Blob instances can be used as values).
 * @returns a FormData object, ready to be POSTed
 */
export function makeMultipartBody(query: string, variables: object): FormData {
  const parts: { blob: Blob; path: string }[] = [];

  // We don't want to modify the variables passed in as arguments
  // so we do a deep copy and we replace instances of Blobs with
  // a null and generate the correct object-path as we go.

  function copyValue(r: any, k: string | number, v: any, path: (string | number)[]) {
    if (v instanceof Blob) {
      parts.push({
        blob: v,
        path: path.join(".") + "." + k,
      });
      r[k] = null;
    } else {
      if (typeof v === "object" && v != null) {
        path.push(k);
        r[k] = copyObject(v, path);
        path.pop();
      } else {
        r[k] = v;
      }
    }
  }

  function copyObject(obj: object, path: (string | number)[]) {
    const r: any = obj.constructor();
    for (const [k, v] of Object.entries(obj)) {
      copyValue(r, k, v, path);
    }
    return r;
  }

  variables = copyObject(variables, ["variables"]);

  const formData = new FormData();
  formData.append("operations", JSON.stringify({ query, variables }));
  formData.append(
    "map",
    JSON.stringify(Object.fromEntries(parts.map((x, i) => [`${i}`, [x.path]]))),
  );
  for (let i = 0; i < parts.length; i++) {
    formData.append(`${i}`, parts[i]!.blob);
  }
  return formData;
}

/**
 * Creates a GraphQL query string.
 */
export const gql = (query: TemplateStringsArray, ...expressions: any[]): string =>
  query
    .map((s, i) => `${s}${expressions[i] ?? ""}`)
    .join("")
    .replace(/#.+\r?\n|\r/g, "")
    .replace(/\r?\n|\r/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
