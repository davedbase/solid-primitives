import { describe, it, expect, vi } from "vitest";
import { createEffect, createRoot, createSignal, flush, OBSERVE } from "solid-js";
import { attribution } from "solid-js/attribution";
import { createForm, createFormResetListener, toFormData } from "../src/index.js";

const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email";

const minLength = (n: number) => (v: string) =>
  v.length < n ? `Minimum ${n} characters` : null;

const hasUppercase = (v: string) =>
  /[A-Z]/.test(v) ? null : "Must contain an uppercase letter";

describe("field signals", () => {
  it("initializes field values from config", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "" },
          age: { initial: 0 },
        },
      });

      expect(form.fields.email.value()).toBe("");
      expect(form.fields.age.value()).toBe(0);
      dispose();
    });
  });

  it("updates value with setValue", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.fields.name.setValue("Alice");
      flush();
      expect(form.fields.name.value()).toBe("Alice");
      dispose();
    });
  });

  it("tracks touched state", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.fields.name.touched()).toBe(false);
      form.fields.name.setTouched(true);
      flush();
      expect(form.fields.name.touched()).toBe(true);
      dispose();
    });
  });
});

describe("validation", () => {
  it("returns null error for valid field", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "user@example.com", validate: isEmail } },
      });

      expect(form.fields.email.error()).toBe(null);
      dispose();
    });
  });

  it("returns error message for invalid field", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "not-an-email", validate: isEmail } },
      });

      // Pristine field, so "change" mode's display gate hides it from error() - errors()
      // (never gated by validateOn) is what this test actually means to exercise: does the
      // validator run and report correctly.
      expect(form.errors().email).toBe("Invalid email");
      dispose();
    });
  });

  it("runs array of validators and returns first failure", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          password: { initial: "abc", validate: [minLength(8), hasUppercase] },
        },
      });

      expect(form.errors().password).toBe("Minimum 8 characters");

      form.fields.password.setValue("abcdefgh");
      flush();
      expect(form.fields.password.error()).toBe("Must contain an uppercase letter");

      form.fields.password.setValue("Abcdefgh");
      flush();
      expect(form.fields.password.error()).toBe(null);

      dispose();
    });
  });

  it("reactively updates errors when value changes", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
      });

      expect(form.errors().email).toBe("Invalid email");

      form.fields.email.setValue("user@example.com");
      flush();
      expect(form.fields.email.error()).toBe(null);

      dispose();
    });
  });

  it("returns null when no validator is configured", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.fields.name.error()).toBe(null);
      dispose();
    });
  });
});

describe("dirty", () => {
  it("is false initially", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.dirty()).toBe(false);
      dispose();
    });
  });

  it("is true when any field changes from initial", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.fields.name.setValue("Alice");
      flush();
      expect(form.dirty()).toBe(true);
      dispose();
    });
  });

  it("returns to false when field value matches initial again", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.fields.name.setValue("Alice");
      flush();
      form.fields.name.setValue("");
      flush();
      expect(form.dirty()).toBe(false);
      dispose();
    });
  });
});

describe("valid", () => {
  it("is true when all fields pass validation", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "user@example.com", validate: isEmail } },
      });

      expect(form.valid()).toBe(true);
      dispose();
    });
  });

  it("is false when any field has an error", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
      });

      expect(form.valid()).toBe(false);
      dispose();
    });
  });

  it("is true when there are no validators", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.valid()).toBe(true);
      dispose();
    });
  });
});

describe("errors", () => {
  it("includes only fields with errors", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "bad", validate: isEmail },
          name: { initial: "Alice" },
        },
      });

      const errs = form.errors();
      expect(errs.email).toBe("Invalid email");
      expect(errs.name).toBeUndefined();
      dispose();
    });
  });

  it("is empty when all fields are valid", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "user@example.com", validate: isEmail } },
      });

      expect(form.errors()).toEqual({});
      dispose();
    });
  });
});

describe("values", () => {
  it("returns plain object with all current values", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "user@example.com" },
          name: { initial: "Alice" },
        },
      });

      expect(form.values()).toEqual({ email: "user@example.com", name: "Alice" });
      dispose();
    });
  });

  it("reflects updated values", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.fields.name.setValue("Bob");
      flush();
      expect(form.values()).toEqual({ name: "Bob" });
      dispose();
    });
  });
});

