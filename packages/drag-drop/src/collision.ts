import type { CollisionDetector } from "./types.js";

/** Returns the droppable whose center is nearest to the pointer. Uses squared distance — no sqrt needed. */
export const closestCenter: CollisionDetector = (_draggable, droppables, pointer) => {
  let best: string | number | null = null;
  let bestDistSq = Infinity;
  const px = pointer.x, py = pointer.y;
  for (const d of droppables) {
    const dx = px - (d.rect.left + d.rect.width * 0.5);
    const dy = py - (d.rect.top + d.rect.height * 0.5);
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) { bestDistSq = distSq; best = d.id; }
  }
  return best;
};

/** Returns the droppable whose nearest corner is closest to the pointer. Uses squared distance — no sqrt needed. */
export const closestCorners: CollisionDetector = (_draggable, droppables, pointer) => {
  let best: string | number | null = null;
  let bestDistSq = Infinity;
  const px = pointer.x, py = pointer.y;
  for (const d of droppables) {
    const { left, right, top, bottom } = d.rect;
    let dx: number, dy: number, distSq: number;
    // top-left
    dx = px - left;  dy = py - top;    distSq = dx * dx + dy * dy; if (distSq < bestDistSq) { bestDistSq = distSq; best = d.id; }
    // top-right
    dx = px - right; dy = py - top;    distSq = dx * dx + dy * dy; if (distSq < bestDistSq) { bestDistSq = distSq; best = d.id; }
    // bottom-left
    dx = px - left;  dy = py - bottom; distSq = dx * dx + dy * dy; if (distSq < bestDistSq) { bestDistSq = distSq; best = d.id; }
    // bottom-right
    dx = px - right; dy = py - bottom; distSq = dx * dx + dy * dy; if (distSq < bestDistSq) { bestDistSq = distSq; best = d.id; }
  }
  return best;
};

/** Returns the droppable with the largest overlap area with the draggable. */
export const rectIntersection: CollisionDetector = (draggable, droppables) => {
  const dr = draggable.rect;
  let best: string | number | null = null;
  let bestArea = 0;
  for (const d of droppables) {
    const r = d.rect;
    const xOverlap = Math.max(0, Math.min(dr.right, r.right) - Math.max(dr.left, r.left));
    const yOverlap = Math.max(0, Math.min(dr.bottom, r.bottom) - Math.max(dr.top, r.top));
    const area = xOverlap * yOverlap;
    if (area > bestArea) { bestArea = area; best = d.id; }
  }
  return best;
};

/** Returns the topmost droppable whose rect contains the pointer. */
export const pointerWithin: CollisionDetector = (_draggable, droppables, pointer) => {
  const px = pointer.x, py = pointer.y;
  for (let i = droppables.length - 1; i >= 0; i--) {
    const d = droppables[i]!;
    const r = d.rect;
    if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) return d.id;
  }
  return null;
};
