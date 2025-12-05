import type {
  MapFormat,
  HoverInfo,
  PropertiyGroup,
  TreeInfo,
} from "@/viewer/types/format";
import type { MapNode } from "@/viewer/types/map-node";
import type { MapRenderer } from "@/viewer/types/renderer";
import type { Files } from "core";
import type { Vector3 } from "three";
import type { OdrElement, OdrMapElement } from "./elements";
import {
  OdrMapRenderer,
  OdrRoadRenderer,
  OdrLaneSectionRenderer,
  OdrLaneRenderer,
} from "./renderer";

/**
 * OpenDRIVE 地图格式实现
 */
export const OpenDriveFormat: MapFormat<"opendrive", OdrElement, "map"> = {
  format: "opendrive",
  rootNodeType: "map",

  /**
   * 解析 OpenDRIVE 文件并生成节点树
   */
  parse(files: Files): MapNode<"opendrive">[] {
    // TODO: 实现解析逻辑
    // 1. 使用 core 的解析器解析 OpenDRIVE XML
    // 2. 构建节点树结构
    throw new Error("Not implemented yet");
  },

  provideRenderer(node: OdrMapElement): MapRenderer<"opendrive", "map"> {
    return new OdrMapRenderer(node);
  },

  /**
   * 提供鼠标悬停信息
   */
  provideHoverInfo(node: MapNode<"opendrive">, pos: Vector3): HoverInfo | null {
    // TODO: 实现悬停信息
    return null;
  },

  /**
   * 提供属性面板信息
   */
  provideProperties(node: MapNode<"opendrive">): PropertiyGroup[] | null {
    // TODO: 实现属性面板
    return null;
  },

  /**
   * 提供场景树信息
   */
  provideTreeInfo(node: MapNode<"opendrive">): TreeInfo {
    // TODO: 实现场景树信息（图标、右键菜单等）
    return {
      icon: null,
      menus: [],
    };
  },
};
