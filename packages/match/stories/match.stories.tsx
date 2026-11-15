import { createSignal, For } from "solid-js";
import preview from "../../../.storybook/preview.js";
import { MatchTag, MatchValue } from "@solid-primitives/match";
import readme from "../README.md?raw";
import {
  Button,
  Container,
  Card,
  Section,
  StatRow,
  BoolRow,
  Badge,
  colors,
  font,
  radii,
} from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "Control Flow/Match",
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

type Shape =
  | { type: "circle"; radius: number }
  | { type: "rect"; width: number; height: number }
  | { type: "triangle"; base: number; height: number };

const SHAPES: Shape[] = [
  { type: "circle", radius: 40 },
  { type: "rect", width: 80, height: 50 },
  { type: "triangle", base: 70, height: 60 },
];

export const DiscriminatedUnion = meta.story({
  name: "Discriminated union (default tag)",
  parameters: {
    docs: {
      description: {
        story:
          "`<MatchTag>` dispatches on the `type` field by default. Each branch receives a narrowed **accessor** — reading `v().radius` is only possible inside the `circle` branch.",
      },
    },
  },
  render: () => {
    const [shape, setShape] = createSignal<Shape | null>(null);

    const area = () => {
      const s = shape();
      if (!s) return null;
      if (s.type === "circle") return (Math.PI * s.radius ** 2).toFixed(1);
      if (s.type === "rect") return (s.width * s.height).toFixed(1);
      return (0.5 * s.base * s.height).toFixed(1);
    };

    return (
      <Container width={300}>
        <h3 style={{ margin: 0 }}>Shape inspector</h3>

        {/* Shape selector */}
        <div style={{ display: "flex", gap: "0.4rem", "flex-wrap": "wrap" }}>
          <Button
            variant={shape() === null ? "primary" : "outline"}
            onClick={() => setShape(null)}
            style={{ "font-size": font.sizeSm }}
          >
            None
          </Button>
          <For each={SHAPES}>
            {s => (
              <Button
                variant={shape()?.type === s.type ? "primary" : "outline"}
                onClick={() => setShape(s)}
                style={{ "font-size": font.sizeSm }}
              >
                {s.type}
              </Button>
            )}
          </For>
        </div>

        {/* MatchTag output */}
        <Card>
          <MatchTag
            on={shape()}
            case={{
              circle: v => (
                <div>
                  <div style={{ "font-weight": "600", "margin-bottom": "0.25rem" }}>Circle</div>
                  <div style={{ "font-size": font.sizeSm, color: colors.muted }}>
                    radius: {v().radius}px
                  </div>
                </div>
              ),
              rect: v => (
                <div>
                  <div style={{ "font-weight": "600", "margin-bottom": "0.25rem" }}>Rectangle</div>
                  <div style={{ "font-size": font.sizeSm, color: colors.muted }}>
                    {v().width} × {v().height}px
                  </div>
                </div>
              ),
              triangle: v => (
                <div>
                  <div style={{ "font-weight": "600", "margin-bottom": "0.25rem" }}>Triangle</div>
                  <div style={{ "font-size": font.sizeSm, color: colors.muted }}>
                    base {v().base}px · height {v().height}px
                  </div>
                </div>
              ),
            }}
            fallback={
              <span style={{ color: colors.mutedFg, "font-size": font.sizeSm }}>
                No shape selected
              </span>
            }
          />
        </Card>

        <Section title="Derived">
          <StatRow label="type" value={shape()?.type ?? "—"} />
          <StatRow label="area" value={area() ?? "—"} />
        </Section>

        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.muted }}>
          Each branch accessor is narrowed — <code>v().radius</code> only exists inside{" "}
          <code>circle</code>.
        </p>
      </Container>
    );
  },
});

type Notification =
  | { kind: "info"; message: string }
  | { kind: "warning"; message: string; code: number }
  | { kind: "error"; message: string; code: number; fatal: boolean };

const NOTIFS: Notification[] = [
  { kind: "info", message: "Deployment succeeded." },
  { kind: "warning", message: "Disk usage above 80%.", code: 1001 },
  { kind: "error", message: "Out of memory.", code: 5002, fatal: true },
];

const BADGE_VARIANT = {
  info: "info",
  warning: "warning",
  error: "error",
} as const;

export const CustomTagField = meta.story({
  name: "Custom tag field",
  parameters: {
    docs: {
      description: {
        story:
          'Pass `tag="kind"` when the discriminant field isn\'t named `type`. The `case` keys and accessor shape update accordingly.',
      },
    },
  },
  render: () => {
    const [notif, setNotif] = createSignal<Notification | null>(null);

    return (
      <Container width={320}>
        <h3 style={{ margin: 0 }}>Notification viewer</h3>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <Button
            variant={notif() === null ? "primary" : "outline"}
            onClick={() => setNotif(null)}
            style={{ "font-size": font.sizeSm }}
          >
            Clear
          </Button>
          <For each={NOTIFS}>
            {n => (
              <Button
                variant={notif()?.kind === n.kind ? "primary" : "outline"}
                onClick={() => setNotif(n)}
                style={{ "font-size": font.sizeSm }}
              >
                {n.kind}
              </Button>
            )}
          </For>
        </div>

        <Card>
          <MatchTag
            on={notif()}
            tag="kind"
            case={{
              info: v => (
                <div style={{ display: "flex", "flex-direction": "column", gap: "0.3rem" }}>
                  <Badge variant={BADGE_VARIANT.info}>info</Badge>
                  <span style={{ "font-size": font.sizeSm }}>{v().message}</span>
                </div>
              ),
              warning: v => (
                <div style={{ display: "flex", "flex-direction": "column", gap: "0.3rem" }}>
                  <Badge variant={BADGE_VARIANT.warning}>warning #{v().code}</Badge>
                  <span style={{ "font-size": font.sizeSm }}>{v().message}</span>
                </div>
              ),
              error: v => (
                <div style={{ display: "flex", "flex-direction": "column", gap: "0.3rem" }}>
                  <Badge variant={BADGE_VARIANT.error}>error #{v().code}</Badge>
                  <span style={{ "font-size": font.sizeSm }}>{v().message}</span>
                  <BoolRow label="fatal" value={v().fatal} />
                </div>
              ),
            }}
            fallback={
              <span style={{ color: colors.mutedFg, "font-size": font.sizeSm }}>
                No notification
              </span>
            }
          />
        </Card>

        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.muted }}>
          The discriminant is <code>kind</code>, set via <code>tag="kind"</code>.
        </p>
      </Container>
    );
  },
});

