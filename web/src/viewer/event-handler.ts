import type { Intersection, Object3D } from "three";
import type { ViewportRenderer } from "./viewport-renderer";

export type ViewerEventType = "click" | "hover" | "hoverend" | "doubleclick";

export interface BaseEventData {
  originalEvent: PointerEvent;
  intersection: Intersection | null;
  object: Object3D | null;
  position: { x: number; y: number };
}

export interface ClickEventData extends BaseEventData {
  type: "click";
}

export interface DoubleClickEventData extends BaseEventData {
  type: "doubleclick";
}

export interface HoverEventData extends BaseEventData {
  type: "hover";
}

export interface HoverEndEventData {
  type: "hoverend";
  object: Object3D | null;
}

export type ViewerEventData =
  | ClickEventData
  | DoubleClickEventData
  | HoverEventData
  | HoverEndEventData;

export type ViewerEventListener<T extends ViewerEventData = ViewerEventData> = (
  data: T
) => void;

export class ViewerEventHandler {
  private readonly renderer: ViewportRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly listeners = new Map<
    ViewerEventType,
    Set<ViewerEventListener>
  >();

  private hoveredObject: Object3D | null = null;
  private hoverCheckInterval: number | null = null;
  private lastClickTime = 0;
  private readonly doubleClickThreshold = 300;

  constructor(renderer: ViewportRenderer, canvas: HTMLCanvasElement) {
    this.renderer = renderer;
    this.canvas = canvas;

    this.setupEventListeners();
  }

  on<T extends ViewerEventType>(
    type: T,
    listener: ViewerEventListener<Extract<ViewerEventData, { type: T }>>
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as ViewerEventListener);
  }

  off<T extends ViewerEventType>(
    type: T,
    listener: ViewerEventListener<Extract<ViewerEventData, { type: T }>>
  ): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(listener as ViewerEventListener);
    }
  }

  removeAllListeners(type?: ViewerEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  dispose(): void {
    this.stopHoverCheck();
    this.removeEventListeners();
    this.listeners.clear();
    this.hoveredObject = null;
  }

  private emit<T extends ViewerEventData>(data: T): void {
    const typeListeners = this.listeners.get(data.type);
    if (typeListeners) {
      typeListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${data.type} event listener:`, error);
        }
      });
    }
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
  }

  private removeEventListeners(): void {
    this.canvas.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
  }

  private handleClick = (event: PointerEvent): void => {
    const result = this.renderer.raycastFromEvent(event);
    const now = Date.now();
    const isDoubleClick = now - this.lastClickTime < this.doubleClickThreshold;

    const baseData: BaseEventData = {
      originalEvent: event,
      intersection: result?.intersection ?? null,
      object: result?.intersection.object ?? null,
      position: result?.position ?? { x: 0, y: 0 },
    };

    if (isDoubleClick) {
      this.emit<DoubleClickEventData>({
        ...baseData,
        type: "doubleclick",
      });
      this.lastClickTime = 0;
    } else {
      this.emit<ClickEventData>({
        ...baseData,
        type: "click",
      });
      this.lastClickTime = now;
    }
  };
  
  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.hoverCheckInterval) {
      this.startHoverCheck();
    }
  };

  private handlePointerLeave = (): void => {
    this.stopHoverCheck();
    this.clearHoveredObject();
  };

  private startHoverCheck(): void {
    if (this.hoverCheckInterval !== null) return;

    const check = () => {
      this.checkHover();
      this.hoverCheckInterval = requestAnimationFrame(check) as unknown as number;
    };
    check();
  }

  private stopHoverCheck(): void {
    if (this.hoverCheckInterval !== null) {
      cancelAnimationFrame(this.hoverCheckInterval);
      this.hoverCheckInterval = null;
    }
  }

  private checkHover(): void {
    const intersection = this.renderer.raycast();
    const newObject = intersection?.object ?? null;

    if (newObject !== this.hoveredObject) {
      if (this.hoveredObject) {
        this.emit<HoverEndEventData>({
          type: "hoverend",
          object: this.hoveredObject,
        });
      }

      this.hoveredObject = newObject;

      if (newObject) {
        const rect = this.canvas.getBoundingClientRect();
        const syntheticEvent = new PointerEvent("pointermove", {
          clientX: rect.left + (this.renderer["pointer"].x + 1) * rect.width / 2,
          clientY: rect.top + (1 - this.renderer["pointer"].y) * rect.height / 2,
        });

        this.emit<HoverEventData>({
          type: "hover",
          originalEvent: syntheticEvent,
          intersection,
          object: newObject,
          position: {
            x: (this.renderer["pointer"].x + 1) * rect.width / 2,
            y: (1 - this.renderer["pointer"].y) * rect.height / 2,
          },
        });
      }
    }
  }

  private clearHoveredObject(): void {
    if (this.hoveredObject) {
      this.emit<HoverEndEventData>({
        type: "hoverend",
        object: this.hoveredObject,
      });
      this.hoveredObject = null;
    }
  }
}
