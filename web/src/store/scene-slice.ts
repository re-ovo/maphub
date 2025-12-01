import type { StateCreator } from "zustand";
import type { Scene } from "@babylonjs/core";
import type { DocumentNode, SemanticNode, HoverInfo } from "@/viewer/types";

export type CameraMode = "perspective" | "orthographic";

export interface SceneSlice {
  // ============ Babylon.js Scene ============
  /** BabylonJS 场景实例 */
  scene: Scene | null;
  setScene: (scene: Scene | null) => void;

  // ============ Viewport Settings ============
  showGrid: boolean;
  showAxis: boolean;
  toggleGrid: () => void;
  toggleAxis: () => void;

  /** 相机模式：透视/正交 */
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;

  // ============ Documents ============
  /** 已加载的文档节点 (documentId -> DocumentNode) */
  documents: Map<string, DocumentNode>;

  /** 所有语义节点索引 (nodeId -> SemanticNode) */
  nodeIndex: Map<string, SemanticNode>;

  /** 添加文档 */
  addDocument: (doc: DocumentNode) => void;

  /** 移除文档 */
  removeDocument: (id: string) => void;

  /** 获取文档 */
  getDocument: (id: string) => DocumentNode | undefined;

  /** 获取节点 */
  getNode: (id: string) => SemanticNode | undefined;

  /** 设置文档可见性 */
  setDocumentVisible: (id: string, visible: boolean) => void;

  /** 设置节点可见性 */
  setNodeVisible: (nodeId: string, visible: boolean) => void;

  // ============ Selection ============
  /** 当前选中的节点 ID 列表 */
  selection: string[];

  /** 设置选择 (替换) */
  setSelection: (nodeIds: string[]) => void;

  /** 添加到选择 */
  addToSelection: (nodeId: string) => void;

  /** 从选择中移除 */
  removeFromSelection: (nodeId: string) => void;

  /** 清空选择 */
  clearSelection: () => void;

  /** 切换选择 */
  toggleSelection: (nodeId: string) => void;

  /** 获取主选择（最后选中的） */
  getPrimarySelection: () => string | null;

  // ============ Hover ============
  /** 当前悬浮的节点 ID */
  hoveredNodeId: string | null;

  /** 悬浮信息 */
  hoverInfo: HoverInfo | null;

  /** 鼠标位置（屏幕坐标） */
  hoverPosition: { x: number; y: number } | null;

  /** 设置悬浮 */
  setHover: (
    nodeId: string | null,
    info?: HoverInfo | null,
    position?: { x: number; y: number }
  ) => void;

  /** 清除悬浮 */
  clearHover: () => void;
}

/** 从 DocumentNode 构建节点索引 */
function buildNodeIndex(doc: DocumentNode): Map<string, SemanticNode> {
  const index = new Map<string, SemanticNode>();

  // DocumentNode 本身也是 SemanticNode
  index.set(doc.id, doc);

  // 从 metadata.nodeIndex 获取子节点索引（由 MapFormat.createDocument 构建）
  const metadataIndex = (doc.metadata as Record<string, unknown>)?.nodeIndex as
    | Map<string, SemanticNode>
    | undefined;

  if (metadataIndex) {
    metadataIndex.forEach((node, id) => {
      index.set(id, node);
    });
  }

  return index;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (
  set,
  get
) => ({
  // ============ Scene ============
  scene: null,
  setScene: (scene) => set({ scene }),

  showGrid: true,
  showAxis: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAxis: () => set((state) => ({ showAxis: !state.showAxis })),

  cameraMode: "perspective",
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === "perspective" ? "orthographic" : "perspective",
    })),

  // ============ Documents ============
  documents: new Map(),
  nodeIndex: new Map(),

  addDocument: (doc) =>
    set((state) => {
      const newDocs = new Map(state.documents);
      newDocs.set(doc.id, doc);

      // 构建节点索引
      const newIndex = new Map(state.nodeIndex);
      const docIndex = buildNodeIndex(doc);
      docIndex.forEach((node, id) => newIndex.set(id, node));

      return { documents: newDocs, nodeIndex: newIndex };
    }),

  removeDocument: (id) =>
    set((state) => {
      const doc = state.documents.get(id);
      if (doc) {
        doc.renderer.dispose();
      }

      const newDocs = new Map(state.documents);
      newDocs.delete(id);

      // 移除该文档的所有节点索引
      const newIndex = new Map(state.nodeIndex);
      newIndex.forEach((node, nodeId) => {
        // 检查节点是否属于该文档（通过向上查找父节点直到根）
        let current: SemanticNode | undefined = node;
        while (current) {
          if (current.id === id) {
            newIndex.delete(nodeId);
            break;
          }
          current = current.parentId
            ? state.nodeIndex.get(current.parentId)
            : undefined;
        }
      });

      return { documents: newDocs, nodeIndex: newIndex };
    }),

  getDocument: (id) => get().documents.get(id),

  getNode: (id) => get().nodeIndex.get(id),

  setDocumentVisible: (id, visible) =>
    set((state) => {
      const doc = state.documents.get(id);
      if (doc) {
        doc.renderer.setVisible(visible);
        const newDocs = new Map(state.documents);
        newDocs.set(id, { ...doc, visible });
        return { documents: newDocs };
      }
      return state;
    }),

  setNodeVisible: (nodeId, visible) => {
    const state = get();
    const node = state.nodeIndex.get(nodeId);
    if (!node) return;

    // 找到所属文档
    let current: SemanticNode | undefined = node;
    while (current?.parentId) {
      current = state.nodeIndex.get(current.parentId);
    }
    const doc = current ? state.documents.get(current.id) : undefined;
    if (doc) {
      doc.renderer.setNodeVisible(nodeId, visible);
    }
  },

  // ============ Selection ============
  selection: [],

  setSelection: (nodeIds) => set({ selection: nodeIds }),

  addToSelection: (nodeId) =>
    set((state) => {
      if (state.selection.includes(nodeId)) return state;
      return { selection: [...state.selection, nodeId] };
    }),

  removeFromSelection: (nodeId) =>
    set((state) => ({
      selection: state.selection.filter((id) => id !== nodeId),
    })),

  clearSelection: () => set({ selection: [] }),

  toggleSelection: (nodeId) =>
    set((state) => {
      if (state.selection.includes(nodeId)) {
        return { selection: state.selection.filter((id) => id !== nodeId) };
      }
      return { selection: [...state.selection, nodeId] };
    }),

  getPrimarySelection: () => {
    const selection = get().selection;
    return selection.length > 0 ? selection[selection.length - 1] : null;
  },

  // ============ Hover ============
  hoveredNodeId: null,
  hoverInfo: null,
  hoverPosition: null,

  setHover: (nodeId, info, position) =>
    set({
      hoveredNodeId: nodeId,
      hoverInfo: info ?? null,
      hoverPosition: position ?? null,
    }),

  clearHover: () =>
    set({
      hoveredNodeId: null,
      hoverInfo: null,
      hoverPosition: null,
    }),
});
