import { createMemo, createSignal, isPending, Loading } from "solid-js";
import type { JSX } from "@solidjs/web";
import preview from "../../../.storybook/preview.js";
import * as i18n from "@solid-primitives/i18n";
import readme from "../README.md?raw";
import {
  Badge,
  Button,
  ButtonRow,
  Card,
  colors,
  Container,
  EventLog,
  font,
  Section,
  Separator,
  StatRow,
  TextField,
} from "../../../.storybook/ui/index.js";

const meta = preview.meta({
  title: "Utilities/i18n",
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

const en_raw = {
  greeting: i18n.template<{ name: string }>("Hello, {{ name }}!"),
  farewell: ({ name }: { name: string }) => `Goodbye, ${name}!`,
  food: { meat: "meat", fruit: "fruit" },
};

type RawDict = typeof en_raw;
type Locale = "en" | "fr" | "es";

const staticDicts: Record<Locale, RawDict> = {
  en: en_raw,
  fr: {
    greeting: "Bonjour, {{ name }} !" as any,
    farewell: ({ name }: { name: string }) => `Au revoir, ${name} !`,
    food: { meat: "viande", fruit: "fruit" },
  },
  es: {
    greeting: "¡Hola, {{ name }}!" as any,
    farewell: ({ name }: { name: string }) => `¡Adiós, ${name}!`,
    food: { meat: "carne", fruit: "fruta" },
  },
};

function LocaleSwitcher(props: { locale: Locale; onChange: (locale: Locale) => void }) {
  const localeLabel = () =>
    props.locale === "en" ? "English" : props.locale === "fr" ? "Français" : "Español";

  return (
    <>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
        }}
      >
        <span style={{ "font-size": font.sizeSm, color: colors.muted }}>Active locale</span>
        <Badge variant="info">{localeLabel()}</Badge>
      </div>

      <ButtonRow>
        <Button
          variant={props.locale === "en" ? "primary" : "outline"}
          onClick={() => props.onChange("en")}
        >
          English
        </Button>
        <Button
          variant={props.locale === "fr" ? "primary" : "outline"}
          onClick={() => props.onChange("fr")}
        >
          Français
        </Button>
        <Button
          variant={props.locale === "es" ? "primary" : "outline"}
          onClick={() => props.onChange("es")}
        >
          Español
        </Button>
      </ButtonRow>
    </>
  );
}

export const TranslatorStory = meta.story({
  name: "Locale Switching with Static Dictionaries",
  parameters: {
    docs: {
      description: {
        story:
          "`translator(dict, resolveTemplate)` returns a type-safe `t()` function. Locale switching happens by swapping the reactive dict signal — no re-creation needed. Supports `{{ placeholder }}` template strings, function values called with provided arguments, and nested keys via dot notation.",
      },
    },
  },
  render: () => {
    const [locale, setLocale] = createSignal<Locale>("en");
    const [name, setName] = createSignal("World");

    const dict = createMemo(() => i18n.flatten(staticDicts[locale()]));
    const t = i18n.translator(dict, i18n.resolveTemplate);

    return (
      <Container width={400}>
        <LocaleSwitcher locale={locale()} onChange={setLocale} />

        <TextField
          label="Name — substituted into template strings"
          value={name()}
          onChange={setName}
          placeholder="Enter a name"
        />

        <Card>
          <StatRow label='t("greeting", { name })' value={t("greeting", { name: name() })} />
          <Separator />
          <StatRow label='t("farewell", { name })' value={t("farewell", { name: name() })} />
          <Separator />
          <StatRow label='t("food.meat")' value={t("food.meat")} />
          <Separator />
          <StatRow label='t("food.fruit")' value={t("food.fruit")} />
        </Card>
      </Container>
    );
  },
});

async function simulateFetch(locale: Locale): Promise<i18n.Flatten<RawDict>> {
  await new Promise(r => setTimeout(r, 400));
  return i18n.flatten(staticDicts[locale]);
}

