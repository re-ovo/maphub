import type { MapFormat } from "@/viewer/types/format";
import type { MapNode } from "@/viewer/types/map-node";
import type { MapRenderer } from "@/viewer/types/renderer";
import {
  OpenDrive,
  parseOpendriveFromFiles,
  type Files,
  type OdrRoad,
  type OdrLaneSection,
  type OdrLane,
} from "@maphub/core";
import type { Vector3 } from "three";
import type {
  OdrElement,
  OdrMapElement,
  OdrRoadsElement,
  OdrRoadElement,
  OdrLaneSectionElement,
  OdrLaneElement,
} from "./elements";
import { OdrMapRenderer } from "./renderer";
import { generateId, type Id } from "@/utils/id";
import { provideHoverInfo, provideProperties, provideTreeInfo } from "./providers";
/**
 * OpenDRIVE 地图格式实现
 */
export const OpenDriveFormat: MapFormat<"opendrive", OdrElement, "map"> = {
  format: "opendrive",
  rootNodeType: "map",

  /**
   * 解析 OpenDRIVE 文件并生成节点树
   */
  parse(files: Files): OdrMapElement[] {
    const opendrives: OpenDrive[] = parseOpendriveFromFiles(files);
    return opendrives.map(buildMapElement);
  },

  provideRenderer(node: OdrMapElement): MapRenderer<"opendrive", "map"> {
    return new OdrMapRenderer(node);
  },

  /**
   * 提供鼠标悬停信息
   */
  provideHoverInfo(node: MapNode<"opendrive">, pos: Vector3) {
    return provideHoverInfo(node as OdrElement, pos);
  },

  /**
   * 提供属性面板信息
   */
  provideProperties(node: MapNode<"opendrive">) {
    return provideProperties(node as OdrElement);
  },

  /**
   * 提供场景树信息
   */
  provideTreeInfo(node: MapNode<"opendrive">) {
    return provideTreeInfo(node as OdrElement);
  },
};

/**
 * 构建单个车道的 Element
 */
function buildLaneElement(
  parentId: Id,
  road: OdrRoad,
  section: OdrLaneSection,
  lane: OdrLane,
  sStart: number,
  sEnd: number,
): OdrLaneElement {
  return {
    id: generateId(),
    parentId,
    children: [],
    name: `Lane ${lane.id}`,
    visible: true,
    format: "opendrive",
    type: "lane",
    road,
    section,
    lane,
    sStart,
    sEnd,
  };
}

/**
 * 构建车道段的 Element（包含所有车道）
 */
function buildLaneSectionElement(
  parentId: Id,
  road: OdrRoad,
  section: OdrLaneSection,
  sectionIndex: number,
  sStart: number,
  sEnd: number,
): OdrLaneSectionElement {
  const sectionId = generateId();

  // 收集所有车道（左侧 + 右侧，不包含中心线 id=0）
  const allLanes: OdrLane[] = [...section.left, ...section.right];

  // 构建车道子节点
  const laneElements: OdrLaneElement[] = allLanes.map((lane) =>
    buildLaneElement(sectionId, road, section, lane, sStart, sEnd),
  );

  return {
    id: sectionId,
    parentId,
    children: laneElements,
    name: `LaneSection ${sectionIndex}`,
    visible: true,
    format: "opendrive",
    type: "lane-section",
    road,
    section,
    sStart,
    sEnd,
  };
}

/**
 * 构建道路的 Element（包含所有车道段）
 */
function buildRoadElement(parentId: Id, road: OdrRoad): OdrRoadElement {
  const roadId = generateId();
  const laneSections = road.lanes;

  // 构建车道段子节点
  const laneSectionElements: OdrLaneSectionElement[] = laneSections.map((section, index) => {
    // 计算当前 lane section 的 s 范围
    const sStart = section.s;
    // 下一个 lane section 的起始位置，或者道路的长度
    const sEnd = index < laneSections.length - 1 ? laneSections[index + 1].s : road.length;

    return buildLaneSectionElement(roadId, road, section, index, sStart, sEnd);
  });

  return {
    id: roadId,
    parentId,
    children: laneSectionElements,
    name: `Road ${road.id}${road.name ? ` (${road.name})` : ""}`,
    visible: true,
    format: "opendrive",
    type: "road",
    road,
  };
}

/**
 * 构建 Roads 容器 Element
 */
function buildRoadsElement(parentId: Id, roads: OdrRoad[]): OdrRoadsElement {
  const roadsId = generateId();

  // 构建道路子节点
  const roadElements: OdrRoadElement[] = roads.map((road) => buildRoadElement(roadsId, road));

  return {
    id: roadsId,
    parentId,
    children: roadElements,
    name: "Roads",
    visible: true,
    format: "opendrive",
    type: "roads",
    roads,
  };
}

/**
 * 构建完整的 Map Element 树
 */
function buildMapElement(opendrive: OpenDrive): OdrMapElement {
  const mapId = generateId();

  // 构建 roads 容器节点
  const roadsElement = buildRoadsElement(mapId, opendrive.roads);

  return {
    id: mapId,
    parentId: null,
    children: [roadsElement],
    opendrive,
    name: opendrive.header.name || "OpenDRIVE Map",
    visible: true,
    format: "opendrive",
    type: "map",
  };
}
