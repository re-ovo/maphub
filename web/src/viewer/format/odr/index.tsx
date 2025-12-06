import type { MapFormat, HoverInfo, PropertiyGroup, TreeInfo } from "@/viewer/types/format";
import type { MapNode } from "@/viewer/types/map-node";
import type { MapRenderer } from "@/viewer/types/renderer";
import {
  OpenDrive,
  parseOpendriveFromFiles,
  type Files,
  type OdrRoad,
  type OdrLaneSection,
  type OdrLane,
} from "core";
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
import { Map, FolderOpen, Route, Layers, RectangleHorizontal } from "lucide-react";

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
  provideHoverInfo(node: MapNode<"opendrive">, _pos: Vector3): HoverInfo | null {
    const element = node as OdrElement;

    switch (element.type) {
      case "lane":
        return provideLaneHoverInfo(element);
      case "lane-section":
        return provideLaneSectionHoverInfo(element);
      case "road":
        return provideRoadHoverInfo(element);
      default:
        return null;
    }
  },

  /**
   * 提供属性面板信息
   */
  provideProperties(node: MapNode<"opendrive">): PropertiyGroup[] | null {
    const element = node as OdrElement;

    switch (element.type) {
      case "map":
        return provideMapProperties(element);
      case "roads":
        return provideRoadsProperties(element);
      case "road":
        return provideRoadProperties(element);
      case "lane-section":
        return provideLaneSectionProperties(element);
      case "lane":
        return provideLaneProperties(element);
      default:
        return null;
    }
  },

  /**
   * 提供场景树信息
   */
  provideTreeInfo(node: MapNode<"opendrive">): TreeInfo {
    const element = node as OdrElement;

    const iconClass = "w-4 h-4 shrink-0 text-muted-foreground";

    switch (element.type) {
      case "map":
        return { icon: <Map className={iconClass} />, menus: [] };
      case "roads":
        return { icon: <FolderOpen className={iconClass} />, menus: [] };
      case "road":
        return { icon: <Route className={iconClass} />, menus: [] };
      case "lane-section":
        return { icon: <Layers className={iconClass} />, menus: [] };
      case "lane":
        return { icon: <RectangleHorizontal className={iconClass} />, menus: [] };
      default:
        return { icon: null, menus: [] };
    }
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

/**
 * 提供车道的 hover 信息
 */
function provideLaneHoverInfo(element: OdrLaneElement): HoverInfo {
  const { lane, road, sStart, sEnd } = element;

  // 获取第一个宽度定义的 a 值作为基础宽度
  const baseWidth = lane.width.length > 0 ? lane.width[0].a : 0;

  return {
    title: `Lane ${lane.id}`,
    icon: null,
    description: [`Road: ${road.id}${road.name ? ` (${road.name})` : ""}`],
    items: [
      { label: "Type", value: lane.type },
      { label: "Width", value: `${baseWidth.toFixed(2)} m` },
      { label: "S Range", value: `${sStart.toFixed(1)} - ${sEnd.toFixed(1)} m` },
    ],
  };
}

/**
 * 提供车道段的 hover 信息
 */
function provideLaneSectionHoverInfo(element: OdrLaneSectionElement): HoverInfo {
  const { section, road, sStart, sEnd } = element;

  const leftCount = section.left.length;
  const rightCount = section.right.length;

  return {
    title: `Lane Section`,
    icon: null,
    description: [`Road: ${road.id}${road.name ? ` (${road.name})` : ""}`],
    items: [
      { label: "S Start", value: `${section.s.toFixed(2)} m` },
      { label: "S Range", value: `${sStart.toFixed(1)} - ${sEnd.toFixed(1)} m` },
      { label: "Left Lanes", value: String(leftCount) },
      { label: "Right Lanes", value: String(rightCount) },
    ],
  };
}

/**
 * 提供道路的 hover 信息
 */
function provideRoadHoverInfo(element: OdrRoadElement): HoverInfo {
  const { road } = element;

  const laneSectionCount = road.lanes.length;
  const isJunction = road.junction !== "-1" && road.junction !== "";

  return {
    title: road.name ? `${road.name}` : `Road ${road.id}`,
    icon: null,
    description: isJunction ? [`Junction Road`] : [],
    items: [
      { label: "ID", value: road.id },
      { label: "Length", value: `${road.length.toFixed(2)} m` },
      { label: "Sections", value: String(laneSectionCount) },
      ...(isJunction ? [{ label: "Junction", value: road.junction }] : []),
    ],
  };
}

/**
 * 提供地图的属性面板信息
 */
function provideMapProperties(element: OdrMapElement): PropertiyGroup[] {
  const { opendrive } = element;
  const header = opendrive.header;

  const groups: PropertiyGroup[] = [];

  // 基本信息
  const basicItems = [];
  if (header.name) {
    basicItems.push({ label: "名称", value: header.name });
  }
  if (header.version) {
    basicItems.push({ label: "版本", value: header.version });
  }
  if (header.date) {
    basicItems.push({ label: "日期", value: header.date });
  }
  basicItems.push({ label: "规范版本", value: `${header.revMajor}.${header.revMinor}` });
  if (header.vendor) {
    basicItems.push({ label: "供应商", value: header.vendor });
  }
  basicItems.push({ label: "道路数量", value: String(opendrive.roads.length) });

  if (basicItems.length > 0) {
    groups.push({ label: "基本信息", items: basicItems });
  }

  // 地理边界
  const hasBounds =
    header.north !== undefined ||
    header.south !== undefined ||
    header.east !== undefined ||
    header.west !== undefined;

  if (hasBounds) {
    const boundsItems = [];
    if (header.north !== undefined) {
      boundsItems.push({ label: "北", value: header.north.toFixed(6) });
    }
    if (header.south !== undefined) {
      boundsItems.push({ label: "南", value: header.south.toFixed(6) });
    }
    if (header.east !== undefined) {
      boundsItems.push({ label: "东", value: header.east.toFixed(6) });
    }
    if (header.west !== undefined) {
      boundsItems.push({ label: "西", value: header.west.toFixed(6) });
    }
    groups.push({ label: "地理边界", items: boundsItems });
  }

  // 地理参考
  if (header.geoReference) {
    groups.push({
      label: "地理参考",
      items: [{ label: "投影", value: header.geoReference }],
    });
  }

  return groups;
}

/**
 * 提供道路集合的属性面板信息
 */
function provideRoadsProperties(element: OdrRoadsElement): PropertiyGroup[] {
  const { roads } = element;

  // 统计车道类型
  const laneTypeCount = new Map<string, number>();
  let totalLanes = 0;

  for (const road of roads) {
    for (const section of road.lanes) {
      for (const lane of [...section.left, ...section.right]) {
        totalLanes++;
        const count = laneTypeCount.get(lane.type) || 0;
        laneTypeCount.set(lane.type, count + 1);
      }
    }
  }

  const groups: PropertiyGroup[] = [
    {
      label: "统计",
      items: [
        { label: "道路数量", value: String(roads.length) },
        { label: "车道总数", value: String(totalLanes) },
      ],
    },
  ];

  // 车道类型分布
  if (laneTypeCount.size > 0) {
    const typeItems = Array.from(laneTypeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        label: type,
        value: String(count),
      }));
    groups.push({ label: "车道类型分布", items: typeItems });
  }

  return groups;
}

