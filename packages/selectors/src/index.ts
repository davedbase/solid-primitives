import { createSelector } from "solid-js";

/**
 * Wrapper around `createSelector` to create a selector for an array.
 *
 * @param source - source array signal to create the selector from
 * @param options - set computation name for debugging purposes
 * @returns selector for the array
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/selectors#createArraySelector
 *
 * @example
 * const list: string[] = [...]
 * const [selectedItems] = createSignal<string[]>([])
 * const isSelected = createArraySelector(selectedItems)
 * <For each={list}>
 *   {(item) => 
 *    <li classList={{ active: isSelected(item) }}>
 *      {item}
 *    </li>}
 * </For>
 */
export function createArraySelector<T>(
  source: () => Array<T>,
  options?: { name?: string },
): (k: T) => boolean {
  const selector = createSelector<Array<T>, T>(
    source,
    (a, b) => {
      return b.includes(a);
    },
    options,
  );
  return selector;
}
