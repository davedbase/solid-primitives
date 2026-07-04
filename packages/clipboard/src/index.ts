import { access, type MaybeAccessor } from "@solid-primitives/utils";
import {
  type Accessor,
  createEffect,
  createResource,
  type InitializedResource,
  on,
  onCleanup,
} from "solid-js";
import { isServer } from "solid-js/web";

export type ClipboardSetter = (data: string | ClipboardItem[]) => Promise<void>;
export type NewClipboardItem = (
  type: string,
  data: string | Blob | PromiseLike<string | Blob>,
) => ClipboardItem;
export type HighlightModifier = (el: any) => void;
export type Highlighter = (start?: number, end?: number) => HighlightModifier;
export type CopyToClipboardOptions = {
  value?: any;
  setter?: ClipboardSetter;
  highlight?: HighlightModifier;
};

export type ClipboardResourceItem = {
  readonly type: string;
  readonly text: string | undefined;
  readonly blob: Blob;
};

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      copyToClipboard: CopyToClipboardOptions | true;
    }
  }
}

/**
 * Async write to the clipboard
 * @param data - Data to write to the clipboard - either a string or ClipboardItem array.
 */
export const writeClipboard: ClipboardSetter = async data => {
  if (isServer) {
    return;
  }

  typeof data === "string"
    ? await navigator.clipboard.writeText(data)
    : await navigator.clipboard.write(data);
};

/**
 * Async read from the clipboard
 * @return Promise of ClipboardItem array
 */
export function readClipboard(): Promise<ClipboardItem[]> {
  if (isServer) {
    return Promise.resolve([]);
  }

  return navigator.clipboard.read();
}

/**
 * @deprecated Use `readClipboard`, `writeClipboard` and `newClipboardItem` instead.
 */
export const makeClipboard = (): [
  writeClipboard: ClipboardSetter,
  readClipboard: () => Promise<ClipboardItems | undefined>,
  newClipboardItem: NewClipboardItem,
] => {
  return [writeClipboard, readClipboard, newClipboardItem];
};

/**
 * Creates a new reactive primitive for managing the clipboard.
 *
 * @param data - Data signal to write to the clipboard.
 * @param deferInitial - When false, also writes the initial signal value on mount. Defaults to true (skip first write).
 * @return Returns a resource representing the clipboard elements and children.
 *
 * @example
 * const [data, setData] = createSignal('Foo bar');
 * const [ clipboard, read ] = createClipboard(data);
 */
export const createClipboard = (
  data?: Accessor<string | ClipboardItem[]>,
  deferInitial?: boolean,
): [
  clipboardItems: InitializedResource<ClipboardResourceItem[]>,
  refetch: VoidFunction,
  write: ClipboardSetter,
] => {
  if (isServer) {
    return [
      Object.assign(() => [], { loading: false, error: undefined }) as any,
      () => void 0,
      async () => void 0,
    ];
  }

  let init = true;
  const [clipboard, { refetch }] = createResource<ClipboardResourceItem[]>(
    async (_, info) => {
      if (init) {
        init = false;
        return info.value!;
      }

      try {
        const items = await readClipboard();
        if (!items.length) return [];

        return Promise.all(
          items.map(async item => {
            const type = item.types[item.types.length - 1]!;
            const blob = await item.getType(type);
            const text = blob.type === "text/plain" ? await blob.text() : undefined;
            return { type, blob, text };
          }),
        );
      } catch {
        return [];
      }
    },
    { initialValue: [] },
  );

  navigator.clipboard.addEventListener("clipboardchange", refetch);
  onCleanup(() => navigator.clipboard.removeEventListener("clipboardchange", refetch));
  if (data) {
    createEffect(on(data, () => writeClipboard(data()), { defer: deferInitial !== false }));
  }

  return [clipboard, refetch, writeClipboard];
};

/**
 * A helpful directive that makes it easy to copy data to clipboard directly.
 * Using it on input should capture it's value, on an HTMLElement will use innerHTML.
 *
 * @param el - Element to bind to
 * @param options - Options to supply the directive with:
 * - `value` — Value to override the clipboard with.
 * - `write` — Optional write method to use for the clipboard action.
 * - `highlight` — The highlight modifier to use for the current element.
 *
 * @example
 * ```ts
 * <input type="text" use:copyToClipboard />
 * ```
 */
export const copyToClipboard = (
  el: HTMLElement,
  options: MaybeAccessor<CopyToClipboardOptions>,
) => {
  if (isServer) {
    return undefined;
  }
  const setValue = () => {
    const opts: CopyToClipboardOptions = access(options);
    let data = opts.value;
    if (!data) {
      // @ts-ignore
      data = el[["input", "texfield"].includes(el.tagName.toLowerCase()) ? "value" : "innerHTML"];
    }
    let write;
    if (opts.setter) {
      write = opts.setter;
    } else {
      write = async (data: any) => await navigator.clipboard.writeText(data);
    }
    if (opts.highlight) opts.highlight(el);
    write(data);
  };
  el.addEventListener("click", setValue);
  onCleanup(() => el.removeEventListener("click", setValue));
};

/**
 * newClipboardItem is a wrapper method around creating new ClipboardItems.
 *
 * @param type - The MIME type of the item to create
 * @param data - Data to populate the item with
 * @returns Provides a ClipboardItem object
 */
export const newClipboardItem: NewClipboardItem = (type, data) =>
  new ClipboardItem({ [type]: data });

/**
 * @deprecated Use `newClipboardItem` instead.
 */
export const newItem = newClipboardItem;

/**
 * A modifier that highlights/selects a range on an HTML element.
 *
 * @param start - Starting point to highlight
 * @param end - Ending point to highlight
 * @returns Returns a modifier function.
 */
export const element: Highlighter = (start: number = 0, end: number = 0) => {
  return (node: HTMLElement) => {
    const text = node.childNodes[0]!;
    const range = new Range();
    range.setStart(text, start);
    range.setEnd(text, end);
    const selection = document.getSelection();
    selection!.removeAllRanges();
    selection!.addRange(range);
  };
};

/**
 * A modifier that highlights/selects a range on an HTML input element.
 *
 * @param start - Starting point to highlight
 * @param end - Ending point to highlight
 * @returns Returns a modifier function.
 */
export const input: Highlighter = (start?: number, end?: number) => {
  return (node: HTMLInputElement) => {
    node.setSelectionRange(start || 0, end || node.value.length);
  };
};
