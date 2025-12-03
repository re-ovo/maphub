import type { Files } from "core";
import type {
  ElementNode,
  HoverInfo,
  PropertyGroup,
  TreeNode,
} from "./element";
import type { Vector3 } from "three";
import type { RenderBase } from "./render-base";

export type MapFormatType = "opendrive" | "apollo";

export interface Format<
  ParsedData,
  M extends MapFormatType,
  E extends ElementNode<unknown, M, string>,
  Renderer extends RenderBase<E>
> {
  parse(data: Files): Promise<ParsedData>;

  buildElements(data: ParsedData): E[];

  buildRenderer(data: ParsedData): Renderer;

  provideHoverInfo(element: E, pos: Vector3): HoverInfo | null;

  provideProperties(element: E): PropertyGroup[];

  provideTreeNode(element: E): TreeNode;
}
