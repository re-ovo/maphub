import { Raycaster, Vector2, Vector3, type Object3D } from "three";
import type { ViewportRenderer } from "./viewport-renderer";
import { MapRenderer, type MapRendererEventMap } from "./types/renderer";

/** Hover 事件回调参数 */
export interface HoverCallbackParams {
  /** 当前悬停的渲染器，null 表示离开 */
  renderer: MapRenderer | null;
  /** 3D 空间中的命中点 */
  hitPoint: Vector3;
  /** 屏幕坐标 */
  screenPos: { x: number; y: number };
}

/** 点击事件回调参数 */
export interface ClickCallbackParams {
  /** 点击的渲染器 */
  renderer: MapRenderer;
  /** 3D 空间中的命中点 */
  hitPoint: Vector3;
  /** 屏幕坐标 */
  screenPos: { x: number; y: number };
}

export interface ViewerEventHandlerOptions {
  /** 是否启用悬停检测 */
  enableHover?: boolean;
  /** 是否启用点击检测 */
  enableClick?: boolean;
  /** 是否启用右键点击检测 */
  enableRightClick?: boolean;
  /** Hover 事件回调 */
  onHover?: (params: HoverCallbackParams) => void;
  /** 点击事件回调 */
  onClick?: (params: ClickCallbackParams) => void;
  /** 右键点击事件回调 */
  onRightClick?: (params: ClickCallbackParams) => void;
}

/**
 * 视口事件处理器
 * 负责处理鼠标与 3D 场景中 MapRenderer 对象的交互
 */
export class ViewerEventHandler {
  private readonly viewportRenderer: ViewportRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();

  private readonly enableHover: boolean;
  private readonly enableClick: boolean;
  private readonly enableRightClick: boolean;

  /** 回调函数 */
  private readonly onHoverCallback?: (params: HoverCallbackParams) => void;
  private readonly onClickCallback?: (params: ClickCallbackParams) => void;
  private readonly onRightClickCallback?: (params: ClickCallbackParams) => void;

  /** 当前悬停的渲染器 */
  private hoveredRenderer: MapRenderer | null = null;
  /** 上一次悬停的位置 */
  private lastHoverPos = new Vector3();
  /** 上一次鼠标的屏幕坐标 */
  private lastScreenPos = { x: 0, y: 0 };

  private disposed = false;

  // 绑定的事件处理函数（用于移除监听）
  private readonly boundOnPointerMove: (e: PointerEvent) => void;
  private readonly boundOnClick: (e: MouseEvent) => void;
  private readonly boundOnContextMenu: (e: MouseEvent) => void;

  constructor(
    viewportRenderer: ViewportRenderer,
    canvas: HTMLCanvasElement,
    options: ViewerEventHandlerOptions = {},
  ) {
    this.viewportRenderer = viewportRenderer;
    this.canvas = canvas;

    this.enableHover = options.enableHover ?? true;
    this.enableClick = options.enableClick ?? true;
    this.enableRightClick = options.enableRightClick ?? true;

    this.onHoverCallback = options.onHover;
    this.onClickCallback = options.onClick;
    this.onRightClickCallback = options.onRightClick;

    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnClick = this.onClick.bind(this);
    this.boundOnContextMenu = this.onContextMenu.bind(this);

    this.setupEventListeners();
  }

  /**
   * 销毁事件处理器
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.canvas.removeEventListener("pointermove", this.boundOnPointerMove);
    this.canvas.removeEventListener("click", this.boundOnClick);
    this.canvas.removeEventListener("contextmenu", this.boundOnContextMenu);

    if (this.hoveredRenderer) {
      this.dispatchRendererEvent(this.hoveredRenderer, "hoverOff", this.lastHoverPos);
      this.hoveredRenderer = null;
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (this.enableHover) {
      this.canvas.addEventListener("pointermove", this.boundOnPointerMove);
    }
    if (this.enableClick) {
      this.canvas.addEventListener("click", this.boundOnClick);
    }
    if (this.enableRightClick) {
      this.canvas.addEventListener("contextmenu", this.boundOnContextMenu);
    }
  }

  /**
   * 更新指针位置（标准化到 -1 到 1）
   */
  private updatePointer(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    // 保存屏幕坐标
    this.lastScreenPos = { x: event.clientX, y: event.clientY };
  }

  /**
   * 执行射线检测，返回第一个命中的 MapRenderer
   */
  private raycast(): { renderer: MapRenderer; point: Vector3 } | null {
    this.raycaster.setFromCamera(this.pointer, this.viewportRenderer.camera);

    const intersects = this.raycaster.intersectObjects(this.viewportRenderer.scene.children, true);

    for (const intersect of intersects) {
      const renderer = this.findMapRenderer(intersect.object);
      if (renderer) {
        return { renderer, point: intersect.point.clone() };
      }
    }

    return null;
  }

  /**
   * 从 Object3D 向上查找 MapRenderer
   */
  private findMapRenderer(object: Object3D): MapRenderer | null {
    let current: Object3D | null = object;
    while (current) {
      if (current instanceof MapRenderer) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * 触发 MapRenderer 事件
   */
  private dispatchRendererEvent(
    renderer: MapRenderer,
    type: keyof MapRendererEventMap,
    pos: Vector3,
  ): void {
    renderer.dispatchEvent({ type, pos } as any);
  }

  /**
   * 处理指针移动
   */
  private onPointerMove(event: PointerEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hit = this.raycast();

    const newRenderer = hit?.renderer ?? null;
    const hitPoint = hit?.point ?? new Vector3();

    // 检测悬停状态变化
    if (newRenderer !== this.hoveredRenderer) {
      // 离开旧的渲染器
      if (this.hoveredRenderer) {
        this.dispatchRendererEvent(this.hoveredRenderer, "hoverOff", this.lastHoverPos);
      }
      // 进入新的渲染器
      if (newRenderer) {
        this.dispatchRendererEvent(newRenderer, "hoverOn", hitPoint);
      }
      this.hoveredRenderer = newRenderer;

      // 调用 hover 回调
      this.onHoverCallback?.({
        renderer: newRenderer,
        hitPoint,
        screenPos: this.lastScreenPos,
      });
    } else if (newRenderer) {
      // 同一个渲染器上持续移动，触发 hover 事件
      this.dispatchRendererEvent(newRenderer, "hover", hitPoint);
      this.onHoverCallback?.({
        renderer: newRenderer,
        hitPoint,
        screenPos: this.lastScreenPos,
      });
    }

    if (hit) {
      this.lastHoverPos.copy(hitPoint);
    }
  }

  /**
   * 处理点击
   */
  private onClick(event: MouseEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hit = this.raycast();

    if (hit) {
      this.dispatchRendererEvent(hit.renderer, "click", hit.point);
      this.onClickCallback?.({
        renderer: hit.renderer,
        hitPoint: hit.point,
        screenPos: this.lastScreenPos,
      });
    }
  }

  /**
   * 处理右键点击
   */
  private onContextMenu(event: MouseEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hit = this.raycast();

    if (hit) {
      event.preventDefault();
      this.dispatchRendererEvent(hit.renderer, "rightClick", hit.point);
      this.onRightClickCallback?.({
        renderer: hit.renderer,
        hitPoint: hit.point,
        screenPos: this.lastScreenPos,
      });
    }
  }
}
