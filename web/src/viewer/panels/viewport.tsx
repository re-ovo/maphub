import { useCallback, useEffect, useRef } from "react";
import { ViewportRenderer } from "../viewport-renderer";
import { useStore } from "@/store";
import { formatRegistry } from "@/viewer/format";
import type { HoverCallbackParams } from "../event-handler";
import { HoverTooltip } from "@/components/viewer/hover-tooltip";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const setViewportRenderer = useStore((s) => s.setViewportRenderer);
  const hoverData = useStore((s) => s.hoverData);
  const setHoverData = useStore((s) => s.setHoverData);

  const handleHover = useCallback(
    ({ renderer, hitPoint, screenPos }: HoverCallbackParams) => {
      if (!renderer) {
        setHoverData(null);
        return;
      }

      const node = renderer.node;
      const formatHandler = formatRegistry[node.format];
      if (!formatHandler) {
        setHoverData(null);
        return;
      }

      const info = formatHandler.provideHoverInfo(node as any, hitPoint);
      if (!info) {
        setHoverData(null);
        return;
      }

      setHoverData({
        pos: screenPos,
        info,
      });
    },
    [setHoverData],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建渲染器
    const renderer = new ViewportRenderer({
      canvas: canvasRef.current,
      showGrid: true,
      eventHandlerOptions: {
        onHover: handleHover,
      },
    });
    rendererRef.current = renderer;

    // 注册到 store
    setViewportRenderer(renderer);

    // 清理函数
    return () => {
      setViewportRenderer(null);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [setViewportRenderer, handleHover]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {hoverData && <HoverTooltip info={hoverData.info} position={hoverData.pos} />}
    </div>
  );
}
