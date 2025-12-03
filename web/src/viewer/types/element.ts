import type { Id } from "@/utils/id";
import type { ReactNode } from "react";

export interface ElementNode<D, T extends string> {
  id: Id;
  parentId: Id | null;
  childrenIds: Id[];
  name: string;
  visible: boolean;
  type: T; // union type of all possible element types (e.g. "road", "lane", "junction", etc.)
  data: D;
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
