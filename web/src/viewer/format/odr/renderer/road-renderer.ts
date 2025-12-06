import { Vector3 } from "three";
import { MapRenderer } from "@/viewer/types/renderer";
import { DirectionArrows } from "@/utils/three/direction-arrows";
import type { OdrRoadElement } from "../elements";
import { odrPositionToThree } from "../math";
import { OdrLaneSectionRenderer } from "./lane-section-renderer";

export class OdrRoadRenderer extends MapRenderer<"opendrive", "road"> {
  readonly node: OdrRoadElement;
  private arrows: DirectionArrows | null = null;

  constructor(node: OdrRoadElement) {
    super();

    this.node = node;
    this.name = node.name;
    this.visible = node.visible;

    this.createLaneSections();

    // 监听 hover 事件
    this.addEventListener("hoverOn", this.onHoverOn.bind(this));
    this.addEventListener("hoverOff", this.onHoverOff.bind(this));
  }

  private createLaneSections() {
    // 遍历子节点,都是 lane-section 节点
    this.node.children.forEach((child) => {
      this.add(new OdrLaneSectionRenderer(child));
    });
  }

  /**
   * Hover 进入时创建方向箭头
   */
  private onHoverOn(): void {
    if (this.arrows) return; // 已存在则不重复创建

    const { road } = this.node;

    // 采样道路参考线,生成采样点
    const samplingInterval = 1.0; // 每 1 米采样一个点
    const numSamples = Math.ceil(road.length / samplingInterval) + 1;
    const points: Vector3[] = [];

    for (let i = 0; i < numSamples; i++) {
      const s = Math.min(i * samplingInterval, road.length);
      // 使用 sthToXyz 将道路坐标转为 OpenDRIVE 坐标
      // t=0 (在参考线上), h=0 (无高度偏移)
      const odr = road.sthToXyz(s, 0, 0);
      points.push(odrPositionToThree(odr));
    }

    // 创建方向箭头
    this.arrows = new DirectionArrows(points, {
      color: 0xffaa00, // 橙色
      spacing: 10, // 每 10 米一个箭头
      arrowLength: 3,
      headLength: 1.2,
      headWidth: 0.8,
      offsetY: 0.5, // 悬浮 0.5 米
      reverse: false,
    });

    this.add(this.arrows);
  }

  private onHoverOff(): void {
    if (this.arrows) {
      this.arrows.dispose();
      this.remove(this.arrows);
      this.arrows = null;
    }
  }
}
