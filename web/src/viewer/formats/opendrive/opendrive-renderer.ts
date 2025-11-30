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
import type { MapRenderer, Selectable } from "../../types";

/** OpenDrive 渲染器 */
export class OpenDriveRenderer implements MapRenderer {
  readonly rootNode: TransformNode;
  readonly scene: Scene;

  private odr: OpenDrive;
  private documentId: string;
  private highlightLayer: HighlightLayer;
  private meshToSelectable = new Map<AbstractMesh, Selectable>();
  private selectableToMeshes = new Map<string, AbstractMesh[]>();

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
    this.meshToSelectable.clear();
    this.selectableToMeshes.clear();
  }

  getSelectableFromPick(pickInfo: PickingInfo): Selectable | null {
    if (!pickInfo.hit || !pickInfo.pickedMesh) return null;
    return this.meshToSelectable.get(pickInfo.pickedMesh) ?? null;
  }

  setVisible(visible: boolean): void {
    this.rootNode.setEnabled(visible);
  }

  highlight(selectable: Selectable): void {
    const key = this.getSelectableKey(selectable);
    const meshes = this.selectableToMeshes.get(key);
    if (meshes) {
      meshes.forEach((mesh) => {
        this.highlightLayer.addMesh(mesh, Color3.Yellow());
      });
    }
  }

  unhighlight(selectable: Selectable): void {
    const key = this.getSelectableKey(selectable);
    const meshes = this.selectableToMeshes.get(key);
    if (meshes) {
      meshes.forEach((mesh) => {
        this.highlightLayer.removeMesh(mesh);
      });
    }
  }

  unhighlightAll(): void {
    this.highlightLayer.removeAllMeshes();
  }

  focusOn(selectable: Selectable): void {
    const key = this.getSelectableKey(selectable);
    const meshes = this.selectableToMeshes.get(key);
    if (meshes && meshes.length > 0) {
      // 计算边界框中心并移动相机
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

    // 注册可选择对象
    const selectable: Selectable = {
      documentId: this.documentId,
      type: "road",
      path: road.id,
      meshes: [mesh],
    };

    this.registerSelectable(mesh, selectable);
  }

  private registerSelectable(mesh: AbstractMesh, selectable: Selectable): void {
    this.meshToSelectable.set(mesh, selectable);

    const key = this.getSelectableKey(selectable);
    const existing = this.selectableToMeshes.get(key) || [];
    existing.push(mesh);
    this.selectableToMeshes.set(key, existing);

    // 更新 selectable 的 meshes 引用
    selectable.meshes = existing;
  }

  private getSelectableKey(selectable: Selectable): string {
    return `${selectable.documentId}:${selectable.type}:${selectable.path}`;
  }
}
