import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
} from "three";
import { LaneMeshBuilder, OdrLane } from "core";
import { MapRenderer } from "@/viewer/types/renderer";
import type { OdrLaneElement } from "../elements";

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
