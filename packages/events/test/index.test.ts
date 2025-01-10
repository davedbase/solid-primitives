import { createRoot } from "solid-js";
import { describe, expect, test } from "vitest";
import { createEvent, createPartition, createTopic, halt } from "../src/index.js";
import { setTimeout } from "timers/promises";

describe(`createEvent`, () => {
  test(`emits to callback`, () => {
    const messages = [] as string[];

    const d = createRoot(d => {
      const [on, emit] = createEvent();
      on(p => messages.push(p));
      emit(`hello`);
      return d;
    });

    expect(messages).toEqual([`hello`]);
    d();
  });

  test(`emits to callback asynchronously`, async () => {
    const messages = [] as string[];

    const [d, emit] = createRoot(d => {
      const [on, emit] = createEvent();
      on(p => messages.push(p));
      emit(`hello`);
      return [d, emit];
    });

    expect(messages).toEqual([`hello`]);

    await setTimeout(10);
    emit(`world`);
    expect(messages).toEqual([`hello`, `world`]);
    d();
  });

  test(`cleans up with the root`, () => {
    const messages = [] as string[];

    const [d, emit] = createRoot(d => {
      const [on, emit] = createEvent();
      on(p => messages.push(p));
      emit(`hello`);
      return [d, emit];
    });

    expect(messages).toEqual([`hello`]);
    d();
    emit(`world`);
    expect(messages).toEqual([`hello`]);
  });

  test(`transforms into new handler`, () => {
    const messages = [] as string[];

    const d = createRoot(d => {
      const [on, emit] = createEvent();
      const on2 = on(p => `Decorated: ${p}`);
      on2(p => messages.push(p));
      emit(`hello`);
      return d;
    });

    expect(messages).toEqual([`Decorated: hello`]);
    d();
  });

  test(`halts`, () => {
    const messages = [] as string[];

    const d = createRoot(d => {
      const [on, emit] = createEvent<string>();
      const onValid = on(p => (p.length < 3 ? halt() : p));
      onValid(p => messages.push(p));
      emit(`hello`);
      emit(`hi`);
      return d;
    });

    expect(messages).toEqual([`hello`]);
    d();
  });

  test(`flattens a promise`, async () => {
    const messages = [] as string[];

    const d = createRoot(d => {
      const [on, emit] = createEvent<string>();
      const onAsync = on(async p => {
        await setTimeout(10);
        return p;
      });
      onAsync(p => messages.push(p));
      emit(`hello`);
      return d;
    });

    await setTimeout(10);

    expect(messages).toEqual([`hello`]);
    d();
  });
});

describe(`createPartition`, () => {
  test(`partitions an event`, () => {
    const messages = [] as string[];

    const d = createRoot(d => {
      const [on, emit] = createEvent<string>();
      const [onValid, onInvalid] = createPartition(on, p => p.length >= 3);
      onValid(p => messages.push(`valid: ${p}`));
      onInvalid(p => messages.push(`invalid: ${p}`));

      emit(`hello`);
      emit(`hi`);

      return d;
    });

    expect(messages).toEqual([`valid: hello`, `invalid: hi`]);
    d();
  });
});

describe(`createTopic`, () => {
  test(`merges events`, () => {
    const messages = [] as string[];

    const d = createRoot(d => {
      const [on1, emit1] = createEvent<string>();
      const [on2, emit2] = createEvent<string>();
      const on = createTopic(on1, on2);
      on(p => messages.push(p));

      emit1(`hello`);
      emit2(`world`);

      return d;
    });

    expect(messages).toEqual([`hello`, `world`]);
    d();
  });
});

describe(`createSubject`, () => {
  test.todo(`need effects to run on server to test signals`);
});
