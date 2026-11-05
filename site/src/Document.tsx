import { getFontPreloadLinkAttrs } from "@kobalte/solidbase/default-theme/fonts.js";
import { getHtmlProps } from "@kobalte/solidbase/server";
import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";

// Document shell for @solidjs/vite-plugin start mode: the app arrives as children and the
// client entry script is injected into <head> automatically.
export default function Document(props: ParentProps) {
  return (
    <html {...getHtmlProps()}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {getFontPreloadLinkAttrs().map(attrs => (
          <link {...attrs} />
        ))}
        <link rel="icon" href={`${import.meta.env.BASE_URL}favicons/favicon.ico`} />
        <HydrationScript />
      </head>
      <body>
        <div id="app">{props.children}</div>
      </body>
    </html>
  );
}
