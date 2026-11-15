import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [solid()],

  // the demo imports the storage source from ../../src, so make sure both resolve one Solid copy
  resolve: { dedupe: ["solid-js", "@solidjs/web"] },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
