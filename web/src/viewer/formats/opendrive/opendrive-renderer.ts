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
import { LaneMeshBuilder, type OpenDrive, type OdrRoad } from "core";
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

    // 使用 LaneMeshBuilder 构建道路网格
    const meshBuilder = new LaneMeshBuilder(1.0);
    const meshData = meshBuilder.buildRoadMesh(road);

    // 创建 BabylonJS 网格
    const mesh = new Mesh(`road_${road.id}_lanes`, this.scene);
    mesh.parent = roadNode;

    // 设置顶点数据
    const vertexData = new VertexData();
    vertexData.positions = meshData.vertices;
    vertexData.indices = Array.from(meshData.indices);
    vertexData.normals = meshData.normals;
    vertexData.applyToMesh(mesh);

    // 设置材质
    const material = new StandardMaterial(`road_${road.id}_mat`, this.scene);
    material.diffuseColor = new Color3(0.3, 0.3, 0.3);
    material.backFaceCulling = false;
    mesh.material = material;

    // 注册 nodeId -> mesh 映射
    this.registerNodeMesh(roadNodeId, mesh);
  }

  private registerNodeMesh(nodeId: string, mesh: AbstractMesh): void {
    this.meshToNodeId.set(mesh, nodeId);

    const existing = this.nodeToMeshes.get(nodeId) || [];
    existing.push(mesh);
    this.nodeToMeshes.set(nodeId, existing);
  }
}
