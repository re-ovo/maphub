import type { OpenDrive, OdrRoad, OdrLaneSection, OdrLane } from "core";
import type { Selectable } from "../../types";
import type { SceneNode, TreeNodeProvider } from "../../types";

/** OpenDrive 场景树提供者 */
export class OpenDriveTreeProvider implements TreeNodeProvider {
  private documentId: string;
  private odr: OpenDrive;
  private nodeMap = new Map<string, SceneNode>();
  private selectableToNodeId = new Map<string, string>();

  onNodesChange?: (nodes: SceneNode[]) => void;

  constructor(odr: OpenDrive, documentId: string) {
    this.odr = odr;
    this.documentId = documentId;
    this.buildNodeMap();
  }

  getRootNodes(): SceneNode[] {
    const headerName = this.odr.header?.name || "OpenDRIVE";
    const root: SceneNode = {
      id: `${this.documentId}:root`,
      label: headerName,
      type: "document",
      icon: "file",
      visible: true,
      children: [this.createRoadsFolder()],
    };
    return [root];
  }

  getNodeById(id: string): SceneNode | null {
    return this.nodeMap.get(id) ?? null;
  }

  getNodeIdBySelectable(selectable: Selectable): string | null {
    const key = `${selectable.documentId}:${selectable.type}:${selectable.path}`;
    return this.selectableToNodeId.get(key) ?? null;
  }

  setNodeVisible(id: string, visible: boolean): void {
    const node = this.nodeMap.get(id);
    if (node) {
      node.visible = visible;
      this.onNodesChange?.(this.getRootNodes());
    }
  }

  private buildNodeMap(): void {
    const visit = (node: SceneNode) => {
      this.nodeMap.set(node.id, node);
      if (node.selectable) {
        const key = `${node.selectable.documentId}:${node.selectable.type}:${node.selectable.path}`;
        this.selectableToNodeId.set(key, node.id);
      }
      node.children?.forEach(visit);
    };
    this.getRootNodes().forEach(visit);
  }

  private createRoadsFolder(): SceneNode {
    const roads = this.odr.roads || [];
    return {
      id: `${this.documentId}:roads`,
      label: `Roads (${roads.length})`,
      type: "folder",
      icon: "folder",
      visible: true,
      children: roads.map((road) => this.createRoadNode(road)),
    };
  }

  private createRoadNode(road: OdrRoad): SceneNode {
    const roadId = road.id;
    const nodeId = `${this.documentId}:road:${roadId}`;
    const selectable: Selectable = {
      documentId: this.documentId,
      type: "road",
      path: roadId,
      meshes: [],
    };

    return {
      id: nodeId,
      label: road.name || `Road ${roadId}`,
      type: "road",
      icon: "road",
      visible: true,
      selectable,
      children: this.createLaneSectionNodes(road),
      actions: [
        {
          id: "focus",
          label: "聚焦",
          handler: () => console.log("Focus road", roadId),
        },
        {
          id: "hide",
          label: "隐藏",
          handler: () => this.setNodeVisible(nodeId, false),
        },
      ],
    };
  }

  private createLaneSectionNodes(road: OdrRoad): SceneNode[] {
    const sections = road.lanes || [];
    return sections.map((section, index) =>
      this.createLaneSectionNode(road.id, section, index)
    );
  }

  private createLaneSectionNode(
    roadId: string,
    section: OdrLaneSection,
    index: number
  ): SceneNode {
    const nodeId = `${this.documentId}:road:${roadId}:section:${index}`;
    const selectable: Selectable = {
      documentId: this.documentId,
      type: "lane-section",
      path: `${roadId}/section/${index}`,
      meshes: [],
    };

    const leftLanes = section.left || [];
    const rightLanes = section.right || [];
    const allLanes = [...leftLanes, ...rightLanes];

    return {
      id: nodeId,
      label: `Section ${index} (s=${section.s.toFixed(2)})`,
      type: "lane-section",
      icon: "layers",
      visible: true,
      selectable,
      children: allLanes.map((lane) =>
        this.createLaneNode(roadId, index, lane)
      ),
    };
  }

  private createLaneNode(
    roadId: string,
    sectionIndex: number,
    lane: OdrLane
  ): SceneNode {
    const laneId = lane.id;
    const nodeId = `${this.documentId}:road:${roadId}:section:${sectionIndex}:lane:${laneId}`;
    const selectable: Selectable = {
      documentId: this.documentId,
      type: "lane",
      path: `${roadId}/section/${sectionIndex}/lane/${laneId}`,
      meshes: [],
    };

    const side = laneId > 0 ? "L" : laneId < 0 ? "R" : "C";

    return {
      id: nodeId,
      label: `Lane ${side}${Math.abs(laneId)} (${lane.type})`,
      type: "lane",
      icon: "minus",
      visible: true,
      selectable,
    };
  }
}
