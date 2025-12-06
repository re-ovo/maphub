import { Object3D, Vector3, type Object3DEventMap } from "three";
import type { MapNode } from "./map-node";
import type { MapFormatNodeType, MapFormatType } from "../format";

/**
 * 地图渲染器基类
 * 所有格式的渲染器都应该继承此类
 *
 * @template F - 地图格式类型
 * @template T - 节点类型
 */
export abstract class MapRenderer<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends Object3D<MapRendererEventMap<F>> {
  /** 关联的地图节点 */
  abstract readonly node: MapNode<F, T>;
}

export interface MapRendererEventMap<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends Object3DEventMap {
  hoverOn: HoverOnEvent<F, T>;
  hover: HoverEvent<F, T>;
  hoverOff: HoverOffEvent<F, T>;
  click: ClickEvent<F, T>;
  contextMenu: ContextMenuEvent<F, T>;
}

export class MapRendererBaseEvent<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> {
  readonly target: MapRenderer<F, T>;
  private _allowPropagation: boolean = true;

  constructor(target: MapRenderer<F, T>) {
    this.target = target;
  }

  stopPropagation(): void {
    this._allowPropagation = false;
  }

  isPropagationAllowed(): boolean {
    return this._allowPropagation;
  }
}

export class HoverOnEvent<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends MapRendererBaseEvent<F, T> {
  readonly pos: Vector3;

  constructor(target: MapRenderer<F, T>, pos: Vector3) {
    super(target);
    this.pos = pos;
  }
}

export class HoverOffEvent<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends MapRendererBaseEvent<F, T> {
  constructor(target: MapRenderer<F, T>) {
    super(target);
  }
}

export class HoverEvent<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends MapRendererBaseEvent<F, T> {
  readonly pos: Vector3;

  constructor(target: MapRenderer<F, T>, pos: Vector3) {
    super(target);
    this.pos = pos;
  }
}

export class ClickEvent<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends MapRendererBaseEvent<F, T> {
  readonly pos: Vector3;

  constructor(target: MapRenderer<F, T>, pos: Vector3) {
    super(target);
    this.pos = pos;
  }
}

export class ContextMenuEvent<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F],
> extends MapRendererBaseEvent<F, T> {
  readonly pos: Vector3;

  constructor(target: MapRenderer<F, T>, pos: Vector3) {
    super(target);
    this.pos = pos;
  }
}
