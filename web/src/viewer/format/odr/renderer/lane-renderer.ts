import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshStandardMaterial } from "three";
import type { OdrRoadMarkColor } from "@maphub/core";
import { LaneMeshBuilder, OdrLane, RoadMarkMeshBuilder } from "@maphub/core";
import { MapRenderer } from "@/viewer/types/renderer";
import type { OdrLaneElement } from "../elements";
import { scheduleIdleTask } from "@/utils/scheduler";

export class OdrLaneRenderer extends MapRenderer<"opendrive", "lane"> {
  readonly node: OdrLaneElement;

  constructor(node: OdrLaneElement) {
    super();

    this.node = node;
    this.name = node.name;
    this.visible = node.visible;

    // 创建车道网格
    this.createMesh();
    // 在浏览器空闲时创建道路标线网格
    scheduleIdleTask(() => {
      this.createRoadMarkMesh();
    });
  }

  private createMesh() {
    // 创建车道网格构建器(采样间隔 1 米)
    const meshBuilder = new LaneMeshBuilder(0.1);

    // 从节点中获取必要的数据
    const { road, section, lane, sStart, sEnd } = this.node;

    // 构建单个车道的网格数据
    const meshData = meshBuilder.buildLaneMesh(road, section, lane, sStart, sEnd);

    // 如果网格数据为空,跳过渲染
    if (meshData.vertices.length === 0) {
      meshData.free();
      meshBuilder.free();
      return;
    }

    // 创建 Three.js 几何体
    const geometry = new BufferGeometry();

    // 设置顶点位置(每3个值一组,表示 x, y, z)
    geometry.setAttribute("position", new BufferAttribute(meshData.vertices, 3));

    // 设置法线(用于光照计算)
    geometry.setAttribute("normal", new BufferAttribute(meshData.normals, 3));

    // 设置索引(定义三角形)
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
        color = 0x555555; // 深灰色 - 行车道
        break;
      case "sidewalk":
        color = 0xcccccc; // 浅灰色 - 人行道
        break;
      case "shoulder":
        color = 0x777777; // 中灰色 - 路肩
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
        color = 0x666666;
    }

    return new MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.2,
      side: DoubleSide,
    });
  }

  private createRoadMarkMesh() {
    // 创建车道标线网格构建器(采样间隔 0.1 米)
    const roadMarkBuilder = new RoadMarkMeshBuilder(0.1);

    // 从节点中获取必要的数据
    const { road, section, lane, sStart, sEnd } = this.node;

    // 构建车道标线网格列表(每个 road mark 独立)
    const meshList = roadMarkBuilder.buildLaneRoadMarks(road, section, lane, sStart, sEnd);

    // 为每个 road mark 创建独立的 Mesh
    for (let i = 0; i < meshList.length; i++) {
      const item = meshList.get(i);
      if (!item) continue;

      const meshData = item.mesh;

      // 如果网格数据为空,跳过
      if (meshData.vertices.length === 0) {
        meshData.free();
        continue;
      }

      // 创建 Three.js 几何体
      const geometry = new BufferGeometry();

      // 设置顶点位置
      geometry.setAttribute("position", new BufferAttribute(meshData.vertices, 3));

      // 设置法线
      geometry.setAttribute("normal", new BufferAttribute(meshData.normals, 3));

      // 设置索引
      geometry.setIndex(new BufferAttribute(meshData.indices, 1));

      // 使用该 road mark 的颜色
      const markColor = this.colorToHex(item.color);

      // 创建材质
      const material = new MeshStandardMaterial({
        color: markColor,
        roughness: 0.4,
        metalness: 0.1,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });

      // 创建网格对象
      const mesh = new Mesh(geometry, material);
      mesh.name = `RoadMarkMesh-${lane.id}-${i}`;

      this.add(mesh);

      // 清理 WASM 对象
      meshData.free();
    }

    // 清理 WASM 对象
    roadMarkBuilder.free();
  }

  private colorToHex(color: OdrRoadMarkColor): number {
    switch (color) {
      case "white":
      case "standard":
        return 0xffffff;
      case "yellow":
        return 0xffcc00;
      case "blue":
        return 0x0066cc;
      case "green":
        return 0x00aa00;
      case "red":
        return 0xcc0000;
      case "orange":
        return 0xff8800;
      case "violet":
        return 0x8800cc;
      case "black":
        return 0x222222;
      default:
        return 0xffffff;
    }
  }
}
