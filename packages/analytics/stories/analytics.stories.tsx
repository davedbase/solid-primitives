import { createSignal } from "solid-js";
import preview from "../../../.storybook/preview.js";
import { AnalyticsProvider, createAnalytics, useAnalytics } from "@solid-primitives/analytics";
import type { AnalyticsPlugin } from "@solid-primitives/analytics";
import rawReadme from "../README.md?raw";
import {
  Button,
  ButtonRow,
  colors,
  Container,
  EventLog,
  Section,
  StatRow,
} from "../../../.storybook/ui/index.js";

// Strip YAML frontmatter so it doesn't appear as raw text in the Docs page.
const readme = rawReadme.replace(/^---[\s\S]*?---\n/, "");

const meta = preview.meta({
  title: "Utilities/Analytics",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: { component: readme },
    },
  },
});

export default meta;

export const QueueAndReplayStory = meta.story({
  name: "Queue & replay on plugin ready",
  parameters: {
    docs: {
      description: {
        story:
          "Events fired before all plugins have finished initializing accumulate in a bounded queue. Once every plugin's `loaded()` check passes, the queue drains in order and `pendingCount` resets to zero. Click the buttons immediately after mount — the plugin resolves after 1.5 s — to see events queue up and then replay automatically.",
      },
    },
  },
  render: () => {
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const addLog = (label: string) =>
      setLog(prev => [{ label, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));

    let pluginLoaded = false;
    const plugin: AnalyticsPlugin = {
      name: "demo-logger",
      initialize: () =>
        new Promise<void>(resolve =>
          setTimeout(() => {
            pluginLoaded = true;
            resolve();
          }, 1500),
        ),
      loaded: () => pluginLoaded,
      page: ({ payload }) =>
        addLog(`page  "${payload.properties.title ?? payload.properties.path ?? "/"}"`),
      track: ({ payload }) => addLog(`track  "${payload.event}"`),
      identify: ({ payload }) => addLog(`identify  "${payload.userId}"`),
    };

    const analytics = createAnalytics([plugin]);

    return (
      <Container width={300}>
        <StatRow label="pendingCount" value={analytics.pendingCount()} />
        <ButtonRow>
          <Button
            onClick={() => analytics.page({ title: "Home" })}
            variant="outline"
            style={{ flex: "1" }}
          >
            page
          </Button>
          <Button
            onClick={() => analytics.track("cta_click", { location: "hero" })}
            variant="outline"
            style={{ flex: "1" }}
          >
            track
          </Button>
          <Button
            onClick={() => analytics.identify("user-1", { plan: "pro" })}
            variant="outline"
            style={{ flex: "1" }}
          >
            identify
          </Button>
        </ButtonRow>
        <EventLog entries={log()} />
        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.mutedFg }}>
          Plugin resolves after 1.5 s. Events queued before that replay in order — watch{" "}
          <code>pendingCount</code> drop and the log populate.
        </p>
      </Container>
    );
  },
});

export const BatchedDrainStory = meta.story({
  name: "Batched dispatch window",
  parameters: {
    docs: {
      description: {
        story:
          "Setting `drainInterval` switches the engine to batch mode: events accumulate and flush on a timer rather than immediately. `drainSize` caps the number of events dispatched per cycle — the remainder stays queued for the next tick. Useful for reducing network calls when events fire at high frequency.",
      },
    },
  },
  render: () => {
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const addLog = (label: string) =>
      setLog(prev => [{ label, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));

    const DRAIN_INTERVAL = 3000;
    const DRAIN_SIZE = 3;
    let batchN = 0;

    const plugin: AnalyticsPlugin = {
      name: "batch-logger",
      track: ({ payload }) => addLog(`[batch ${++batchN}]  ${payload.event}`),
    };

    const analytics = createAnalytics([plugin], {
      drainInterval: DRAIN_INTERVAL,
      drainSize: DRAIN_SIZE,
    });

    return (
      <Container width={300}>
        <StatRow label="queued" value={analytics.pendingCount()} />
        <StatRow label="drainInterval" value={`${DRAIN_INTERVAL / 1000} s`} />
        <StatRow label="drainSize" value={`max ${DRAIN_SIZE} / cycle`} />
        <ButtonRow>
          <Button onClick={() => analytics.track("click")} variant="outline" style={{ flex: "1" }}>
            +1 event
          </Button>
          <Button
            onClick={() => {
              for (let i = 0; i < 5; i++) analytics.track(`rapid_${i + 1}`);
            }}
            variant="outline"
            style={{ flex: "1" }}
          >
            +5 events
          </Button>
        </ButtonRow>
        <EventLog entries={log()} />
        <p style={{ margin: 0, "font-size": "0.78rem", color: colors.mutedFg }}>
          Events flush up to {DRAIN_SIZE} at a time every {DRAIN_INTERVAL / 1000} s. The queue
          beyond that carries forward to the next cycle.
        </p>
      </Container>
    );
  },
});

export const ContextSharingStory = meta.story({
  name: "Single provider, many consumers",
  parameters: {
    docs: {
      description: {
        story:
          "`AnalyticsProvider` creates one shared `createAnalytics` instance and exposes it via context. Any descendant calls `useAnalytics()` to get the same controls — no prop-drilling needed. Both sections below fire to the same log through the shared instance.",
      },
    },
  },
  render: () => {
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const addLog = (kind: string, detail: string) =>
      setLog(prev =>
        [{ label: `[${kind}]  ${detail}`, time: new Date().toLocaleTimeString() }, ...prev].slice(
          0,
          10,
        ),
      );

    const plugin: AnalyticsPlugin = {
      name: "context-demo",
      page: ({ payload }) => addLog("page", payload.properties.path ?? "/"),
      track: ({ payload }) => addLog("track", payload.event),
      identify: ({ payload }) => addLog("identify", payload.userId),
    };

    const HeroSection = () => {
      const analytics = useAnalytics();
      return (
        <ButtonRow>
          <Button
            onClick={() => analytics.track("hero_cta")}
            variant="outline"
            style={{ flex: "1" }}
          >
            Hero CTA
          </Button>
          <Button
            onClick={() => analytics.page({ path: "/home" })}
            variant="outline"
            style={{ flex: "1" }}
          >
            Page view
          </Button>
        </ButtonRow>
      );
    };

    const CartSection = () => {
      const analytics = useAnalytics();
      return (
        <ButtonRow>
          <Button
            onClick={() => analytics.track("add_to_cart")}
            variant="outline"
            style={{ flex: "1" }}
          >
            Add to cart
          </Button>
          <Button
            onClick={() => analytics.identify("user-42")}
            variant="outline"
            style={{ flex: "1" }}
          >
            Identify
          </Button>
        </ButtonRow>
      );
    };

    return (
      <AnalyticsProvider plugins={[plugin]}>
        <Container width={300}>
          <Section title="Hero">
            <HeroSection />
          </Section>
          <Section title="Cart">
            <CartSection />
          </Section>
          <EventLog entries={log()} />
        </Container>
      </AnalyticsProvider>
    );
  },
});