describe("reset", () => {
  it("restores all fields to initial values and clears touched", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "" },
          name: { initial: "" },
        },
      });

      form.fields.email.setValue("user@example.com");
      form.fields.name.setValue("Alice");
      form.fields.email.setTouched(true);
      flush();

      form.reset();
      flush();

      expect(form.fields.email.value()).toBe("");
      expect(form.fields.name.value()).toBe("");
      expect(form.fields.email.touched()).toBe(false);
      expect(form.dirty()).toBe(false);
      dispose();
    });
  });

  it("field.reset() restores only that field", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "" },
          name: { initial: "" },
        },
      });

      form.fields.email.setValue("user@example.com");
      form.fields.name.setValue("Alice");
      flush();

      form.fields.email.reset();
      flush();

      expect(form.fields.email.value()).toBe("");
      expect(form.fields.name.value()).toBe("Alice");
      dispose();
    });
  });

  it("field.reset() also clears touched state", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      form.fields.email.setTouched(true);
      flush();
      expect(form.fields.email.touched()).toBe(true);

      form.fields.email.reset();
      flush();
      expect(form.fields.email.touched()).toBe(false);
      dispose();
    });
  });

  it("reset(newValues) resets fields to new baseline values", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "" },
          name:  { initial: "" },
        },
      });

      form.reset({ email: "server@example.com", name: "Alice" });
      flush();

      expect(form.fields.email.value()).toBe("server@example.com");
      expect(form.fields.name.value()).toBe("Alice");
      dispose();
    });
  });

  it("reset(newValues) updates the dirty baseline — form is not dirty after reset", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      form.fields.email.setValue("user@example.com");
      flush();
      expect(form.dirty()).toBe(true);

      form.reset({ email: "user@example.com" });
      flush();
      // New baseline matches current value → not dirty
      expect(form.dirty()).toBe(false);
      dispose();
    });
  });

  it("reset(newValues) leaves unmentioned fields at their original baseline", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "old@example.com" },
          name:  { initial: "OldName" },
        },
      });

      form.reset({ email: "new@example.com" });
      flush();

      expect(form.fields.email.value()).toBe("new@example.com");
      expect(form.fields.name.value()).toBe("OldName"); // unchanged baseline
      dispose();
    });
  });

  it("after reset(newValues), editing to the original config value is still dirty", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.reset({ name: "Alice" });
      flush();
      // Baseline is now "Alice"
      expect(form.dirty()).toBe(false);

      form.fields.name.setValue("");
      flush();
      // "" differs from new baseline "Alice" → dirty
      expect(form.dirty()).toBe(true);
      dispose();
    });
  });
});

describe("submit", () => {
  it("calls onSubmit with current values when valid", async () => {
    const onSubmit = vi.fn();
    let submitPromise: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { email: { initial: "user@example.com", validate: isEmail } },
        onSubmit: values => {
          onSubmit(values);
        },
      });
      submitPromise = form.submit();
      return d;
    });

    await submitPromise!;
    expect(onSubmit).toHaveBeenCalledWith({ email: "user@example.com" });
    dispose();
  });

  it("does not call onSubmit when form is invalid", async () => {
    const onSubmit = vi.fn();
    let submitPromise: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
        onSubmit,
      });
      submitPromise = form.submit();
      return d;
    });

    await submitPromise!;
    expect(onSubmit).not.toHaveBeenCalled();
    dispose();
  });

  it("touches all fields on submit attempt", async () => {
    let submitPromise: Promise<void>;
    let touchedAfterSubmit = false;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
      });

      submitPromise = form.submit().then(() => {
        flush();
        touchedAfterSubmit = form.fields.email.touched();
      });

      return d;
    });

    await submitPromise!;
    expect(touchedAfterSubmit).toBe(true);
    dispose();
  });

  it("sets submitting to true while processing", async () => {
    let submittingDuringCall = false;
    let submitPromise: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { email: { initial: "user@example.com" } },
        onSubmit: () => {
          flush();
          submittingDuringCall = form.submitting();
        },
      });
      submitPromise = form.submit();
      return d;
    });

    await submitPromise!;
    expect(submittingDuringCall).toBe(true);
    dispose();
  });

  it("resets submitting to false after completion", async () => {
    let submitPromise: Promise<void>;
    let submittingAfter = true;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { name: { initial: "Alice" } },
        onSubmit: async () => {},
      });
      submitPromise = form.submit().then(() => {
        flush();
        submittingAfter = form.submitting();
      });
      return d;
    });

    await submitPromise!;
    expect(submittingAfter).toBe(false);
    dispose();
  });

  it("does not submit while async validators are pending", async () => {
    const onSubmit = vi.fn();
    let submitPromise: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: {
          email: {
            initial: "user@example.com",
            validate: async () => {
              await new Promise(r => setTimeout(r, 50));
              return null;
            },
          },
        },
        onSubmit,
      });

      flush(); // starts async validator → pending() = true
      submitPromise = form.submit();
      return d;
    });

    await submitPromise!;
    expect(onSubmit).not.toHaveBeenCalled();
    dispose();
  });

  it("allows re-submit after correcting a validation error", async () => {
    const onSubmit = vi.fn();
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    let form: any;

    const dispose = createRoot(d => {
      form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
        onSubmit,
      });
      return d;
    });

    await form.submit(); // invalid → blocked
    expect(onSubmit).not.toHaveBeenCalled();

    form.fields.email.setValue("user@example.com");
    flush();

    await form.submit(); // valid → succeeds
    expect(onSubmit).toHaveBeenCalledWith({ email: "user@example.com" });
    dispose();
  });

  it("ignores concurrent submit calls", async () => {
    const onSubmit = vi.fn(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    let submitPromise1: Promise<void>;
    let submitPromise2: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { name: { initial: "Alice" } },
        onSubmit,
      });
      submitPromise1 = form.submit();
      submitPromise2 = form.submit();
      return d;
    });

    await Promise.all([submitPromise1!, submitPromise2!]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    dispose();
  });
});

describe("submitted", () => {
  it("starts false", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.submitted()).toBe(false);
      dispose();
    });
  });

  it("becomes true after any submit attempt, including invalid", async () => {
    let submitPromise: Promise<void>;
    let submittedAfter = false;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
      });
      submitPromise = form.submit().then(() => {
        flush();
        submittedAfter = form.submitted();
      });
      return d;
    });

    await submitPromise!;
    expect(submittedAfter).toBe(true);
    dispose();
  });

  it("resets to false on form.reset()", async () => {
    let submitPromise: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({ fields: { name: { initial: "Alice" } } });
      submitPromise = form.submit().then(() => {
        flush();
        expect(form.submitted()).toBe(true);
        form.reset();
        flush();
        expect(form.submitted()).toBe(false);
      });
      return d;
    });

    await submitPromise!;
    dispose();
  });
});

