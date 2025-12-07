import type { ReactNode } from "react";
import type { MapNode } from "./map-node";
import type { Vector3 } from "three";
import type { Files } from "@maphub/core";
import type { MapRenderer } from "./renderer";
import type { MapFormatNodeType, MapFormatType } from "../format";

export interface MapFormat<
  F extends MapFormatType = MapFormatType, // 格式类型
  E extends MapNode<F> = MapNode<F>, // 所有节点类型的联合类型
  R extends MapFormatNodeType[F] = MapFormatNodeType[F], // 根节点类型
> {
  format: F;
  rootNodeType: R;

  parse: (files: Files) => Extract<E, MapNode<F, R>>[];

  provideRenderer: (node: Extract<E, MapNode<F, R>>) => MapRenderer<F, R>;

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
  virtual?: boolean; // 是否为虚拟节点 (default: false)
}

export interface TreeMenu {
  label: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}
