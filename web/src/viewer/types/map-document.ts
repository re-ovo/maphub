import type { MapFormatId } from "./map-format";
import type { MapRenderer } from "./renderer";
import type { TreeNodeProvider } from "./scene-node";
import type { PropertyProvider } from "./property";
import type { HoverInfoProvider } from "./hover";

/** 已加载的地图文档 */
export interface MapDocument {
  /** 唯一 ID */
  id: string;

  /** 文件名 */
  filename: string;

  /** 格式 ID */
  formatId: MapFormatId;

  /** 原始解析数据 */
  data: unknown;

  /** 渲染器实例 */
  renderer: MapRenderer;

  /** 场景树提供者 */
  treeProvider: TreeNodeProvider;

  /** 属性提供者 */
  propertyProvider: PropertyProvider;

  /** 悬浮信息提供者 */
  hoverProvider: HoverInfoProvider;

  /** 是否可见 */
  visible: boolean;
}
