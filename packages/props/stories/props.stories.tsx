import { createSignal, For } from "solid-js";
import preview from "../../../.storybook/preview.js";
import { combineProps, combineHandlers, partitionProps } from "@solid-primitives/props";
import readme from "../README.md?raw";
import {
  Container,
  Card,
  EventLog,
  Button,
  ButtonRow,
  StatRow,
  BoolRow,
  Section,
} from "../../../.storybook/ui/index.js";
import { colors, font, radii } from "../../../.storybook/ui/tokens.js";

const statusColors = {
  ok: { bg: "#dcfce7", fg: "#16a34a" },
  warn: { bg: "#fef9c3", fg: "#ca8a04" },
  error: { bg: "#fee2e2", fg: "#dc2626" },
} as const;

type StatusKey = keyof typeof statusColors;
type StatusProps = { status: StatusKey; label: string; [key: string]: unknown };

const StatusBadge = (props: StatusProps) => {
  const [own, html] = partitionProps(props, k => k === "status" || k === "label");
  const status = () => (own as StatusProps).status;
  return (
    <span
      {...(html as any)}
      style={{
        display: "inline-block",
        padding: "0.2rem 0.65rem",
        "border-radius": radii.full,
        "font-size": font.sizeSm,
        "font-weight": "600",
        background: statusColors[status()].bg,
        color: statusColors[status()].fg,
      }}
    >
      {(own as StatusProps).label}
    </span>
  );
};

const FILTER_DEMO_KEYS = [
  "id",
  "class",
  "style",
  "data-id",
  "data-testid",
  "aria-label",
  "aria-hidden",
  "onClick",
] as const;

const meta = preview.meta({
  title: "Utilities/Props",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: readme } },
  },
});

export default meta;

export const HandlerChaining = meta.story({
  name: "Handler chaining",
  parameters: {
    docs: {
      description: {
        story:
          "All `on*` handlers across sources are chained left-to-right — spread `{...combined}` onto a native element and every source's handler fires without any manual wiring.",
      },
    },
  },
  render: () => {
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const push = (msg: string) =>
      setLog(e =>
        [{ label: msg, time: new Date().toLocaleTimeString("en", { hour12: false }) }, ...e].slice(
          0,
          5,
        ),
      );

    const combined = combineProps(
      { onClick: () => push("base onClick") },
      { onClick: () => push("extra onClick") },
    );

    return (
      <Container minWidth={300}>
        <button
          {...combined}
          style={{
            background: colors.primary,
            color: "white",
            padding: "0.5rem 1.1rem",
            border: "none",
            "border-radius": radii.md,
            cursor: "pointer",
            "font-size": font.sizeBase,
            "font-family": font.system,
          }}
        >
          Click me
        </button>
        <EventLog entries={log()} />
      </Container>
    );
  },
});

export const StyleAndClassMerge = meta.story({
  name: "Class & style merging",
  parameters: {
    docs: {
      description: {
        story:
          "`class` values are joined with a space. `style` objects are shallow-merged with later sources overriding the same key — string styles are converted to objects first.",
      },
    },
  },
  render: () => {
    const sourceA = {
      class: "btn",
      style: { background: colors.primary, color: "white", "border-radius": radii.md },
    };
    const sourceB = {
      class: "btn-large",
      style: { padding: "0.75rem 1.5rem", "font-weight": "700" },
    };
    const combined = combineProps(sourceA, sourceB);

    return (
      <Container minWidth={320}>
        <button
          style={{
            ...(combined.style as object),
            border: "none",
            cursor: "pointer",
            "font-size": font.sizeMd,
            "font-family": font.system,
          }}
        >
          Merged button
        </button>
        <Card>
          <Section title="class">
            <code
              style={{
                "font-family": font.mono,
                "font-size": font.sizeSm,
                background: colors.secondary,
                padding: "0.15rem 0.4rem",
                "border-radius": radii.sm,
              }}
            >
              "{combined.class as string}"
            </code>
          </Section>
          <Section title="style">
            <For each={Object.entries((combined.style ?? {}) as Record<string, string>)}>
              {([k, v]) => <StatRow label={k} value={v} />}
            </For>
          </Section>
        </Card>
      </Container>
    );
  },
});