/**
 * 提供道路的属性面板信息
 */
function provideRoadProperties(element: OdrRoadElement): PropertiyGroup[] {
  const { road } = element;

  const isJunction = road.junction !== "-1" && road.junction !== "";
  const trafficRuleStr = road.trafficRule === 0 ? "左行 (LHT)" : "右行 (RHT)";

  const groups: PropertiyGroup[] = [];

  // 基本信息
  const basicItems = [
    { label: "ID", value: road.id },
    { label: "长度", value: `${road.length.toFixed(2)} m` },
    { label: "车道段数", value: String(road.lanes.length) },
    { label: "交通规则", value: trafficRuleStr },
  ];
  if (road.name) {
    basicItems.unshift({ label: "名称", value: road.name });
  }
  if (isJunction) {
    basicItems.push({ label: "所属路口", value: road.junction });
  }
  groups.push({ label: "基本信息", items: basicItems });

  // 道路类型
  if (road.roadTypes.length > 0) {
    const typeItems = road.roadTypes.map((rt) => ({
      label: `s = ${rt.s.toFixed(1)} m`,
      value: rt.country ? `${rt.roadType} (${rt.country})` : rt.roadType,
    }));
    groups.push({ label: "道路类型", items: typeItems });
  }

  // 连接信息
  const linkItems = [];
  if (road.predecessor) {
    const pred = road.predecessor;
    const typeStr = pred.elementType === 0 ? "路口" : "道路";
    linkItems.push({
      label: "前驱",
      value: `${typeStr} ${pred.elementId}${pred.contactPoint ? ` (${pred.contactPoint})` : ""}`,
    });
  }
  if (road.successor) {
    const succ = road.successor;
    const typeStr = succ.elementType === 0 ? "路口" : "道路";
    linkItems.push({
      label: "后继",
      value: `${typeStr} ${succ.elementId}${succ.contactPoint ? ` (${succ.contactPoint})` : ""}`,
    });
  }
  if (linkItems.length > 0) {
    groups.push({ label: "连接", items: linkItems });
  }

  // 几何信息
  if (road.planView.length > 0) {
    const geometryKindMap: Record<number, string> = {
      0: "直线",
      1: "螺旋线",
      2: "圆弧",
      3: "参数多项式",
    };
    const geometryItems = road.planView.map((geom) => ({
      label: `s = ${geom.s.toFixed(1)} m`,
      value: `${geometryKindMap[geom.kind] || "未知"} (${geom.length.toFixed(1)} m)`,
    }));
    groups.push({ label: "几何元素", items: geometryItems });
  }

  return groups;
}

