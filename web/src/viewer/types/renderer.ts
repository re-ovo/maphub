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
> extends Object3D<MapRendererEventMap> {
  /** 关联的地图节点 */
  abstract readonly node: MapNode<F, T>;
}

export interface MapRendererEventMap extends Object3DEventMap {
  hoverOn: {
    pos: Vector3;
  };
  hover: {
    pos: Vector3;
  };
  hoverOff: {
    pos: Vector3;
  };
  click: {
    pos: Vector3;
  };
  rightClick: {
    pos: Vector3;
  };
}
