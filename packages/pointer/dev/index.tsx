import { createPointerListeners, pointerHover, createPointerList } from "../src/index-ols.js";
import { Component, createSignal, For } from "solid-js";

pointerHover;

const App: Component = () => {
  const [poz, setPoz] = createSignal({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = createSignal(false);
  // const [points, setPoints] = createSignal<Accessor<Position>[]>([]);

  let ref!: HTMLDivElement;

  createPointerListeners({
    // target: () => ref
    // pointerTypes: ["touch"],
    onEnter: e => console.log("Enter"),
    onGotCapture: e => console.log("GotCapture"),
    onCancel: e => console.log("Cancel"),
    onLeave: e => console.log("Leave"),
    onLostCapture: e => console.log("LostCapture"),
    onDown: e => console.log("Down"),
    onUp: e => console.log("Up"),
    onMove: e => setPoz({ x: e.x, y: e.y }),
  });

  const points = createPointerList();

  // createPerPointerListeners({
  //   onEnter({ x, y, pointerId }, { onMove, onLeave, onDown }) {
  //     console.log("New pointer:", pointerId);
  //     onDown(e => {
  //       onLeave(e => {});
  //     });
  //     const [point, setPoint] = createSignal({ x, y });
  //     setPoints(p => push(p, point));
  //     onMove(e => setPoint({ x: e.x, y: e.y }));
  //     onLeave(e => {
  //       setPoint({ x: e.x, y: e.y });
  //       setPoints(p => remove(p, point));
  //     });
  //   }
  //   // onDown({ x, y, pointerId }, onMove, onUp) {
  //   //   console.log("New pointer:", pointerId);
  //   //   const [point, setPoint] = createSignal({ x, y });
  //   //   setPoints(p => push(p, point));
  //   //   onMove(e => setPoint({ x: e.x, y: e.y }));
  //   //   onUp(e => {
  //   //     setPoint({ x: e.x, y: e.y });
  //   //     setPoints(p => remove(p, point));
  //   //   });
  //   // }
  // });

  // const state = createPointerPosition();

  return (
    <>
      <div
        class="min-h-150vh box-border flex w-full flex-col items-center justify-center space-y-4 bg-gray-800 p-24 text-white"
        classList={{
          "!bg-cyan-700": isHovering(),
        }}
        style={{ "touch-action": "pan-y" }}
      >
        <div ref={ref} class="wrapper-v" use:pointerHover={setIsHovering}>
          <p class="caption">x = {Math.round(poz().x)}</p>
          <p class="caption">y = {Math.round(poz().y)}</p>
          <p class="caption">{isHovering() ? "hovering" : "not hovering"}</p>
        </div>
        <div ref={ref} class="wrapper-v">
          {/* <p class="break-words max-w-80vw">{JSON.stringify(state())}</p> */}
        </div>
      </div>
      <For each={points()}>
        {poz => (
          <div
            class="ball bg-yellow-600"
            style={{
              transform: `translate(${poz().x}px, ${poz().y}px)`,
            }}
          ></div>
        )}
      </For>
    </>
  );
};

export default App;