/**
 * 提供车道段的属性面板信息
 */
function provideLaneSectionProperties(element: OdrLaneSectionElement): PropertiyGroup[] {
  const { section, road, sStart, sEnd } = element;

  const groups: PropertiyGroup[] = [];

  // 基本信息
  const basicItems = [
    { label: "所属道路", value: `Road ${road.id}${road.name ? ` (${road.name})` : ""}` },
    { label: "起始位置", value: `${sStart.toFixed(2)} m` },
    { label: "结束位置", value: `${sEnd.toFixed(2)} m` },
    { label: "长度", value: `${(sEnd - sStart).toFixed(2)} m` },
  ];
  if (section.single_side !== undefined) {
    basicItems.push({ label: "单侧", value: section.single_side ? "是" : "否" });
  }
  groups.push({ label: "基本信息", items: basicItems });

  // 车道统计
  const laneItems = [
    { label: "左侧车道", value: String(section.left.length) },
    { label: "右侧车道", value: String(section.right.length) },
    { label: "总计", value: String(section.left.length + section.right.length) },
  ];
  groups.push({ label: "车道数量", items: laneItems });

  // 左侧车道类型
  if (section.left.length > 0) {
    const leftItems = section.left.map((lane) => ({
      label: `Lane ${lane.id}`,
      value: lane.type,
    }));
    groups.push({ label: "左侧车道", items: leftItems });
  }

  // 右侧车道类型
  if (section.right.length > 0) {
    const rightItems = section.right.map((lane) => ({
      label: `Lane ${lane.id}`,
      value: lane.type,
    }));
    groups.push({ label: "右侧车道", items: rightItems });
  }

  return groups;
}

/**
 * 提供车道的属性面板信息
 */
function provideLaneProperties(element: OdrLaneElement): PropertiyGroup[] {
  const { lane, road, sStart, sEnd } = element;

  const groups: PropertiyGroup[] = [];

  // 基本信息
  const basicItems = [
    { label: "ID", value: String(lane.id) },
    { label: "类型", value: lane.type },
    { label: "所属道路", value: `Road ${road.id}` },
    { label: "S 范围", value: `${sStart.toFixed(2)} - ${sEnd.toFixed(2)} m` },
  ];
  if (lane.level) {
    basicItems.push({ label: "保持水平", value: "是" });
  }
  if (lane.roadWorks) {
    basicItems.push({ label: "施工中", value: "是" });
  }
  groups.push({ label: "基本信息", items: basicItems });

  // 宽度信息
  if (lane.width.length > 0) {
    const widthItems = lane.width.map((w) => ({
      label: `s = ${w.sOffset.toFixed(2)} m`,
      value: `${w.a.toFixed(3)} m`,
    }));
    groups.push({ label: "宽度", items: widthItems });
  }

  // 速度限制
  if (lane.speed.length > 0) {
    const speedItems = lane.speed.map((s) => {
      const unitStr = s.unit !== undefined ? ["km/h", "m/s", "mph"][s.unit] || "" : "km/h";
      return {
        label: `s = ${s.sOffset.toFixed(2)} m`,
        value: `${s.max} ${unitStr}`,
      };
    });
    groups.push({ label: "速度限制", items: speedItems });
  }

  // 连接信息
  const linkItems = [];
  if (lane.link.predecessor !== undefined) {
    linkItems.push({ label: "前驱车道", value: String(lane.link.predecessor) });
  }
  if (lane.link.successor !== undefined) {
    linkItems.push({ label: "后继车道", value: String(lane.link.successor) });
  }
  if (linkItems.length > 0) {
    groups.push({ label: "连接", items: linkItems });
  }

  // 路面材质
  if (lane.material.length > 0) {
    const materialItems = lane.material.map((m) => {
      const parts = [`摩擦系数: ${m.friction.toFixed(2)}`];
      if (m.surface) parts.push(`表面: ${m.surface}`);
      if (m.roughness !== undefined) parts.push(`粗糙度: ${m.roughness.toFixed(2)}`);
      return {
        label: `s = ${m.sOffset.toFixed(2)} m`,
        value: parts.join(", "),
      };
    });
    groups.push({ label: "路面材质", items: materialItems });
  }

  // 通行规则
  if (lane.access.length > 0) {
    const accessItems = lane.access.map((a) => {
      const ruleStr = a.rule !== undefined ? (a.rule === 0 ? "允许" : "禁止") : "";
      return {
        label: `s = ${a.sOffset.toFixed(2)} m`,
        value: `${ruleStr} ${a.restriction.join(", ")}`,
      };
    });
    groups.push({ label: "通行规则", items: accessItems });
  }

  // 车道规则
  if (lane.rule.length > 0) {
    const ruleItems = lane.rule.map((r) => ({
      label: `s = ${r.sOffset.toFixed(2)} m`,
      value: r.value,
    }));
    groups.push({ label: "车道规则", items: ruleItems });
  }

  return groups;
}
