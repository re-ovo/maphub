import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { LaneMeshBuilder, OdrLane } from "core";
import { MapRenderer } from "@/viewer/types/renderer";
import { AdaptiveGrid } from "@/utils/three/adaptive-grid";
import { DirectionArrows } from "@/utils/three/direction-arrows";
import type {
  OdrMapElement,
  OdrRoadElement,
  OdrLaneSectionElement,
  OdrLaneElement,
} from "../elements";
import { odrPositionToThree } from "../math";

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
    // 遍历子节点，找到 roads 节点或直接找到 road 节点
    this.node.children.forEach((child) => {
      if (child.type === "roads") {
        // 如果是 roads 容器节点，遍历其子节点
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
    // 遍历子节点，都是 lane-section 节点
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

    // 采样道路参考线，生成采样点
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
    // 遍历子节点，都是 lane 节点
    this.node.children.forEach((child) => {
      this.add(new OdrLaneRenderer(child));
    });
  }
}

export class OdrLaneRenderer extends MapRenderer<"opendrive", "lane"> {
  readonly node: OdrLaneElement;

  constructor(node: OdrLaneElement) {
    super();

    this.node = node;
    this.name = node.name;
    this.visible = node.visible;

    this.createMesh();
  }

  private createMesh() {
    // 创建车道网格构建器（采样间隔 1 米）
    const meshBuilder = new LaneMeshBuilder(0.1);

    // 从节点中获取必要的数据
    const { road, section, lane, sStart, sEnd } = this.node;

    // 构建单个车道的网格数据
    const meshData = meshBuilder.buildLaneMesh(road, section, lane, sStart, sEnd);

    // 如果网格数据为空，跳过渲染
    if (meshData.vertices.length === 0) {
      meshData.free();
      meshBuilder.free();
      return;
    }

    // 创建 Three.js 几何体
    const geometry = new BufferGeometry();

    // 设置顶点位置（每3个值一组，表示 x, y, z）
    geometry.setAttribute("position", new BufferAttribute(meshData.vertices, 3));

    // 设置法线（用于光照计算）
    geometry.setAttribute("normal", new BufferAttribute(meshData.normals, 3));

    // 设置索引（定义三角形）
    geometry.setIndex(new BufferAttribute(meshData.indices, 1));

    // 根据车道类型选择不同的材质
    const material = this.createMaterial(lane);

    // 创建网格对象
    const mesh = new Mesh(geometry, material);
    mesh.name = `LaneMesh-${lane.id}`;

    this.add(mesh);

    // 清理 WASM 对象
    meshData.free();
    meshBuilder.free();
  }

  private createMaterial(lane: OdrLane): MeshStandardMaterial {
    // 根据车道类型设置不同的颜色
    let color = 0x555555; // 默认深灰色

    switch (lane.type) {
      case "driving":
        color = 0x444444; // 深灰色 - 行车道
        break;
      case "sidewalk":
        color = 0xcccccc; // 浅灰色 - 人行道
        break;
      case "shoulder":
        color = 0x666666; // 中灰色 - 路肩
        break;
      case "border":
        color = 0x888888; // 边界
        break;
      case "parking":
        color = 0x7799aa; // 蓝灰色 - 停车区
        break;
      case "biking":
        color = 0x88aa77; // 绿色 - 自行车道
        break;
      default:
        color = 0x555555;
    }

    return new MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.2,
      side: DoubleSide,
    });
  }
}
