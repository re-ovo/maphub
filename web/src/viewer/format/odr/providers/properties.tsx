import type { PropertiyGroup } from "@/viewer/types/format";
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
} from "../elements";

/**
 * 提供地图的属性面板信息
 */
export function provideMapProperties(element: OdrMapElement): PropertiyGroup[] {
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
export function provideRoadsProperties(element: OdrRoadsElement): PropertiyGroup[] {
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
export function provideRoadProperties(element: OdrRoadElement): PropertiyGroup[] {
  const { road } = element;

  const isJunction = road.junction !== "-1" && road.junction !== "";
  const trafficRuleStr = road.trafficRule === "LHT" ? "左行 (LHT)" : "右行 (RHT)";

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
    const typeStr = pred.elementType === "junction" ? "路口" : "道路";
    linkItems.push({
      label: "前驱",
      value: `${typeStr} ${pred.elementId}${pred.contactPoint ? ` (${pred.contactPoint})` : ""}`,
    });
  }
  if (road.successor) {
    const succ = road.successor;
    const typeStr = succ.elementType === "junction" ? "路口" : "道路";
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
export function provideLaneSectionProperties(element: OdrLaneSectionElement): PropertiyGroup[] {
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
export function provideLaneProperties(element: OdrLaneElement): PropertiyGroup[] {
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
      const unitStr = s.unit ?? "km/h";
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
      const ruleStr = a.rule !== undefined ? (a.rule === "allow" ? "允许" : "禁止") : "";
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

/**
 * 提供 Junctions 容器的属性面板信息
 */
export function provideJunctionsProperties(element: OdrJunctionsElement): PropertiyGroup[] {
  const { junctions } = element;

  // 统计 junction 类型
  const junctionTypeCount = new Map<string, number>();
  for (const junction of junctions) {
    const type = junction.junctionType;
    junctionTypeCount.set(type, (junctionTypeCount.get(type) || 0) + 1);
  }

  const groups: PropertiyGroup[] = [
    {
      label: "统计",
      items: [{ label: "路口数量", value: String(junctions.length) }],
    },
  ];

  // Junction 类型分布
  if (junctionTypeCount.size > 0) {
    const typeItems = Array.from(junctionTypeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        label: type,
        value: String(count),
      }));
    groups.push({ label: "类型分布", items: typeItems });
  }

  return groups;
}

/**
 * 提供 Junction 的属性面板信息
 */
export function provideJunctionProperties(element: OdrJunctionElement): PropertiyGroup[] {
  const { junction } = element;

  const groups: PropertiyGroup[] = [];

  // 基本信息
  const basicItems = [
    { label: "ID", value: junction.id },
    { label: "类型", value: junction.junctionType },
    { label: "连接数", value: String(junction.connections.length) },
  ];
  if (junction.name) {
    basicItems.unshift({ label: "名称", value: junction.name });
  }
  groups.push({ label: "基本信息", items: basicItems });

  // Virtual Junction 特有属性
  if (junction.mainRoad) {
    const virtualItems = [{ label: "主道路", value: junction.mainRoad }];
    if (junction.sStart !== undefined) {
      virtualItems.push({ label: "起始位置", value: `${junction.sStart.toFixed(2)} m` });
    }
    if (junction.sEnd !== undefined) {
      virtualItems.push({ label: "结束位置", value: `${junction.sEnd.toFixed(2)} m` });
    }
    if (junction.orientation) {
      virtualItems.push({ label: "方向", value: junction.orientation });
    }
    groups.push({ label: "Virtual Junction", items: virtualItems });
  }

  // 优先级
  if (junction.priorities.length > 0) {
    const priorityItems = junction.priorities.map((p) => ({
      label: `高: ${p.high}`,
      value: `低: ${p.low}`,
    }));
    groups.push({ label: "优先级规则", items: priorityItems });
  }

  return groups;
}

/**
 * 提供 Junction Connection 的属性面板信息
 */
export function provideJunctionConnectionProperties(
  element: OdrJunctionConnectionElement,
): PropertiyGroup[] {
  const { connection, junction } = element;

  const groups: PropertiyGroup[] = [];

  // 基本信息
  const basicItems = [
    { label: "ID", value: connection.id },
    { label: "所属路口", value: junction.id },
  ];
  if (connection.incomingRoad) {
    basicItems.push({ label: "进入道路", value: connection.incomingRoad });
  }
  if (connection.connectingRoad) {
    basicItems.push({ label: "连接道路", value: connection.connectingRoad });
  }
  if (connection.linkedRoad) {
    basicItems.push({ label: "链接道路", value: connection.linkedRoad });
  }
  if (connection.contactPoint) {
    const contactStr = connection.contactPoint === "start" ? "起点" : "终点";
    basicItems.push({ label: "接触点", value: contactStr });
  }
  groups.push({ label: "基本信息", items: basicItems });

  // 车道连接
  const laneLinkCount = connection.laneLinkCount();
  if (laneLinkCount > 0) {
    const laneLinkItems = [];
    for (let i = 0; i < laneLinkCount; i++) {
      const laneLink = connection.getLaneLink(i);
      if (laneLink) {
        laneLinkItems.push({
          label: `Lane ${laneLink.from}`,
          value: `→ Lane ${laneLink.to}`,
        });
      }
    }
    groups.push({ label: "车道连接", items: laneLinkItems });
  }

  return groups;
}

/**
 * 提供属性信息的统一入口
 */
export function provideProperties(element: OdrElement): PropertiyGroup[] | null {
  switch (element.type) {
    case "map":
      return provideMapProperties(element);
    case "roads":
      return provideRoadsProperties(element);
    case "junctions":
      return provideJunctionsProperties(element);
    case "junction":
      return provideJunctionProperties(element);
    case "junction-connection":
      return provideJunctionConnectionProperties(element);
    case "road":
      return provideRoadProperties(element);
    case "lane-section":
      return provideLaneSectionProperties(element);
    case "lane":
      return provideLaneProperties(element);
    default:
      return null;
  }
}
