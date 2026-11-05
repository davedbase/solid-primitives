import solid from "@solidjs/vite-plugin";
import { createSolidBase } from "@kobalte/solidbase/config";
import defaultTheme from "@kobalte/solidbase/default-theme";
import { defineConfig } from "vite";
import { sidebar } from "./src/generated/sidebar";

const solidBase = createSolidBase(defaultTheme);

export default defineConfig({
  // SolidBase's theme depends on pinned @solid-primitives/*@next releases. Left external, the
  // prerender worker would resolve `@solid-primitives/utils` up the tree to a different copy
  // (the workspace's), so bundle them into the server build.
  ssr: { noExternal: [/^@solid-primitives\//] },
  plugins: [
    solidBase.plugin({
      title: "Solid Primitives 2",
      titleTemplate: ":title | Solid Primitives 2",
      description: "High-quality reactive primitives for building applications in Solid2",
      // Base/fallback src — app.css swaps the actual rendered image per data-theme.
      logo: "/logo-light.png",
      lastUpdated: false,
      themeConfig: {
        // We ship Geist ourselves via app.css instead of the theme's bundled fonts.
        fonts: {
          inter: false,
          lexend: false,
          jetbrainsMono: false,
        },
        socialLinks: {
          github: "https://github.com/solidjs-community/solid-primitives",
          discord: "https://discord.com/invite/solidjs",
        },
        nav: [
          { text: "Guide", link: "/" },
          { text: "Primitives", link: "/primitives" },
          { text: "Philosophy", link: "/philosophy" },
          { text: "JSR & NPM", link: "/jsr-npm" },
          { text: "Contributors", link: "/contributors" },
          { text: "Security", link: "/security" },
          { text: "Migration", link: "/migration" },
        ],
        sidebar: {
          "/": sidebar,
        },
      },
    }),
    // start mode (SSR + static prerender into dist/client) replaces SolidStart + Nitro.
    solid(solidBase.startConfig()),
  ],
});