describe("validateOn", () => {
  it("change (default): error() is null until the field is dirtied", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
      });

      // Invalid from the start (empty fails isEmail), but untouched - shouldn't render errored.
      expect(form.fields.email.error()).toBe(null);

      form.fields.email.setValue("not-an-email");
      flush();
      expect(form.fields.email.error()).toBe("Invalid email");

      // Setting it back to the initial value un-dirties it - error hides again.
      form.fields.email.setValue("");
      flush();
      expect(form.fields.email.error()).toBe(null);
      dispose();
    });
  });

  it("blur: error() is null until field is touched", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail, validateOn: "blur" } },
      });

      expect(form.fields.email.error()).toBe(null);

      form.fields.email.setTouched(true);
      flush();
      expect(form.fields.email.error()).toBe("Invalid email");
      dispose();
    });
  });

  it("submit: error() is null until form.submit() is called", async () => {
    let submitPromise: Promise<void>;
    let errorBefore: string | null;
    let errorAfter: string | null;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail, validateOn: "submit" } },
      });

      errorBefore = form.fields.email.error();
      submitPromise = form.submit().then(() => {
        flush();
        errorAfter = form.fields.email.error();
      });
      return d;
    });

    await submitPromise!;
    expect(errorBefore!).toBe(null);
    expect(errorAfter!).toBe("Invalid email");
    dispose();
  });

  it("form-level validateOn applies to all fields", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail } },
        validateOn: "blur",
      });

      expect(form.fields.email.error()).toBe(null);

      form.fields.email.setTouched(true);
      flush();
      expect(form.fields.email.error()).toBe("Invalid email");
      dispose();
    });
  });

  it("per-field validateOn overrides form-level", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "", validate: isEmail },
          name: {
            initial: "",
            validate: (v: string) => (v ? null : "Required"),
            validateOn: "blur",
          },
        },
        validateOn: "submit",
      });

      // email inherits "submit" → hidden; name is "blur" → also hidden
      expect(form.fields.email.error()).toBe(null);
      expect(form.fields.name.error()).toBe(null);

      // touching name reveals its error; email stays hidden
      form.fields.name.setTouched(true);
      flush();
      expect(form.fields.name.error()).toBe("Required");
      expect(form.fields.email.error()).toBe(null);
      dispose();
    });
  });

  it("valid() always uses raw error regardless of validateOn", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail, validateOn: "blur" } },
      });

      // error() is null (not yet touched) but the field is actually invalid
      expect(form.fields.email.error()).toBe(null);
      expect(form.valid()).toBe(false);
      dispose();
    });
  });

  it("errors() always uses raw error regardless of validateOn", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "", validate: isEmail, validateOn: "blur" } },
      });

      expect(form.fields.email.error()).toBe(null);
      expect(form.errors().email).toBe("Invalid email");
      dispose();
    });
  });
});

