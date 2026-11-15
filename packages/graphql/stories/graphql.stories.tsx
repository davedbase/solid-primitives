import {
  createOptimistic,
  createSignal,
  Errored,
  For,
  isPending,
  Loading,
  refresh,
  Show,
} from "solid-js";
import preview from "../../../.storybook/preview.js";
import { createGraphQLClient, createGraphQLMutation, gql } from "@solid-primitives/graphql";
import readme from "../README.md?raw";
import {
  Alert,
  Badge,
  Button,
  ButtonRow,
  Card,
  colors,
  Container,
  font,
  StatRow,
} from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "Network/GraphQL",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: readme,
      },
    },
  },
});

export default meta;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const USERS: Record<string, { id: string; name: string; role: string }> = {
  "1": { id: "1", name: "Ada Lovelace", role: "Mathematician" },
  "2": { id: "2", name: "Grace Hopper", role: "Rear Admiral" },
  "3": { id: "3", name: "Margaret Hamilton", role: "Flight software lead" },
};

/** An in-memory GraphQL "server": no network needed, with a simulated latency. */
const makeMockServer = (latency = 900) => {
  const todos = ["Read the docs", "Write a primitive"];
  const state = { fail: false, failQueries: 0, uploads: [] as string[] };
  const fetcher = (async (_url: string, init: RequestInit) => {
    await delay(latency);
    const reply = (body: object) => new Response(JSON.stringify(body));
    // multipart requests carry the operation in an `operations` form field
    if (init.body instanceof FormData) {
      const { variables } = JSON.parse(init.body.get("operations") as string);
      const file = init.body.get("0") as File | null;
      if (state.fail) return reply({ errors: [{ message: "The server rejected the upload" }] });
      state.uploads.push(file?.name ?? variables.caption);
      return reply({
        data: {
          uploadImage: {
            name: file?.name ?? "",
            size: file?.size ?? 0,
            caption: variables.caption,
          },
        },
      });
    }
    const { query, variables } = JSON.parse(init.body as string) as {
      query: string;
      variables: Record<string, any>;
    };
    if (query.includes("mutation")) {
      if (state.fail) return reply({ errors: [{ message: "The server rejected the mutation" }] });
      todos.push(variables.text);
      return reply({ data: { addTodo: { text: variables.text } } });
    }
    if (state.failQueries > 0) {
      state.failQueries--;
      return reply({ errors: [{ message: "Service temporarily unavailable" }] });
    }
    if (query.includes("user(")) return reply({ data: { user: USERS[variables.id] ?? null } });
    return reply({ data: { todos: [...todos] } });
  }) as typeof fetch;
  return { fetcher, state };
};

export const ReactiveQueryStory = meta.story({
  name: "Reactive query with <Loading> & isPending",
  parameters: {
    docs: {
      description: {
        story:
          "The query is an async `createMemo`. The first request suspends `<Loading>`; changing the variables keeps the previous result on screen while `isPending` reports the in-flight request. Requests that are superseded are aborted.",
      },
    },
  },
  render: () => {
    const { fetcher } = makeMockServer();
    const query = createGraphQLClient("mock://graphql", { fetcher });
    const [id, setId] = createSignal("1");

    const user = query<{ user: { id: string; name: string; role: string } | null }>(
      gql`
        query ($id: ID!) {
          user(id: $id) {
            id
            name
            role
          }
        }
      `,
      () => ({ id: id() }),
    );

    return (
      <Container width={320}>
        <ButtonRow>
          <For each={Object.keys(USERS)}>
            {key => (
              <Button variant={id() === key ? "primary" : "outline"} onClick={() => setId(key)}>
                User {key}
              </Button>
            )}
          </For>
        </ButtonRow>
        <Errored fallback={err => <Alert variant="error">{(err() as Error).message}</Alert>}>
          <Loading
            fallback={
              <div style={{ color: colors.muted, "font-size": font.sizeBase }}>Loading user…</div>
            }
          >
            <Card>
              <StatRow label="name" value={user()?.user?.name ?? "not found"} />
              <StatRow label="role" value={user()?.user?.role ?? "-"} />
            </Card>
            <Show when={isPending(() => user())}>
              <Badge variant="info">refreshing…</Badge>
            </Show>
          </Loading>
        </Errored>
      </Container>
    );
  },
});

