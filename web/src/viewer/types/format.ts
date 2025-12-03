import type { Files } from "core";
import type { ElementNode } from "./element";

export interface Format<T, R> {
  parse(data: Files): Promise<T>;

  buildElements(data: T): ElementNode[];

  buildRenderer(data: T): R;
}
