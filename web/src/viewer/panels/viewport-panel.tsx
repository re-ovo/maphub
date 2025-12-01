import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store";
import { formatRegistry } from "@/viewer/formats";
import { ViewportRenderer } from "@/viewer/viewport-renderer";
import { Button } from "@/components/ui/button";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const previousHoveredRef = useRef<string | null>(null);

  const {
    setScene,
    setCamera,
    setControls,
    setRenderer,
    showGrid,
    documents,
    selection,
    setSelection,
    hoveredNodeId,
    hoverInfo,
    hoverPosition,
    setHover,
    clearHover,
    cameraMode,
    toggleCameraMode,
  } = useStore();

  // 处理点击选择
  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      const vr = rendererRef.current;
      if (!vr) return;

      const result = vr.raycastFromEvent(event);

      if (!result) {
        setSelection([]);
        return;
      }

      // 从所有文档的渲染器中查找 nodeId
      for (const doc of documents.values()) {
        const nodeId = doc.renderer.getNodeFromIntersection(result.intersection);
        if (nodeId) {
          const isMultiSelect = event.ctrlKey || event.metaKey;
          if (isMultiSelect) {
            useStore.getState().toggleSelection(nodeId);
          } else {
            setSelection([nodeId]);
          }
          return;
        }
      }

      setSelection([]);
    },
    [documents, setSelection]
  );

  // 处理悬浮
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const vr = rendererRef.current;
      if (!vr) return;

      const result = vr.raycastFromEvent(event);

      if (!result) {
        if (previousHoveredRef.current) {
          for (const doc of documents.values()) {
            doc.renderer.unhighlight(previousHoveredRef.current);
          }
          previousHoveredRef.current = null;
          clearHover();
        }
        return;
      }

      // 查找 nodeId
      for (const doc of documents.values()) {
        const nodeId = doc.renderer.getNodeFromIntersection(result.intersection);
        if (nodeId) {
          if (previousHoveredRef.current === nodeId) return;

          // 取消之前的高亮
          if (previousHoveredRef.current) {
            for (const d of documents.values()) {
              d.renderer.unhighlight(previousHoveredRef.current);
            }
          }

          // 高亮新的对象
          doc.renderer.highlight(nodeId);
          previousHoveredRef.current = nodeId;

          // 获取悬浮信息
          const node = useStore.getState().getNode(nodeId);
          const format = formatRegistry.get(doc.formatId);
          const hoverInfo = node && format ? format.getHoverInfo(node) : null;

          setHover(nodeId, hoverInfo, result.position);
          return;
        }
      }
    },
    [documents, setHover, clearHover]
  );

  // 初始化场景
  useEffect(() => {
    if (!canvasRef.current) return;

    const vr = new ViewportRenderer({
      canvas: canvasRef.current,
      showGrid,
    });
    rendererRef.current = vr;

    // 存储到 store
    setScene(vr.scene);
    setCamera(vr.camera);
    setControls(vr.controls);
    setRenderer(vr.renderer);

    return () => {
      vr.dispose();
      rendererRef.current = null;
    };
    // 只在挂载时初始化一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 注册指针事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handlePointerDown, handlePointerMove]);

  // 更新网格可见性
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.showGrid = showGrid;
    }
  }, [showGrid]);

  // 高亮选中的对象
  useEffect(() => {
    // 先取消所有高亮
    for (const doc of documents.values()) {
      doc.renderer.unhighlightAll();
    }

    // 高亮选中的对象
    for (const nodeId of selection) {
      const node = useStore.getState().getNode(nodeId);
      if (node) {
        // 向上查找到文档节点
        let current = node;
        while (current.parentId) {
          const parent = useStore.getState().getNode(current.parentId);
          if (!parent) break;
          current = parent;
        }
        const doc = documents.get(current.id);
        if (doc) {
          doc.renderer.highlight(nodeId);
        }
      }
    }
  }, [documents, selection]);

  // 更新相机模式
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setCameraMode(cameraMode);
      // 同步更新 store 中的 camera 引用
      setCamera(rendererRef.current.camera);
    }
  }, [cameraMode, setCamera]);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />

      {/* 工具栏 */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCameraMode}
          title={cameraMode === "perspective" ? "切换到正交视图" : "切换到透视视图"}
          className="bg-background/80 hover:bg-background"
        >
          {cameraMode === "perspective" ? "Perspective" : "Orthographic"}
        </Button>
      </div>

      {/* 悬浮信息提示 */}
      {hoveredNodeId && hoverInfo && hoverPosition && (
        <HoverTooltip info={hoverInfo} position={hoverPosition} />
      )}
    </div>
  );
}

/** 悬浮信息提示组件 */
function HoverTooltip({
  info,
  position,
}: {
  info: NonNullable<ReturnType<typeof useStore.getState>["hoverInfo"]>;
  position: NonNullable<ReturnType<typeof useStore.getState>["hoverPosition"]>;
}) {
  return (
    <div
      className="absolute z-50 pointer-events-none bg-popover border border-border rounded-md shadow-lg p-2 text-sm"
      style={{
        left: position.x + 10,
        top: position.y + 10,
        maxWidth: 300,
      }}
    >
      <div className="font-medium">{info.title}</div>
      {info.subtitle && (
        <div className="text-xs text-muted-foreground">{info.subtitle}</div>
      )}
      {info.items.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {info.items.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
