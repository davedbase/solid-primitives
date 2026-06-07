// jsdom doesn't implement PointerEvent or DragEvent — shim them on top of MouseEvent.

class PointerEventShim extends MouseEvent {
  readonly pointerId: number;
  readonly width: number;
  readonly height: number;
  readonly pressure: number;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.width = init.width ?? 1;
    this.height = init.height ?? 1;
    this.pressure = init.pressure ?? 0;
    this.tiltX = init.tiltX ?? 0;
    this.tiltY = init.tiltY ?? 0;
    this.pointerType = init.pointerType ?? "mouse";
    this.isPrimary = init.isPrimary ?? true;
  }
}

class DragEventShim extends MouseEvent {
  readonly dataTransfer: DataTransfer | null;

  constructor(type: string, init: DragEventInit = {}) {
    super(type, init);
    this.dataTransfer = init.dataTransfer ?? null;
  }
}

// Install globally so test files can use `new PointerEvent(...)` / `new DragEvent(...)`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).PointerEvent = PointerEventShim;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).DragEvent = DragEventShim;
