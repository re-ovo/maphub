import type { Intersection, Object3D, Scene } from "three";

/** 地图渲染器接口 */
export interface MapRenderer {
  /** 根节点 */
  readonly rootNode: Object3D;

  /** 所属场景 */
  readonly scene: Scene;

  /** 初始化渲染 */
  render(): void;

  /** 销毁 */
  dispose(): void;

  /** 根据射线投射结果获取节点 ID */
  getNodeFromIntersection(intersection: Intersection): string | null;

  /** 设置整体可见性 */
  setVisible(visible: boolean): void;

  /** 设置节点可见性 */
  setNodeVisible(nodeId: string, visible: boolean): void;

  /** 高亮节点 */
  highlight(nodeId: string): void;

  /** 取消高亮 */
  unhighlight(nodeId: string): void;

  /** 取消所有高亮 */
  unhighlightAll(): void;

  /** 聚焦到节点（移动相机） */
  focusOn(nodeId: string): void;
}
