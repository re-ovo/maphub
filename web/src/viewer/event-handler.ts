import { Raycaster, Vector2, Vector3, type Object3D } from "three";
import type { ViewportRenderer } from "./viewport-renderer";
import {
  MapRenderer,
  type MapRendererEventMap,
  HoverOnEvent,
  HoverOffEvent,
  HoverEvent,
  ClickEvent,
  ContextMenuEvent,
} from "./types/renderer";

/** 射线命中结果 */
export interface RaycastHit {
  /** 命中的渲染器 */
  renderer: MapRenderer;
  /** 3D 空间中的命中点 */
  point: Vector3;
  /** 距离相机的距离 */
  distance: number;
}

/** Hover 事件回调参数 */
export interface HoverCallbackParams {
  /** 当前悬停的渲染器列表（距离相同的多个物体） */
  renderers: MapRenderer[];
  /** 3D 空间中的命中点列表 */
  hitPoints: Vector3[];
  /** 屏幕坐标 */
  screenPos: { x: number; y: number };
}

/** 点击事件回调参数 */
export interface ClickCallbackParams {
  /** 点击的渲染器列表（距离相同的多个物体） */
  renderers: MapRenderer[];
  /** 3D 空间中的命中点列表 */
  hitPoints: Vector3[];
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
  /** 距离阈值，距离差在此范围内的物体视为同一层（默认 0.01） */
  distanceThreshold?: number;
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
  private readonly distanceThreshold: number;

  /** 回调函数 */
  private readonly onHoverCallback?: (params: HoverCallbackParams) => void;
  private readonly onClickCallback?: (params: ClickCallbackParams) => void;
  private readonly onRightClickCallback?: (params: ClickCallbackParams) => void;

  /** 当前悬停的渲染器列表 */
  private hoveredRenderers: MapRenderer[] = [];
  /** 上一次悬停的位置 */
  private lastHoverPoint = new Vector3();
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
    this.distanceThreshold = options.distanceThreshold ?? 0.01;

    this.onHoverCallback = options.onHover;
    this.onClickCallback = options.onClick;
    this.onRightClickCallback = options.onRightClick;

    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnClick = this.onClick.bind(this);
    this.boundOnContextMenu = this.onContextMenu.bind(this);

    this.setupEventListeners();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.canvas.removeEventListener("pointermove", this.boundOnPointerMove);
    this.canvas.removeEventListener("click", this.boundOnClick);
    this.canvas.removeEventListener("contextmenu", this.boundOnContextMenu);

    // 对所有悬停的渲染器触发 hoverOff 事件
    for (const renderer of this.hoveredRenderers) {
      this.dispatchRendererEvent(renderer, "hoverOff", this.lastHoverPoint);
    }
    this.hoveredRenderers = [];
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
   * 执行射线检测，返回所有距离相近的 MapRenderer
   */
  private raycast(): RaycastHit[] {
    this.raycaster.setFromCamera(this.pointer, this.viewportRenderer.camera);

    const intersects = this.raycaster.intersectObjects(this.viewportRenderer.scene.children, true);

    const hits: RaycastHit[] = [];
    const seenRenderers = new Set<MapRenderer>();
    let minDistance: number | null = null;

    for (const intersect of intersects) {
      const renderer = this.findMapRenderer(intersect.object);
      if (renderer && !seenRenderers.has(renderer)) {
        // 第一个命中的物体确定基准距离
        if (minDistance === null) {
          minDistance = intersect.distance;
        }

        // 只收集距离在阈值范围内的物体
        if (intersect.distance - minDistance <= this.distanceThreshold) {
          seenRenderers.add(renderer);
          hits.push({
            renderer,
            point: intersect.point.clone(),
            distance: intersect.distance,
          });
        } else {
          // 超出阈值范围，停止收集
          break;
        }
      }
    }

    return hits;
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
   * 触发 MapRenderer 事件（支持冒泡）
   */
  private dispatchRendererEvent(
    renderer: MapRenderer,
    type: keyof MapRendererEventMap,
    pos: Vector3,
  ): void {
    // 创建事件对象
    let event;
    switch (type) {
      case "hoverOn":
        event = new HoverOnEvent(renderer, pos);
        break;
      case "hoverOff":
        event = new HoverOffEvent(renderer);
        break;
      case "hover":
        event = new HoverEvent(renderer, pos);
        break;
      case "click":
        event = new ClickEvent(renderer, pos);
        break;
      case "contextMenu":
        event = new ContextMenuEvent(renderer, pos);
        break;
      default:
        return;
    }

    // 实现事件冒泡
    let currentTarget: Object3D | null = renderer;
    while (currentTarget) {
      if (currentTarget instanceof MapRenderer) {
        currentTarget.dispatchEvent({ type, ...event } as any);

        // 检查是否停止冒泡
        if (!event.isPropagationAllowed()) {
          break;
        }
      }

      currentTarget = currentTarget.parent;
    }
  }

  /**
   * 处理指针移动
   */
  private onPointerMove(event: PointerEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hits = this.raycast();

    const newRenderers = hits.map((h) => h.renderer);
    const hitPoints = hits.map((h) => h.point);
    const firstHitPoint = hitPoints[0] ?? new Vector3();

    // 计算新增和离开的渲染器
    const oldSet = new Set(this.hoveredRenderers);
    const newSet = new Set(newRenderers);

    // 离开的渲染器：在旧列表中但不在新列表中
    for (const renderer of this.hoveredRenderers) {
      if (!newSet.has(renderer)) {
        this.dispatchRendererEvent(renderer, "hoverOff", this.lastHoverPoint);
      }
    }

    // 新进入的渲染器：在新列表中但不在旧列表中
    for (let i = 0; i < newRenderers.length; i++) {
      const renderer = newRenderers[i];
      if (!oldSet.has(renderer)) {
        this.dispatchRendererEvent(renderer, "hoverOn", hitPoints[i]);
      }
    }

    // 持续悬停的渲染器触发 hover 事件
    for (let i = 0; i < newRenderers.length; i++) {
      const renderer = newRenderers[i];
      if (oldSet.has(renderer)) {
        this.dispatchRendererEvent(renderer, "hover", hitPoints[i]);
      }
    }

    // 更新状态
    this.hoveredRenderers = newRenderers;
    if (hits.length > 0) {
      this.lastHoverPoint.copy(firstHitPoint);
    }

    // 调用回调（无论是否有变化，只要有命中或状态变化就调用）
    if (newRenderers.length > 0 || oldSet.size > 0) {
      this.onHoverCallback?.({
        renderers: newRenderers,
        hitPoints,
        screenPos: this.lastScreenPos,
      });
    }
  }

  /**
   * 处理点击
   */
  private onClick(event: MouseEvent): void {
    if (this.disposed) return;

    this.updatePointer(event);
    const hits = this.raycast();

    if (hits.length > 0) {
      // 对所有命中的渲染器触发点击事件
      for (const hit of hits) {
        this.dispatchRendererEvent(hit.renderer, "click", hit.point);
      }
      this.onClickCallback?.({
        renderers: hits.map((h) => h.renderer),
        hitPoints: hits.map((h) => h.point),
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
    const hits = this.raycast();

    if (hits.length > 0) {
      event.preventDefault();
      // 对所有命中的渲染器触发右键菜单事件
      for (const hit of hits) {
        this.dispatchRendererEvent(hit.renderer, "contextMenu", hit.point);
      }
      this.onRightClickCallback?.({
        renderers: hits.map((h) => h.renderer),
        hitPoints: hits.map((h) => h.point),
        screenPos: this.lastScreenPos,
      });
    }
  }
}
