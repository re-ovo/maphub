import type { MapNode } from "@/viewer/types/map-node";
import type { OdrLane, OdrLaneSection, OdrRoad, OpenDrive } from "core";

export interface OdrMapElement extends MapNode<"opendrive", "map"> {
  opendrive: OpenDrive;
}

export interface OdrRoadsElement extends MapNode<"opendrive", "roads"> {
  roads: OdrRoad[];
}

// export interface OdrJunctionsElement extends MapNode<"opendrive", "junctions"> {
//   junctions: OdrJunction[];
// }

export interface OdrRoadElement extends MapNode<"opendrive", "road"> {
  road: OdrRoad;
}

export interface OdrLaneSectionElement
  extends MapNode<"opendrive", "lane-section"> {
  section: OdrLaneSection;
}

export interface OdrLaneElement extends MapNode<"opendrive", "lane"> {
  lane: OdrLane;
}
