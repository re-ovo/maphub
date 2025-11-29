import type { Scene } from "@babylonjs/core";
import type { MapRenderer } from "./renderer";
import type { TreeNodeProvider } from "./scene-node";
import type { PropertyProvider } from "./property";
import type { HoverInfoProvider } from "./hover";

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

  /** 创建渲染器 */
  createRenderer(
    scene: Scene,
    data: TData,
    documentId: string
  ): MapRenderer;

  /** 创建场景树提供者 */
  createTreeProvider(data: TData, documentId: string): TreeNodeProvider;

  /** 创建属性面板提供者 */
  createPropertyProvider(data: TData): PropertyProvider;

  /** 创建悬浮信息提供者 */
  createHoverProvider(data: TData): HoverInfoProvider;
}
