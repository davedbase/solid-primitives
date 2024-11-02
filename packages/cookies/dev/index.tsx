import { Component } from "solid-js";
import { createUserTheme } from "../src/index.js";

const App: Component = () => {
  const [theme, setTheme] = createUserTheme();
  const increment = () => setTheme(theme() === "light" ? "dark" : "light");
  return (
    <div class={`min-h-screen ${"dark" == "dark" ? "dark" : ""}`}>
      <div class="box-border flex min-h-screen w-full flex-col items-center justify-center space-y-4 bg-gray-800 p-24 text-white">
        <div class="wrapper-v">
          <h4>Counter component</h4>
          <p class="caption">it's very important...</p>
          <button class="btn" onClick={increment}>
            {theme()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
