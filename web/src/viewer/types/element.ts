import type { Id } from "@/utils/id";

export type ElementType = string;

export interface ElementNode<D, T extends ElementType> {
  id: Id;
  parentId: Id | null;
  childrenIds: Id[];
  name: string;
  visible: boolean;
  type: T;
  data: D;
}