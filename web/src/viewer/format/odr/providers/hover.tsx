import type { HoverInfo } from "@/viewer/types/format";
import type {
  OdrLaneElement,
  OdrLaneSectionElement,
  OdrRoadElement,
  OdrElement,
} from "../elements";

/**
 * 提供车道的 hover 信息
 */
export function provideLaneHoverInfo(element: OdrLaneElement): HoverInfo {
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
export function provideLaneSectionHoverInfo(element: OdrLaneSectionElement): HoverInfo {
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
export function provideRoadHoverInfo(element: OdrRoadElement): HoverInfo {
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
 * 提供 hover 信息的统一入口
 */
export function provideHoverInfo(element: OdrElement): HoverInfo | null {
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
}
