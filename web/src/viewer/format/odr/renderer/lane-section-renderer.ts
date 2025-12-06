import { MapRenderer } from "@/viewer/types/renderer";
import type { OdrLaneSectionElement } from "../elements";
import { OdrLaneRenderer } from "./lane-renderer";

export class OdrLaneSectionRenderer extends MapRenderer<"opendrive", "lane-section"> {
  readonly node: OdrLaneSectionElement;

  constructor(node: OdrLaneSectionElement) {
    super();

    this.node = node;
    this.name = node.name;
    this.visible = node.visible;

    this.createLanes();
  }

  private createLanes() {
    // 遍历子节点,都是 lane 节点
    this.node.children.forEach((child) => {
      this.add(new OdrLaneRenderer(child));
    });
  }
}
