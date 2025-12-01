import React, { useContext, useCallback } from "react";
import {
  Mosaic,
  MosaicContext,
  MosaicWindow,
  type MosaicNode,
  type MosaicPath,
} from "@lonli-lokli/react-mosaic-component";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { Box3, Vector3 } from "three";
import ViewportPanel from "./panels/viewport-panel";
import SceneTreePanel from "./panels/scene-tree-panel";
import PropertiesPanel from "./panels/properties-panel";
import { useStore } from "@/store";
import { DEFAULT_MOSAIC_LAYOUT } from "@/store/pref-slice";
import { FileDropZone } from "@/components/file-drop-zone";
import { formatRegistry } from "./formats";

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

export default function Viewer() {
  const { mosaicLayout, setMosaicLayout, scene, camera, controls, addDocument } = useStore();

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

          // 创建文档（新 API：返回 DocumentNode）
          const doc = format.createDocument(data, file.name, scene);

          // 渲染
          doc.renderer.render();

          // 聚焦到地图中心 (Three.js 方式)
          const box = new Box3().setFromObject(doc.renderer.rootNode);
          const center = box.getCenter(new Vector3());
          const size = box.getSize(new Vector3());
          const diagonal = size.length();

          if (controls && camera) {
            controls.target.copy(center);
            camera.position.copy(center).add(new Vector3(diagonal * 0.5, diagonal * 0.5, diagonal * 0.5));
            controls.update();
          }

          // 添加到 store
          addDocument(doc);

          console.log(`Loaded ${file.name} (${doc.id})`);
        } catch (error) {
          console.error(`Failed to load ${file.name}:`, error);
        }
      }
    },
    [scene, camera, controls, addDocument]
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