export const DynamicLoadingStory = meta.story({
  name: "Loading Dictionaries Asynchronously",
  parameters: {
    docs: {
      description: {
        story:
          "Pass an async `createMemo` to `translator()` to load dictionaries lazily. Wrap translated content in `<Loading>` to suspend until the first dictionary resolves. `isPending(dict)` inside the loaded content returns `true` during subsequent locale transitions — use it to dim the UI while the next dictionary fetches (simulated 400 ms delay).",
      },
    },
  },
  render: () => {
    const [locale, setLocale] = createSignal<Locale>("en");
    const [name, setName] = createSignal("World");

    const dict = createMemo(async () => simulateFetch(locale()));
    const t = i18n.translator(dict, i18n.resolveTemplate);

    return (
      <Container width={400}>
        <ButtonRow>
          <Button
            variant={locale() === "en" ? "primary" : "outline"}
            onClick={() => setLocale("en")}
          >
            English
          </Button>
          <Button
            variant={locale() === "fr" ? "primary" : "outline"}
            onClick={() => setLocale("fr")}
          >
            Français
          </Button>
          <Button
            variant={locale() === "es" ? "primary" : "outline"}
            onClick={() => setLocale("es")}
          >
            Español
          </Button>
        </ButtonRow>

        <TextField label="Name" value={name()} onChange={setName} placeholder="Enter a name" />

        <Loading
          fallback={
            <Card>
              <span style={{ color: colors.muted, "font-size": font.sizeBase }}>
                Loading dictionary…
              </span>
            </Card>
          }
        >
          <div style={{ opacity: isPending(dict) ? 0.5 : 1, transition: "opacity 0.15s" }}>
            <Card>
              <StatRow label="greeting" value={String(t("greeting", { name: name() }) ?? "")} />
              <Separator />
              <StatRow label="farewell" value={String(t("farewell", { name: name() }) ?? "")} />
              <Separator />
              <StatRow label="food.meat" value={String(t("food.meat") ?? "")} />
            </Card>
          </div>
        </Loading>
      </Container>
    );
  },
});

const moduleDict = {
  nav: {
    home: "Home",
    about: "About",
    contact: "Contact",
  },
  auth: {
    login: "Log in",
    logout: "Log out",
    welcome: i18n.template<{ user: string }>("Welcome, {{ user }}!"),
  },
};

const flatModuleDict = i18n.flatten(moduleDict);

export const ScopedChainedStory = meta.story({
  name: "Module Scoping & Object-Style Key Access",
  parameters: {
    docs: {
      description: {
        story:
          '`scopedTranslator(t, scope)` narrows a translator to a key prefix — useful for component-local scopes. `chainedTranslator(dict, t)` maps the dictionary shape to callable methods, enabling IDE "Go to definition" on translation keys. `proxyTranslator(t)` achieves the same via `Proxy` without needing the original dictionary object.',
      },
    },
  },
  render: () => {
    const [user, setUser] = createSignal("Alice");

    const t = i18n.translator(() => flatModuleDict, i18n.resolveTemplate);
    const nav = i18n.scopedTranslator(t, "nav");
    const auth = i18n.scopedTranslator(t, "auth");
    const chained = i18n.chainedTranslator(moduleDict, t);
    const proxy = i18n.proxyTranslator(t);

    return (
      <Container width={430}>
        <TextField
          label="User name — used in the welcome template"
          value={user()}
          onChange={setUser}
          placeholder="Enter name"
        />

        <Section title="scopedTranslator">
          <Card>
            <StatRow label='nav("home")' value={String(nav("home") ?? "")} />
            <Separator />
            <StatRow
              label='auth("welcome", { user })'
              value={String(auth("welcome", { user: user() }) ?? "")}
            />
          </Card>
        </Section>

        <Section title="chainedTranslator">
          <Card>
            <StatRow label="chained.nav.home()" value={chained.nav.home()} />
            <Separator />
            <StatRow
              label="chained.auth.welcome({ user })"
              value={chained.auth.welcome({ user: user() })}
            />
          </Card>
        </Section>

        <Section title="proxyTranslator">
          <Card>
            <StatRow label="proxy.nav.home()" value={proxy.nav.home()} />
            <Separator />
            <StatRow
              label="proxy.auth.welcome({ user })"
              value={proxy.auth.welcome({ user: user() })}
            />
          </Card>
        </Section>
      </Container>
    );
  },
});

