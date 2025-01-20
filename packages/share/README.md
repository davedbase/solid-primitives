<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Share" alt="Solid Primitives Share">
</p>

# @solid-primitives/share

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/share?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/share)
[![size](https://img.shields.io/npm/v/@solid-primitives/share?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/share)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Primitives for supporting sharing of resources on social media and beyond.

- [`createSocialShare`](#createsocialshare) - A primitive for sharing on social media and beyond.
- [`makeWebShare`](#makewebshare) - Generates a simple non-reactive WebShare primitive for sharing.
- [`createWebShare`](#createwebshare) - Creates a reactive status about web share.

## Installation

```
npm install @solid-primitives/share
# or
yarn add @solid-primitives/share
# or
pnpm add @solid-primitives/share
```

## `createSocialShare`

### How to use it

```ts
import { createSocialShare, TWITTER } from "@solid-primitives/share";

const [share, close] = createSocialShare(() => ({
  title: "SolidJS.com",
  url: "https://www.solidjs.com",
  description: "Simple and well-behaved reactivity!",
}));
share(TWITTER);
```

### Definition

```ts
function createSocialShare(
  options: Accessor<{
    network?: Network;
    url: string;
    title: string;
    description: string;
    quote?: string;
    hashtags?: string;
    twitterUser?: string;
    media?: string;
    tag?: string;
    popup?: SharePopupOptions;
  }>,
  controller: Window = window,
): [share: (network: Network | undefined) => void, close: () => void, isSharing: Accessor<boolean>];
```

### Network List

The following are a list of supported networks that may be imported from the share package.

| Network       | `url`              | `title`            | `description`      | Extras/Comments                                                                                             |
| ------------- | ------------------ | ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Baidu         | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Buffer        | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Email         | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| EverNote      | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Facebook      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | `hashtags` A list of comma-separated hashtags, only the first one will be used.<br/>`quote` Facebook quote. |
| FlipBoard     | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| HackerNews    | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| InstaPaper    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| Line          | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| LinkedIn      | :heavy_check_mark: | :x:                | :x:                |                                                                                                             |
| Messenger     | :heavy_check_mark: | :x:                | :x:                |                                                                                                             |
| Odnoklassniki | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Pinterest     | :heavy_check_mark: | :heavy_check_mark: | :x:                | `media` URL of an image describing the content.                                                             |
| Pocket        | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Reddit        | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Skype         | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| SMS           | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| StumbleUpon   | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Telegram      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| Tumblr        | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| Twitter       | :heavy_check_mark: | :heavy_check_mark: | :x:                | `hashtags` A list of comma-separated hashtags.<br/>`twitter-user` Twitter user to mention.                  |
| Viber         | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| VK            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | `media` URL of an image describing the content.                                                             |
| Weibo         | :heavy_check_mark: | :heavy_check_mark: | :x:                | `media` URL of an image describing the content.                                                             |
| WhatsApp      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |
| Wordpress     | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | `media` URL of an image describing the content.                                                             |
| Xing          | :heavy_check_mark: | :heavy_check_mark: | :x:                |                                                                                                             |
| Yammer        | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |                                                                                                             |

For the networks: `Line`, `Skype`, `SMS`, `Telegram`, `Viber`, `WhatsApp` and `Yammer`; the shared content is a string of the form: "`$title` `$url` `$description`"

Note that you can also provide your own custom network by formatting the input string into the share function. The following is a list of properties that will be replaced by the utility:

- `@u`: URL
- `@t`: Title
- `@d`: Description
- `@q`: Quote
- `@h`: Hashtags
- `@m`: Media
- `@tu`: TwitterUser (Twitter specific)

The following is an example of Twitter's share string:

```ts
const twitter: Network = "https://twitter.com/intent/tweet?text=@t&url=@u&hashtags=@h@tu";
```

### Demo

You may view a working example [here on Stackblitz](https://stackblitz.com/edit/vitejs-vite-vz1yr8?file=src/App.tsx).

### Acknowledgements

A portion of this primitive was built from https://github.com/nicolasbeauvais/vue-social-sharing/blob/master/src/share-network.js.

## `makeWebShare`

Generates a simple non-reactive WebShare primitive for sharing. Uses the [WebShare API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).

### How to use it

```ts
import { makeWebShare } from "@solid-primitives/share";

const share = makeWebShare();

try {
  await share({ url: "https://solidjs.com" });
} catch (e) {
  console.log(e);
}
```

## `createWebShare`

Creates a reactive status about web share. Uses the [WebShare API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).

### How to use it

```ts
import { createWebShare } from "@solid-primitives/share";

const [data, setData] = createSignal<ShareData>({});
const shareStatus = createWebShare(data);

createEffect(() => {
  console.log(shareStatus.status, shareStatus.message);
});
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
