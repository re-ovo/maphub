import type { Scene } from "@babylonjs/core";
import {
  parseOpendrive,
  type OpenDrive,
  type OdrRoad,
  type OdrLaneSection,
  type OdrLane,
} from "core";
import type {
  MapFormat,
  SemanticNode,
  DocumentNode,
  PropertyGroup,
  PropertyItem,
  HoverInfo,
} from "../../types";
import { OpenDriveRenderer } from "./opendrive-renderer";
import { generateId } from "@/utils/id";


/** 构建 OpenDrive 节点树 */
function buildNodeTree(
  odr: OpenDrive,
  documentId: string,
  filename: string
): { root: DocumentNode; nodeIndex: Map<string, SemanticNode> } {
  const nodeIndex = new Map<string, SemanticNode>();

  // Roads 文件夹节点
  const roads = odr.roads || [];
  const roadsFolderId = generateId();
  const roadNodes: SemanticNode[] = roads.map((road) =>
    buildRoadNode(road, documentId, roadsFolderId, nodeIndex)
  );

  const roadsFolder: SemanticNode = {
    id: roadsFolderId,
    type: "folder",
    label: `Roads (${roads.length})`,
    parentId: documentId,
    childrenIds: roadNodes.map((n) => n.id),
    metadata: { kind: "roads-folder" },
  };
  nodeIndex.set(roadsFolderId, roadsFolder);

  // 创建文档根节点（占位，renderer 在外部设置）
  const root: DocumentNode = {
    id: documentId,
    type: "document",
    label: odr.header?.name || filename,
    parentId: null,
    childrenIds: [roadsFolderId],
    filename,
    formatId: "opendrive",
    renderer: null as unknown as DocumentNode["renderer"], // 稍后设置
    visible: true,
    metadata: { header: odr.header, odr },
  };
  nodeIndex.set(documentId, root);

  return { root, nodeIndex };
}

function buildRoadNode(
  road: OdrRoad,
  documentId: string,
  parentId: string,
  nodeIndex: Map<string, SemanticNode>
): SemanticNode {
  const roadNodeId = `${documentId}:road:${road.id}`;

  // 构建 lane section 节点
  const sections = road.lanes || [];
  const sectionNodes = sections.map((section, index) =>
    buildLaneSectionNode(road.id, section, index, documentId, roadNodeId, nodeIndex)
  );

  const roadNode: SemanticNode = {
    id: roadNodeId,
    type: "road",
    label: road.name || `Road ${road.id}`,
    parentId,
    childrenIds: sectionNodes.map((n) => n.id),
    metadata: { road, roadId: road.id },
  };
  nodeIndex.set(roadNodeId, roadNode);

  return roadNode;
}

function buildLaneSectionNode(
  roadId: string,
  section: OdrLaneSection,
  index: number,
  documentId: string,
  parentId: string,
  nodeIndex: Map<string, SemanticNode>
): SemanticNode {
  const sectionNodeId = `${documentId}:road:${roadId}:section:${index}`;

  // 构建 lane 节点
  const leftLanes = section.left || [];
  const rightLanes = section.right || [];
  const allLanes = [...leftLanes, ...rightLanes];
  const laneNodes = allLanes.map((lane) =>
    buildLaneNode(roadId, index, lane, documentId, sectionNodeId, nodeIndex)
  );

  const sectionNode: SemanticNode = {
    id: sectionNodeId,
    type: "lane-section",
    label: `Section ${index} (s=${section.s.toFixed(2)})`,
    parentId,
    childrenIds: laneNodes.map((n) => n.id),
    metadata: { section, roadId, sectionIndex: index },
  };
  nodeIndex.set(sectionNodeId, sectionNode);

  return sectionNode;
}

function buildLaneNode(
  roadId: string,
  sectionIndex: number,
  lane: OdrLane,
  documentId: string,
  parentId: string,
  nodeIndex: Map<string, SemanticNode>
): SemanticNode {
  const laneId = lane.id;
  const laneNodeId = `${documentId}:road:${roadId}:section:${sectionIndex}:lane:${laneId}`;
  const side = laneId > 0 ? "L" : laneId < 0 ? "R" : "C";

  const laneNode: SemanticNode = {
    id: laneNodeId,
    type: "lane",
    label: `Lane ${side}${Math.abs(laneId)} (${lane.type})`,
    parentId,
    childrenIds: [],
    metadata: { lane, roadId, sectionIndex, laneId },
  };
  nodeIndex.set(laneNodeId, laneNode);

  return laneNode;
}

