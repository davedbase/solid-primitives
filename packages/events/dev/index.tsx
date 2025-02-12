import { createEffect, onCleanup } from "solid-js";
import { createEvent, createSubject, halt } from "../src/index.js";

function Counter() {
  const [onStart, emitStart] = createEvent();
  const [onPause, emitPause] = createEvent();
  const [onSet, emitSet] = createEvent<number>();
  const [onReset, emitReset] = createEvent();
  const [onIncrement, emitIncrement] = createEvent();
  const [onDecrement, emitDecrement] = createEvent();
  const [onTimerChange, emitTimerChange] = createEvent<number>();

  const onInvalidTimerChange = onTimerChange(n => (n > 0 ? null : true));

  const timerActive = createSubject(
    true,
    onStart(() => true),
    onPause(() => false),
    onInvalidTimerChange(() => false),
  );

  const count = createSubject<number>(
    0,
    onSet,
    onReset(() => 0),
    onIncrement(() => c => c + 1),
    onDecrement(() => c => c - 1),
  );

  const delay = createSubject(
    500,
    onTimerChange(n => (n > 0 ? n : halt())),
  );

  createEffect(() => {
    if (delay() && timerActive()) {
      const i = setInterval(emitIncrement, delay());
      onCleanup(() => clearInterval(i));
    }
  });

  return (
    <div>
      <span class="rounded bg-amber-100 p-4 text-3xl">{count()}</span>
      <div class="my-8 flex flex-col items-center gap-3">
        <div class="flex gap-2">
          <button
            onClick={emitStart}
            class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:bg-gray-500"
            disabled={timerActive()}
          >
            Start
          </button>
          <label class="flex items-center gap-2 px-2">
            <span>Timer</span>
            <input
              type="number"
              class="w-14 border-b text-center font-bold"
              value={delay()}
              onInput={e => emitTimerChange(Number(e.currentTarget.value))}
            />
            <span>ms</span>
          </label>
          <button
            onClick={emitPause}
            class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:bg-gray-500"
            disabled={!timerActive()}
          >
            Pause
          </button>
        </div>
        <div class="flex gap-2">
          <button
            onClick={() => emitSet(10)}
            class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Set To 10
          </button>
          <button
            onClick={emitReset}
            class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Reset to 0
          </button>
        </div>
        <div class="flex gap-2">
          <button
            onClick={emitIncrement}
            class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Increment
          </button>
          <button
            onClick={emitDecrement}
            class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Decrement
          </button>
        </div>
      </div>
    </div>
  );
}

export default Counter;
