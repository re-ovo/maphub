import { Raycaster, Vector2, type Intersection, type Object3D } from "three";
import type { ViewportRenderer } from "./viewport-renderer";
import {
  RenderBase,
  type ClickEvent,
  type HoverEnterEvent,
  type HoverLeaveEvent,
} from "./types/render-base";
import type { ElementNode } from "./types/element";

function isRenderBase(obj: Object3D): obj is RenderBase<ElementNode, unknown> {
  return obj instanceof RenderBase;
}

/**
 * 沿父级链查找最近的 RenderBase 对象
 */
function findRenderBase(
  obj: Object3D
): RenderBase<ElementNode, unknown> | null {
  let current: Object3D | null = obj;
  while (current) {
    if (isRenderBase(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

export interface RaycastHit {
  target: RenderBase<ElementNode, unknown>;
  intersection: Intersection;
}

/**
 * 视口事件处理器 - 处理鼠标交互并分发事件给 RenderBase 对象
 */
export class ViewerEventHandler {
  private readonly renderer: ViewportRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();

  private hoveredTarget: RenderBase<ElementNode, unknown> | null = null;
  private disposed = false;

  // 绑定的事件处理函数引用（用于移除监听器）
  private readonly boundPointerMove: (e: PointerEvent) => void;
  private readonly boundClick: (e: PointerEvent) => void;
  private readonly boundPointerLeave: (e: PointerEvent) => void;

  constructor(renderer: ViewportRenderer, canvas: HTMLCanvasElement) {
    this.renderer = renderer;
    this.canvas = canvas;

    // 绑定事件处理函数
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundPointerLeave = this.handlePointerLeave.bind(this);

    // 注册事件监听器
    this.canvas.addEventListener("pointermove", this.boundPointerMove);
    this.canvas.addEventListener("click", this.boundClick);
    this.canvas.addEventListener("pointerleave", this.boundPointerLeave);
  }

  /**
   * 更新指针坐标为标准化设备坐标 (NDC)
   */
  private updatePointer(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 执行射线检测，返回第一个命中的 RenderBase 对象
   */
  private raycast(): RaycastHit | null {
    this.raycaster.setFromCamera(this.pointer, this.renderer.camera);
    const intersects = this.raycaster.intersectObjects(
      this.renderer.scene.children,
      true
    );

    for (const intersection of intersects) {
      const renderBase = findRenderBase(intersection.object);
      if (renderBase) {
        return { target: renderBase, intersection };
      }
    }

    return null;
  }

  /**
   * 处理指针移动事件
   */
  private handlePointerMove(event: PointerEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hit = this.raycast();
    const newTarget = hit?.target ?? null;

    // 如果 hover 目标发生变化
    if (newTarget !== this.hoveredTarget) {
      // 离开旧目标
      if (this.hoveredTarget) {
        this.dispatchHoverLeave(this.hoveredTarget, event);
      }

      // 进入新目标
      if (newTarget && hit) {
        this.dispatchHoverEnter(newTarget, hit.intersection, event);
      }

      this.hoveredTarget = newTarget;
    }
  }

  /**
   * 处理点击事件
   */
  private handleClick(event: PointerEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hit = this.raycast();

    if (hit) {
      this.dispatchClick(hit.target, hit.intersection, event);
    }
  }

  /**
   * 处理指针离开 canvas 事件
   */
  private handlePointerLeave(event: PointerEvent): void {
    if (this.disposed) return;

    if (this.hoveredTarget) {
      this.dispatchHoverLeave(this.hoveredTarget, event);
      this.hoveredTarget = null;
    }
  }

  /**
   * 分发 hoverenter 事件
   */
  private dispatchHoverEnter(
    target: RenderBase<ElementNode, unknown>,
    intersection: Intersection,
    originalEvent: PointerEvent
  ): void {
    const event: HoverEnterEvent = {
      type: "hoverenter",
      intersection,
      originalEvent,
    };

    // 触发 Three.js 事件系统
    target.dispatchEvent(event);

    // 调用实例方法（如果存在）
    target.onHoverEnter?.(event);
  }

  /**
   * 分发 hoverleave 事件
   */
  private dispatchHoverLeave(
    target: RenderBase<ElementNode, unknown>,
    originalEvent: PointerEvent
  ): void {
    const event: HoverLeaveEvent = {
      type: "hoverleave",
      originalEvent,
    };

    target.dispatchEvent(event);
    target.onHoverLeave?.(event);
  }

  /**
   * 分发 click 事件
   */
  private dispatchClick(
    target: RenderBase<ElementNode, unknown>,
    intersection: Intersection,
    originalEvent: PointerEvent
  ): void {
    const event: ClickEvent = {
      type: "click",
      intersection,
      originalEvent,
    };

    target.dispatchEvent(event);
    target.onClick?.(event);
  }

  /**
   * 获取当前 hover 的目标
   */
  getHoveredTarget(): RenderBase<ElementNode, unknown> | null {
    return this.hoveredTarget;
  }

  /**
   * 销毁事件处理器
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.canvas.removeEventListener("pointermove", this.boundPointerMove);
    this.canvas.removeEventListener("click", this.boundClick);
    this.canvas.removeEventListener("pointerleave", this.boundPointerLeave);

    this.hoveredTarget = null;
  }
}