export const NullHandlerSkip = meta.story({
  name: "Null handler skipping",
  parameters: {
    docs: {
      description: {
        story:
          "`combineHandlers` silently skips `null`, `undefined`, and `false` — toggle the extra handler off and click: no errors, only the base handler fires.",
      },
    },
  },
  render: () => {
    const [extraOn, setExtraOn] = createSignal(true);
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const push = (msg: string) =>
      setLog(e =>
        [{ label: msg, time: new Date().toLocaleTimeString("en", { hour12: false }) }, ...e].slice(
          0,
          5,
        ),
      );

    const base = () => push("base handler");
    const extra = () => push("extra handler");

    return (
      <Container minWidth={300}>
        <ButtonRow>
          <Button variant={extraOn() ? "primary" : "outline"} onClick={() => setExtraOn(v => !v)}>
            Extra handler: {extraOn() ? "enabled" : "null"}
          </Button>
        </ButtonRow>
        <button
          onClick={combineHandlers(base, extraOn() ? extra : null)}
          style={{
            background: colors.secondary,
            color: colors.secondaryFg,
            padding: "0.5rem 1.1rem",
            border: `1px solid ${colors.border}`,
            "border-radius": radii.md,
            cursor: "pointer",
            "font-size": font.sizeBase,
            "font-family": font.system,
          }}
        >
          Fire handlers
        </button>
        <EventLog entries={log()} />
      </Container>
    );
  },
});

export const DynamicFilter = meta.story({
  name: "Dynamic prefix filter",
  parameters: {
    docs: {
      description: {
        story:
          "`filterProps` evaluates its predicate lazily per property read. Any signal inside the predicate is tracked — switching the prefix below reactively changes which keys pass through.",
      },
    },
  },
  render: () => {
    const [prefix, setPrefix] = createSignal("data-");

    return (
      <Container minWidth={300}>
        <ButtonRow>
          {(["data-", "aria-", "on"] as const).map(p => (
            <Button variant={prefix() === p ? "primary" : "outline"} onClick={() => setPrefix(p)}>
              {p}*
            </Button>
          ))}
        </ButtonRow>
        <Card>
          <For each={FILTER_DEMO_KEYS}>
            {key => <BoolRow label={key} value={(key as string).startsWith(prefix())} />}
          </For>
        </Card>
      </Container>
    );
  },
});

export const OwnVsDomSplit = meta.story({
  name: "Own vs DOM split",
  parameters: {
    docs: {
      description: {
        story:
          "`partitionProps` splits props into two lazy views. `status` and `label` are consumed by `StatusBadge`; all other keys (`title`, `id`, `aria-label`) pass through to the underlying `<span>`. Hover a badge to see the forwarded `title` tooltip.",
      },
    },
  },
  render: () => {
    const [status, setStatus] = createSignal<StatusKey>("ok");

    return (
      <Container minWidth={320}>
        <ButtonRow>
          {(Object.keys(statusColors) as StatusKey[]).map(s => (
            <Button variant={status() === s ? "primary" : "outline"} onClick={() => setStatus(s)}>
              {s}
            </Button>
          ))}
        </ButtonRow>
        <div
          style={{ display: "flex", gap: "0.5rem", "align-items": "center", "flex-wrap": "wrap" }}
        >
          <StatusBadge
            status={status()}
            label="Deploy"
            title="title forwarded via htmlProps — hover to confirm"
          />
          <StatusBadge status="ok" label="Tests" id="test-badge" title="id + title forwarded" />
          <StatusBadge
            status="warn"
            label="Coverage"
            aria-label="coverage warning"
            title="aria-label forwarded"
          />
        </div>
        <Card>
          <Section title="own props → consumed by StatusBadge">
            <StatRow label="status" value={status()} />
            <StatRow label="label" value="string" />
          </Section>
          <Section title="html props → forwarded to <span>">
            <StatRow label="title" value='"title forwarded via htmlProps…"' />
            <StatRow label="id" value='"test-badge"' />
            <StatRow label="aria-label" value='"coverage warning"' />
          </Section>
        </Card>
      </Container>
    );
  },
});