type MediaEvent =
  { type: "play" } | { type: "pause" } | { type: "seek"; position: number } | { type: "end" };

const ALL_EVENTS: MediaEvent[] = [
  { type: "play" },
  { type: "pause" },
  { type: "seek", position: 42 },
  { type: "end" },
];

export const PartialMatch = meta.story({
  name: "Partial match with fallback",
  parameters: {
    docs: {
      description: {
        story:
          "Add `partial` when you only handle a subset of union members. Unhandled cases fall through to `fallback` — identical runtime behavior, but the TypeScript type of `case` switches from required to optional keys.",
      },
    },
  },
  render: () => {
    const [evt, setEvt] = createSignal<MediaEvent | null>(null);

    return (
      <Container width={300}>
        <h3 style={{ margin: 0 }}>Media event handler</h3>
        <p style={{ margin: 0, "font-size": font.sizeSm, color: colors.muted }}>
          Only <code>play</code> and <code>pause</code> are handled; others fall through.
        </p>

        <div style={{ display: "flex", gap: "0.4rem", "flex-wrap": "wrap" }}>
          <Button
            variant={evt() === null ? "primary" : "outline"}
            onClick={() => setEvt(null)}
            style={{ "font-size": font.sizeSm }}
          >
            Clear
          </Button>
          <For each={ALL_EVENTS}>
            {e => (
              <Button
                variant={evt()?.type === e.type ? "primary" : "outline"}
                onClick={() => setEvt(e)}
                style={{ "font-size": font.sizeSm }}
              >
                {e.type}
              </Button>
            )}
          </For>
        </div>

        <Card>
          <MatchTag
            partial
            on={evt()}
            case={{
              play: () => (
                <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                  <span style={{ color: colors.success, "font-size": "1.1rem" }}>▶</span>
                  <span style={{ "font-size": font.sizeSm }}>Playing</span>
                </div>
              ),
              pause: () => (
                <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                  <span style={{ color: colors.warning, "font-size": "1.1rem" }}>⏸</span>
                  <span style={{ "font-size": font.sizeSm }}>Paused</span>
                </div>
              ),
            }}
            fallback={
              <span style={{ color: colors.mutedFg, "font-size": font.sizeSm }}>
                {evt() ? `Unhandled: "${evt()!.type}"` : "No event"}
              </span>
            }
          />
        </Card>

        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.muted }}>
          <code>partial</code> is TypeScript-only — runtime behavior is unchanged.
        </p>
      </Container>
    );
  },
});

type Status = "idle" | "loading" | "success" | "error";

const STATUSES: Status[] = ["idle", "loading", "success", "error"];

const STATUS_COLOR: Record<Status, string> = {
  idle: colors.muted,
  loading: "#6366f1",
  success: colors.success,
  error: "#ef4444",
};

const STATUS_LABEL: Record<Status, string> = {
  idle: "Idle",
  loading: "Loading…",
  success: "Done",
  error: "Failed",
};

export const LiteralUnion = meta.story({
  name: "Literal union (MatchValue)",
  parameters: {
    docs: {
      description: {
        story:
          "`<MatchValue>` matches plain string/number literals — no tag field required. Each branch receives the matched value directly.",
      },
    },
  },
  render: () => {
    const [status, setStatus] = createSignal<Status>("idle");

    return (
      <Container width={280}>
        <h3 style={{ margin: 0 }}>Request status</h3>

        {/* Status indicator */}
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "0.6rem",
            padding: "0.6rem 0.75rem",
            "border-radius": radii.md,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              "border-radius": "50%",
              background: STATUS_COLOR[status()],
              transition: "background 0.2s",
              "flex-shrink": 0,
            }}
          />
          <MatchValue
            on={status()}
            case={{
              idle: () => (
                <span style={{ "font-size": font.sizeSm, color: colors.muted }}>Waiting</span>
              ),
              loading: () => (
                <span style={{ "font-size": font.sizeSm, color: "#6366f1" }}>Fetching data…</span>
              ),
              success: () => (
                <span style={{ "font-size": font.sizeSm, color: colors.success }}>
                  Data loaded successfully
                </span>
              ),
              error: () => (
                <span style={{ "font-size": font.sizeSm, color: "#ef4444" }}>Request failed</span>
              ),
            }}
          />
        </div>

        <Section title="Set status">
          <div style={{ display: "flex", gap: "0.4rem", "flex-wrap": "wrap" }}>
            <For each={STATUSES}>
              {s => (
                <Button
                  variant={status() === s ? "primary" : "outline"}
                  onClick={() => setStatus(s)}
                  style={{ "font-size": font.sizeSm }}
                >
                  {STATUS_LABEL[s]}
                </Button>
              )}
            </For>
          </div>
        </Section>

        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.muted }}>
          No object needed — <code>MatchValue</code> matches <code>"idle" | "loading" | …</code>{" "}
          directly.
        </p>
      </Container>
    );
  },
});
