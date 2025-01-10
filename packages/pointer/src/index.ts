import { Accessor, createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { createEventListener } from "@solid-primitives/event-listener";

function upsert_pointer(pointers: PointerEvent[], e: PointerEvent): PointerEvent[] {
  let i = 0
  for (;i < pointers.length && pointers[i]!.pointerId !== e.pointerId; i++) {}
  return pointers.toSpliced(i, 1, e)
}

function remove_pointer(pointers: PointerEvent[], e: PointerEvent): PointerEvent[] {
  for (let i = 0; i < pointers.length; i++) {
    if (pointers[i]!.pointerId === e.pointerId) {      
      return pointers.toSpliced(i, 1)
    }
  }
  return pointers
}

export type ListenerTarget = SVGSVGElement | HTMLElement | Window | Document

export function createPointers(
  target: ListenerTarget | Accessor<undefined | ListenerTarget> = () => document,
): Accessor<PointerEvent[]> {
  if (isServer) {
    return () => []
  }

  const [pointers, setPointers] = createSignal<PointerEvent[]>([])

  createEventListener(target, "pointermove",
    e => setPointers(p => upsert_pointer(p, e)),
  )
	createEventListener(target, "pointerdown",
    e => setPointers(p => upsert_pointer(p, e)),
  )
	createEventListener(target, "pointerup",
    e => setPointers(p => e.pointerType === "touch" ? remove_pointer(p, e) : upsert_pointer(p, e)),
  )
	createEventListener(target, "pointerleave",
    e => setPointers(p => remove_pointer(p, e)),
  )
	createEventListener(target, "pointercancel",
    e => setPointers(p => remove_pointer(p, e)),
  )

  return pointers
}