describe("async validators", () => {
  it("pending becomes true while an async validator is in flight", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: {
            initial: "test@example.com",
            validate: async () => {
              await new Promise(r => setTimeout(r, 50));
              return null;
            },
          },
        },
      });

      flush();
      expect(form.fields.email.pending()).toBe(true);
      expect(form.pending()).toBe(true);
      dispose();
    });
  });

  it("sets error after async validation resolves", async () => {
    const form = createRoot(() =>
      createForm({
        fields: {
          email: {
            initial: "taken@example.com",
            validate: async (v: string) =>
              v === "taken@example.com" ? "Email already taken" : null,
          },
        },
      }),
    );

    flush();
    await new Promise(r => setTimeout(r, 20));
    flush();
    // Field is untouched/pristine (never dirtied via setValue), so the "change"-mode display
    // gate hides it from error() - but the validator genuinely ran and found it invalid, which
    // errors() (never gated by validateOn) confirms.
    expect(form.errors().email).toBe("Email already taken");
    expect(form.fields.email.pending()).toBe(false);
  });

  it("sync and async validators coexist in one validate array", async () => {
    const form = createRoot(() =>
      createForm({
        fields: {
          email: {
            initial: "",
            validate: [
              isEmail,
              async (v: string) => (v === "taken@example.com" ? "Email already taken" : null),
            ],
          },
        },
      }),
    );

    // Sync validator fires immediately - checked via errors() since the field is still
    // pristine and "change" mode's display gate hides it from error() until dirtied.
    expect(form.errors().email).toBe("Invalid email");

    form.fields.email.setValue("taken@example.com");
    flush();
    // Sync passes, async is in flight
    expect(form.fields.email.error()).toBe(null);
    expect(form.fields.email.pending()).toBe(true);

    await new Promise(r => setTimeout(r, 20));
    flush();
    expect(form.fields.email.error()).toBe("Email already taken");
  });

  it("valid() is false while any async validator is pending", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: {
            initial: "test@example.com",
            validate: async () => {
              await new Promise(r => setTimeout(r, 50));
              return null;
            },
          },
        },
      });

      flush();
      expect(form.valid()).toBe(false);
      dispose();
    });
  });

  it("pending() is false when a sync validator already fails", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: {
            initial: "",
            validate: [
              isEmail,
              async (v: string) => (v === "taken@example.com" ? "Email already taken" : null),
            ],
          },
        },
      });

      flush();
      // isEmail("") fails synchronously — async validator must not run. Checked via errors()
      // since the field is pristine and "change" mode's display gate hides it from error().
      expect(form.errors().email).toBe("Invalid email");
      expect(form.fields.email.pending()).toBe(false);
      expect(form.pending()).toBe(false);
      dispose();
    });
  });

  it("stale results are discarded when value changes mid-flight", async () => {
    const form = createRoot(() =>
      createForm({
        fields: {
          username: {
            initial: "first",
            validate: async (v: string) => {
              await new Promise(r => setTimeout(r, 10));
              return v === "first" ? "taken" : null;
            },
          },
        },
      }),
    );

    flush();
    form.fields.username.setValue("second");
    flush();

    await new Promise(r => setTimeout(r, 30));
    flush();

    expect(form.fields.username.error()).toBe(null);
  });

  it("async validator is called exactly once per value change", async () => {
    const asyncValidator = vi.fn(async (_v: string): Promise<string | null> => {
      await new Promise(r => setTimeout(r, 10));
      return null;
    });

    const form = createRoot(() =>
      createForm({
        fields: { name: { initial: "alice", validate: asyncValidator } },
      }),
    );

    // Initial value triggers one invocation
    flush();
    await new Promise(r => setTimeout(r, 30));
    flush();
    expect(asyncValidator).toHaveBeenCalledTimes(1);

    // Value change triggers exactly one more invocation
    form.fields.name.setValue("bob");
    flush();
    await new Promise(r => setTimeout(r, 30));
    flush();
    expect(asyncValidator).toHaveBeenCalledTimes(2);
  });

  it("async validator is not re-invoked when its result settles (asyncError signal change)", async () => {
    const asyncValidator = vi.fn(async (_v: string): Promise<string | null> => {
      await new Promise(r => setTimeout(r, 10));
      return "always fails";
    });

    createRoot(() =>
      createForm({
        fields: { name: { initial: "alice", validate: asyncValidator } },
      }),
    );

    // One invocation on initial value
    flush();
    expect(asyncValidator).toHaveBeenCalledTimes(1);

    // Wait for it to settle — asyncError signal changes here
    await new Promise(r => setTimeout(r, 30));
    flush();

    // The asyncError signal change must not trigger another validator call
    expect(asyncValidator).toHaveBeenCalledTimes(1);
  });
});

describe("bind", () => {
  it("sets initial input value from signal", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "initial@example.com" } },
      });

      const el = document.createElement("input");
      const cleanup = form.bind("email")(el);

      expect(el.value).toBe("initial@example.com");
      cleanup();
      dispose();
    });
  });

  it("updates signal when input event fires", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      const el = document.createElement("input");
      const cleanup = form.bind("email")(el);

      el.value = "user@example.com";
      el.dispatchEvent(new Event("input"));
      flush();

      expect(form.fields.email.value()).toBe("user@example.com");
      cleanup();
      dispose();
    });
  });

  it("sets touched on blur", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      const el = document.createElement("input");
      const cleanup = form.bind("email")(el);

      expect(form.fields.email.touched()).toBe(false);
      el.dispatchEvent(new Event("blur"));
      flush();
      expect(form.fields.email.touched()).toBe(true);
      cleanup();
      dispose();
    });
  });

  it("cleanup removes event listeners", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      const el = document.createElement("input");
      const cleanup = form.bind("email")(el);
      cleanup();

      el.value = "user@example.com";
      el.dispatchEvent(new Event("input"));
      flush();

      expect(form.fields.email.value()).toBe("");
      dispose();
    });
  });

  it("throws when field name does not exist", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      expect(() => form.bind("nonexistent" as any)).toThrow(
        'createForm: unknown field "nonexistent"',
      );
      dispose();
    });
  });

  it("checkbox: sets initial checked from boolean signal", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { agree: { initial: false } } });

      const el = document.createElement("input");
      el.type = "checkbox";
      const cleanup = form.bind("agree" as any)(el);

      expect(el.checked).toBe(false);
      cleanup();
      dispose();
    });
  });

  it("checkbox: updates signal with boolean on change event", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { agree: { initial: false } } });

      const el = document.createElement("input");
      el.type = "checkbox";
      const cleanup = form.bind("agree" as any)(el);

      el.checked = true;
      el.dispatchEvent(new Event("change"));
      flush();

      expect(form.fields.agree.value()).toBe(true);
      cleanup();
      dispose();
    });
  });

  it("radio: sets initial checked from boolean signal", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { agree: { initial: true } } });

      const el = document.createElement("input");
      el.type = "radio";
      const cleanup = form.bind("agree" as any)(el);

      expect(el.checked).toBe(true);
      cleanup();
      dispose();
    });
  });

  it("radio: updates signal with boolean on change event", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { agree: { initial: false } } });

      const el = document.createElement("input");
      el.type = "radio";
      const cleanup = form.bind("agree" as any)(el);

      el.checked = true;
      el.dispatchEvent(new Event("change"));
      flush();

      expect(form.fields.agree.value()).toBe(true);
      cleanup();
      dispose();
    });
  });

  it("syncs DOM when signal changes programmatically", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      const el = document.createElement("input");
      const cleanup = form.bind("email")(el);

      form.fields.email.setValue("new@example.com");
      flush();

      expect(el.value).toBe("new@example.com");
      cleanup();
      dispose();
    });
  });

  it("cleanup stops signal→DOM sync", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      const el = document.createElement("input");
      const cleanup = form.bind("email")(el);
      cleanup();

      form.fields.email.setValue("ignored@example.com");
      flush();

      expect(el.value).toBe("");
      dispose();
    });
  });
});

