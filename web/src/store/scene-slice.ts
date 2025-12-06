import type { Id } from "@/utils/id";
import type { StateCreator } from "zustand";
import type { ViewportRenderer } from "@/viewer/viewport-renderer";
import { MapRenderer } from "@/viewer/types/renderer";
import type { MapNode } from "@/viewer/types/map-node";
import type { HoverInfo } from "@/viewer/types/format";
import { Files, File } from "core";
import { formatRegistry, type MapFormatType } from "@/viewer/format";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export interface SceneSlice {
  /** ViewportRenderer 实例（由 viewport 组件设置） */
  viewportRenderer: ViewportRenderer | null;
  setViewportRenderer: (renderer: ViewportRenderer | null) => void;

  /** 所有根节点 */
  rootNodes: MapNode[];
  /** 所有根渲染器（与 rootNodes 一一对应） */
  rootRenderers: MapRenderer[];

  /** 加载文件 */
  loadFiles: (files: globalThis.File[]) => Promise<void>;

  /** 移除地图 */
  removeMap: (nodeId: Id) => void;

  /** 清空所有地图 */
  clearMaps: () => void;

  /** 导出为 GLB 文件 */
  exportGLB: () => Promise<void>;

  /** Hover 数据 */
  hoverData: HoverData | null;
  setHoverData: (data: HoverData | null) => void;

  /** 选中的节点 ID */
  selectedNodeId: Id | null;
  selectNode: (nodeId: Id | null) => void;

  /** 展开的节点 ID 集合 */
  expandedNodeIds: Set<Id>;
  toggleNodeExpanded: (nodeId: Id) => void;
  setNodeExpanded: (nodeId: Id, expanded: boolean) => void;

  /** 切换节点可见性 */
  toggleNodeVisibility: (nodeId: Id) => void;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (set, get) => ({
  viewportRenderer: null,
  setViewportRenderer: (renderer) => set({ viewportRenderer: renderer }),

  rootNodes: [],
  rootRenderers: [],

  loadFiles: async (browserFiles) => {
    const { viewportRenderer, rootNodes, rootRenderers } = get();
    if (!viewportRenderer) {
      console.error("ViewportRenderer not initialized");
      return;
    }

    // 将浏览器 File 转换为 core 的 Files
    const files = new Files();
    for (const browserFile of browserFiles) {
      const data = new Uint8Array(await browserFile.arrayBuffer());
      const file = new File(browserFile.name, data);
      files.addFile(file);
    }

    // 检测格式
    const format: MapFormatType = files.detectFormat() as MapFormatType;

    // 获取格式处理器
    const formatHandler = formatRegistry[format];
    if (!formatHandler) {
      console.error(`Unsupported format: ${format}`);
      return;
    }

    // 解析文件
    const nodes = formatHandler.parse(files);

    // 为每个根节点创建渲染器并添加到场景
    const newNodes: MapNode[] = [];
    const newRenderers: MapRenderer[] = [];

    for (const node of nodes) {
      const renderer = formatHandler.provideRenderer(node);
      viewportRenderer.scene.add(renderer);
      newNodes.push(node);
      newRenderers.push(renderer);
    }

    // 更新状态
    set({
      rootNodes: [...rootNodes, ...newNodes],
      rootRenderers: [...rootRenderers, ...newRenderers],
    });

    // 自动聚焦到第一个新添加的渲染器
    if (newRenderers.length > 0) {
      viewportRenderer.fitTo(newRenderers[0]);
    }
  },

  removeMap: (nodeId) => {
    const { viewportRenderer, rootNodes, rootRenderers } = get();
    const index = rootNodes.findIndex((n) => n.id === nodeId);
    if (index === -1) return;

    // 从场景中移除
    const renderer = rootRenderers[index];
    if (viewportRenderer) {
      viewportRenderer.scene.remove(renderer);
    }

    // 更新状态
    set({
      rootNodes: rootNodes.filter((_, i) => i !== index),
      rootRenderers: rootRenderers.filter((_, i) => i !== index),
    });
  },

  clearMaps: () => {
    const { viewportRenderer, rootRenderers } = get();

    // 从场景中移除所有渲染器
    if (viewportRenderer) {
      for (const renderer of rootRenderers) {
        viewportRenderer.scene.remove(renderer);
      }
    }

    set({ rootNodes: [], rootRenderers: [] });
  },

  exportGLB: async () => {
    const { viewportRenderer, rootRenderers } = get();

    // 检查是否有可用的渲染器
    if (!viewportRenderer) {
      console.error("ViewportRenderer not initialized");
      return;
    }

    // 检查是否有加载的地图
    if (rootRenderers.length === 0) {
      console.warn("No map loaded to export");
      return;
    }

    // 创建导出器
    const exporter = new GLTFExporter();

    // 导出所有根渲染器
    try {
      // 导出为二进制 GLB 格式
      const result = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          rootRenderers,
          (gltf) => {
            resolve(gltf as ArrayBuffer);
          },
          (error) => {
            reject(error);
          },
          { binary: true },
        );
      });

      // 创建 Blob 并下载
      const blob = new Blob([result], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `map_export_${new Date().getTime()}.glb`;
      link.click();
      URL.revokeObjectURL(url);

      console.log("GLB exported successfully");
    } catch (error) {
      console.error("Failed to export GLB:", error);
    }
  },

  hoverData: null,
  setHoverData: (data) => set({ hoverData: data }),

  selectedNodeId: null,
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  expandedNodeIds: new Set<Id>(),
  toggleNodeExpanded: (nodeId) => {
    const { expandedNodeIds } = get();
    const newSet = new Set(expandedNodeIds);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    set({ expandedNodeIds: newSet });
  },
  setNodeExpanded: (nodeId, expanded) => {
    const { expandedNodeIds } = get();
    const newSet = new Set(expandedNodeIds);
    if (expanded) {
      newSet.add(nodeId);
    } else {
      newSet.delete(nodeId);
    }
    set({ expandedNodeIds: newSet });
  },

  toggleNodeVisibility: (nodeId) => {
    const { rootNodes, rootRenderers } = get();

    // 递归在渲染器树中查找并切换可见性
    const findAndToggle = (renderers: MapRenderer[]): boolean => {
      for (const renderer of renderers) {
        if (renderer.node.id === nodeId) {
          // 找到目标渲染器，切换可见性
          renderer.node.visible = !renderer.node.visible;
          renderer.visible = renderer.node.visible;
          return true;
        }

        // 递归查找子渲染器
        const childRenderers = renderer.children.filter(
          (child): child is MapRenderer => child instanceof MapRenderer,
        );
        if (childRenderers.length > 0 && findAndToggle(childRenderers)) {
          return true;
        }
      }
      return false;
    };

    findAndToggle(rootRenderers);
    // 触发重新渲染
    set({ rootNodes: [...rootNodes] });
  },
});

interface HoverData {
  pos: {
    x: number;
    y: number;
  };
  info: HoverInfo;
}
