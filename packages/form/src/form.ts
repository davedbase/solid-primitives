import { createSignal, createMemo, createRoot, onCleanup, untrack, createEffect, type Accessor } from "solid-js";
import { isServer } from "@solidjs/web";
import { makeEventListener } from "@solid-primitives/event-listener";
import type { ValidatorFn, FieldsConfig, InferValue, FormField, FormReturn, FormConfig } from "./types.ts";

export type { ValidatorFn, FieldConfig, FieldsConfig, FormField, FormReturn, FormConfig } from "./types.ts";


/**
 * Converts a plain values object into a `FormData` instance.
 *
 * `null`, `undefined`, and `false` are omitted — matching HTML's native behaviour where
 * unchecked checkboxes are absent from the form payload. All other values are coerced to
 * strings via `String(value)`.
 *
 * @example
 * ```ts
 * const form = createForm({ fields: { name: { initial: "" }, agreed: { initial: false } } });
 * const fd = toFormData(form.values()); // agreed is omitted
 * await fetch("/api", { method: "POST", body: fd });
 * ```
 */
export function toFormData(values: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v != null && v !== false) fd.append(k, String(v));
  }
  return fd;
}

/**
 * Creates a reactive form with per-field signals, derived validity state, and helpers for
 * binding fields to DOM inputs.
 *
 * Validators are plain functions `(value) => string | null | Promise<string | null>`, so any
 * schema library (Zod, Valibot, Arktype, …) wires in with a one-line adapter. Async validators
 * (uniqueness checks, server-side rules) are first-class: while a check is in flight,
 * `field.pending()` and `form.pending()` are `true` and `form.valid()` is `false`.
 *
 * @param config - Field definitions, optional `onSubmit` handler, and default `validateOn` mode.
 * @returns Reactive form object with per-field accessors, form-level signals, and DOM helpers.
 * @example
 * ```tsx
 * const form = createForm({
 *   fields: {
 *     email:    { initial: "", validate: isEmail },
 *     password: { initial: "", validate: [minLength(8), hasUppercase] },
 *   },
 *   onSubmit: async values => { await api.login(values); },
 * });
 *
 * return (
 *   <form ref={form.ref}>
 *     <input ref={form.bind("email")} type="email" />
 *     <Show when={form.fields.email.error()}>{err => <span>{err()}</span>}</Show>
 *     <button type="submit" disabled={!form.valid() || form.submitting()}>Sign in</button>
 *   </form>
 * );
 * ```
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/form
 */