describe("validate", () => {
  it("returns null when the cross-field rule passes", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          password: { initial: "secret" },
          confirm: { initial: "secret" },
        },
      });

      const matchError = form.validate(v =>
        v.password !== v.confirm ? "Passwords must match" : null,
      );

      expect(matchError()).toBe(null);
      dispose();
    });
  });

  it("returns an error message when the rule fails", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          password: { initial: "secret" },
          confirm: { initial: "different" },
        },
      });

      const matchError = form.validate(v =>
        v.password !== v.confirm ? "Passwords must match" : null,
      );

      expect(matchError()).toBe("Passwords must match");
      dispose();
    });
  });

  it("updates reactively when a field value changes", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          password: { initial: "secret" },
          confirm: { initial: "" },
        },
      });

      const matchError = form.validate(v =>
        v.password !== v.confirm ? "Passwords must match" : null,
      );

      expect(matchError()).toBe("Passwords must match");

      form.fields.confirm.setValue("secret");
      flush();
      expect(matchError()).toBe(null);

      dispose();
    });
  });

  it("factors into form.valid()", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          password: { initial: "secret" },
          confirm: { initial: "" },
        },
      });

      form.validate(v => (v.password !== v.confirm ? "Passwords must match" : null));

      expect(form.valid()).toBe(false);

      form.fields.confirm.setValue("secret");
      flush();
      expect(form.valid()).toBe(true);

      dispose();
    });
  });

  it("multiple validate() calls are all checked by valid()", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          min: { initial: 5 },
          max: { initial: 3 },
          step: { initial: 0 },
        },
      });

      form.validate(v => (v.min >= v.max ? "min must be less than max" : null));
      form.validate(v => (v.step <= 0 ? "step must be positive" : null));

      expect(form.valid()).toBe(false);

      form.fields.max.setValue(10);
      flush();
      expect(form.valid()).toBe(false); // step still invalid

      form.fields.step.setValue(1);
      flush();
      expect(form.valid()).toBe(true);

      dispose();
    });
  });

  it("does not submit when a form-level validator fails", async () => {
    const onSubmit = vi.fn();
    let submitPromise: Promise<void>;

    const dispose = createRoot(d => {
      const form = createForm({
        fields: {
          password: { initial: "secret" },
          confirm: { initial: "wrong" },
        },
        onSubmit,
      });

      form.validate(v => (v.password !== v.confirm ? "Passwords must match" : null));

      submitPromise = form.submit();
      return d;
    });

    await submitPromise!;
    expect(onSubmit).not.toHaveBeenCalled();
    dispose();
  });
});

describe("toFormData", () => {
  it("returns a FormData with all current field values", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "user@example.com" },
          name: { initial: "Alice" },
        },
      });

      const fd = toFormData(form.values());
      expect(fd.get("email")).toBe("user@example.com");
      expect(fd.get("name")).toBe("Alice");
      dispose();
    });
  });

  it("reflects updated values", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.fields.name.setValue("Bob");
      flush();

      expect(toFormData(form.values()).get("name")).toBe("Bob");
      dispose();
    });
  });

  it("omits null and undefined values", () => {
    const fd = toFormData({ tag: null, label: undefined, name: "Alice" });
    expect(fd.get("tag")).toBeNull();
    expect(fd.get("label")).toBeNull();
    expect(fd.get("name")).toBe("Alice");
  });

  it("omits false (unchecked checkbox semantics)", () => {
    const fd = toFormData({ agreed: false, name: "Alice", count: 0 });
    expect(fd.get("agreed")).toBeNull();
    expect(fd.get("name")).toBe("Alice");
    expect(fd.get("count")).toBe("0"); // 0 is not false — still included
  });
});

describe("formData", () => {
  it("returns FormData with all current field values", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "user@example.com" },
          name: { initial: "Alice" },
        },
      });

      const fd = form.formData();
      expect(fd.get("email")).toBe("user@example.com");
      expect(fd.get("name")).toBe("Alice");
      dispose();
    });
  });

  it("reflects updated values", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      form.fields.name.setValue("Bob");
      flush();

      expect(form.formData().get("name")).toBe("Bob");
      dispose();
    });
  });
});

describe("setValues", () => {
  it("updates multiple fields at once", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "" },
          name: { initial: "" },
        },
      });

      form.setValues({ email: "user@example.com", name: "Alice" });
      flush();

      expect(form.fields.email.value()).toBe("user@example.com");
      expect(form.fields.name.value()).toBe("Alice");
      dispose();
    });
  });

  it("accepts a partial update — only named fields change", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          email: { initial: "original@example.com" },
          name: { initial: "Original" },
        },
      });

      form.setValues({ name: "Updated" });
      flush();

      expect(form.fields.name.value()).toBe("Updated");
      expect(form.fields.email.value()).toBe("original@example.com");
      dispose();
    });
  });

  it("marks the form dirty after update", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.dirty()).toBe(false);
      form.setValues({ name: "Alice" });
      flush();
      expect(form.dirty()).toBe(true);
      dispose();
    });
  });

  it("ignores unknown field keys", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(() => form.setValues({ unknown: "x" } as any)).not.toThrow();
      dispose();
    });
  });

  it("does not affect touched state", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { name: { initial: "" } } });

      expect(form.fields.name.touched()).toBe(false);
      form.setValues({ name: "Alice" });
      flush();
      expect(form.fields.name.touched()).toBe(false);
      dispose();
    });
  });
});

