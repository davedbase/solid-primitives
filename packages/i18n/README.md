<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=I18n" alt="Solid Primitives I18n">
</p>

# @solid-primitives/i18n

[![size](https://img.shields.io/bundlephobia/minzip/@solid-primitives/i18n?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/i18n)
[![size](https://img.shields.io/npm/v/@solid-primitives/i18n?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/i18n)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-3.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)

Library of primitives for providing internationalization support.

## Installation

```bash
npm i @solid-primitives/i18n
# or
pnpm add @solid-primitives/i18n
# or
yarn add @solid-primitives/i18n
```

## How to use it

The library consists of multiple small and composable primitives that can be used together to create an internationalization solution that fits your needs.

### Defining dictionaries

Dictionary is any plain js object that contains translations for a given language. It can be nested and contain functions.

Dictionaries can be defined in inline in js, or imported from json files.

```ts
const en_dict = {
  hello: "hello {{ name }}, how are you?",
  goodbye: (name: string) => `goodbye ${name}`,
  food: {
    meat: "meat",
    fruit: "fruit",
  },
};

type Dict = typeof en_dict;

const fr_dict: Dict = {
  hello: "bonjour {{ name }}, comment vas-tu ?",
  goodbye: (name: string) => `au revoir ${name}`,
  food: {
    meat: "viande",
    fruit: "fruit",
  },
};
```

When using large dictionary files, JSON files are [faster to load](https://www.youtube.com/watch?v=ff4fgQxPaO0). Additionally, we recommend keeping a flat JSON structure so you don't need to flatten the object on the client for best performance.

### With `createResource`

Example of using `@solid-primitives/i18n` with `createResource` to dynamically load directories for selected languages.

```tsx
import * as i18n from "@solid-primitives/i18n";

/*
Assuming the dictionaries are in the following structure:
./i18n
  en.ts
  fr.ts
  es.ts
And all exports a `dict` object
*/

// use `type` to not include the actual dictionary in the bundle
import type * as en from "./i18n/en.js";

export type Locale = "en" | "fr" | "es";
export type RawDictionary = typeof en.dict;
export type Dictionary = i18n.Flatten<RawDictionary>;

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  const dict: RawDictionary = (await import(`./i18n/${locale}.ts`)).dict;
  return i18n.flatten(dict); // flatten the dictionary to make all nested keys available top-level
}

const App: Component = () => {
  const [locale, setLocale] = createSignal<Locale>("en");

  const [dict] = createResource(locale, fetchDictionary);

  dict(); // => Dictionary | undefined
  // (undefined when the dictionary is not loaded yet)

  const t = i18n.translator(dict);

  t("hello"); // => string | undefined

  return (
    <Suspense>
      <Show when={dict()}>
        {dict => {
          dict(); // => Dictionary (narrowed by Show)

          const t = i18n.translator(dict);

          t("hello"); // => string

          return (
            <div>
              <p>Current locale: {locale()}</p>
              <div>
                <button onClick={() => setLocale("en")}>English</button>
                <button onClick={() => setLocale("fr")}>French</button>
                <button onClick={() => setLocale("es")}>Spanish</button>
              </div>

              <h4>{t("hello", { name: "John" })}</h4>
              <h4>{t("goodbye", { name: "John" })}</h4>
              <h4>{t("food.meat")}</h4>
            </div>
          );
        }}
      </Show>
    </Suspense>
  );
};
```

### With initial dictionary

Instead of narrowing the current dictionary with `Show`, you can also provide an initial dictionary to `createResource`.

```ts
// en dictionary will be included in the bundle
import { dict as en_dict } from "./i18n/en.js";

const [dict] = createResource(locale, fetchDictionary, {
  initialValue: i18n.flatten(en_dict),
});

dict(); // => Dictionary
```

### With transitions

Since the dictionary is a resource, you can use solid's transitions when switching the locale.

```tsx
const [dict] = createResource(locale, fetchDictionary);

const [duringTransition, startTransition] = useTransition();

function switchLocale(locale: Locale) {
  startTransition(() => setLocale(locale));
}

return (
  <div style={{ opacity: duringTransition() ? 0.5 : 1 }}>
    <Suspense>
      <App />
    </Suspense>
  </div>
);
```

### Static dictionaries

If you don't need to load dictionaries dynamically, you can use `createMemo` instead of `createResource`.

```tsx
import * as en from "./i18n/en.js";
import * as fr from "./i18n/fr.js";
import * as es from "./i18n/es.js";

const dictionaries = {
  en: en.dict,
  fr: fr.dict,
  es: es.dict,
};

const [locale, setLocale] = createSignal<Locale>("en");

const dict = createMemo(() => i18n.flatten(dictionaries[locale()]));

const t = i18n.translator(dict);
```

### Templates

Templates are strings that can contain placeholders. Placeholders are defined with double curly braces `{{ placeholder }}`.

Templates can be resolved by calling `resolveTemplate` function. e.g.

```ts
i18n.resolveTemplate("hello {{ name }}!", { name: "John" }); // => 'hello John!'
```

By default, the `translator` function will not resolve templates. You can pass `resolveTemplate` as the second argument to `translator` to enable template resolution. Or use a custom template resolver.

```ts
const dict = {
  hello: "hello {{ name }}!",
};

const t1 = i18n.translator(() => dict);

t1("hello", { name: "John" }); // => 'hello {{ name }}!'

const t2 = i18n.translator(() => dict, i18n.resolveTemplate);

t2("hello", { name: "John" }); // => 'hello John!'
```

### Modules

Splitting the dictionary into multiple modules can be useful when you have a large dictionary and want to avoid loading the entire dictionary at once.

For example, if our app had a separate `login` and `dashboard` modules, we could split the dictionary into 3 modules: (`common`, `login` and `dashboard`).

```
i18n/
  en.json
  pl.json
modules/
  login/
    i18n/
      en.json
      pl.json
    login.ts
  ...
root.ts
```

Translations in `root.ts` would be available in all modules. Translations in `login.ts` would be available only in `login` module, and the same for other modules.

```ts
// root.ts

const [locale, setLocale] = createSignal<Locale>("en");
const [commonDict] = createResource(locale, fetchCommonDictionary);
const t = i18n.translator(commonDict);

// login/login.ts

const [loginDict] = createResource(locale, fetchLoginDictionary);

// translator only for login module
const loginT = i18n.translator(loginDict);

t("welcome"); // => 'Welcome from common translations!'
loginT("welcome"); // => 'Welcome from login translations!'
```

Or combine multiple dictionaries into one. While prefixing the keys with the module name.

```ts
const combined_dict = createMemo(() => ({
  ...i18n.prefix(commonDict(), "common"),
  ...i18n.prefix(loginDict(), "login"),
}));

const t = i18n.translator(combined_dict);

t("common.welcome"); // => 'Welcome from common translations!'
t("login.welcome"); // => 'Welcome from login translations!'
```

To scope an existing translator to a module, you can use `scopedTranslator`.

```ts
const dict = {
  "login.username": "User name",
  "login.password": "Password",
  "login.login": "Login",
  // ...
};

const t = i18n.translator(() => dict);

const loginT = i18n.scopedTranslator(t, "login");

loginT("username"); // => 'User name'
```

### Nested objects syntax

String paths passesd to the translator don't allow for taking advantage of TypeScript's "Go to definition", and "Find all references", "Rename" features.

If you prefer to use nested objects instead of dot notation, you can use `chainedTranslator` helper.

It takes a dictionary _(not flattened)_ to map it's shape and a translator function for resolving the translations.

```ts
const dict = {
  greetings: {
    hello: "hello {{ name }}!",
    hi: "hi!",
  },
  goodbye: (name: string) => `goodbye ${name}!`,
};
const flat_dict = i18n.flatten(dict);

const t = i18n.translator(() => flat_dict, i18n.resolveTemplate);

const chained = i18n.chainedTranslator(dict, t);

chained.greetings.hello({ name: "John" }); // => "hello John!"
chained.greetings.hi(); // => "hi!"
chained.goodbye("John"); // => "goodbye John!"
```

Alternatively you can use `proxyTranslator` that is implemented using `new Proxy` so it doesn't require a directory object to be passed as source.

```ts
const proxy = i18n.proxyTranslator(t);

proxy.greetings.hello({ name: "John" }); // => "hello John!"
proxy.greetings.hi(); // => "hi!"
proxy.goodbye("John"); // => "goodbye John!"
```

Using a proxy will have a slight performance impact, so it's recommended to use `chainedTranslator` if possible. But it can be useful when you don't have access to the dictionary object. Or want to mock the translations in tests.

```ts
const proxy = i18n.proxyTranslator(path => path);

proxy.greetings.hello({ name: "John" }); // => "greetings.hello"
proxy.greetings.hi(); // => "greetings.hi"
proxy.goodbye("John"); // => "goodbye"
```

## Demo

[Live example](https://primitives.solidjs.community/playground/i18n) | [Source code](https://github.com/solidjs-community/solid-primitives/blob/main/packages/i18n/dev/index.tsx)

the i18n package is also being used in solidjs.com, you can see the source code [here](https://github.com/solidjs/solid-site/blob/main/src/AppContext.tsx)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
