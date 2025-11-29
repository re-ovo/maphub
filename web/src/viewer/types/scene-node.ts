import type { Selectable } from "./selectable";

/** 场景树节点类型 */
export type SceneNodeType =
  | "document" // 文档根节点
  | "folder" // 文件夹
  | "road" // 道路
  | "lane" // 车道
  | "lane-section" // 车道段
  | "junction" // 交叉口
  | "signal" // 信号灯
  | "object" // 物体
  | string; // 可扩展

/** 节点操作 */
export interface NodeAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  handler: () => void;
  disabled?: boolean;
}

/** 场景树节点 */
export interface SceneNode {
  /** 唯一标识 */
  id: string;

  /** 显示名称 */
  label: string;

  /** 节点类型 */
  type: SceneNodeType;

  /** 图标名称 (可选) */
  icon?: string;

  /** 子节点 */
  children?: SceneNode[];

  /** 关联的可选择对象 */
  selectable?: Selectable;

  /** 可用的上下文菜单操作 */
  actions?: NodeAction[];

  /** 是否可见 */
  visible: boolean;
}

/** 场景树提供者 */
export interface TreeNodeProvider {
  /** 获取根节点列表 */
  getRootNodes(): SceneNode[];

  /** 根据 ID 获取节点 */
  getNodeById(id: string): SceneNode | null;

  /** 根据 Selectable 获取节点 ID */
  getNodeIdBySelectable(selectable: Selectable): string | null;

  /** 设置节点可见性 */
  setNodeVisible(id: string, visible: boolean): void;

  /** 节点变更回调 */
  onNodesChange?: (nodes: SceneNode[]) => void;
}