// ============ OpenDrive 格式定义 ============

/** OpenDrive 格式定义 */
export const openDriveFormat: MapFormat<OpenDrive> = {
  id: "opendrive",
  name: "OpenDRIVE",
  extensions: [".xodr", ".xml"],

  async parse(content: Uint8Array): Promise<OpenDrive> {
    return parseOpendrive(content);
  },

  detect(content: Uint8Array, filename: string): boolean {
    if (filename.toLowerCase().endsWith(".xodr")) {
      return true;
    }
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(content.slice(0, 1000));
      return text.includes("<OpenDRIVE") || text.includes("<opendrive");
    } catch {
      return false;
    }
  },

  createDocument(data: OpenDrive, filename: string, scene: Scene): DocumentNode {
    const documentId = generateId();
    const { root, nodeIndex } = buildNodeTree(data, documentId, filename);

    // 创建渲染器
    const renderer = new OpenDriveRenderer(scene, data, documentId);
    root.renderer = renderer;

    // 将 nodeIndex 存储到 metadata 中供后续使用
    (root.metadata as Record<string, unknown>).nodeIndex = nodeIndex;

    return root;
  },

  getProperties(node: SemanticNode): PropertyGroup[] {
    const meta = node.metadata as Record<string, unknown> | undefined;
    if (!meta) return [];

    switch (node.type) {
      case "road": {
        const road = meta.road as OdrRoad;
        if (!road) return [];
        return getRoadProperties(road);
      }
      case "lane-section": {
        const section = meta.section as OdrLaneSection;
        if (!section) return [];
        return getLaneSectionProperties(section);
      }
      case "lane": {
        const lane = meta.lane as OdrLane;
        if (!lane) return [];
        return getLaneProperties(lane);
      }
      default:
        return [];
    }
  },

  getTitle(node: SemanticNode): { title: string; subtitle?: string } {
    const meta = node.metadata as Record<string, unknown> | undefined;

    switch (node.type) {
      case "document":
        return { title: node.label, subtitle: "OpenDRIVE Document" };
      case "road": {
        const road = meta?.road as OdrRoad | undefined;
        return {
          title: road?.name || node.label,
          subtitle: "OpenDRIVE Road",
        };
      }
      case "lane-section": {
        const roadId = meta?.roadId as string;
        return {
          title: node.label,
          subtitle: `Road ${roadId}`,
        };
      }
      case "lane": {
        const roadId = meta?.roadId as string;
        return {
          title: node.label,
          subtitle: `Road ${roadId}`,
        };
      }
      default:
        return { title: node.label };
    }
  },

  getHoverInfo(node: SemanticNode): HoverInfo | null {
    const meta = node.metadata as Record<string, unknown> | undefined;
    if (!meta) return null;

    switch (node.type) {
      case "road": {
        const road = meta.road as OdrRoad;
        if (!road) return null;
        return {
          title: road.name || `Road ${road.id}`,
          subtitle: "OpenDRIVE Road",
          items: [
            { label: "ID", value: road.id },
            { label: "Length", value: `${road.length.toFixed(2)} m` },
            { label: "Sections", value: `${road.lanes?.length || 0}` },
          ],
        };
      }
      case "lane-section": {
        const section = meta.section as OdrLaneSection;
        const roadId = meta.roadId as string;
        const sectionIndex = meta.sectionIndex as number;
        if (!section) return null;
        const leftCount = section.left?.length || 0;
        const rightCount = section.right?.length || 0;
        return {
          title: `Lane Section ${sectionIndex}`,
          subtitle: `Road ${roadId}`,
          items: [
            { label: "S", value: `${section.s.toFixed(2)} m` },
            { label: "Lanes", value: `${leftCount}L / ${rightCount}R` },
          ],
        };
      }
      case "lane": {
        const lane = meta.lane as OdrLane;
        const laneId = meta.laneId as number;
        if (!lane) return null;
        const side = laneId > 0 ? "Left" : laneId < 0 ? "Right" : "Center";
        return {
          title: `Lane ${laneId}`,
          subtitle: `${side} · ${lane.type}`,
          items: [
            { label: "Type", value: lane.type },
            { label: "Side", value: side },
          ],
        };
      }
      default:
        return null;
    }
  },
};

