import { createSignal } from "solid-js";
import { For, Show } from "@solidjs/web";
import preview from "../../../.storybook/preview.js";
import { createDeferredDisposal, type DisposalHold } from "../src/index.js";
import readme from "../README.md?raw";
import {
  Badge,
  BoolRow,
  Button,
  ButtonRow,
  Card,
  Container,
  EventLog,
  Section,
  Separator,
  StatRow,
} from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "Reactivity/DeferredDisposal",
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

// ─── Story 1: Hold Inspector ─────────────────────────────────────────────────

export const HoldInspector = meta.story({
  name: "Hold inspector",
  parameters: {
    docs: {
      description: {
        story:
          "Each `hold()` call blocks `allSettled` from resolving. `isHeld` is `true` while any hold is active. Release holds individually or all at once to observe the state transition.",
      },
    },
  },
  render: () => {
    const removal = createDeferredDisposal();
    const [holds, setHolds] = createSignal<{ id: number; label: string; hold: DisposalHold }[]>([]);
    let nextId = 1;

    const LABELS = ["fade", "slide", "scale", "blur"];

    const addHold = (label: string) => {
      const id = nextId++;
      const hold = removal.hold(label);
      setHolds(prev => [...prev, { id, label, hold }]);
    };

    const releaseOne = (id: number) => {
      const entry = holds().find(h => h.id === id);
      if (!entry) return;
      entry.hold.release();
      setHolds(prev => prev.filter(h => h.id !== id));
    };

    const releaseAll = () => {
      holds().forEach(({ hold }) => hold.release());
      setHolds([]);
    };

    return (
      <Container width={320}>
        <Card>
          <BoolRow label="isHeld" value={removal.isHeld()} />
          <StatRow label="active holds" value={holds().length} />
        </Card>

        <Section title="Add a hold">
          <ButtonRow>
            <For each={LABELS}>
              {label => (
                <Button variant="outline" onClick={() => addHold(label)}>
                  + {label}
                </Button>
              )}
            </For>
          </ButtonRow>
        </Section>

        <Show when={holds().length > 0}>
          <Section title="Active holds">
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
              <For each={holds()}>
                {({ id, label }) => (
                  <div
                    style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "0.5rem",
                      padding: "0.3rem 0.5rem",
                      background: "#dbeafe",
                      "border-radius": "6px",
                    }}
                  >
                    <span
                      style={{
                        flex: "1",
                        "font-size": "0.82rem",
                        "font-family": "monospace",
                        color: "#1e40af",
                      }}
                    >
                      "{label}"
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => releaseOne(id)}
                      style={{ padding: "0.15rem 0.5rem", "font-size": "0.75rem" }}
                    >
                      Release
                    </Button>
                  </div>
                )}
              </For>
            </div>
            <Button variant="secondary" onClick={releaseAll}>
              Release all
            </Button>
          </Section>
        </Show>
      </Container>
    );
  },
});

// ─── Story 2: Deferred tasks (defer shorthand) ────────────────────────────────

const TASKS = [
  { label: "fast · 400ms", ms: 400, color: "#10b981" },
  { label: "medium · 900ms", ms: 900, color: "#f59e0b" },
  { label: "slow · 1.5s", ms: 1500, color: "#ef4444" },
];

