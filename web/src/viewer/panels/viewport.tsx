import { useCallback, useEffect, useRef } from "react";
import { ViewportRenderer } from "../viewport-renderer";
import { useStore } from "@/store";
import { formatRegistry } from "@/viewer/format";
import type { HoverCallbackParams } from "../event-handler";
import { HoverTooltip } from "@/components/viewer/hover-tooltip";
import type { MapNode } from "../types/map-node";
import type { HoverInfo } from "../types/format";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const setViewportRenderer = useStore((s) => s.setViewportRenderer);
  const hoverData = useStore((s) => s.hoverData);
  const setHoverData = useStore((s) => s.setHoverData);

  const handleHover = useCallback(
    ({ renderers, hitPoints, screenPos }: HoverCallbackParams) => {
      if (renderers.length === 0) {
        setHoverData(null);
        return;
      }

      // 收集所有渲染器的 hover 信息
      const infos: Array<{ node: MapNode; info: HoverInfo }> = [];
      for (let i = 0; i < renderers.length; i++) {
        const renderer = renderers[i];
        const hitPoint = hitPoints[i];
        const node = renderer.node;
        const formatHandler = formatRegistry[node.format];
        if (formatHandler) {
          const info = formatHandler.provideHoverInfo(node as any, hitPoint);
          if (info) {
            infos.push({ node, info });
          }
        }
      }
      if (infos.length === 0) {
        setHoverData(null);
        return;
      }
      setHoverData({
        pos: screenPos,
        infos: infos.map((i) => i.info),
      });
    },
    [setHoverData],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建渲染器
    const renderer = new ViewportRenderer({
      canvas: canvasRef.current,
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
      {hoverData && <HoverTooltip infos={hoverData.infos} position={hoverData.pos} />}
    </div>
  );
}
