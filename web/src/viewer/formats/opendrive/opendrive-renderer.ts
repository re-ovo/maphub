import {
  Scene,
  Group,
  Mesh,
  BufferGeometry,
  MeshStandardMaterial,
  Color,
  Float32BufferAttribute,
  DoubleSide,
  type Object3D,
  type Intersection,
  type Material,
} from "three";
import {
  LaneMeshBuilder,
  type OpenDrive,
  type OdrRoad,
  type OdrLaneSection,
  type OdrLane,
} from "core";
import type { MapRenderer } from "../../types";

/** OpenDrive 渲染器 */
export class OpenDriveRenderer implements MapRenderer {
  readonly rootNode: Group;
  readonly scene: Scene;

  private odr: OpenDrive;
  private documentId: string;

  /** nodeId -> meshes 映射 */
  private nodeToMeshes = new Map<string, Mesh[]>();
  /** mesh -> nodeId 映射 */
  private meshToNodeId = new Map<Object3D, string>();
  /** 高亮前的原始颜色 */
  private originalColors = new Map<Mesh, Color>();

  constructor(scene: Scene, odr: OpenDrive, documentId: string) {
    this.scene = scene;
    this.odr = odr;
    this.documentId = documentId;

    this.rootNode = new Group();
    this.rootNode.name = `odr_${documentId}`;
    scene.add(this.rootNode);
  }

  render(): void {
    const roads = this.odr.roads || [];
    roads.forEach((road) => this.renderRoad(road));
  }

