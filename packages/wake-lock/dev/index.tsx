import { type Component, createSignal } from "solid-js";

const App: Component = () => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(count() + 1);

  return (
    <div class="box-border flex min-h-screen w-full flex-col items-center justify-center space-y-4 bg-gray-800 p-24 text-white">
      <div class="wrapper-v">
        <h4>Counter component</h4>
        <p class="caption">it's very important...</p>
        <button class="btn" onClick={increment}>
          {count()}
        </button>
      </div>
    </div>
  );
};

export default App;
