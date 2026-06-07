import type { CollisionDetector, Point } from "./types.js";

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function center(rect: DOMRect): Point {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function corners(rect: DOMRect): Point[] {
  return [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.left, y: rect.bottom },
    { x: rect.right, y: rect.bottom },
  ];
}

/** Returns the droppable whose center is nearest to the pointer. */
export const closestCenter: CollisionDetector = (_draggable, droppables, pointer) => {
  let best: string | number | null = null;
  let bestDist = Infinity;
  for (const d of droppables) {
    const distance = dist(pointer, center(d.rect));
    if (distance < bestDist) {
      bestDist = distance;
      best = d.id;
    }
  }
  return best;
};

/** Returns the droppable whose nearest corner is closest to the pointer. */
export const closestCorners: CollisionDetector = (_draggable, droppables, pointer) => {
  let best: string | number | null = null;
  let bestDist = Infinity;
  for (const d of droppables) {
    for (const corner of corners(d.rect)) {
      const distance = dist(pointer, corner);
      if (distance < bestDist) {
        bestDist = distance;
        best = d.id;
      }
    }
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
    if (area > bestArea) {
      bestArea = area;
      best = d.id;
    }
  }
  return best;
};

/** Returns the topmost droppable whose rect contains the pointer. */
export const pointerWithin: CollisionDetector = (_draggable, droppables, pointer) => {
  for (let i = droppables.length - 1; i >= 0; i--) {
    const d = droppables[i]!;
    const r = d.rect;
    if (pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom) {
      return d.id;
    }
  }
  return null;
};