describe("setError", () => {
  it("field.setError sets an external error visible via error()", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "user@example.com" } } });

      form.fields.email.setError("Email already registered");
      flush();
      expect(form.fields.email.error()).toBe("Email already registered");
      dispose();
    });
  });

  it("form.setError sets an external error on the named field", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "user@example.com" } } });

      form.setError("email", "Email already registered");
      flush();
      expect(form.fields.email.error()).toBe("Email already registered");
      dispose();
    });
  });

  it("external error makes valid() false", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "user@example.com" } } });

      expect(form.valid()).toBe(true);
      form.fields.email.setError("Email already registered");
      flush();
      expect(form.valid()).toBe(false);
      dispose();
    });
  });

  it("external error is included in errors()", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "user@example.com" } } });

      form.fields.email.setError("Email already registered");
      flush();
      expect(form.errors().email).toBe("Email already registered");
      dispose();
    });
  });

  it("external error is cleared when setValue is called", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "user@example.com" } } });

      form.fields.email.setError("Email already registered");
      flush();
      expect(form.fields.email.error()).toBe("Email already registered");

      form.fields.email.setValue("other@example.com");
      flush();
      expect(form.fields.email.error()).toBe(null);
      dispose();
    });
  });

  it("external error is cleared by reset()", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "" } } });

      form.fields.email.setError("Email already registered");
      flush();
      form.reset();
      flush();
      expect(form.fields.email.error()).toBe(null);
      dispose();
    });
  });

  it("setError(null) clears a previously set external error", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { email: { initial: "user@example.com" } } });

      form.fields.email.setError("Email already registered");
      flush();
      form.fields.email.setError(null);
      flush();
      expect(form.fields.email.error()).toBe(null);
      expect(form.valid()).toBe(true);
      dispose();
    });
  });

  it("validator error takes priority over external error", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: { email: { initial: "bad", validate: isEmail } },
      });

      // Dirty the field (still invalid) so the validator error is actually displayed under
      // "change" mode's dirty gate - otherwise there'd be nothing to take priority over yet.
      form.fields.email.setValue("still-bad");
      form.fields.email.setError("Server error");
      flush();
      // Client-side validator error wins — shown first
      expect(form.fields.email.error()).toBe("Invalid email");
      dispose();
    });
  });
});

describe("validate reactive invalidation", () => {
  it("valid() reflects a new cross-field rule added after it was first read", () => {
    createRoot(dispose => {
      const form = createForm({
        fields: {
          password: { initial: "secret" },
          confirm: { initial: "different" },
        },
      });

      // Read valid() before calling validate() — caches as true (no field validators)
      expect(form.valid()).toBe(true);

      // Now register a cross-field rule that currently fails
      form.validate(v => (v.password !== v.confirm ? "Passwords must match" : null));
      flush();

      // valid() must re-compute and reflect the new failing rule
      expect(form.valid()).toBe(false);
      dispose();
    });
  });
});

describe("bind with textarea", () => {
  it("sets initial value on a textarea", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { bio: { initial: "Hello" } } });

      const el = document.createElement("textarea");
      const cleanup = form.bind("bio")(el);

      expect(el.value).toBe("Hello");
      cleanup();
      dispose();
    });
  });

  it("updates signal when input event fires on textarea", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { bio: { initial: "" } } });

      const el = document.createElement("textarea");
      const cleanup = form.bind("bio")(el);

      el.value = "Updated bio";
      el.dispatchEvent(new Event("input"));
      flush();

      expect(form.fields.bio.value()).toBe("Updated bio");
      cleanup();
      dispose();
    });
  });
});

describe("bind with select", () => {
  function makeSelect(...values: string[]): HTMLSelectElement {
    const el = document.createElement("select");
    for (const v of values) {
      const opt = document.createElement("option");
      opt.value = v;
      el.append(opt);
    }
    return el;
  }

  it("sets initial value on a select element", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { role: { initial: "admin" } } });

      const el = makeSelect("admin", "user");
      const cleanup = form.bind("role")(el);

      expect(el.value).toBe("admin");
      cleanup();
      dispose();
    });
  });

  it("updates signal when select changes via input event", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { role: { initial: "admin" } } });

      const el = makeSelect("admin", "user");
      const cleanup = form.bind("role")(el);

      el.value = "user";
      el.dispatchEvent(new Event("input"));
      flush();

      expect(form.fields.role.value()).toBe("user");
      cleanup();
      dispose();
    });
  });

  it("syncs DOM when signal changes programmatically", () => {
    createRoot(dispose => {
      const form = createForm({ fields: { role: { initial: "admin" } } });

      const el = makeSelect("admin", "user");
      const cleanup = form.bind("role")(el);

      form.fields.role.setValue("user");
      flush();

      expect(el.value).toBe("user");
      cleanup();
      dispose();
    });
  });
});

