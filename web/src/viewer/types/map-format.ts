import type { Scene } from "@babylonjs/core";
import type { DocumentNode, SemanticNode } from "./semantic-node";
import type { PropertyGroup } from "./property";
import type { HoverInfo } from "./hover";

/** 地图格式唯一标识 */
export type MapFormatId = "opendrive" | "apollo" | "lanelet2" | (string & {});

/** 地图格式定义 - 每种格式需要实现此接口 */
export interface MapFormat<TData = unknown> {
  /** 格式唯一标识 */
  id: MapFormatId;

  /** 格式显示名称 */
  name: string;

  /** 支持的文件扩展名 (如 ['.xodr', '.xml']) */
  extensions: string[];

  /** 解析文件内容 */
  parse(content: Uint8Array): Promise<TData>;

  /** 检测文件是否为此格式 */
  detect(content: Uint8Array, filename: string): boolean;

  /** 创建文档节点（包含整棵语义树 + renderer） */
  createDocument(
    data: TData,
    filename: string,
    scene: Scene
  ): DocumentNode;

  // ============ Provider 能力 ============

  /** 获取节点属性 */
  getProperties(node: SemanticNode): PropertyGroup[];

  /** 获取节点标题信息 */
  getTitle(node: SemanticNode): { title: string; subtitle?: string };

  /** 获取节点悬浮信息 */
  getHoverInfo(node: SemanticNode): HoverInfo | null;
}
