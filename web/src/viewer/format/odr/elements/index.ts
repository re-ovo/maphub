import type { MapNode } from "@/viewer/types/map-node";
import type { OdrLane, OdrLaneSection, OdrRoad, OpenDrive } from "core";

export interface OdrMapElement extends MapNode<"opendrive", "map"> {
  opendrive: OpenDrive;
  children: OdrElement[];
}

export interface OdrRoadsElement extends MapNode<"opendrive", "roads"> {
  roads: OdrRoad[];
  children: OdrRoadElement[];
}

// export interface OdrJunctionsElement extends MapNode<"opendrive", "junctions"> {
//   junctions: OdrJunction[];
// }

export interface OdrRoadElement extends MapNode<"opendrive", "road"> {
  road: OdrRoad;
  children: OdrLaneSectionElement[];
}

export interface OdrLaneSectionElement
  extends MapNode<"opendrive", "lane-section"> {
  road: OdrRoad; // 父 road 引用，用于网格构建
  section: OdrLaneSection;
  sStart: number; // lane section 起始位置
  sEnd: number; // lane section 结束位置
  children: OdrLaneElement[];
}

export interface OdrLaneElement extends MapNode<"opendrive", "lane"> {
  road: OdrRoad; // 父 road 引用，用于网格构建
  section: OdrLaneSection; // 父 lane section 引用
  lane: OdrLane;
  sStart: number; // lane 起始位置
  sEnd: number; // lane 结束位置
  children: [];
}

// OpenDRIVE 所有节点类型的 discriminated union
export type OdrElement =
  | OdrMapElement
  | OdrRoadsElement
  | OdrRoadElement
  | OdrLaneSectionElement
  | OdrLaneElement;
