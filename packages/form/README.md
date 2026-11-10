<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Primitives&background=tiles&project=Form" alt="Solid Primitives Form">
</p>

# @solid-primitives/form

[![size](https://img.shields.io/badge/size-2.73_kB-blue?style=for-the-badge)](https://bundlephobia.com/package/@solid-primitives/form)
[![size](https://img.shields.io/npm/v/@solid-primitives/form?style=for-the-badge)](https://www.npmjs.com/package/@solid-primitives/form)
[![stage](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolidjs-community%2Fsolid-primitives%2Fmain%2Fassets%2Fbadges%2Fstage-0.json)](https://github.com/solidjs-community/solid-primitives#contribution-process)
[![tested with vitest](https://img.shields.io/badge/tested_with-vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev)

Reactive form primitive for Solid.js. Tracks field values, validation errors, touched state, and submission status — all as fine-grained signals that compose naturally with the rest of the Solid reactive graph.

Bring your own validation: validators are plain functions `(value) => string | null | Promise<string | null>`, so any schema library (Zod, Valibot, Arktype, …) wires in with a one-line adapter. Async validators (uniqueness checks, server-side rules) are first-class.

## Installation

```
npm install @solid-primitives/form
# or
yarn add @solid-primitives/form
# or
pnpm add @solid-primitives/form
```

## `createForm`

Creates a reactive form with per-field signals, derived validity state, and helpers for binding fields to DOM inputs.

```tsx
import { createForm } from "@solid-primitives/form";

function LoginForm() {
  const form = createForm({
    fields: {
      email: { initial: "", validate: isEmail },
      password: { initial: "", validate: [minLength(8), hasUppercase] },
    },
    onSubmit: async values => {
      await api.login(values);
    },
  });

  return (
    <form ref={form.ref}>
      <input ref={form.bind("email")} type="email" />
      <Show when={form.fields.email.touched()}>
        <span>{form.fields.email.error()}</span>
      </Show>

      <input ref={form.bind("password")} type="password" />
      <Show when={form.fields.password.touched()}>
        <span>{form.fields.password.error()}</span>
      </Show>

      <button type="submit" disabled={!form.valid() || form.submitting()}>
        {form.submitting() ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

### Configuration

`createForm` accepts a config object:

| Property     | Type                                | Description                                                                 |
| ------------ | ----------------------------------- | --------------------------------------------------------------------------- |
| `fields`     | `Record<string, FieldConfig>`       | Field definitions (see below)                                               |
| `onSubmit`   | `(values) => void \| Promise<void>` | Called with all field values when the form submits and all fields are valid |
| `validateOn` | `"change" \| "blur" \| "submit"`    | Default display timing for field errors. Defaults to `"change"`.            |

**`FieldConfig`**

| Property     | Type                             | Description                                                                               |
| ------------ | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `initial`    | `V`                              | Initial value for the field                                                               |
| `validate`   | `ValidatorFn \| ValidatorFn[]`   | One or more validator functions. Validators run in order; the first failure is the error. |
| `validateOn` | `"change" \| "blur" \| "submit"` | When to display this field's error in the UI. Overrides the form-level `validateOn`.      |

A **`ValidatorFn`** is any function with the signature `(value: V) => string | null | Promise<string | null>` — returning an error message string on failure, `null` when valid, or a Promise that resolves to either.

### Per-field API

Each entry in `form.fields` exposes:

| Member          | Type                              | Description                                                                                              |
| --------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `value()`       | `Accessor<V>`                     | Current field value                                                                                      |
| `error()`       | `Accessor<string \| null>`        | First validation error, or `null` if valid. Respects `validateOn`.                                       |
| `touched()`     | `Accessor<boolean>`               | Whether the field has been blurred                                                                       |
| `pending()`     | `Accessor<boolean>`               | `true` while an async validator is in flight for this field                                              |
| `setValue(v)`   | `(v: V) => void`                  | Imperatively set the value                                                                               |
| `setTouched(v)` | `(v: boolean) => void`            | Imperatively set the touched flag                                                                        |
| `setError(msg)` | `(error: string \| null) => void` | Inject an external error (e.g. from a server response). Cleared automatically when `setValue` is called. |
| `reset()`       | `() => void`                      | Reset this field to its initial value and clear touched                                                  |

### Form-level API

| Member                | Type                                    | Description                                                                                                                                                                                                                                                                              |
| --------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dirty()`             | `Accessor<boolean>`                     | `true` when any field differs from its initial value                                                                                                                                                                                                                                     |
| `valid()`             | `Accessor<boolean>`                     | `true` when all fields pass validation and no async validators are pending                                                                                                                                                                                                               |
| `pending()`           | `Accessor<boolean>`                     | `true` while any field has an async validator in flight                                                                                                                                                                                                                                  |
| `submitting()`        | `Accessor<boolean>`                     | `true` while `onSubmit` is in flight                                                                                                                                                                                                                                                     |
| `submitted()`         | `Accessor<boolean>`                     | `true` after the first submit attempt; reset by `reset()`                                                                                                                                                                                                                                |
| `values()`            | `Accessor<Values>`                      | Plain object of all current field values                                                                                                                                                                                                                                                 |
| `errors()`            | `Accessor<Partial<Record<...>>>`        | Object containing only **field-level** errors (always reflects true validity, regardless of `validateOn`). Cross-field errors registered via `validate()` are not included — access those through the accessor each `validate()` call returns.                                           |
| `bind(name)`          | Ref directive factory                   | Wires an `<input>` or `<select>` to the named field (see below)                                                                                                                                                                                                                          |
| `ref`                 | Ref callback                            | Attaches submit handling to a `<form>` element                                                                                                                                                                                                                                           |
| `validate(fn)`        | Cross-field rule                        | Registers a form-level validation rule (see below)                                                                                                                                                                                                                                       |
| `setError(name, msg)` | `(name, error: string \| null) => void` | Inject an external error on a named field (e.g. server-side validation). Cleared automatically when that field's value changes.                                                                                                                                                          |
| `formData()`          | `() => FormData`                        | Snapshot of current field values as a `FormData` instance                                                                                                                                                                                                                                |
| `setValues(values)`   | `(values: Partial<Values>) => void`     | Imperatively update one or more field values. Equivalent to calling `setValue` on each named field — clears any external error on each updated field and re-runs validation per `validateOn`. Does **not** alter baselines; use `reset(newValues)` if you also want to update baselines. |
| `reset(newValues?)`   | `(newValues?: Partial<Values>) => void` | Reset all fields. If `newValues` is provided, the named fields adopt those as their new baseline (useful for edit forms after a successful save).                                                                                                                                        |
| `submit()`            | `() => Promise<void>`                   | Programmatically trigger submission                                                                                                                                                                                                                                                      |

### `validateOn`

Controls when field errors become visible to the user. Can be set at the form level (applies to all fields) or overridden per field.

| Mode                 | Error appears when…            |
| -------------------- | ------------------------------ |
| `"change"` (default) | Immediately as the user types  |
| `"blur"`             | After the field loses focus    |
| `"submit"`           | After the first submit attempt |

```tsx
// All fields only show errors after blur
const form = createForm({
  fields: {
    email: { initial: "", validate: isEmail },
    password: { initial: "", validate: minLength(8) },
  },
  validateOn: "blur",
});

// Mix modes per field
const form = createForm({
  fields: {
    username: { initial: "", validate: isAvailable, validateOn: "blur" },
    email: { initial: "", validate: isEmail, validateOn: "submit" },
  },
});
```

> **Note:** `errors()` and `valid()` always reflect the true validation state, regardless of `validateOn`. The mode only controls when `field.error()` becomes non-null in the UI. This means `form.valid()` is a reliable gate for enabling the submit button even when errors aren't shown yet.

### `form.bind(name)`

`bind` follows the Solid 2.0 two-phase ref directive pattern. Call it during JSX rendering to wire a field to an input element:

```tsx
<input ref={form.bind("email")} type="email" />
<input ref={form.bind("agreed")} type="checkbox" />
<select ref={form.bind("country")}>...</select>
```

This sets up bidirectional sync:

- **Signal → DOM:** the input's value (or `checked` state for checkboxes/radios) stays in sync with the field signal
- **DOM → signal:** `input` events update the field value; `blur` events mark the field as touched

For checkboxes and radios, `bind` reads and writes `el.checked` (a boolean) and listens on `change` rather than `input`.

You can also apply the ref imperatively (e.g. in tests):

```ts
const cleanup = form.bind("email")(inputElement);
// ...
cleanup(); // removes event listeners
```

> **Note:** `bind` must be called during component rendering (inside a reactive owner). Calling it at module level or outside a reactive context will warn.

### Async validators

A validator can return a `Promise<string | null>`. While the promise is pending, `field.pending()` and `form.pending()` are `true`, and `form.valid()` returns `false`.

```tsx
const isAvailable = async (username: string): Promise<string | null> => {
  const taken = await api.checkUsername(username);
  return taken ? "Username is taken" : null;
};

const form = createForm({
  fields: {
    username: {
      initial: "",
      validate: [required, isAvailable],
      validateOn: "blur", // avoid checking on every keystroke
    },
  },
});

return (
  <form ref={form.ref}>
    <input ref={form.bind("username")} />
    <Show when={form.fields.username.pending()}>
      <span>Checking availability…</span>
    </Show>
    <Show when={form.fields.username.error()}>
      <span>{form.fields.username.error()}</span>
    </Show>
    <button type="submit" disabled={!form.valid() || form.pending()}>
      Sign up
    </button>
  </form>
);
```

Sync and async validators can coexist in a single `validate` array. Sync validators run first and short-circuit immediately — the async validator is only awaited if all preceding sync validators pass.

Stale async results are automatically discarded: if the field value changes while a validator is in flight, the in-flight result is ignored.

> **Tip:** Debounce noisy async validators yourself before passing them to `validate`, so network requests don't fire on every keystroke.

### `form.validate(fn)`

Registers a cross-field validation rule and returns a reactive accessor for its error. Call it during component rendering — the same phase as `bind`.

```tsx
function SignupForm() {
  const form = createForm({
    fields: {
      password: { initial: "" },
      confirm: { initial: "" },
    },
    onSubmit: async values => {
      /* ... */
    },
  });

  const confirmError = form.validate(values =>
    values.password !== values.confirm ? "Passwords must match" : null,
  );

  return (
    <form ref={form.ref}>
      <input ref={form.bind("password")} type="password" />
      <input ref={form.bind("confirm")} type="password" />
      <Show when={confirmError()}>
        <p>{confirmError()}</p>
      </Show>
      <button type="submit" disabled={!form.valid()}>
        Sign up
      </button>
    </form>
  );
}
```

- `form.validate(fn)` returns an `Accessor<string | null>` — reactive over `form.values()`, so it re-runs whenever any field changes.
- The result is included in `form.valid()` — submission is blocked when the rule fails.
- Call it multiple times to register independent rules; all are checked by `form.valid()`.

Works directly with any schema library:

```ts
import * as v from "valibot";

const SignupSchema = v.pipe(
  v.object({ password: v.string(), confirm: v.string() }),
  v.check(({ password, confirm }) => password === confirm, "Passwords must match"),
);

const confirmError = form.validate(values => {
  const result = v.safeParse(SignupSchema, values);
  return result.success ? null : result.issues[0].message;
});
```

> **Note:** `validate` must be called inside a reactive owner (i.e. during component rendering), because it calls `createMemo` internally.

### `form.ref`

Attach to a `<form>` element to intercept the native submit event:

```tsx
<form ref={form.ref}>...</form>
```

This calls `e.preventDefault()` and runs the submit flow: touches all fields, sets `submitted` to `true`, validates, then calls `onSubmit` if the form is valid.

### `submitted`

`form.submitted()` becomes `true` on the first submit attempt and stays `true` until `form.reset()` is called. Combined with `validateOn: "submit"`, this lets you reveal all errors only after the user first tries to submit:

```tsx
const form = createForm({
  fields: {
    email: { initial: "", validate: isEmail, validateOn: "submit" },
    password: { initial: "", validate: minLength(8), validateOn: "submit" },
  },
});

// errors are hidden until form.submitted() becomes true
```

### `toFormData(values)`

A standalone helper that converts a plain values object into a `FormData` instance. Useful when passing form data to Solid Router actions or server functions that expect `FormData`:

```ts
import { createForm, toFormData } from "@solid-primitives/form";
import { action, useAction } from "@solidjs/router";

const saveProfile = action(async (fd: FormData) => {
  await api.save(Object.fromEntries(fd));
});

function ProfileForm() {
  const save = useAction(saveProfile);
  const form = createForm({
    fields: { name: { initial: "" }, bio: { initial: "" } },
    onSubmit: values => save(toFormData(values)),
  });

  return <form ref={form.ref}>...</form>;
}
```

`null`, `undefined`, and `false` are omitted — matching HTML's native checkbox behaviour where unchecked inputs are absent from the form payload. All other values are coerced to strings via `String(value)`.

```ts
function toFormData(values: Record<string, unknown>): FormData;
```

### Server-side validation errors

Use `form.setError(name, message)` (or `field.setError(message)`) to surface errors returned by the server after submission. The injected error is treated like any other field error: it blocks `form.valid()`, appears in `form.errors()`, and is visible via `field.error()`.

The external error is cleared automatically the moment the user edits the field (`setValue` is called), so there is no manual cleanup needed.

```tsx
const form = createForm({
  fields: {
    email: { initial: "" },
    username: { initial: "" },
  },
  onSubmit: async values => {
    const result = await api.signup(values);
    if (!result.ok) {
      // Surface each field-level error from the server response
      for (const [field, message] of Object.entries(result.errors)) {
        form.setError(field as "email" | "username", message);
      }
    }
  },
});
```

Client-side validator errors take priority over external errors — if a field fails its own validators, the client error is shown first. The external error becomes visible once the client error is resolved.

### Optimistic updates

`createForm` works naturally with Solid 2.0's `action` primitive for optimistic mutations:

```ts
import { action } from "@solidjs/router";

const form = createForm({
  fields: { name: { initial: "" } },
  onSubmit: action(function* (values) {
    setOptimisticName(values.name);
    yield api.updateName(values);
    refresh(profile);
  }),
});
```

### TypeScript

Field value types are inferred from `initial`:

```ts
const form = createForm({
  fields: {
    age: { initial: 0 }, // FormField<number>
    name: { initial: "" }, // FormField<string>
    tags: { initial: [] as string[] }, // FormField<string[]>
  },
});

form.fields.age.value(); // number
form.fields.name.value(); // string
```

#### Definition

```ts
function createForm<C extends FieldsConfig>(config: FormConfig<C>): FormReturn<C>;

type ValidatorFn<V = string> = (value: V) => string | null | Promise<string | null>;

type FormConfig<C extends FieldsConfig> = {
  fields: C;
  onSubmit?: (values: { [K in keyof C]: InferValue<C[K]> }) => void | Promise<void>;
  validateOn?: "change" | "blur" | "submit";
};

type FieldConfig<V = string> = {
  initial: V;
  validate?: ValidatorFn<V> | ValidatorFn<V>[];
  validateOn?: "change" | "blur" | "submit";
};

type FormField<V = string> = {
  value: Accessor<V>;
  error: Accessor<string | null>;
  touched: Accessor<boolean>;
  pending: Accessor<boolean>;
  setValue: (v: V) => void;
  setTouched: (v: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

type FormReturn<C extends FieldsConfig> = {
  fields: { [K in keyof C]: FormField<InferValue<C[K]>> };
  values: Accessor<{ [K in keyof C]: InferValue<C[K]> }>;
  errors: Accessor<Partial<Record<keyof C & string, string>>>;
  dirty: Accessor<boolean>;
  valid: Accessor<boolean>;
  pending: Accessor<boolean>;
  submitting: Accessor<boolean>;
  submitted: Accessor<boolean>;
  bind: (
    name: keyof C & string,
  ) => (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => () => void;
  ref: (el: HTMLFormElement) => () => void;
  validate: (fn: (values: Values) => string | null) => Accessor<string | null>;
  setError: (name: keyof C & string, error: string | null) => void;
  formData: () => FormData;
  reset: (newValues?: Partial<Values>) => void;
  submit: () => Promise<void>;
};
```

---

## Validation

`createForm` has no built-in validators. A validator is any function `(value: V) => string | null | Promise<string | null>`. This makes it trivial to use your preferred schema library.

### Using Valibot

```ts
import { createForm } from "@solid-primitives/form";
import * as v from "valibot";

// Wrap any Valibot schema into a ValidatorFn
function valibot<T>(schema: v.BaseSchema<T, T, v.BaseIssue<unknown>>) {
  return (value: T): string | null => {
    const result = v.safeParse(schema, value);
    return result.success ? null : result.issues[0].message;
  };
}

const form = createForm({
  fields: {
    email: { initial: "", validate: valibot(v.pipe(v.string(), v.email())) },
    password: { initial: "", validate: valibot(v.pipe(v.string(), v.minLength(8))) },
    age: { initial: 0, validate: valibot(v.pipe(v.number(), v.minValue(18))) },
  },
  onSubmit: async values => {
    /* ... */
  },
});
```

### Using Zod

```ts
import { createForm } from "@solid-primitives/form";
import { z } from "zod";

// Wrap any Zod schema into a ValidatorFn
function zod<T>(schema: z.ZodType<T>) {
  return (value: T): string | null => {
    const result = schema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };
}

const form = createForm({
  fields: {
    email: { initial: "", validate: zod(z.string().email()) },
    password: { initial: "", validate: zod(z.string().min(8)) },
    age: { initial: 0, validate: zod(z.number().min(18)) },
  },
  onSubmit: async values => {
    /* ... */
  },
});
```

### Whole-form validation with Valibot

For schemas that validate the entire values object at once (cross-field rules, refinements), validate in `onSubmit` and surface errors manually:

```ts
import * as v from "valibot";

const SignupSchema = v.pipe(
  v.object({
    password: v.string(),
    confirm: v.string(),
  }),
  v.check(({ password, confirm }) => password === confirm, "Passwords do not match"),
);

const form = createForm({
  fields: {
    password: { initial: "" },
    confirm: { initial: "" },
  },
  onSubmit: values => {
    const result = v.safeParse(SignupSchema, values);
    if (!result.success) {
      throw new Error(result.issues[0].message);
    }
    return api.signup(result.output);
  },
});
```

### Custom validators

Plain functions work too — no library required:

```ts
const required = (value: string) => (value.trim().length === 0 ? "Required" : null);

const noSpaces = (value: string) => (value.includes(" ") ? "No spaces allowed" : null);

const form = createForm({
  fields: {
    username: { initial: "", validate: [required, noSpaces] },
  },
});
```

---

## `createFormControl`

Builds the ARIA accessibility graph for a labeled form field: a stable ID, registration slots for a label, description, and error message, and the computed `aria-labelledby` / `aria-describedby` strings that tie them together.

This is a low-level primitive aimed at headless component libraries (such as [Kobalte](https://kobalte.dev)). If you are building a component that wraps a label + input + helper text, `createFormControl` handles the ARIA wiring so you don't have to manage IDs manually.

```tsx
import {
  createFormControl,
  createFormControlInput,
  FormControlContext,
  useFormControl,
} from "@solid-primitives/form";
```

### The sub-component pattern

The intended usage is a `Root` component that owns the context and a set of named sub-components that each register themselves on mount. This is the same pattern Kobalte uses internally for `TextField`, `Checkbox`, etc.

```tsx
// 1. Root — creates the graph and provides it via context
const TextFieldRoot = (props: {
  id?: string;
  validationState?: "valid" | "invalid";
  required?: boolean;
  disabled?: boolean;
  children: JSX.Element;
}) => {
  const ctx = createFormControl(props);
  return <FormControlContext value={ctx}>{props.children}</FormControlContext>;
};

// 2. Label — registers its ID so the input can reference it
const TextFieldLabel = (props: { children: JSX.Element }) => {
  const ctx = useFormControl();
  const id = ctx.generateId("label");
  onCleanup(ctx.registerLabel(id));
  return <label id={id}>{props.children}</label>;
};

// 3. Input — reads context and spreads computed ARIA props
const TextFieldInput = (props: { placeholder?: string }) => {
  const { fieldProps } = createFormControlInput();
  const ctx = useFormControl();
  return (
    <input
      id={fieldProps.id()}
      placeholder={props.placeholder}
      aria-labelledby={fieldProps.ariaLabelledBy()}
      aria-describedby={fieldProps.ariaDescribedBy()}
      aria-invalid={ctx.validationState() === "invalid" ? "true" : undefined}
      aria-required={ctx.isRequired() ? "true" : undefined}
      disabled={ctx.isDisabled() ?? false}
    />
  );
};

// 4. Description — registers so it's included in aria-describedby
const TextFieldDescription = (props: { children: JSX.Element }) => {
  const ctx = useFormControl();
  const id = ctx.generateId("description");
  onCleanup(ctx.registerDescription(id));
  return <span id={id}>{props.children}</span>;
};

// 5. ErrorMessage — registers only while rendered (Show handles mount/unmount)
const TextFieldErrorMessage = (props: { children: JSX.Element }) => {
  const ctx = useFormControl();
  return (
    <Show when={ctx.validationState() === "invalid"}>
      {() => {
        const id = ctx.generateId("error-message");
        onCleanup(ctx.registerErrorMessage(id));
        return (
          <span id={id} role="alert">
            {props.children}
          </span>
        );
      }}
    </Show>
  );
};

// Usage
<TextFieldRoot id="email" validationState={fieldError() ? "invalid" : undefined} required>
  <TextFieldLabel>Email address</TextFieldLabel>
  <TextFieldInput placeholder="you@example.com" />
  <TextFieldDescription>We'll never share your email.</TextFieldDescription>
  <TextFieldErrorMessage>Enter a valid email address.</TextFieldErrorMessage>
</TextFieldRoot>;
```

When `validationState` is `"invalid"`, the error message component mounts, registers its ID, and `aria-describedby` on the input automatically expands to include it. When the state clears, the component unmounts and `onCleanup` removes its ID from the graph.

### `createFormControl(props)`

Creates the ARIA context for a labeled field group. Returns a `FormControlContextValue` directly — usable standalone or passed to `<FormControlContext>` for sub-components to consume via `useFormControl()`.

**Props**

| Prop              | Type                                               | Description                                                                                               |
| ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`              | `MaybeAccessor<string>`                            | Base ID for the field group. Auto-generated if omitted.                                                   |
| `name`            | `MaybeAccessor<string>`                            | Form submission name. Falls back to `id`.                                                                 |
| `validationState` | `MaybeAccessor<"valid" \| "invalid" \| undefined>` | Sets `data-valid` / `data-invalid` and controls whether `aria-describedby` includes the error message ID. |
| `required`        | `MaybeAccessor<boolean \| undefined>`              | Sets `data-required`.                                                                                     |
| `disabled`        | `MaybeAccessor<boolean \| undefined>`              | Sets `data-disabled`.                                                                                     |
| `readOnly`        | `MaybeAccessor<boolean \| undefined>`              | Sets `data-readonly`.                                                                                     |

All props accept either a plain value or a reactive accessor `() => value`, so they compose naturally with signals.

**Context value**

| Member                                                             | Description                                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `name()`                                                           | Resolved name (falls back to id)                                                          |
| `validationState()`                                                | Current validation state                                                                  |
| `isRequired()` / `isDisabled()` / `isReadOnly()`                   | State accessors                                                                           |
| `dataset()`                                                        | Memo of all `data-*` attribute values — spread onto any element that should reflect state |
| `generateId(part)`                                                 | Returns `"${baseId}-${part}"` — use this to derive stable IDs for sub-elements            |
| `labelId()` / `fieldId()` / `descriptionId()` / `errorMessageId()` | Currently registered IDs for each slot                                                    |
| `registerLabel(id)`                                                | Registers a label ID; returns a cleanup function                                          |
| `registerField(id)`                                                | Registers the field ID; returns a cleanup function                                        |
| `registerDescription(id)`                                          | Registers a description ID; returns a cleanup function                                    |
| `registerErrorMessage(id)`                                         | Registers an error message ID; returns a cleanup function                                 |
| `getAriaLabelledBy(fieldId, ariaLabel, ariaLabelledBy)`            | Computes the full `aria-labelledby` value                                                 |
| `getAriaDescribedBy(ariaDescribedBy)`                              | Computes the full `aria-describedby` value                                                |

### `createFormControlInput(props?)`

Reads from `FormControlContext` (must be called inside a `<FormControlContext>`) and returns a `fieldProps` object for the actual input element. Uses `createEffect` to register/deregister the field's ID reactively.

**Props**

| Prop               | Type                    | Description                                                                 |
| ------------------ | ----------------------- | --------------------------------------------------------------------------- |
| `id`               | `MaybeAccessor<string>` | Override the generated field ID. Defaults to `context.generateId("field")`. |
| `aria-label`       | `MaybeAccessor<string>` | Passed through to `fieldProps.ariaLabel()`.                                 |
| `aria-labelledby`  | `MaybeAccessor<string>` | Merged into the computed `aria-labelledby` chain.                           |
| `aria-describedby` | `MaybeAccessor<string>` | Appended to the computed `aria-describedby` value.                          |

**Returns**

```ts
{
  fieldProps: {
    id: () => string;
    ariaLabel: () => string | undefined;
    ariaLabelledBy: () => string | undefined;
    ariaDescribedBy: () => string | undefined;
  }
}
```

### `FormControlContext` + `useFormControl()`

`FormControlContext` is a standard Solid context. Provide a value from `createFormControl` and consume it in any descendant:

```tsx
const ctx = createFormControl({ id: "my-field" });

<FormControlContext value={ctx}>
  <MyLabel />
  <MyInput />
</FormControlContext>;
```

```ts
// Inside any descendant component:
const ctx = useFormControl();
```

`useFormControl()` throws if called outside a `<FormControlContext>`.

### `aria-labelledby` chain

`getAriaLabelledBy` follows Kobalte's three-argument logic: if both a visible label (`labelId`) and an explicit `aria-label` are present on the input, the **field's own ID** is appended to the chain. This ensures screen readers can announce all three — the label element, the field element, and the inline description — in the correct order.

```
// No label registered, no aria-label                  → undefined
// Label registered, no aria-label                     → "field-label"
// Label registered + explicit aria-labelledby         → "external-label field-label"
// Label registered + aria-label on input              → "field-label field-field"
```

### `validationState` and error messages

The error message ID is included in `aria-describedby` whenever the error message element is registered — regardless of `validationState`. The conditional behaviour comes from whether the error message component is mounted (typically gated by `<Show when={ctx.validationState() === "invalid"}`). This matches Kobalte's approach: use `aria-describedby` for error messages rather than `aria-errormessage`, which has poor screen reader support.

#### Definition

```ts
function createFormControl(props: CreateFormControlProps): FormControlContextValue;
function createFormControlInput(props?: CreateFormControlInputProps): { fieldProps: FieldProps };

const FormControlContext: Context<FormControlContextValue | undefined>;
function useFormControl(): FormControlContextValue;

type CreateFormControlProps = {
  id?: MaybeAccessor<string>;
  name?: MaybeAccessor<string>;
  validationState?: MaybeAccessor<"valid" | "invalid" | undefined>;
  required?: MaybeAccessor<boolean | undefined>;
  disabled?: MaybeAccessor<boolean | undefined>;
  readOnly?: MaybeAccessor<boolean | undefined>;
};

type CreateFormControlInputProps = {
  id?: MaybeAccessor<string>;
  "aria-label"?: MaybeAccessor<string>;
  "aria-labelledby"?: MaybeAccessor<string>;
  "aria-describedby"?: MaybeAccessor<string>;
};

type FormControlContextValue = {
  name: Accessor<string>;
  validationState: Accessor<"valid" | "invalid" | undefined>;
  isRequired: Accessor<boolean | undefined>;
  isDisabled: Accessor<boolean | undefined>;
  isReadOnly: Accessor<boolean | undefined>;
  dataset: Accessor<FormControlDataSet>;
  labelId: Accessor<string | undefined>;
  fieldId: Accessor<string | undefined>;
  descriptionId: Accessor<string | undefined>;
  errorMessageId: Accessor<string | undefined>;
  generateId: (part: string) => string;
  registerLabel: (id: string) => () => void;
  registerField: (id: string) => () => void;
  registerDescription: (id: string) => () => void;
  registerErrorMessage: (id: string) => () => void;
  getAriaLabelledBy: (fieldId, ariaLabel, ariaLabelledBy) => string | undefined;
  getAriaDescribedBy: (ariaDescribedBy) => string | undefined;
};
```

---

## `createFormResetListener`

Listens for the `reset` event on the closest ancestor `<form>` element and calls the given handler. Useful for form controls that need to restore their default value when the surrounding form is reset.

The element accessor is reactive — when it changes, the old listener is automatically removed and a new one is attached to the form closest to the new element.

```ts
import { createFormResetListener } from "@solid-primitives/form";
```

```tsx
function NumberField(props) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [value, setValue] = createSignal(props.defaultValue ?? 0);

  createFormResetListener(ref, () => setValue(props.defaultValue ?? 0));

  return <input ref={setRef} type="number" value={value()} />;
}
```

For native form elements (`input`, `select`, `textarea`, `button`) the handler is attached to `element.form`. For all other elements it walks up the DOM via `element.closest("form")`. If no form ancestor is found, no listener is added.

#### Definition

```ts
function createFormResetListener(
  element: Accessor<HTMLElement | null | undefined>,
  handler: () => void,
): void;
```

---

## Future work

### Field sanitizers

A `sanitize` option on `FieldConfig`, mirroring `validate`, that transforms a field's value rather than inspecting it:

```ts
type SanitizerFn<V = string> = (value: V) => V;

// proposed config shape
email: {
  initial: "",
  sanitize: v => v.trim().toLowerCase(), // or an array, run as a chain
  validate: isEmail,
}
```

Sanitizers would run on `blur` (better UX than on every keystroke — trimming mid-input prevents typing a space), producing the cleaned value before validation sees it. `form.fields.email.value()` would always return the sanitized value.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
