import type { Id } from "@/utils/id";
import type { ReactNode } from "react";
import type { Vector3 } from "three";

export interface ElementNode<D = unknown> {
  id: Id;
  parentId: Id | null;
  childrenIds: Id[];
  name: string;
  visible: boolean;
  data: D;

  provideHoverInfo(pos: Vector3): HoverInfo | null;

  provideProperties(): PropertyGroup[];

  provideTreeNode(): TreeNode;
}

export type Value = string | number | ReactNode | null;

export type HoverInfo = {
  title: string;
  subtitle: string;
  items: HoverInfoItem[];
};

export type HoverInfoItem = {
  label: string;
  value: Value;
};

export interface PropertyGroup {
  label: string;
  properties: PropertyItem[];
}

export interface PropertyItem {
  label: string;
  value: Value;
}

export interface TreeNode {
  icon?: ReactNode;
  label: string | ReactNode;
  actions: TreeAction[];
}

export interface TreeAction {
  icon?: ReactNode;
  label: string | ReactNode;
  onClick: () => void;
}
