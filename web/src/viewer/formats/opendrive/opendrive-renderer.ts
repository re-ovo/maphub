import {
  Scene,
  TransformNode,
  Mesh,
  VertexData,
  StandardMaterial,
  Color3,
  HighlightLayer,
  type PickingInfo,
  type AbstractMesh,
} from "@babylonjs/core";
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
  readonly rootNode: TransformNode;
  readonly scene: Scene;

  private odr: OpenDrive;
  private documentId: string;
  private highlightLayer: HighlightLayer;

  /** nodeId -> meshes 映射 */
  private nodeToMeshes = new Map<string, AbstractMesh[]>();
  /** mesh -> nodeId 映射 */
  private meshToNodeId = new Map<AbstractMesh, string>();

  constructor(scene: Scene, odr: OpenDrive, documentId: string) {
    this.scene = scene;
    this.odr = odr;
    this.documentId = documentId;

    this.rootNode = new TransformNode(`odr_${documentId}`, scene);
    this.highlightLayer = new HighlightLayer(`highlight_${documentId}`, scene);
  }

  render(): void {
    const roads = this.odr.roads || [];
    roads.forEach((road) => this.renderRoad(road));
  }

  dispose(): void {
    this.highlightLayer.dispose();
    this.rootNode.dispose();
    this.nodeToMeshes.clear();
    this.meshToNodeId.clear();
  }

  getNodeFromPick(pickInfo: PickingInfo): string | null {
    if (!pickInfo.hit || !pickInfo.pickedMesh) return null;
    return this.meshToNodeId.get(pickInfo.pickedMesh) ?? null;
  }

  setVisible(visible: boolean): void {
    this.rootNode.setEnabled(visible);
  }

  setNodeVisible(nodeId: string, visible: boolean): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes) {
      meshes.forEach((mesh) => mesh.setEnabled(visible));
    }
  }

  highlight(nodeId: string): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes) {
      meshes.forEach((mesh) => {
        this.highlightLayer.addMesh(mesh, Color3.Yellow());
      });
    }
  }

  unhighlight(nodeId: string): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes) {
      meshes.forEach((mesh) => {
        this.highlightLayer.removeMesh(mesh);
      });
    }
  }

  unhighlightAll(): void {
    this.highlightLayer.removeAllMeshes();
  }

  focusOn(nodeId: string): void {
    const meshes = this.nodeToMeshes.get(nodeId);
    if (meshes && meshes.length > 0) {
      const mesh = meshes[0];
      const boundingInfo = mesh.getBoundingInfo();
      const center = boundingInfo.boundingBox.centerWorld;

      const camera = this.scene.activeCamera;
      if (camera && "setTarget" in camera) {
        (camera as { setTarget: (target: typeof center) => void }).setTarget(
          center
        );
      }
    }
  }

  private renderRoad(road: OdrRoad): void {
    const roadNodeId = `${this.documentId}:road:${road.id}`;
    const roadNode = new TransformNode(`road_${road.id}`, this.scene);
    roadNode.parent = this.rootNode;

    const meshBuilder = new LaneMeshBuilder(1.0);
    const sections = road.lanes || [];

    // 遍历每个 lane section
    sections.forEach((section, sectionIndex) => {
      const sectionNodeId = `${this.documentId}:road:${road.id}:section:${sectionIndex}`;
      const sectionNode = new TransformNode(
        `road_${road.id}_section_${sectionIndex}`,
        this.scene
      );
      sectionNode.parent = roadNode;

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
          sectionNode
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
          sectionNode
        );
      }

      // 注册 section 节点（包含其下所有 lane mesh）
      const sectionMeshes = sectionNode.getChildMeshes();
      if (sectionMeshes.length > 0) {
        this.nodeToMeshes.set(
          sectionNodeId,
          sectionMeshes as AbstractMesh[]
        );
      }
    });

    // 注册 road 节点（包含所有子 mesh）
    const roadMeshes = roadNode.getChildMeshes();
    if (roadMeshes.length > 0) {
      this.nodeToMeshes.set(roadNodeId, roadMeshes as AbstractMesh[]);
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
    parentNode: TransformNode
  ): void {
    const laneNodeId = `${this.documentId}:road:${road.id}:section:${sectionIndex}:lane:${lane.id}`;

    // 构建 lane mesh
    const meshData = meshBuilder.buildLaneMesh(road, section, lane, sStart, sEnd);

    // 创建 BabylonJS 网格
    const mesh = new Mesh(
      `road_${road.id}_section_${sectionIndex}_lane_${lane.id}`,
      this.scene
    );
    mesh.parent = parentNode;

    // 设置顶点数据
    const vertexData = new VertexData();
    vertexData.positions = meshData.vertices;
    vertexData.indices = Array.from(meshData.indices);
    vertexData.normals = meshData.normals;
    vertexData.applyToMesh(mesh);

    // 根据车道类型设置材质颜色
    const material = new StandardMaterial(
      `lane_${road.id}_${sectionIndex}_${lane.id}_mat`,
      this.scene
    );
    material.diffuseColor = this.getLaneColor(lane.type);
    material.backFaceCulling = false;
    mesh.material = material;

    // 注册 lane nodeId -> mesh 映射
    this.registerNodeMesh(laneNodeId, mesh);
  }

  /** 根据车道类型返回颜色 */
  private getLaneColor(laneType: string): Color3 {
    switch (laneType) {
      case "driving":
        return new Color3(0.3, 0.3, 0.3); // 深灰色
      case "shoulder":
        return new Color3(0.5, 0.5, 0.5); // 浅灰色
      case "sidewalk":
        return new Color3(0.6, 0.55, 0.5); // 米色
      case "border":
        return new Color3(0.4, 0.4, 0.4);
      case "parking":
        return new Color3(0.3, 0.4, 0.5); // 蓝灰色
      case "biking":
        return new Color3(0.2, 0.5, 0.3); // 绿色
      case "median":
        return new Color3(0.35, 0.45, 0.35); // 草绿
      default:
        return new Color3(0.35, 0.35, 0.35);
    }
  }

  private registerNodeMesh(nodeId: string, mesh: AbstractMesh): void {
    this.meshToNodeId.set(mesh, nodeId);

    const existing = this.nodeToMeshes.get(nodeId) || [];
    existing.push(mesh);
    this.nodeToMeshes.set(nodeId, existing);
  }
}
