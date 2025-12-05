import { FileDropZone } from "@/components/file-drop-zone";
import { useStore } from "@/store";
import { DEFAULT_MOSAIC_LAYOUT } from "@/store/pref-slice";
import {
  Mosaic,
  MosaicContext,
  MosaicWindow,
  type MosaicNode,
  type MosaicPath,
} from "@lonli-lokli/react-mosaic-component";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useCallback, useContext } from "react";
import PropertiesPanel from "./panels/properties";
import SceneTreePanel from "./panels/scene-tree";
import ViewportPanel from "./panels/viewport";

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

export default function Panels() {
  const { mosaicLayout, setMosaicLayout, loadFiles } = useStore();

  const currentLayout = mosaicLayout || DEFAULT_MOSAIC_LAYOUT;

  const handleFilesDropped = useCallback(
    async (files: File[]) => {
      try {
        await loadFiles(files);
      } catch (error) {
        console.error("Failed to load files:", error);
      }
    },
    [loadFiles]
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