// ============ Properties 辅助函数 ============

function getRoadProperties(road: OdrRoad): PropertyGroup[] {
  const basicProps: PropertyItem[] = [
    { key: "id", label: "ID", value: road.id, type: "string", readonly: true },
    { key: "name", label: "Name", value: road.name || "-", type: "string", readonly: true },
    { key: "length", label: "Length", value: road.length, type: "number", unit: "m", readonly: true },
    { key: "junction", label: "Junction", value: road.junction || "-1", type: "string", readonly: true },
  ];

  const linkProps: PropertyItem[] = [];
  if (road.predecessor) {
    linkProps.push({
      key: "predecessor",
      label: "Predecessor",
      value: `${road.predecessor.elementType} ${road.predecessor.elementId}`,
      type: "string",
      readonly: true,
    });
  }
  if (road.successor) {
    linkProps.push({
      key: "successor",
      label: "Successor",
      value: `${road.successor.elementType} ${road.successor.elementId}`,
      type: "string",
      readonly: true,
    });
  }

  const groups: PropertyGroup[] = [
    { id: "basic", title: "基本信息", defaultExpanded: true, properties: basicProps },
  ];

  if (linkProps.length > 0) {
    groups.push({ id: "link", title: "连接关系", defaultExpanded: true, properties: linkProps });
  }

  const lanes = road.lanes || [];
  const totalLanes = lanes.reduce(
    (sum, s) => sum + (s.left?.length || 0) + (s.right?.length || 0),
    0
  );

  groups.push({
    id: "stats",
    title: "统计",
    defaultExpanded: false,
    properties: [
      { key: "laneSections", label: "Lane Sections", value: lanes.length, type: "number", readonly: true },
      { key: "totalLanes", label: "Total Lanes", value: totalLanes, type: "number", readonly: true },
      { key: "geometries", label: "Geometries", value: road.planView?.length || 0, type: "number", readonly: true },
    ],
  });

  return groups;
}

function getLaneSectionProperties(section: OdrLaneSection): PropertyGroup[] {
  return [
    {
      id: "basic",
      title: "基本信息",
      defaultExpanded: true,
      properties: [
        { key: "s", label: "S Offset", value: section.s, type: "number", unit: "m", readonly: true },
        { key: "singleSide", label: "Single Side", value: section.single_side ?? false, type: "boolean", readonly: true },
      ],
    },
    {
      id: "lanes",
      title: "车道统计",
      defaultExpanded: true,
      properties: [
        { key: "leftCount", label: "Left Lanes", value: section.left?.length || 0, type: "number", readonly: true },
        { key: "rightCount", label: "Right Lanes", value: section.right?.length || 0, type: "number", readonly: true },
      ],
    },
  ];
}

function getLaneProperties(lane: OdrLane): PropertyGroup[] {
  const basicProps: PropertyItem[] = [
    { key: "id", label: "ID", value: lane.id, type: "number", readonly: true },
    { key: "type", label: "Type", value: lane.type, type: "string", readonly: true },
    { key: "level", label: "Level", value: lane.level, type: "boolean", readonly: true },
  ];

  if (lane.roadWorks !== undefined) {
    basicProps.push({ key: "roadWorks", label: "Road Works", value: lane.roadWorks, type: "boolean", readonly: true });
  }

  const groups: PropertyGroup[] = [
    { id: "basic", title: "基本信息", defaultExpanded: true, properties: basicProps },
  ];

  if (lane.width && lane.width.length > 0) {
    groups.push({
      id: "width",
      title: "宽度",
      defaultExpanded: false,
      properties: lane.width.map((w, i) => ({
        key: `width_${i}`,
        label: `Width @${w.sOffset.toFixed(2)}`,
        value: `a=${w.a.toFixed(3)}, b=${w.b.toFixed(3)}`,
        type: "string" as const,
        readonly: true,
      })),
    });
  }

  if (lane.speed && lane.speed.length > 0) {
    groups.push({
      id: "speed",
      title: "速度限制",
      defaultExpanded: false,
      properties: lane.speed.map((s, i) => ({
        key: `speed_${i}`,
        label: `Speed @${s.sOffset.toFixed(2)}`,
        value: s.max,
        type: "number" as const,
        unit: s.unit || "m/s",
        readonly: true,
      })),
    });
  }

  return groups;
}