describe("form ref", () => {
  it("intercepts submit event and prevents default", async () => {
    let submitPromise: Promise<void>;
    const onSubmit = vi.fn();

    const dispose = createRoot(d => {
      const form = createForm({
        fields: { name: { initial: "Alice" } },
        onSubmit: values => {
          onSubmit(values);
        },
      });

      const formEl = document.createElement("form");
      form.ref(formEl);

      const event = new SubmitEvent("submit", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      formEl.dispatchEvent(event);

      submitPromise = Promise.resolve();
      expect(preventDefaultSpy).toHaveBeenCalled();
      return d;
    });

    await submitPromise!;
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Alice" });
    dispose();
  });
});

describe("createFormResetListener", () => {
  const makeForm = () => {
    const form = document.createElement("form");
    document.body.appendChild(form);
    return form;
  };

  const cleanup = (form: HTMLFormElement) => {
    document.body.removeChild(form);
  };

  it("calls handler when the parent form is reset", () => {
    const form = makeForm();
    const div = document.createElement("div");
    form.appendChild(div);
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => div, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    cleanup(form);
  });

  it("calls handler multiple times on repeated resets", () => {
    const form = makeForm();
    const div = document.createElement("div");
    form.appendChild(div);
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => div, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    form.dispatchEvent(new Event("reset"));
    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(3);

    dispose();
    cleanup(form);
  });

  it("uses the .form property for native form elements (input)", () => {
    const form = makeForm();
    const input = document.createElement("input");
    form.appendChild(input);
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => input, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    cleanup(form);
  });

  it("uses the .form property for select elements", () => {
    const form = makeForm();
    const select = document.createElement("select");
    form.appendChild(select);
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => select, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    cleanup(form);
  });

  it("uses the .form property for textarea elements", () => {
    const form = makeForm();
    const textarea = document.createElement("textarea");
    form.appendChild(textarea);
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => textarea, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    cleanup(form);
  });

  it("does not call handler when element is null", () => {
    const form = makeForm();
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => null, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    expect(handler).not.toHaveBeenCalled();

    dispose();
    cleanup(form);
  });

  it("does not call handler when element has no parent form", () => {
    const orphan = document.createElement("div");
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => orphan, handler);
      return d;
    });

    flush();
    // no form to dispatch on — just verify no throw and no call
    expect(handler).not.toHaveBeenCalled();

    dispose();
  });

  it("removes the listener when disposed", () => {
    const form = makeForm();
    const div = document.createElement("div");
    form.appendChild(div);
    const handler = vi.fn();

    const dispose = createRoot(d => {
      createFormResetListener(() => div, handler);
      return d;
    });

    flush();
    dispose();

    form.dispatchEvent(new Event("reset"));
    expect(handler).not.toHaveBeenCalled();

    cleanup(form);
  });

  it("switches listener when the element signal changes", () => {
    const form1 = makeForm();
    const form2 = makeForm();
    const div1 = document.createElement("div");
    const div2 = document.createElement("div");
    form1.appendChild(div1);
    form2.appendChild(div2);
    const handler = vi.fn();

    const [el, setEl] = createSignal<HTMLElement>(div1, { ownedWrite: true });

    const dispose = createRoot(d => {
      createFormResetListener(el, handler);
      return d;
    });

    flush();
    form1.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    setEl(div2);
    flush();

    form1.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    form2.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(2);

    dispose();
    cleanup(form1);
    cleanup(form2);
  });

  it("removes listener when element signal becomes null", () => {
    const form = makeForm();
    const div = document.createElement("div");
    form.appendChild(div);
    const handler = vi.fn();

    const [el, setEl] = createSignal<HTMLElement | null>(div, { ownedWrite: true });

    const dispose = createRoot(d => {
      createFormResetListener(el, handler);
      return d;
    });

    flush();
    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    setEl(null);
    flush();

    form.dispatchEvent(new Event("reset"));
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    cleanup(form);
  });
});

