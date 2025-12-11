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
  type OdrJunction,
  type OdrConnection,
} from "@maphub/core";
import type { Vector3 } from "three";
import type {
  OdrElement,
  OdrMapElement,
  OdrRoadsElement,
  OdrJunctionsElement,
  OdrJunctionElement,
  OdrJunctionConnectionElement,
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
  opendrive: OpenDrive,
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
    opendrive,
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
  opendrive: OpenDrive,
  parentId: Id,
  road: OdrRoad,
  section: OdrLaneSection,
  sectionIndex: number,
  sStart: number,
  sEnd: number,
): OdrLaneSectionElement {
  const sectionId = generateId();

  // 收集所有车道（左侧 + 中心 + 右侧）
  // 中心车道宽度为 0，但可携带 road mark（中心线标线）
  const allLanes: OdrLane[] = [...section.left, section.center, ...section.right];

  // 构建车道子节点
  const laneElements: OdrLaneElement[] = allLanes.map((lane) =>
    buildLaneElement(opendrive, sectionId, road, section, lane, sStart, sEnd),
  );

  return {
    id: sectionId,
    parentId,
    children: laneElements,
    name: `LaneSection ${sectionIndex}`,
    visible: true,
    format: "opendrive",
    type: "lane-section",
    opendrive,
    road,
    section,
    sStart,
    sEnd,
  };
}

/**
 * 构建道路的 Element（包含所有车道段）
 */
function buildRoadElement(opendrive: OpenDrive, parentId: Id, road: OdrRoad): OdrRoadElement {
  const roadId = generateId();
  const laneSections = road.lanes;

  // 构建车道段子节点
  const laneSectionElements: OdrLaneSectionElement[] = laneSections.map((section, index) => {
    // 计算当前 lane section 的 s 范围
    const sStart = section.s;
    // 下一个 lane section 的起始位置，或者道路的长度
    const sEnd = index < laneSections.length - 1 ? laneSections[index + 1].s : road.length;

    return buildLaneSectionElement(opendrive, roadId, road, section, index, sStart, sEnd);
  });

  return {
    id: roadId,
    parentId,
    children: laneSectionElements,
    name: `Road ${road.id}${road.name ? ` (${road.name})` : ""}`,
    visible: true,
    format: "opendrive",
    type: "road",
    opendrive,
    road,
  };
}

/**
 * 构建 Roads 容器 Element
 */
function buildRoadsElement(opendrive: OpenDrive, parentId: Id, roads: OdrRoad[]): OdrRoadsElement {
  const roadsId = generateId();

  // 构建道路子节点
  const roadElements: OdrRoadElement[] = roads.map((road) =>
    buildRoadElement(opendrive, roadsId, road),
  );

  return {
    id: roadsId,
    parentId,
    children: roadElements,
    name: "Roads",
    visible: true,
    format: "opendrive",
    type: "roads",
    opendrive,
    roads,
  };
}

/**
 * 构建单个 Junction Connection Element
 */
function buildJunctionConnectionElement(
  opendrive: OpenDrive,
  parentId: Id,
  junction: OdrJunction,
  connection: OdrConnection,
): OdrJunctionConnectionElement {
  const incomingInfo = connection.incomingRoad ? ` (from ${connection.incomingRoad})` : "";
  return {
    id: generateId(),
    parentId,
    children: [],
    name: `Connection ${connection.id}${incomingInfo}`,
    visible: true,
    format: "opendrive",
    type: "junction-connection",
    opendrive,
    junction,
    connection,
  };
}

/**
 * 构建单个 Junction Element
 */
function buildJunctionElement(
  opendrive: OpenDrive,
  parentId: Id,
  junction: OdrJunction,
): OdrJunctionElement {
  const junctionId = generateId();

  // 构建 connection 子节点
  const connectionElements: OdrJunctionConnectionElement[] = junction.connections.map((connection) =>
    buildJunctionConnectionElement(opendrive, junctionId, junction, connection),
  );

  return {
    id: junctionId,
    parentId,
    children: connectionElements,
    name: `Junction ${junction.id}${junction.name ? ` (${junction.name})` : ""}`,
    visible: true,
    format: "opendrive",
    type: "junction",
    opendrive,
    junction,
  };
}

/**
 * 构建 Junctions 容器 Element
 */
function buildJunctionsElement(
  opendrive: OpenDrive,
  parentId: Id,
  junctions: OdrJunction[],
): OdrJunctionsElement {
  const junctionsId = generateId();

  // 构建 junction 子节点
  const junctionElements: OdrJunctionElement[] = junctions.map((junction) =>
    buildJunctionElement(opendrive, junctionsId, junction),
  );

  return {
    id: junctionsId,
    parentId,
    children: junctionElements,
    name: "Junctions",
    visible: true,
    format: "opendrive",
    type: "junctions",
    opendrive,
    junctions,
  };
}

/**
 * 构建完整的 Map Element 树
 */
function buildMapElement(opendrive: OpenDrive): OdrMapElement {
  const mapId = generateId();

  // 构建 roads 容器节点
  const roadsElement = buildRoadsElement(opendrive, mapId, opendrive.roads);

  // 构建子节点列表
  const children: OdrElement[] = [roadsElement];

  // 如果有 junctions，构建 junctions 容器节点
  if (opendrive.junctions.length > 0) {
    const junctionsElement = buildJunctionsElement(opendrive, mapId, opendrive.junctions);
    children.push(junctionsElement);
  }

  return {
    id: mapId,
    parentId: null,
    children,
    opendrive,
    name: opendrive.header.name || "OpenDRIVE Map",
    visible: true,
    format: "opendrive",
    type: "map",
  };
}