export const MutationStory = meta.story({
  name: "Mutation as an action (optimistic + refresh)",
  parameters: {
    docs: {
      description: {
        story:
          "`createGraphQLMutation` returns a Solid `action`. The optimistic todo shows immediately; the `todos` query reads as pending while the request is in flight and is refreshed on success. Switch on **Fail next requests** to watch the optimistic todo revert and the mutation reject with a `GraphQLError`.",
      },
    },
  },
  render: () => {
    const { fetcher, state } = makeMockServer(1200);
    const query = createGraphQLClient("mock://graphql", { fetcher });
    const mutate = createGraphQLMutation("mock://graphql", { fetcher });

    const todos = query<{ todos: string[] }>(gql`
      query {
        todos
      }
    `);
    const [optimistic, setOptimistic] = createOptimistic<string[]>([]);
    const [error, setError] = createSignal<string>();
    const [failing, setFailing] = createSignal(false);
    let count = 0;

    const addTodo = async () => {
      const text = `Todo #${++count}`;
      setError(undefined);
      try {
        await mutate(
          gql`
            mutation ($text: String!) {
              addTodo(text: $text) {
                text
              }
            }
          `,
          { text },
          {
            optimistic: () => setOptimistic(list => [...list, text]),
            refresh: [todos],
          },
        );
      } catch (e) {
        setError((e as Error).message);
      }
    };

    return (
      <Container width={320}>
        <ButtonRow>
          <Button onClick={addTodo}>Add todo</Button>
          <Button
            variant={failing() ? "primary" : "outline"}
            onClick={() => {
              state.fail = !state.fail;
              setFailing(state.fail);
            }}
          >
            Fail next requests: {failing() ? "on" : "off"}
          </Button>
        </ButtonRow>
        <Show when={error()}>{message => <Alert variant="error">{message()}</Alert>}</Show>
        <Errored fallback={err => <Alert variant="error">{(err() as Error).message}</Alert>}>
          <Loading
            fallback={
              <div style={{ color: colors.muted, "font-size": font.sizeBase }}>Loading todos…</div>
            }
          >
            <Card>
              <For each={[...(todos()?.todos ?? []), ...optimistic()]}>
                {text => <StatRow label="•" value={text} />}
              </For>
            </Card>
            <Show when={isPending(() => todos())}>
              <Badge variant="info">saving…</Badge>
            </Show>
          </Loading>
        </Errored>
      </Container>
    );
  },
});

export const LoadingValueStory = meta.story({
  name: "Skeleton with loadingValue",
  parameters: {
    docs: {
      description: {
        story:
          "`loadingValue` is shown until the first response lands. Nothing suspends and `isPending` stays `false` during that first load, so the skeleton is driven from the value itself (`skeleton: true`). Once the response arrives, a refetch uses normal pending semantics: the stale value stays visible and `isPending` turns on.",
      },
    },
  },
  render: () => {
    const { fetcher } = makeMockServer(1500);
    const query = createGraphQLClient("mock://graphql", { fetcher });
    const [id, setId] = createSignal("1");

    type Result = { user: { id: string; name: string; role: string } | null; skeleton?: boolean };
    const user = query<Result>(
      gql`
        query ($id: ID!) {
          user(id: $id) {
            id
            name
            role
          }
        }
      `,
      () => ({ id: id() }),
      { loadingValue: { user: { id: "", name: "…", role: "…" }, skeleton: true } },
    );

    return (
      <Container width={320}>
        <ButtonRow>
          <For each={Object.keys(USERS)}>
            {key => (
              <Button variant={id() === key ? "primary" : "outline"} onClick={() => setId(key)}>
                User {key}
              </Button>
            )}
          </For>
        </ButtonRow>
        <Card>
          <div style={{ opacity: user()?.skeleton ? 0.4 : 1, transition: "opacity 0.2s" }}>
            <StatRow label="name" value={user()?.user?.name ?? "not found"} />
            <StatRow label="role" value={user()?.user?.role ?? "-"} />
          </div>
        </Card>
        <Show when={user()?.skeleton}>
          <Badge variant="warning">first load (skeleton)</Badge>
        </Show>
        <Show when={isPending(() => user())}>
          <Badge variant="info">refreshing…</Badge>
        </Show>
      </Container>
    );
  },
});

