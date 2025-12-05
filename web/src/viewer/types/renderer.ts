import { Object3D } from "three";
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
  T extends MapFormatNodeType[F] = MapFormatNodeType[F]
> extends Object3D {
  /** 关联的地图节点 */
  abstract readonly node: MapNode<F, T>;
}
