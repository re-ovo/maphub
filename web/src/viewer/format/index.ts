import { OpenDriveFormat } from "./odr";

export const formatRegistry = {
  opendrive: OpenDriveFormat,
};

// 地图格式类型
export type MapFormatType = "opendrive";

// 地图格式节点类型
export interface MapFormatNodeType {
  opendrive: "map" | "roads" | "junctions" | "road" | "lane-section" | "lane";
}