  dispose(): void {
    // Three.js 需要手动释放几何体和材质
    this.rootNode.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          (child.material as Material).dispose();
        }
      }
    });

    this.scene.remove(this.rootNode);
    this.nodeToMeshes.clear();
    this.meshToNodeId.clear();
    this.originalColors.clear();
  }

  getNodeFromIntersection(intersection: Intersection): string | null {
    // 向上遍历找到注册的节点
    let current: Object3D | null = intersection.object;
    while (current) {
      const nodeId = this.meshToNodeId.get(current);
      if (nodeId) return nodeId;
      current = current.parent;
    }
    return null;
  }

  setVisible(visible: boolean): void {
    this.rootNode.visible = visible;
  }

  setNodeVisible(nodeId: string, visible: boolean): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes) {
      meshes.forEach((mesh) => {
        mesh.visible = visible;
      });
    }
  }

  highlight(nodeId: string): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes) {
      meshes.forEach((mesh) => {
        const material = mesh.material as MeshStandardMaterial;
        // 保存原始颜色
        if (!this.originalColors.has(mesh)) {
          this.originalColors.set(mesh, material.color.clone());
        }
        // 设置高亮颜色
        material.color.set(0xffff00);
        material.emissive.set(0x333300);
      });
    }
  }

  unhighlight(nodeId: string): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes) {
      meshes.forEach((mesh) => {
        const original = this.originalColors.get(mesh);
        if (original) {
          const material = mesh.material as MeshStandardMaterial;
          material.color.copy(original);
          material.emissive.set(0x000000);
          this.originalColors.delete(mesh);
        }
      });
    }
  }

  unhighlightAll(): void {
    this.originalColors.forEach((original, mesh) => {
      const material = mesh.material as MeshStandardMaterial;
      material.color.copy(original);
      material.emissive.set(0x000000);
    });
    this.originalColors.clear();
  }

  focusOn(nodeId: string): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes && meshes.length > 0) {
      const mesh = meshes[0];
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      if (box) {
        const center = box.getCenter(mesh.position.clone());
        mesh.localToWorld(center);
        // 相机聚焦需要通过 store 的 controls 实现
        // 这里只提供目标位置
      }
    }
  }

  private renderRoad(road: OdrRoad): void {
    const roadNodeId = `${this.documentId}:road:${road.id}`;
    const roadGroup = new Group();
    roadGroup.name = `road_${road.id}`;
    this.rootNode.add(roadGroup);

    const meshBuilder = new LaneMeshBuilder(1.0);
    const sections = road.lanes || [];

    // 遍历每个 lane section
    sections.forEach((section, sectionIndex) => {
      const sectionNodeId = `${this.documentId}:road:${road.id}:section:${sectionIndex}`;
      const sectionGroup = new Group();
      sectionGroup.name = `road_${road.id}_section_${sectionIndex}`;
      roadGroup.add(sectionGroup);

      // 计算 s 范围
      const sStart = section.s;
      const sEnd =
        sectionIndex + 1 < sections.length
          ? sections[sectionIndex + 1].s
          : road.length;

      // 渲染左侧车道
      for (const lane of section.left || []) {
        this.renderLane(
          meshBuilder,
          road,
          section,
          lane,
          sectionIndex,
          sStart,
          sEnd,
          sectionGroup
        );
      }

      // 渲染右侧车道
      for (const lane of section.right || []) {
        this.renderLane(
          meshBuilder,
          road,
          section,
          lane,
          sectionIndex,
          sStart,
          sEnd,
          sectionGroup
        );
      }

      // 注册 section 节点（包含其下所有 lane mesh）
      const sectionMeshes: Mesh[] = [];
      sectionGroup.traverse((child) => {
        if (child instanceof Mesh) {
          sectionMeshes.push(child);
        }
      });
      if (sectionMeshes.length > 0) {
        this.nodeToMeshes.set(sectionNodeId, sectionMeshes);
      }
    });

    // 注册 road 节点（包含所有子 mesh）
    const roadMeshes: Mesh[] = [];
    roadGroup.traverse((child) => {
      if (child instanceof Mesh) {
        roadMeshes.push(child);
      }
    });
    if (roadMeshes.length > 0) {
      this.nodeToMeshes.set(roadNodeId, roadMeshes);
    }
  }

  private renderLane(
    meshBuilder: LaneMeshBuilder,
    road: OdrRoad,
    section: OdrLaneSection,
    lane: OdrLane,
    sectionIndex: number,
    sStart: number,
    sEnd: number,
    parentGroup: Group
  ): void {
    const laneNodeId = `${this.documentId}:road:${road.id}:section:${sectionIndex}:lane:${lane.id}`;

    // 构建 lane mesh 数据
    const meshData = meshBuilder.buildLaneMesh(road, section, lane, sStart, sEnd);

    // 创建 Three.js BufferGeometry
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(meshData.vertices, 3)
    );
    geometry.setAttribute(
      "normal",
      new Float32BufferAttribute(meshData.normals, 3)
    );
    geometry.setIndex(Array.from(meshData.indices));

    // 创建材质
    const material = new MeshStandardMaterial({
      color: this.getLaneColor(lane.type),
      side: DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
    });

    // 创建 mesh
    const mesh = new Mesh(geometry, material);
    mesh.name = `road_${road.id}_section_${sectionIndex}_lane_${lane.id}`;
    parentGroup.add(mesh);

    // 注册 lane nodeId -> mesh 映射
    this.registerNodeMesh(laneNodeId, mesh);
  }

  /** 根据车道类型返回颜色 */
  private getLaneColor(laneType: string): Color {
    switch (laneType) {
      case "driving":
        return new Color(0.3, 0.3, 0.3); // 深灰色
      case "shoulder":
        return new Color(0.5, 0.5, 0.5); // 浅灰色
      case "sidewalk":
        return new Color(0.6, 0.55, 0.5); // 米色
      case "border":
        return new Color(0.4, 0.4, 0.4);
      case "parking":
        return new Color(0.3, 0.4, 0.5); // 蓝灰色
      case "biking":
        return new Color(0.2, 0.5, 0.3); // 绿色
      case "median":
        return new Color(0.35, 0.45, 0.35); // 草绿
      default:
        return new Color(0.35, 0.35, 0.35);
    }
  }

  private registerNodeMesh(nodeId: string, mesh: Mesh): void {
    this.meshToNodeId.set(mesh, nodeId);

    const existing = this.nodeToMeshes.get(nodeId) || [];
    existing.push(mesh);
    this.nodeToMeshes.set(nodeId, existing);
  }
}