export function createForm<C extends FieldsConfig>(config: FormConfig<C>): FormReturn<C> {
  type Values = { [K in keyof C]: InferValue<C[K]> };

  if (isServer) {
    const initialValues = Object.fromEntries(
      Object.entries(config.fields).map(([k, f]) => [k, f.initial]),
    ) as Values;

    const fields = Object.fromEntries(
      Object.entries(config.fields).map(([k, f]) => [
        k,
        {
          value: () => f.initial,
          error: () => null,
          touched: () => false,
          pending: () => false,
          setValue: () => void 0,
          setTouched: () => void 0,
          setError: () => void 0,
          reset: () => void 0,
        },
      ]),
    ) as unknown as FormReturn<C>["fields"];

    return {
      fields,
      values: () => initialValues,
      errors: () => ({}),
      dirty: () => false,
      valid: () => true,
      pending: () => false,
      submitting: () => false,
      submitted: () => false,
      bind: () => () => () => {},
      ref: () => () => {},
      validate: () => () => null,
      setValues: () => void 0,
      setError: () => void 0,
      formData: () => toFormData(initialValues),
      reset: () => void 0,
      submit: async () => void 0,
    };
  }

  // Must be declared before the field loop: validateOn:"submit" error memos close over this signal.
  const [submitted, setSubmitted] = createSignal(false, { ownedWrite: true });
  const formValidateOn = config.validateOn ?? "change";

  // Must be declared before the field loop: validateOn:"change" error memos close over this
  // signal (see the dirty-gating comment below), and the field-level `dirty` memo used by the
  // form-level `dirty` accessor further down needs it too. See that memo's comment for what it's
  // for.
  const [dirtyVer, bumpDirtyVer] = createSignal(0, { ownedWrite: true });

  type InternalField = {
    initial: any;
    value: Accessor<any>;
    _setValue: (v: any) => void;
    _rawError: Accessor<string | null>;
    _asyncPending: Accessor<boolean>;
    _setExternalError: (error: string | null) => void;
    error: Accessor<string | null>;
    touched: Accessor<boolean>;
    _setTouched: (v: boolean) => void;
  };

  const internalFields: Record<string, InternalField> = {};

  for (const [name, fc] of Object.entries(config.fields)) {
    const validators = fc.validate
      ? Array.isArray(fc.validate) ? fc.validate : [fc.validate]
      : [];
    const validateOn = fc.validateOn ?? formValidateOn;

    const [value, _setValueRaw] = createSignal<any>(fc.initial, { ownedWrite: true });
    const [touched, setTouched] = createSignal(false, { ownedWrite: true });
    const [externalError, setExternalError] = createSignal<string | null>(null, { ownedWrite: true });
    // A server-side error is stale the moment the user edits the field; clear it automatically.
    const setValue = (v: any) => { _setValueRaw(v); setExternalError(null); };

    let asyncError: Accessor<string | null> = () => null;
    let _asyncPending: Accessor<boolean> = () => false;
    let _syncError: Accessor<string | null> = () => null;

    if (validators.length > 0) {
      // The async outcome is written only from the promise continuation, never from an effect.
      // It is tagged with the run (the object identity of `inputs` below) it validated, and
      // with that run's epoch (a stretch of consecutive runs without a sync error).
      // `pending` is derived from the run tag: a run is pending until its own result arrived.
      // `asyncError` is derived from the epoch tag: the previous async error stays visible
      // while the next run is in flight (as before), but never survives a sync error.
      type AsyncResult = { run: object; epoch: object; err: string | null };
      const [asyncResult, setAsyncResult] = createSignal<AsyncResult | null>(null, {
        ownedWrite: true,
      });

      // Probe each validator with the initial value to classify it as sync or async.
      // The initial promises are saved so the first async run can reuse them rather than
      // invoking the validator a second time with the same value.
      const syncFns: ValidatorFn<any>[] = [];
      const asyncFns: ValidatorFn<any>[] = [];
      const initProms: Promise<string | null>[] = [];

      for (const fn of validators) {
        const probe = fn(fc.initial);
        if (probe instanceof Promise) {
          asyncFns.push(fn);
          initProms.push(probe);
        } else {
          syncFns.push(fn);
        }
      }

      // Lazy so the probe above counts as the first evaluation; no double-run on mount.
      const syncMemo: Accessor<string | null> = syncFns.length > 0
        ? createMemo(() => {
            const val = value();
            for (const fn of syncFns) {
              const r = fn(val);
              if (r !== null) return r as string;
            }
            return null;
          }, { lazy: true })
        : () => null;
      _syncError = syncMemo;

      if (asyncFns.length > 0) {
        let seq = 0;
        let isFirstRun = true;
        // A new object per (value, syncError) change = one async "run". Pure function of the
        // previous run: the epoch is carried over unless a sync error is or was in effect.
        type Run = { val: any; syncError: string | null; epoch: object };
        const inputs = createMemo<Run>(prev => {
          const syncError = syncMemo();
          const val = value();
          const epoch = prev && prev.syncError === null && syncError === null ? prev.epoch : {};
          return { val, syncError, epoch };
        });

        // Derived in the same flush as the value change, so valid()/pending() never show a
        // frame where the new value looks settled while its async validators have not run.
        asyncError = createMemo(() => {
          const run = inputs();
          const r = asyncResult();
          return run.syncError === null && r !== null && r.epoch === run.epoch ? r.err : null;
        });
        _asyncPending = createMemo(() => {
          const run = inputs();
          if (run.syncError !== null) return false;
          const r = asyncResult();
          return !(r !== null && r.run === run);
        });

        onCleanup(() => {
          seq = -1; // discard results still in flight after dispose
        });

        createEffect(
          () => inputs(),
          run => {
            const { val, syncError } = run;
            // Reuse initProms when the value hasn't changed from initial — they're already
            // in flight and represent the correct result. If the value changed, those
            // promises validated a stale input and must be discarded.
            const asyncProms =
              isFirstRun && val === fc.initial
                ? ((isFirstRun = false), initProms)
                : ((isFirstRun = false), asyncFns.map(fn => fn(val) as Promise<string | null>));

            if (syncError !== null) {
              seq++; // a sync error supersedes anything still in flight
              return;
            }
            const s = ++seq;
            void (async () => {
              for (const p of asyncProms) {
                const err = await p;
                if (s !== seq) return;
                if (err !== null) {
                  setAsyncResult({ run, epoch: run.epoch, err });
                  return;
                }
              }
              setAsyncResult({ run, epoch: run.epoch, err: null });
            })();
          },
        );
      }
    }

    // Validator-only error (no external component) — this is the part that respects validateOn
    // timing below. Kept separate from _rawError so a setError() call is never accidentally
    // gated along with it.
    const validatorError: Accessor<string | null> = validators.length === 0
      ? () => null
      : createMemo(() => _syncError() ?? asyncError());

    // Always tracks the true validation state; never gated by validateOn.
    const _rawError: Accessor<string | null> = validators.length === 0
      ? externalError
      : createMemo(() => validatorError() ?? externalError());

    // Displayed error respects validateOn — but only for the validator portion. An external
    // error (setError()) is caller-injected out-of-band (e.g. a server response) and is always
    // shown the moment it's set, regardless of mode/touched/submitted/dirty.
    //
    // "change" still needs its own gate on the validator portion - not "always show it" - or a
    // field whose initial value fails validation (e.g. a required field starting empty) would
    // render errored before the user has touched anything. Gated on dirtiness (current value ≠
    // initial) rather than on any "has an input event fired" flag, so a programmatic setValue
    // back to the initial value correctly re-hides the error too. dirtyVer forces recompute on
    // reset(newValues), same as the form-level `dirty` memo below - see its comment.
    const error = validateOn === "change"
      ? createMemo(() => {
          dirtyVer();
          const isDirty = value() !== fc.initial;
          return (isDirty ? validatorError() : null) ?? externalError();
        })
      : createMemo(() => {
          const showValidator = validateOn === "blur" ? touched() : submitted();
          return (showValidator ? validatorError() : null) ?? externalError();
        });

    internalFields[name] = {
      initial: fc.initial,
      value,
      _setValue: setValue,
      _rawError,
      _asyncPending,
      _setExternalError: setExternalError,
      error,
      touched,
      _setTouched: setTouched,
    };
  }

  const fieldEntries = Object.entries(internalFields);

  const fields = Object.fromEntries(
    fieldEntries.map(([name, f]) => [
      name,
      {
        value: f.value,
        error: f.error,
        touched: f.touched,
        pending: f._asyncPending,
        setValue: f._setValue,
        setTouched: f._setTouched,
        setError: f._setExternalError,
        reset: () => { f._setValue(f.initial); f._setTouched(false); },
      } satisfies FormField<any>,
    ]),
  ) as unknown as FormReturn<C>["fields"];

  const values = createMemo(
    () => Object.fromEntries(fieldEntries.map(([k, f]) => [k, f.value()])) as Values,
  );

  const errors = createMemo(() => {
    const result: Partial<Record<string, string>> = {};
    for (const [k, f] of fieldEntries) {
      const err = f._rawError();
      if (err !== null) result[k] = err;
    }
    return result;
  }) as Accessor<Partial<Record<keyof C & string, string>>>;

  // Dirty is "current value ≠ initial". When reset(newValues) changes the initial baseline,
  // field values might be unchanged but dirty must still recompute — dirtyVer (declared above
  // the field loop) triggers that.
  const dirty = createMemo(() => {
    dirtyVer();
    return fieldEntries.some(([, f]) => f.value() !== f.initial);
  });
  const pending = createMemo(() => fieldEntries.some(([, f]) => f._asyncPending()));

  // validate() pushes new cross-field rules after valid() may already be memoised.
  // Bumping this counter forces valid() to recompute the next time it's read.
  const [validVer, bumpValidVer] = createSignal(0, { ownedWrite: true });
  const formValidators: Accessor<string | null>[] = [];

  const valid = createMemo(
    () => {
      validVer();
      return (
        fieldEntries.every(([, f]) => f._rawError() === null) &&
        !pending() &&
        formValidators.every(v => v() === null)
      );
    },
    { lazy: true },
  );

  const validate = (fn: (v: Values) => string | null): Accessor<string | null> => {
    const error = createMemo(() => fn(values()));
    formValidators.push(error);
    bumpValidVer(n => n + 1);
    return error;
  };

  const setValues = (newValues: Partial<Values>) => {
    for (const [k, v] of Object.entries(newValues)) {
      if (k in internalFields) internalFields[k]!._setValue(v);
    }
  };

  const [submitting, setSubmitting] = createSignal(false, { ownedWrite: true });
  let _isSubmitting = false;

  const setError = (name: keyof C & string, error: string | null) => {
    internalFields[name]?._setExternalError(error);
  };

  const reset = (newValues?: Partial<Values>) => {
    for (const [name, f] of fieldEntries) {
      if (newValues && name in newValues) f.initial = (newValues as any)[name];
      f._setValue(f.initial); // also clears external error via the setValue wrapper
      f._setTouched(false);
    }
    if (newValues) bumpDirtyVer(n => n + 1); // dirty must recompute when baseline changes
    _isSubmitting = false;
    setSubmitting(false);
    setSubmitted(false);
  };

  const submit = async () => {
    if (_isSubmitting) return;
    for (const [, f] of fieldEntries) f._setTouched(true);
    setSubmitted(true);
    if (!untrack(valid)) return;
    _isSubmitting = true;
    setSubmitting(true);
    try {
      await config.onSubmit?.(untrack(values));
    } finally {
      _isSubmitting = false;
      setSubmitting(false);
    }
  };

  // bind() returns a Phase 2 ref callback. The DOM-sync effect lives inside a createRoot
  // scoped to the element's lifetime so it disposes automatically on unmount.
  const bind = (name: string) => {
    const f = internalFields[name];
    if (!f) throw new Error(`createForm: unknown field "${name}"`);

    return (nextEl: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      const el = nextEl as HTMLInputElement;
      const checkable = el.type === "checkbox" || el.type === "radio";

      if (checkable) el.checked = Boolean(untrack(f.value));
      else el.value = untrack(() => String(f.value() ?? ""));

      const disposeEffect = createRoot(d => {
        createEffect(f.value, v => {
          if (checkable) el.checked = Boolean(v);
          else if (el.value !== String(v ?? "")) el.value = String(v ?? "");
        });
        return d;
      });

      const off1 = makeEventListener(el, checkable ? "change" : "input", () =>
        f._setValue(checkable ? el.checked : el.value),
      );
      const off2 = makeEventListener(el, "blur", () => f._setTouched(true));

      return () => { off1(); off2(); disposeEffect(); };
    };
  };

  const ref = (el: HTMLFormElement) =>
    makeEventListener(el, "submit", (e: SubmitEvent) => {
      e.preventDefault();
      void submit();
    });

  onCleanup(() => { _isSubmitting = false; });

  return {
    fields,
    values,
    errors,
    dirty,
    valid,
    pending,
    submitting,
    submitted,
    bind: bind as FormReturn<C>["bind"],
    ref,
    validate: validate as FormReturn<C>["validate"],
    setValues: setValues as FormReturn<C>["setValues"],
    setError: setError as FormReturn<C>["setError"],
    formData: () => toFormData(values()),
    reset,
    submit,
  };
}
