import React, { useContext, useCallback } from "react";
import {
  Mosaic,
  MosaicContext,
  MosaicWindow,
  type MosaicNode,
  type MosaicPath,
} from "@lonli-lokli/react-mosaic-component";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { ArcRotateCamera } from "@babylonjs/core";
import ViewportPanel from "./panels/viewport-panel";
import SceneTreePanel from "./panels/scene-tree-panel";
import PropertiesPanel from "./panels/properties-panel";
import { useStore } from "@/store";
import { DEFAULT_MOSAIC_LAYOUT } from "@/store/pref-slice";
import { FileDropZone } from "@/components/file-drop-zone";
import { formatRegistry } from "./formats";
import type { MapDocument } from "./types";

export type ViewId = "viewport" | "sceneTree" | "properties";

const ELEMENT_MAP: Record<ViewId, React.ReactNode> = {
  viewport: <ViewportPanel />,
  sceneTree: <SceneTreePanel />,
  properties: <PropertiesPanel />,
};

const TITLE_MAP: Record<ViewId, string> = {
  viewport: "3D 视口",
  sceneTree: "场景树",
  properties: "属性",
};

interface TileProps {
  id: ViewId;
  path: MosaicPath;
  currentLayout: MosaicNode<ViewId>;
  defaultLayout: MosaicNode<ViewId>;
  onLayoutChange: (layout: MosaicNode<ViewId>) => void;
}

function Tile({
  id,
  path,
  currentLayout,
  defaultLayout,
  onLayoutChange,
}: TileProps) {
  const isExpanded = typeof currentLayout === "string" && currentLayout === id;
  const mosaicContext = useContext(MosaicContext);

  const handleExpand = () => {
    if (isExpanded) {
      onLayoutChange(defaultLayout);
    } else {
      onLayoutChange(id);
    }
  };

  const handleClose = () => {
    mosaicContext.mosaicActions.remove(path);
  };

  return (
    <MosaicWindow<ViewId>
      path={path}
      title={TITLE_MAP[id]}
      toolbarControls={[
        <button
          key="expand"
          className="mosaic-window-control"
          onClick={handleExpand}
          title={isExpanded ? "还原" : "最大化"}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>,
        <button
          key="close"
          className="mosaic-window-control"
          onClick={handleClose}
          title="关闭"
        >
          <X size={14} />
        </button>,
      ]}
    >
      {ELEMENT_MAP[id]}
    </MosaicWindow>
  );
}

/** 生成唯一的文档 ID */
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function Viewer() {
  const { mosaicLayout, setMosaicLayout, scene, addDocument } = useStore();

  const currentLayout = mosaicLayout || DEFAULT_MOSAIC_LAYOUT;

  const handleFilesDropped = useCallback(
    async (files: File[]) => {
      if (!scene) {
        console.warn("Scene not ready");
        return;
      }

      for (const file of files) {
        try {
          const content = new Uint8Array(await file.arrayBuffer());

          // 检测文件格式
          const format = formatRegistry.detectFormat(content, file.name);
          if (!format) {
            console.warn(`Unsupported file format: ${file.name}`);
            continue;
          }

          console.log(`Loading ${file.name} as ${format.name}...`);
          const start = performance.now();

          // 解析数据
          const data = await format.parse(content);
          const parseTime = performance.now() - start;
          console.log(`Parse time: ${parseTime.toFixed(2)}ms`);

          // 创建文档
          const documentId = generateDocumentId();
          const renderer = format.createRenderer(scene, data, documentId);
          const treeProvider = format.createTreeProvider(data, documentId);
          const propertyProvider = format.createPropertyProvider(data);
          const hoverProvider = format.createHoverProvider(data);

          const doc: MapDocument = {
            id: documentId,
            filename: file.name,
            formatId: format.id,
            data,
            renderer,
            treeProvider,
            propertyProvider,
            hoverProvider,
            visible: true,
          };

          // 渲染
          renderer.render();

          // 聚焦到地图中心
          const bounds = renderer.rootNode.getHierarchyBoundingVectors();
          const center = bounds.min.add(bounds.max).scale(0.5);
          const diagonal = bounds.max.subtract(bounds.min).length();

          const camera = scene.activeCamera;
          if (camera instanceof ArcRotateCamera) {
            camera.setTarget(center);
            // eslint-disable-next-line react-hooks/immutability
            camera.radius = diagonal * 0.8;
          }

          // 添加到 store
          addDocument(doc);

          console.log(`Loaded ${file.name} (${documentId})`);
        } catch (error) {
          console.error(`Failed to load ${file.name}:`, error);
        }
      }
    },
    [scene, addDocument]
  );

  return (
    <FileDropZone onFilesDropped={handleFilesDropped} className="w-full h-full">
      <Mosaic<ViewId>
        renderTile={(id, path) => (
          <Tile
            id={id}
            path={path}
            currentLayout={currentLayout}
            defaultLayout={DEFAULT_MOSAIC_LAYOUT}
            onLayoutChange={setMosaicLayout}
          />
        )}
        value={currentLayout}
        onChange={setMosaicLayout}
      />
    </FileDropZone>
  );
}