const Link = (props: { onClick: () => void; children: JSX.Element }) => (
  <a
    href="#"
    onClick={e => {
      e.preventDefault();
      props.onClick();
    }}
    style={{ color: colors.primary, "text-decoration": "underline", cursor: "pointer" }}
  >
    {props.children}
  </a>
);

const richDicts = {
  en: {
    clickHere: "click here",
    info: "For more information, {{ clickHere }}.",
    terms:
      "By continuing, you agree to our <terms>Terms of Service</terms> and <privacy>Privacy Policy</privacy>.",
  },
  fr: {
    clickHere: "cliquez ici",
    info: "Pour plus d'informations, {{ clickHere }}.",
    terms:
      "En continuant, vous acceptez nos <terms>Conditions d'utilisation</terms> et notre <privacy>Politique de confidentialité</privacy>.",
  },
  es: {
    clickHere: "haga clic aquí",
    info: "Para más información, {{ clickHere }}.",
    terms:
      "Al continuar, aceptas nuestros <terms>Términos de servicio</terms> y nuestra <privacy>Política de privacidad</privacy>.",
  },
} satisfies Record<Locale, Record<string, string>>;

export const RichTextStory = meta.story({
  name: "Embedding Links & Components in Translations",
  parameters: {
    docs: {
      description: {
        story:
          "`resolveRichTemplate` accepts JSX — not just strings — as `{{ placeholder }}` values, returning JSX instead of a plain string as soon as one is used. `richText(string, tags)` resolves `<tag>content</tag>` markup, resolved separately via `resolveTemplate`, into JSX by calling a renderer for each tag name. Both splice real, interactive Solid components into a translated string, reactively across locales — click a link below to fire its handler.",
      },
    },
  },
  render: () => {
    const [locale, setLocale] = createSignal<Locale>("en");
    const [log, setLog] = createSignal<{ label: string; time: string }[]>([]);
    const logClick = (label: string) =>
      setLog(prev => [{ label, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 6));

    const dict = createMemo(() => richDicts[locale()]);
    const richT = i18n.translator(dict, i18n.resolveRichTemplate);
    const plainT = i18n.translator(dict, i18n.resolveTemplate);

    return (
      <Container width={430}>
        <LocaleSwitcher locale={locale()} onChange={setLocale} />

        <Section title="resolveRichTemplate — JSX as a template argument">
          <Card>
            <p style={{ margin: 0, "font-size": font.sizeBase }}>
              {richT("info", {
                clickHere: (
                  <Link onClick={() => logClick(`clicked: ${plainT("clickHere")}`)}>
                    {plainT("clickHere")}
                  </Link>
                ),
              })}
            </p>
          </Card>
        </Section>

        <Section title="richText — <tag> markup mapped to components">
          <Card>
            <p style={{ margin: 0, "font-size": font.sizeBase }}>
              {i18n.richText(plainT("terms"), {
                terms: text => <Link onClick={() => logClick(`clicked: ${text}`)}>{text}</Link>,
                privacy: text => <Link onClick={() => logClick(`clicked: ${text}`)}>{text}</Link>,
              })}
            </p>
          </Card>
        </Section>

        <Section title="Event log">
          <EventLog entries={log()} />
        </Section>
      </Container>
    );
  },
});
