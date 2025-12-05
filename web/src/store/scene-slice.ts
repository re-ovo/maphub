import type { Id } from "@/utils/id";
import type { ReactNode } from "react";
import type { StateCreator } from "zustand";
import type { ViewportRenderer } from "@/viewer/viewport-renderer";
import type { MapRenderer } from "@/viewer/types/renderer";
import type { MapNode } from "@/viewer/types/map-node";
import { Files, File } from "core";
import { formatRegistry, type MapFormatType } from "@/viewer/format";

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

  /** Hover 数据 */
  hoverData: HoverData | null;
  setHoverData: (data: HoverData | null) => void;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (
  set,
  get
) => ({
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

  hoverData: null,
  setHoverData: (data) => set({ hoverData: data }),
});

interface HoverData {
  pos: {
    x: number;
    y: number;
  };
  content: ReactNode;
}
