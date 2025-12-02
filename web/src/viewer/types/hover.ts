import type { Vector3 } from "three";
import type { ElementNode, ElementType } from "./element";
import type { ReactNode } from "react";

export type HoverInfo = {
  title: string;
  subtitle: string;
  items: { label: string; value: string | number | boolean | ReactNode }[];
};

export interface HoverInfoProvider<
  E extends ElementNode<unknown, ElementType>
> {
  getHoverInfo(element: E, pos: Vector3): HoverInfo | null;
}
