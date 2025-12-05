import type { Id } from "@/utils/id";
import type { MapFormatNodeType, MapFormatType } from "../format";

export interface MapNode<
  F extends MapFormatType = MapFormatType,
  T extends MapFormatNodeType[F] = MapFormatNodeType[F]
> {
  id: Id;
  parentId: Id | null;
  children: MapNode<F>[];
  name: string;
  visible: boolean;
  format: F;
  type: T;
}
