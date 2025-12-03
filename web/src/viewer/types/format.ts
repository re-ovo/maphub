import type { Files } from "core";
import type {
  ElementNode,
  HoverInfo,
  PropertyGroup,
  TreeNode,
} from "./element";
import type { Vector3 } from "three";

/**
 * Format interface for map format implementations.
 *
 * @typeParam ParsedData - The type of data returned by parse()
 * @typeParam Renderer - The renderer type returned by buildRenderer()
 * @typeParam ElementData - The data type stored in ElementNode.data (default: unknown)
 * @typeParam ElementType - Union type of element types (default: string)
 */
export interface Format<
  ParsedData,
  Renderer,
  ElementData = unknown,
  ElementType extends string = string,
> {
  parse(data: Files): Promise<ParsedData>;

  buildElements(data: ParsedData): ElementNode<ElementData, ElementType>[];

  buildRenderer(data: ParsedData): Renderer;

  provideHoverInfo(
    element: ElementNode<ElementData, ElementType>,
    pos: Vector3,
  ): HoverInfo | null;

  provideProperties(
    element: ElementNode<ElementData, ElementType>,
  ): PropertyGroup[];

  provideTreeNode(element: ElementNode<ElementData, ElementType>): TreeNode;
}