describe("async validation state is derived in the same flush", () => {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  const slowOk = async (v: string) => {
    await sleep(15);
    return v === "taken@example.com" ? "Email already taken" : null;
  };

  it("never shows valid() while an async validator for the current value is outstanding", async () => {
    const frames: { value: string; pending: boolean; valid: boolean }[] = [];
    let form!: ReturnType<typeof createForm<any>>;
    const dispose = createRoot(d => {
      form = createForm({
        fields: { email: { initial: "", validate: [isEmail, slowOk] } },
      }) as any;
      createEffect(
        () => ({
          value: form.fields.email.value() as string,
          pending: form.fields.email.pending(),
          valid: form.valid(),
        }),
        f => {
          frames.push(f);
        },
      );
      return d;
    });
    flush();
    form.fields.email.setValue("ok@example.com");
    flush();
    // First committed frame for the new value: async validator not run yet, must be pending.
    const first = frames.find(f => f.value === "ok@example.com")!;
    expect(first.pending).toBe(true);
    expect(first.valid).toBe(false);

    await sleep(40);
    flush();
    expect(form.fields.email.pending()).toBe(false);
    expect(form.valid()).toBe(true);

    form.fields.email.setValue("taken@example.com");
    flush();
    const second = frames.filter(f => f.value === "taken@example.com")[0]!;
    expect(second.pending).toBe(true);
    expect(second.valid).toBe(false);
    await sleep(40);
    flush();
    expect(form.errors().email).toBe("Email already taken");

    // No frame ever claimed valid for a value whose async result was still outstanding.
    for (const f of frames) {
      if (f.valid) expect(f.pending).toBe(false);
    }
    expect(frames.filter(f => f.valid && f.value === "taken@example.com")).toEqual([]);
    dispose();
  });

  it("pending is true from mount while the initial async validation is outstanding", async () => {
    let form!: ReturnType<typeof createForm<any>>;
    const dispose = createRoot(d => {
      form = createForm({
        fields: {
          email: { initial: "a@b.co", validate: slowOk },
          plain: { initial: "" },
          syncOnly: { initial: "x", validate: minLength(1) },
        },
      }) as any;
      return d;
    });
    expect(form.fields.email.pending()).toBe(true);
    expect(form.fields.plain.pending()).toBe(false);
    expect(form.fields.syncOnly.pending()).toBe(false);
    expect(form.valid()).toBe(false);
    flush();
    await sleep(40);
    flush();
    expect(form.fields.email.pending()).toBe(false);
    expect(form.valid()).toBe(true);
    dispose();
  });

  it("keeps the previous async error visible while the next validation is in flight", async () => {
    const frames: { value: string; error: string | null; pending: boolean; valid: boolean }[] = [];
    let form!: ReturnType<typeof createForm<any>>;
    const dispose = createRoot(d => {
      form = createForm({
        fields: { email: { initial: "", validate: [isEmail, slowOk] } },
      }) as any;
      createEffect(
        () => ({
          value: form.fields.email.value() as string,
          error: form.fields.email.error() as string | null,
          pending: form.fields.email.pending(),
          valid: form.valid(),
        }),
        f => {
          frames.push(f);
        },
      );
      return d;
    });
    flush();
    const edit = async (v: string) => {
      form.fields.email.setValue(v);
      flush();
      await sleep(40);
      flush();
    };
    await edit("taken@example.com");
    expect(form.fields.email.error()).toBe("Email already taken");

    // edit: previous async error stays until the new result arrives, but state is not torn
    frames.length = 0;
    form.fields.email.setValue("other@example.com");
    flush();
    expect(frames).toEqual([
      { value: "other@example.com", error: "Email already taken", pending: true, valid: false },
    ]);
    await sleep(40);
    flush();
    expect(form.fields.email.error()).toBeNull();
    expect(form.valid()).toBe(true);

    // a sync error clears the async error and it does not resurface when the sync error clears
    await edit("taken@example.com");
    expect(form.fields.email.error()).toBe("Email already taken");
    form.fields.email.setValue("bad");
    flush();
    expect(form.fields.email.error()).toBe("Invalid email");
    form.fields.email.setValue("another@example.com");
    flush();
    expect(form.fields.email.error()).toBeNull();
    expect(form.fields.email.pending()).toBe(true);
    await sleep(40);
    flush();
    expect(form.valid()).toBe(true);
    dispose();
  });

  it("a sync error discards an async result still in flight for the previous value", async () => {
    let form!: ReturnType<typeof createForm<any>>;
    const dispose = createRoot(d => {
      form = createForm({
        fields: {
          email: { initial: "", validate: [isEmail, async () => (await sleep(15), "late error")] },
        },
      }) as any;
      return d;
    });
    flush();
    form.fields.email.setValue("ok@example.com");
    flush();
    expect(form.fields.email.pending()).toBe(true);
    form.fields.email.setValue("bad");
    flush();
    expect(form.fields.email.pending()).toBe(false);
    await sleep(40);
    flush();
    expect(form.errors().email).toBe("Invalid email");
    // back to a valid-looking value: re-validated, not served from the old result
    form.fields.email.setValue("ok@example.com");
    flush();
    expect(form.fields.email.pending()).toBe(true);
    expect(form.valid()).toBe(false);
    await sleep(40);
    flush();
    expect(form.errors().email).toBe("late error");
    dispose();
  });

  it("a value change mid-flight discards the older result; disposing with a validator in flight is safe", async () => {
    let form!: ReturnType<typeof createForm<any>>;
    const dispose = createRoot(d => {
      form = createForm({
        fields: {
          u: {
            initial: "a",
            validate: async (v: string) => (
              await sleep(v === "a" ? 30 : 5),
              v === "a" ? "old" : null
            ),
          },
        },
      }) as any;
      return d;
    });
    flush();
    form.fields.u.setValue("b");
    flush();
    await sleep(50);
    flush();
    expect(form.errors().u).toBeUndefined();
    expect(form.fields.u.pending()).toBe(false);
    form.fields.u.setValue("c");
    flush();
    dispose();
    await sleep(30);
    flush();
  });

  it("emits no effect-feedback diagnostics over several edits", async () => {
    const release = attribution.enable();
    const cap = OBSERVE!.diagnostics.capture();
    let form!: ReturnType<typeof createForm<any>>;
    const dispose = createRoot(d => {
      form = createForm({
        fields: { email: { initial: "", validate: [isEmail, slowOk] } },
      }) as any;
      createEffect(
        () => [form.fields.email.pending(), form.valid(), form.fields.email.error()],
        () => {},
      );
      return d;
    });
    flush();
    for (const v of ["a@b.co", "bad", "c@d.co", "taken@example.com", "e@f.co", "", "g@h.co"]) {
      form.fields.email.setValue(v);
      flush();
      await sleep(25);
      flush();
    }
    const codes = cap.stop().map(e => e.code);
    release();
    dispose();
    expect(codes.filter(c => c.startsWith("EFFECT_"))).toEqual([]);
  });
});
