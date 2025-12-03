import { Object3D, type Intersection, type Object3DEventMap } from "three";
import type { ElementNode } from "./element";
import type { MapFormatType } from "./format";

export interface HoverEnterEvent {
  type: "hoverenter";
  intersection: Intersection;
  originalEvent: PointerEvent;
}

export interface HoverLeaveEvent {
  type: "hoverleave";
  originalEvent: PointerEvent;
}

export interface ClickEvent {
  type: "click";
  intersection: Intersection;
  originalEvent: PointerEvent;
}

export interface RenderBaseEventMap extends Object3DEventMap {
  hoverenter: HoverEnterEvent;
  hoverleave: HoverLeaveEvent;
  click: ClickEvent;
}

export abstract class RenderBase<
  E extends ElementNode<unknown, MapFormatType, string>
> extends Object3D<RenderBaseEventMap> {
  element: E;

  constructor(element: E) {
    super();
    this.element = element;
    this.visible = element.visible;
    this.name = element.name;
  }

  onHoverEnter?(event: HoverEnterEvent): void;
  onHoverLeave?(event: HoverLeaveEvent): void;
  onClick?(event: ClickEvent): void;
}
