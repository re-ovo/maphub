import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import {
  LaneMeshBuilder,
  OdrLane,
  OdrLaneSection,
  OdrRoad,
  OpenDrive,
} from "core";

export class MapRenderer extends Object3D {
  constructor(opendrive: OpenDrive) {
    super();

    this.createRoads(opendrive);
  }

  createRoads(opendrive: OpenDrive) {
    opendrive.roads.forEach((road) => {
      this.add(new RoadRenderer(road));
    });
  }
}

export class RoadRenderer extends Object3D {
  constructor(road: OdrRoad) {
    super();

    this.name = `Road-${road.id}`;

    // 为每个 lane section 创建渲染器
    road.lanes.forEach((laneSection, index) => {
      // 计算 lane section 的结束位置
      const sStart = laneSection.s;
      const sEnd =
        index < road.lanes.length - 1 ? road.lanes[index + 1].s : road.length;

      this.add(new LaneSectionRenderer(road, laneSection, sStart, sEnd));
    });
  }
}

export class LaneSectionRenderer extends Object3D {
  constructor(
    road: OdrRoad,
    laneSection: OdrLaneSection,
    sStart: number,
    sEnd: number
  ) {
    super();

    this.name = `LaneSection-${laneSection.s}`;

    // 渲染左侧车道
    laneSection.left.forEach((lane) => {
      this.add(new LaneRenderer(road, laneSection, lane, sStart, sEnd));
    });

    // 渲染右侧车道
    laneSection.right.forEach((lane) => {
      this.add(new LaneRenderer(road, laneSection, lane, sStart, sEnd));
    });

    // 中心车道通常不需要渲染（id=0，参考线）
  }
}

export class LaneRenderer extends Object3D {
  constructor(
    road: OdrRoad,
    laneSection: OdrLaneSection,
    lane: OdrLane,
    sStart: number,
    sEnd: number
  ) {
    super();

    this.name = `Lane-${lane.id}`;

    // 创建车道网格构建器（采样间隔 1 米）
    const meshBuilder = new LaneMeshBuilder(1.0);

    // 构建单个车道的网格数据
    const meshData = meshBuilder.buildLaneMesh(
      road,
      laneSection,
      lane,
      sStart,
      sEnd
    );

    // 如果网格数据为空，跳过渲染
    if (meshData.vertices.length === 0) {
      meshData.free();
      meshBuilder.free();
      return;
    }

    // 创建 Three.js 几何体
    const geometry = new BufferGeometry();

    // 设置顶点位置（每3个值一组，表示 x, y, z）
    geometry.setAttribute(
      "position",
      new BufferAttribute(meshData.vertices, 3)
    );

    // 设置法线（用于光照计算）
    geometry.setAttribute("normal", new BufferAttribute(meshData.normals, 3));

    // 设置索引（定义三角形）
    geometry.setIndex(new BufferAttribute(meshData.indices, 1));

    // 根据车道类型选择不同的材质
    const material = this.createMaterial(lane);

    // 创建网格对象
    const mesh = new Mesh(geometry, material);
    mesh.name = `LaneMesh-${lane.id}`;

    // 启用阴影
    mesh.castShadow = true;
    mesh.receiveShadow = true;

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