export const ErrorRetryStory = meta.story({
  name: "Errored boundary with retry",
  parameters: {
    docs: {
      description: {
        story:
          "A failed request (or a GraphQL `errors` response) is thrown as a `GraphQLError` when the query is read, so `<Errored>` catches it. The first two requests of this demo fail; **Retry** calls `refresh(data)` to run the same request again.",
      },
    },
  },
  render: () => {
    const { fetcher, state } = makeMockServer(700);
    state.failQueries = 2;
    const query = createGraphQLClient("mock://graphql", { fetcher });
    const [attempts, setAttempts] = createSignal(0);

    const todos = query<{ todos: string[] }>(gql`
      query {
        todos
      }
    `);

    return (
      <Container width={320}>
        <Errored
          fallback={(err, reset) => (
            <Card>
              <Alert variant="error">{(err() as Error).message}</Alert>
              <Button
                onClick={() => {
                  setAttempts(n => n + 1);
                  refresh(todos);
                  reset();
                }}
                style={{ width: "100%" }}
              >
                Retry
              </Button>
            </Card>
          )}
        >
          <Loading
            fallback={
              <div style={{ color: colors.muted, "font-size": font.sizeBase }}>Loading todos…</div>
            }
          >
            <Card>
              <For each={todos()?.todos}>{text => <StatRow label="•" value={text} />}</For>
            </Card>
          </Loading>
        </Errored>
        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.mutedFg }}>
          Retries: {attempts()} — the server recovers on the third request.
        </p>
      </Container>
    );
  },
});

export const SkippedQueryStory = meta.story({
  name: "Skip the request with falsy variables",
  parameters: {
    docs: {
      description: {
        story:
          "Passing `false`, `null` or `undefined` as the variables skips the request: the accessor stays `undefined` and nothing suspends. Providing variables starts the first fetch.",
      },
    },
  },
  render: () => {
    const { fetcher } = makeMockServer();
    const [id, setId] = createSignal<string | false>(false);
    // the fetcher runs inside the query's compute, so this counter needs `ownedWrite`
    const [requests, setRequests] = createSignal(0, { ownedWrite: true });
    const countingQuery = createGraphQLClient("mock://graphql", {
      fetcher: ((...args: Parameters<typeof fetch>) => {
        setRequests(n => n + 1);
        return fetcher(...args);
      }) as typeof fetch,
    });

    const user = countingQuery<{ user: { name: string; role: string } | null }>(
      gql`
        query ($id: ID!) {
          user(id: $id) {
            name
            role
          }
        }
      `,
      () => {
        const value = id();
        return value !== false && { id: value };
      },
    );

    return (
      <Container width={320}>
        <ButtonRow>
          <Button variant={id() === false ? "primary" : "outline"} onClick={() => setId(false)}>
            Skip
          </Button>
          <Button variant={id() === "2" ? "primary" : "outline"} onClick={() => setId("2")}>
            Load user 2
          </Button>
        </ButtonRow>
        <Loading
          fallback={<div style={{ color: colors.muted, "font-size": font.sizeBase }}>Loading…</div>}
        >
          <Card>
            <StatRow
              label="data()"
              value={user() ? (user()!.user?.name ?? "not found") : "undefined"}
            />
            <StatRow label="requests sent" value={requests()} />
          </Card>
        </Loading>
      </Container>
    );
  },
});

export const UploadStory = meta.story({
  name: "File upload with multipart mutation",
  parameters: {
    docs: {
      description: {
        story:
          "`multipart: true` sends the mutation as `multipart/form-data` per the GraphQL multipart request spec, so `File`/`Blob` values in the variables are uploaded as binary parts. The mock server reads the `operations` field and the attached file.",
      },
    },
  },
  render: () => {
    const { fetcher } = makeMockServer(1000);
    const mutate = createGraphQLMutation("mock://graphql", { fetcher });
    const [status, setStatus] = createSignal<"idle" | "uploading" | "done" | "error">("idle");
    const [message, setMessage] = createSignal("");

    const upload = async (file: File) => {
      setStatus("uploading");
      try {
        const result = await mutate<{ uploadImage: { name: string; size: number } }>(
          gql`
            mutation ($file: Upload!, $caption: String!) {
              uploadImage(file: $file, caption: $caption) {
                name
                size
              }
            }
          `,
          { file, caption: "From Storybook" },
          { multipart: true },
        );
        setMessage(`${result.uploadImage.name} (${result.uploadImage.size} bytes)`);
        setStatus("done");
      } catch (e) {
        setMessage((e as Error).message);
        setStatus("error");
      }
    };

    return (
      <Container width={320}>
        <input
          type="file"
          onChange={e => {
            const file = e.currentTarget.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Card>
          <StatRow label="status" value={status()} />
          <Show when={message()}>
            <StatRow label="server" value={message()} />
          </Show>
        </Card>
        <Show when={status() === "uploading"}>
          <Badge variant="info">uploading…</Badge>
        </Show>
      </Container>
    );
  },
});
