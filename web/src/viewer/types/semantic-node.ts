import type { MapRenderer } from "./renderer";
import type { MapFormatId } from "./map-format";

/** 语义节点类型 */
export type SemanticNodeType =
  | "document" // 地图文档根节点
  | "folder" // 纯展示分组节点
  | "road" // 道路
  | "lane-section" // 车道段
  | "lane" // 车道
  | "junction" // 交叉口
  | "signal" // 信号
  | "object" // 物体
  | (string & {}); // 可扩展

/** 语义节点 - 统一的节点模型 */
export interface SemanticNode {
  /** UUID */
  id: string;

  /** 节点类型 */
  type: SemanticNodeType;

  /** 显示名称 */
  label: string;

  /** 父节点 ID（根节点为 null） */
  parentId: string | null;

  /** 子节点 ID 列表 */
  childrenIds: string[];

  /** 格式相关的原始数据/元数据 */
  metadata?: unknown;
}

/** 文档节点 - 继承 SemanticNode，额外有 renderer */
export interface DocumentNode extends SemanticNode {
  type: "document";

  /** 文件名 */
  filename: string;

  /** 格式 ID */
  formatId: MapFormatId;

  /** 渲染器实例 */
  renderer: MapRenderer;

  /** 是否可见 */
  visible: boolean;
}

/** 节点仓库 - 存储和查询节点 */
export interface SemanticNodeStore {
  /** 获取节点 */
  getNode(id: string): SemanticNode | null;

  /** 获取根文档节点 */
  getRootNode(): DocumentNode;

  /** 获取子节点 */
  getChildren(id: string): SemanticNode[];

  /** 获取父节点 */
  getParent(id: string): SemanticNode | null;

  /** 获取所有节点 */
  getAllNodes(): SemanticNode[];

  /** 通过路径查找节点（用于从旧格式迁移） */
  findNodeByPath?(path: string): SemanticNode | null;
}
