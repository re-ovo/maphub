import { Object3D, type Intersection, type Object3DEventMap } from "three";
import type { ElementNode } from "./element";

/**
 * 自定义事件：鼠标悬停进入
 */
export interface HoverEnterEvent {
  type: "hoverenter";
  intersection: Intersection;
  originalEvent: PointerEvent;
}

/**
 * 自定义事件：鼠标悬停离开
 */
export interface HoverLeaveEvent {
  type: "hoverleave";
  originalEvent: PointerEvent;
}

/**
 * 自定义事件：点击
 */
export interface ClickEvent {
  type: "click";
  intersection: Intersection;
  originalEvent: PointerEvent;
}

/**
 * RenderBase 事件映射
 */
export interface RenderBaseEventMap extends Object3DEventMap {
  hoverenter: HoverEnterEvent;
  hoverleave: HoverLeaveEvent;
  click: ClickEvent;
}

/**
 * 渲染基类 - 连接 ElementNode 数据模型与 Three.js Object3D
 */
export abstract class RenderBase<
  E extends ElementNode<D>,
  D = unknown
> extends Object3D<RenderBaseEventMap> {
  element: E;

  constructor(element: E) {
    super();
    this.element = element;
  }

  /**
   * 处理悬停进入事件，子类可重写
   */
  onHoverEnter?(event: HoverEnterEvent): void;

  /**
   * 处理悬停离开事件，子类可重写
   */
  onHoverLeave?(event: HoverLeaveEvent): void;

  /**
   * 处理点击事件，子类可重写
   */
  onClick?(event: ClickEvent): void;
}
