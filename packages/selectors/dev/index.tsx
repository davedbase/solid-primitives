import { Component, For, createSignal } from "solid-js";
import { createArraySelector } from "../src/index.js";

const items = [1, 2, 3];

const App: Component = () => {
  const [selectedItems, setSelectedItems] = createSignal<number[]>([]);
  const isSelected = createArraySelector(selectedItems);

  return (
    <>
      <For each={items}>
        {item => (
          <div>
            <input
              type="checkbox"
              checked={isSelected(item)}
              onChange={e => {
                const filtered = selectedItems().filter(i => i === item);
                if (e.currentTarget.checked) {
                  if (filtered.length === 0) {
                    setSelectedItems([...selectedItems(), item]);
                  }
                } else {
                  setSelectedItems(filtered);
                }
              }}
            />
            {item}
          </div>
        )}
      </For>
    </>
  );
};

export default App;
