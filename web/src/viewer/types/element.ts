import type { Id } from "@/utils/id";
import type { ReactNode } from "react";

export type ElementType = string;

export interface ElementNode<D, T extends ElementType> {
  id: Id;
  parentId: Id | null;
  childrenIds: Id[];
  name: string;
  visible: boolean;
  type: T;
  data: D;
  provideHoverInfo(): HoverInfo | null;
  provideProperties(): PropertyGroup[] | null;
  provideTree(): TreeAction[] | null;
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

export interface TreeAction {
  icon?: ReactNode;
  label: string | ReactNode;
  onClick: () => void;
}