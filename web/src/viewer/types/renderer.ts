import type { PickingInfo, Scene, TransformNode } from "@babylonjs/core";
import type { Selectable } from "./selectable";

/** 地图渲染器接口 */
export interface MapRenderer {
  /** 根节点 */
  readonly rootNode: TransformNode;

  /** 所属场景 */
  readonly scene: Scene;

  /** 初始化渲染 */
  render(): void;

  /** 销毁 */
  dispose(): void;

  /** 根据 pick 结果获取 Selectable */
  getSelectableFromPick(pickInfo: PickingInfo): Selectable | null;

  /** 设置整体可见性 */
  setVisible(visible: boolean): void;

  /** 高亮对象 */
  highlight(selectable: Selectable): void;

  /** 取消高亮 */
  unhighlight(selectable: Selectable): void;

  /** 取消所有高亮 */
  unhighlightAll(): void;

  /** 聚焦到对象 (移动相机) */
  focusOn(selectable: Selectable): void;
}
