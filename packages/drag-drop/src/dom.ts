export function applyStyle(el: HTMLElement, style: Partial<CSSStyleDeclaration> | undefined): void {
  if (!style) return;
  for (const [k, v] of Object.entries(style)) {
    (el.style as any)[k] = v as string;
  }
}

export function removeStyle(el: HTMLElement, style: Partial<CSSStyleDeclaration> | undefined): void {
  if (!style) return;
  for (const k of Object.keys(style)) {
    (el.style as any)[k] = "";
  }
}

export function applyClass(el: HTMLElement, classes: string | undefined): void {
  if (!classes) return;
  for (const cls of classes.split(" ")) {
    if (cls) el.classList.add(cls);
  }
}

export function removeClass(el: HTMLElement, classes: string | undefined): void {
  if (!classes) return;
  for (const cls of classes.split(" ")) {
    if (cls) el.classList.remove(cls);
  }
}