export const DeferredTasks = meta.story({
  name: "Deferred tasks",
  parameters: {
    docs: {
      description: {
        story:
          "`defer(promise)` is a shorthand for `hold()` + `release()`. Each task enqueues a timed promise — `isHeld` stays `true` while any task is running, and flips to `false` only after all complete.",
      },
    },
  },
  render: () => {
    const removal = createDeferredDisposal();
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const [running, setRunning] = createSignal<string[]>([]);

    const addLog = (msg: string) =>
      setLog(prev => [{ label: msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));

    const startTask = (label: string, ms: number) => {
      addLog(`▶ ${label}`);
      setRunning(prev => [...prev, label]);

      const work = new Promise<void>(resolve => setTimeout(resolve, ms)).then(() => {
        setRunning(prev => prev.filter(l => l !== label));
        addLog(`✓ ${label}`);
      });

      removal.defer(work);
    };

    return (
      <Container width={340}>
        <Card>
          <BoolRow label="isHeld" value={removal.isHeld()} />
          <StatRow label="running" value={running().length} />
        </Card>

        <Section title="Start task">
          <ButtonRow>
            <For each={TASKS}>
              {t => (
                <Button variant="outline" color={t.color} onClick={() => startTask(t.label, t.ms)}>
                  {t.label}
                </Button>
              )}
            </For>
          </ButtonRow>
        </Section>

        <Show when={running().length > 0}>
          <div style={{ display: "flex", gap: "0.375rem", "flex-wrap": "wrap" }}>
            <For each={running()}>
              {label => <Badge variant="info">{label}</Badge>}
            </For>
          </div>
        </Show>

        <EventLog entries={log()} />
      </Container>
    );
  },
});

// ─── Story 3: Animated exit list ─────────────────────────────────────────────

const ITEM_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

type ListItem = { id: number; label: string; color: string };

let _itemSeed = 1;
const makeItems = (): ListItem[] =>
  ["Task Alpha", "Task Beta", "Task Gamma", "Task Delta"].map((label, i) => ({
    id: _itemSeed++,
    label,
    color: ITEM_COLORS[i]!,
  }));

export const AnimatedExitList = meta.story({
  name: "Animated exit list",
  parameters: {
    docs: {
      description: {
        story:
          "Clicking Remove triggers a CSS slide-out animation via the Web Animations API. `removal.defer(animation.finished)` holds `isHeld` true for the duration — the item stays in the DOM until the animation completes, then is removed from the list.",
      },
    },
  },
  render: () => {
    const removal = createDeferredDisposal();
    const [items, setItems] = createSignal(makeItems());
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);

    const refs = new Map<number, HTMLDivElement>();
    const addLog = (msg: string) =>
      setLog(prev => [{ label: msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 6));

    const removeItem = (id: number) => {
      const el = refs.get(id);
      const item = items().find(i => i.id === id);
      if (!el || !item) return;

      addLog(`→ animating out "${item.label}"`);

      const anim = el.animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: "translateX(48px)" },
        ],
        { duration: 450, easing: "ease-out", fill: "forwards" },
      );

      removal.defer(
        anim.finished.then(() => {
          setItems(prev => prev.filter(i => i.id !== id));
          refs.delete(id);
          addLog(`✓ removed "${item.label}"`);
        }),
      );
    };

    const reset = () => {
      setItems(makeItems());
      setLog([]);
    };

    return (
      <Container width={360}>
        <Card>
          <BoolRow label="isHeld (exit pending)" value={removal.isHeld()} />
          <StatRow label="items" value={items().length} />
        </Card>

        <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
          <For each={items()}>
            {item => (
              <div
                ref={el => refs.set(item.id, el)}
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.875rem",
                  background: item.color + "18",
                  border: `1px solid ${item.color}50`,
                  "border-radius": "8px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    "border-radius": "50%",
                    background: item.color,
                    "flex-shrink": "0",
                  }}
                />
                <span style={{ flex: "1", "font-size": "0.875rem", color: "#1e293b" }}>
                  {item.label}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  style={{ padding: "0.2rem 0.5rem", "font-size": "0.78rem" }}
                >
                  Remove
                </Button>
              </div>
            )}
          </For>
        </div>

        <Show when={items().length === 0}>
          <div
            style={{
              "text-align": "center",
              color: "#94a3b8",
              "font-size": "0.875rem",
              padding: "0.5rem 0",
            }}
          >
            All items removed
          </div>
        </Show>

        <Button variant="secondary" onClick={reset}>
          Reset list
        </Button>

        <EventLog entries={log()} />
      </Container>
    );
  },
});

// ─── Story 4: DisposableStack aggregation ─────────────────────────────────────

export const DisposableStackAggregation = meta.story({
  name: "DisposableStack aggregation",
  parameters: {
    docs: {
      description: {
        story:
          "`DisposalHold` implements `[Symbol.dispose]` and `[Symbol.asyncDispose]`, making it a first-class `AsyncDisposable`. `AsyncDisposableStack.use(hold)` collects multiple holds and releases them all when the stack is disposed — no manual release loop needed.",
      },
    },
  },
  render: () => {
    const removal = createDeferredDisposal();
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const [running, setRunning] = createSignal(false);

    const addLog = (msg: string) =>
      setLog(prev => [{ label: msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));

    const STEPS = [
      { label: "fade", ms: 400 },
      { label: "slide", ms: 700 },
      { label: "scale", ms: 550 },
    ];

    const runSequence = async () => {
      if (running()) return;
      setRunning(true);

      addLog("AsyncDisposableStack created");

      // AsyncDisposableStack collects all holds; disposing releases them together
      const stack = new AsyncDisposableStack();

      for (const step of STEPS) {
        stack.use(removal.hold(step.label));
        addLog(`  + hold("${step.label}")`);
      }

      addLog(`isHeld → ${removal.isHeld()}`);

      // Simulate each animation finishing independently
      await Promise.all(
        STEPS.map(step =>
          new Promise<void>(r => setTimeout(r, step.ms)).then(() =>
            addLog(`  ✓ "${step.label}" animation done`),
          ),
        ),
      );

      // Disposing the stack releases ALL holds at once
      await stack[Symbol.asyncDispose]();
      addLog(`stack disposed — all holds released`);
      addLog(`isHeld → ${removal.isHeld()}`);

      setRunning(false);
    };

    return (
      <Container width={360}>
        <Card>
          <BoolRow label="isHeld" value={removal.isHeld()} />
        </Card>

        <Separator />

        <div
          style={{
            "font-size": "0.78rem",
            color: "#64748b",
            "font-family": "monospace",
            "line-height": "1.6",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            "border-radius": "6px",
            padding: "0.65rem 0.875rem",
          }}
        >
          <div>
            {"const stack = new AsyncDisposableStack();"}
          </div>
          <For each={STEPS}>
            {s => <div>{`stack.use(removal.hold("${s.label}"));`}</div>}
          </For>
          <div>{"await Promise.all([...animations]);"}</div>
          <div>{"await stack[Symbol.asyncDispose]();"}</div>
        </div>

        <Button onClick={runSequence} disabled={running()}>
          {running() ? "Running…" : "Run sequence"}
        </Button>

        <EventLog entries={log()} />
      </Container>
    );
  },
});
