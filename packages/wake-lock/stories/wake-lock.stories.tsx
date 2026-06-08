import { createSignal, Show } from "solid-js";
import preview from "../../../.storybook/preview.js";
import { createWakeLock } from "@solid-primitives/wake-lock";
import readme from "../README.md?raw";
import {
  Button,
  ButtonRow,
  Container,
  Section,
  BoolRow,
  StatRow,
  colors,
  font,
} from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "Browser APIs/Wake Lock",
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

export const ReactiveWakeLock = meta.story({
  name: "createWakeLock — reactive state",
  parameters: {
    docs: {
      description: {
        story:
          "`createWakeLock` returns reactive `isActive`, `type`, `sentinel`, and `error` signals. " +
          "Click **Request Lock** to acquire the wake lock and **Release Lock** to drop it. " +
          "The lock is automatically released when this story unmounts. " +
          "Switch tabs while the lock is active — with `autoReacquire: true` (default) it will " +
          "be re-requested when the tab becomes visible again.",
      },
    },
  },
  render: () => {
    const wl = createWakeLock({ autoReacquire: true });

    return (
      <Container width={340}>
        <Show
          when={wl.isSupported}
          fallback={
            <div
              style={{
                padding: "1rem",
                background: colors.surface,
                "border-radius": "8px",
                color: colors.muted,
                "font-size": font.sizeSm,
              }}
            >
              The Screen Wake Lock API is not supported in this browser or environment.
            </div>
          }
        >
          <ButtonRow>
            <Button
              onClick={() => wl.request("screen")}
              variant={wl.isActive() ? "outline" : "primary"}
              disabled={wl.isActive()}
            >
              Request Lock
            </Button>
            <Button onClick={() => wl.release()} variant="secondary" disabled={!wl.isActive()}>
              Release Lock
            </Button>
          </ButtonRow>

          <Section title="State">
            <BoolRow label="isActive" value={wl.isActive()} />
            <StatRow label="type" value={wl.type() ?? "—"} />
            <StatRow label="sentinel" value={wl.sentinel() ? "WakeLockSentinel" : "null"} />
          </Section>

          <Show when={wl.error()}>
            {err => (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "#fef2f2",
                  "border-radius": "6px",
                  "border-left": "3px solid #ef4444",
                  "font-size": font.sizeSm,
                  color: "#7f1d1d",
                }}
              >
                <strong>Error:</strong> {err().message}
              </div>
            )}
          </Show>
        </Show>
      </Container>
    );
  },
});

export const NoAutoReacquire = meta.story({
  name: "createWakeLock — no auto-reacquire",
  parameters: {
    docs: {
      description: {
        story:
          "With `autoReacquire: false` the lock is NOT re-requested when the tab becomes visible " +
          "after being hidden. Use this when your application needs explicit control over " +
          "when the lock is held.",
      },
    },
  },
  render: () => {
    const wl = createWakeLock({ autoReacquire: false });

    return (
      <Container width={340}>
        <Show
          when={wl.isSupported}
          fallback={
            <div
              style={{
                padding: "1rem",
                color: colors.muted,
                "font-size": font.sizeSm,
              }}
            >
              Wake Lock API not supported in this environment.
            </div>
          }
        >
          <ButtonRow>
            <Button
              onClick={() => wl.request()}
              variant={wl.isActive() ? "outline" : "primary"}
              disabled={wl.isActive()}
            >
              Request Lock
            </Button>
            <Button onClick={() => wl.release()} variant="secondary" disabled={!wl.isActive()}>
              Release Lock
            </Button>
          </ButtonRow>

          <Section title="State">
            <BoolRow label="isActive" value={wl.isActive()} />
            <StatRow label="type" value={wl.type() ?? "—"} />
          </Section>

          <div
            style={{
              padding: "0.65rem 0.9rem",
              background: colors.surface,
              "border-radius": "6px",
              "font-size": font.sizeSm,
              color: colors.muted,
            }}
          >
            Switching tabs will release this lock and it will <strong>not</strong> be automatically
            re-acquired.
          </div>
        </Show>
      </Container>
    );
  },
});

export const ConditionalLock = meta.story({
  name: "createWakeLock — conditional via signal",
  parameters: {
    docs: {
      description: {
        story:
          'A common pattern: tie the wake lock to application state. Here a "Playing" toggle ' +
          "drives `request` and `release` so the screen stays on only while content is active.",
      },
    },
  },
  render: () => {
    const wl = createWakeLock();
    const [playing, setPlaying] = createSignal(false);

    const toggle = async () => {
      const next = !playing();
      setPlaying(next);
      if (next) {
        await wl.request();
      } else {
        await wl.release();
      }
    };

    return (
      <Container width={340}>
        <Show
          when={wl.isSupported}
          fallback={
            <p style={{ color: colors.muted, "font-size": font.sizeSm }}>
              Wake Lock API not supported.
            </p>
          }
        >
          <ButtonRow>
            <Button onClick={toggle} variant={playing() ? "primary" : "outline"}>
              {playing() ? "⏸ Pause" : "▶ Play"}
            </Button>
          </ButtonRow>

          <Section title="State">
            <BoolRow label="playing" value={playing()} />
            <BoolRow label="isActive (lock)" value={wl.isActive()} />
          </Section>

          <div
            style={{
              "font-size": font.sizeSm,
              color: colors.muted,
            }}
          >
            The wake lock is held while playing and released when paused.
          </div>
        </Show>
      </Container>
    );
  },
});
