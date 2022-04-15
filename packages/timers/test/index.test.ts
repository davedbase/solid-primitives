import { createRoot, createSignal } from "solid-js";
import { suite } from "uvu";
import * as assert from "uvu/assert";
import { createInterval, createTimeout } from "../src";

const test = suite("timers");

const sleep = (delay: number) => new Promise<void>(resolve => setTimeout(resolve, delay));

test("createTimeout and createInterval call and dispose when expected with number", async () => {
  let timeoutCount = 0;
  let intervalCount = 0;

  await createRoot(async dispose => {
    createTimeout(() => timeoutCount++, 100);
    createInterval(() => intervalCount++, 100);
    await sleep(50);
    dispose();
  });
  await sleep(100);
  assert.is(timeoutCount, 0);
  assert.is(intervalCount, 0);

  await createRoot(async dispose => {
    createTimeout(() => timeoutCount++, 100);
    createInterval(() => intervalCount++, 100);
    await sleep(50); // 0.5, account for drift
    assert.is(timeoutCount, 0);
    assert.is(intervalCount, 0);
    await sleep(100); // 1.5
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 1);
    await sleep(100); // 2.5
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 2);
    dispose();
  });
  await sleep(100); // 3.5
  assert.is(timeoutCount, 1);
  assert.is(intervalCount, 2);
});

test("createInterval calls when expected with accessor", async () => {
  let timeoutCount = 0;
  let intervalCount = 0;

  await createRoot(async dispose => {
    const [delay, setDelay] = createSignal(100);
    createTimeout(() => timeoutCount++, delay);
    createInterval(() => intervalCount++, delay);
    await sleep(50);
    setDelay(200);
    await sleep(60);
    assert.is(timeoutCount, 0);
    assert.is(intervalCount, 0);
    await sleep(80);
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 1);
    dispose();
  });

  timeoutCount = 0;
  intervalCount = 0;

  await createRoot(async dispose => {
    const [delay, setDelay] = createSignal(100);
    createTimeout(() => timeoutCount++, delay);
    createInterval(() => intervalCount++, delay);
    await sleep(50); // 0.5, account for drift
    assert.is(timeoutCount, 0);
    assert.is(intervalCount, 0);
    await sleep(100); // 1.5
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 1);
    await sleep(100); // 2.5
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 2);
    setDelay(200);
    await sleep(60); // 2.8
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 2);
    await sleep(80); // 3.2
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 3);
    await sleep(200); // 4.2
    assert.is(timeoutCount, 1);
    assert.is(intervalCount, 4);
    dispose();
  });

  await sleep(200); // 5.2
  assert.is(timeoutCount, 1);
  assert.is(intervalCount, 4);
});

test.run();
