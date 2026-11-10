export type FaviconRel = "icon" | "shortcut icon" | "apple-touch-icon";

export type FaviconOptions = {
  /** `rel` attribute of the favicon `<link>` element. */
  rel?: FaviconRel;
};

export type FaviconController = {
  /** The href currently applied to the favicon link. */
  readonly href: string;
  /** Update the favicon href. */
  setHref: (href: string) => void;
  /** Restores the href captured before this controller ran, or removes the link it created. */
  dispose: () => void;
};

/**
 * Resolves `href` the way a `<link>`'s `href` property reports it: against the document base URL,
 * falling back to the raw string when it can't be parsed. Lets callers derive the applied href
 * from their inputs instead of mirroring it back out of the DOM element after an effect.
 */
export function resolveFaviconHref(href: string): string {
  try {
    return new URL(href, document.baseURI).href;
  } catch {
    return href;
  }
}

/**
 * Finds the document's favicon `<link>` for the given `rel`, creating and appending one if none
 * exists. Captures whatever href was present before this call so callers can restore it later —
 * each call snapshots independently, so sequential/nested callers compose like a stack as long as
 * disposal happens in reverse of creation order (the normal case for component mount/unmount).
 */
export function bindFaviconLink(rel: FaviconRel, href: string): FaviconController {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  const created = link == null;
  // The raw attribute, not the `.href` IDL property — the property resolves a missing attribute
  // to `""` (a real, if empty, value), which would lose the "no href at all" case on restore.
  const previousHref = link?.getAttribute("href") ?? undefined;

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
  const el = link;

  return {
    get href() {
      return el.href;
    },
    setHref(next: string) {
      el.href = next;
    },
    dispose() {
      if (created) {
        el.remove();
      } else if (previousHref !== undefined) {
        el.href = previousHref;
      } else {
        el.removeAttribute("href");
      }
    },
  };
}
