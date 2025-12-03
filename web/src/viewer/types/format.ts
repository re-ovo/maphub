import type { Files } from "core";
import type {
  ElementNode,
  HoverInfo,
  PropertyGroup,
  TreeNode,
} from "./element";
import type { Vector3 } from "three";

export interface Format<
  ParsedData,
  Renderer,
  E extends ElementNode<unknown, string>
> {
  parse(data: Files): Promise<ParsedData>;

  buildElements(data: ParsedData): E[];

  buildRenderer(data: ParsedData): Renderer;

  provideHoverInfo(element: E, pos: Vector3): HoverInfo | null;

  provideProperties(element: E): PropertyGroup[];

  provideTreeNode(element: E): TreeNode;
}
