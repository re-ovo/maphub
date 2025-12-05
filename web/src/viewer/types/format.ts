import type { ReactNode } from "react";
import type { MapNode } from "./map-node";
import type { Object3D, Vector3 } from "three";
import type { Files } from "core";

export type MapFormatType = "opendrive";

export interface MapFormatNodeType {
  opendrive: "map" | "roads" | "junctions" | "road" | "lane-section" | "lane";
}

export interface MapFormat<F extends MapFormatType = MapFormatType> {
  format: F;
  rootNodeType: MapFormatNodeType[F];

  parse: (files: Files) => MapNode<F>[];

  provideRenderer: (node: MapNode<F>) => Object3D;

  provideHoverInfo: (node: MapNode<F>, pos: Vector3) => HoverInfo | null;

  provideProperties: (node: MapNode<F>) => PropertiyGroup[] | null;

  provideTreeInfo: (node: MapNode<F>) => TreeInfo;
}

export interface HoverInfo {
  title: ReactNode;
  description: ReactNode[];
  icon: ReactNode;
  items: HoverInfoItem[];
}

export interface HoverInfoItem {
  label: ReactNode;
  value: ReactNode;
}

export interface PropertiyGroup {
  label: ReactNode;
  items: PropertyItem[];
}

export interface PropertyItem {
  label: ReactNode;
  value: ReactNode;
}

export interface TreeInfo {
  icon: ReactNode; // 在场景树内的图标
  menus: TreeMenu[]; // 在场景树内的菜单
}

export interface TreeMenu {
  label: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}
