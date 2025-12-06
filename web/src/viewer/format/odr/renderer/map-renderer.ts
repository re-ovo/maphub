import { MapRenderer } from "@/viewer/types/renderer";
import { AdaptiveGrid } from "@/utils/three/adaptive-grid";
import type { OdrMapElement } from "../elements";
import { OdrRoadRenderer } from "./road-renderer";

export class OdrMapRenderer extends MapRenderer<"opendrive", "map"> {
  readonly node: OdrMapElement;
  private readonly grid: AdaptiveGrid;

  constructor(node: OdrMapElement) {
    super();

    this.node = node;
    this.name = node.name;
    this.visible = node.visible;

    this.createRoads();

    // 创建自适应网格
    this.grid = new AdaptiveGrid({
      primaryColor: 0x444444,
      secondaryColor: 0x222222,
      opacity: 0.5,
      offsetY: 0.5,
    });
    this.add(this.grid);

    // 在所有道路创建完成后更新网格
    this.grid.updateFromTarget(this);
  }

  private createRoads() {
    // 遍历子节点,找到 roads 节点或直接找到 road 节点
    this.node.children.forEach((child) => {
      if (child.type === "roads") {
        // 如果是 roads 容器节点,遍历其子节点
        child.children.forEach((roadChild) => {
          this.add(new OdrRoadRenderer(roadChild));
        });
      } else if (child.type === "road") {
        // 直接是 road 节点
        this.add(new OdrRoadRenderer(child));
      }
    });
  }
}
