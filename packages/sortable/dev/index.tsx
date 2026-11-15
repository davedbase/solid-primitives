import { type Component, createSignal } from "solid-js";
import { For } from "@solidjs/web";
import { createSorted, createSortedIndex, by, descending } from "../src/index.js";

type Player = { id: number; name: string; score: number };

const NAMES = ["Ada", "Grace", "Alan", "Linus", "Barbara", "Margaret"];

function randomScore() {
  return Math.floor(Math.random() * 100);
}

const App: Component = () => {
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

  const shuffleOne = () => {
    const list = players();
    const target = list[Math.floor(Math.random() * list.length)]!;
    setPlayers(list.map(p => (p.id === target.id ? { ...p, score: randomScore() } : p)));
  };

  return (
    <div class="box-border flex min-h-screen w-full flex-col items-center justify-center space-y-4 bg-gray-800 p-24 text-white">
      <div class="wrapper-v">
        <h4>Sortable Primitive</h4>
        <p class="caption">Leaderboard sorted by score — each row tracks its own rank</p>
        <button class="btn" onClick={shuffleOne}>
          Randomize one score
        </button>
        <ul>
          <For each={sorted()}>
            {player => (
              <li>
                #{indexOf(player)() + 1} — {player.name} ({player.score})
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default App;
