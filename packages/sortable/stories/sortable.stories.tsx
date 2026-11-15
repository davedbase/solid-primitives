import { createSignal, createEffect, createMemo, For } from "solid-js";
import preview from "../../../.storybook/preview.js";
import {
  createSorted,
  createSortedIndex,
  createSortedProjection,
  insertSorted,
  by,
  combine,
  reverse,
  descending,
} from "../src/index.js";
import readme from "../README.md?raw";
import { Badge, Button, ButtonRow, Container, Section } from "../../../.storybook/ui/index.js";

type Player = { id: number; name: string; score: number };

const NAMES = ["Ada", "Grace", "Alan", "Linus", "Barbara", "Margaret"];

function randomScore() {
  return Math.floor(Math.random() * 100);
}

const meta = preview.meta({
  title: "Reactivity/Sortable",
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

export const GranularRankTracking = meta.story({
  name: "Granular rank tracking",
  parameters: {
    docs: {
      description: {
        story:
          "`createSortedIndex` gives each row a per-item reactive rank, built on `mapArray`'s keyed diff. Click the button to randomize a single row's score — only the row(s) whose rank actually changes flashes, not the whole leaderboard.",
      },
    },
  },
  render: () => {
    const [players, setPlayers] = createSignal<Player[]>(
      NAMES.map((name, id) => ({ id, name, score: randomScore() })),
    );
    const sorted = createSorted(
      players,
      by((p: Player) => p.score, descending),
    );
    const indexOf = createSortedIndex(
      players,
      by((p: Player) => p.score, descending),
    );

    const [flashed, setFlashed] = createSignal<ReadonlySet<number>>(new Set());

    const shuffleOne = () => {
      const list = players();
      const target = list[Math.floor(Math.random() * list.length)]!;
      setPlayers(list.map(p => (p.id === target.id ? { ...p, score: randomScore() } : p)));
    };

    return (
      <Container width={320}>
        <ButtonRow>
          <Button onClick={shuffleOne}>Randomize one score</Button>
        </ButtonRow>
        <Section title="Leaderboard">
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
            <For each={sorted()}>
              {player => {
                const rank = indexOf(player);

                createEffect(
                  () => rank(),
                  () => {
                    setFlashed(prev => new Set(prev).add(player.id));
                    const timer = setTimeout(() => {
                      setFlashed(prev => {
                        const next = new Set(prev);
                        next.delete(player.id);
                        return next;
                      });
                    }, 600);
                    return () => clearTimeout(timer);
                  },
                  { defer: true },
                );

                return (
                  <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                    <Badge variant={flashed().has(player.id) ? "success" : "default"}>
                      #{rank() + 1}
                    </Badge>
                    <span>{player.name}</span>
                    <span style={{ "margin-left": "auto", opacity: "0.6" }}>{player.score}</span>
                  </div>
                );
              }}
            </For>
          </div>
        </Section>
      </Container>
    );
  },
});

type Product = { id: number; category: string; name: string; price: number };

const PRODUCTS: Product[] = [
  { id: 1, category: "Fruit", name: "Apple", price: 1.2 },
  { id: 2, category: "Fruit", name: "Banana", price: 0.5 },
  { id: 3, category: "Veg", name: "Carrot", price: 0.8 },
  { id: 4, category: "Veg", name: "Potato", price: 0.3 },
  { id: 5, category: "Dairy", name: "Milk", price: 2.5 },
  { id: 6, category: "Dairy", name: "Cheese", price: 4.0 },
];

export const MultiColumnSort = meta.story({
  name: "Multi-column sort",
  parameters: {
    docs: {
      description: {
        story:
          "`combine` chains comparators so a later one breaks ties left by an earlier one. Category is always the primary key here; toggling the button swaps the price comparator (the tie-breaker) between ascending and `reverse`d, without touching the category ordering at all.",
      },
    },
  },
  render: () => {
    const [priceDesc, setPriceDesc] = createSignal(false);
    const comparator = createMemo(() => {
      const byPrice = by((p: Product) => p.price);
      return combine(
        by((p: Product) => p.category),
        priceDesc() ? reverse(byPrice) : byPrice,
      );
    });
    const sorted = createSorted(() => PRODUCTS, comparator);

    return (
      <Container width={340}>
        <ButtonRow>
          <Button onClick={() => setPriceDesc(v => !v)}>
            Price: {priceDesc() ? "High → Low" : "Low → High"}
          </Button>
        </ButtonRow>
        <Section title="Products (category, then price)">
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.3rem" }}>
            <For each={sorted()}>
              {p => (
                <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                  <Badge>{p.category}</Badge>
                  <span>{p.name}</span>
                  <span style={{ "margin-left": "auto", opacity: "0.6" }}>
                    ${p.price.toFixed(2)}
                  </span>
                </div>
              )}
            </For>
          </div>
        </Section>
      </Container>
    );
  },
});

type Task = { id: number; label: string; order: number };

function initialTasks(): Task[] {
  return ["Design", "Build", "Test", "Ship"].map((label, order) => ({ id: order, label, order }));
}

export const DragToReorder = meta.story({
  name: "Drag to reorder",
  parameters: {
    docs: {
      description: {
        story:
          "A lightweight drag-and-drop list backed by `createSortedProjection`, sorted by each row's `order` field. Dropping a row only reassigns `order` on the rows between its old and new position — the store's keyed reconcile (by `id`) means every untouched row keeps its DOM node and reactive identity across the drop, not just its data.",
      },
    },
  },
  render: () => {
    const [tasks, setTasks] = createSignal<Task[]>(initialTasks());
    const sorted = createSortedProjection(
      tasks,
      by((t: Task) => t.order),
      "id",
    );

    let draggedId: number | null = null;

    const onDrop = (targetId: number) => {
      if (draggedId === null || draggedId === targetId) return;
      const current = tasks();
      const from = current.findIndex(t => t.id === draggedId);
      const to = current.findIndex(t => t.id === targetId);
      const reordered = current.slice();
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved!);
      setTasks(reordered.map((t, order) => (t.order === order ? t : { ...t, order })));
      draggedId = null;
    };

    return (
      <Container width={280}>
        <Section title="Drag rows to reorder">
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
            <For each={sorted}>
              {task => (
                <div
                  draggable="true"
                  onDragStart={() => (draggedId = task.id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(task.id)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    "border-radius": "0.5rem",
                    background: "rgba(148, 163, 184, 0.15)",
                    cursor: "grab",
                    "user-select": "none",
                  }}
                >
                  ⠿ {task.label}
                </div>
              )}
            </For>
          </div>
        </Section>
      </Container>
    );
  },
});

type Score = { id: number; player: string; points: number };

const PLAYERS = ["Nova", "Kai", "Zed", "Mira", "Rex"];
let nextScoreId = 0;

function randomScoreEntry(): Score {
  return {
    id: nextScoreId++,
    player: PLAYERS[Math.floor(Math.random() * PLAYERS.length)]!,
    points: Math.floor(Math.random() * 1000),
  };
}

export const LiveSortedFeed = meta.story({
  name: "Live sorted feed",
  parameters: {
    docs: {
      description: {
        story:
          '`insertSorted` places each incoming score at its correct position with a binary search — an O(log n) search plus an O(n) copy — instead of re-sorting the whole feed on every arrival. Click "Add score" a few times to watch new entries drop straight into place.',
      },
    },
  },
  render: () => {
    const byPointsDesc = by((s: Score) => s.points, descending);
    const [scores, setScores] = createSignal<Score[]>(
      Array.from({ length: 5 }, randomScoreEntry).sort(byPointsDesc),
    );

    const addScore = () => setScores(prev => insertSorted(prev, randomScoreEntry(), byPointsDesc));

    return (
      <Container width={280}>
        <ButtonRow>
          <Button onClick={addScore}>Add score</Button>
        </ButtonRow>
        <Section title="High scores">
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.3rem" }}>
            <For each={scores()}>
              {(s, i) => (
                <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                  <Badge variant={i() === 0 ? "success" : "default"}>#{i() + 1}</Badge>
                  <span>{s.player}</span>
                  <span style={{ "margin-left": "auto", opacity: "0.6" }}>{s.points}</span>
                </div>
              )}
            </For>
          </div>
        </Section>
      </Container>
    );
  },
});
