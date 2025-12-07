import { useCallback, useEffect, useRef } from "react";
import { ViewportRenderer } from "../viewport-renderer";
import { useStore } from "@/store";
import { formatRegistry } from "@/viewer/format";
import type { HoverCallbackParams, ClickCallbackParams } from "../event-handler";
import { HoverTooltip } from "@/components/viewer/hover-tooltip";
import type { MapNode } from "../types/map-node";
import type { HoverInfo } from "../types/format";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const setViewportRenderer = useStore((s) => s.setViewportRenderer);
  const hoverData = useStore((s) => s.hoverData);
  const setHoverData = useStore((s) => s.setHoverData);
  const selectNodes = useStore((s) => s.selectNodes);
  const rootNodes = useStore((s) => s.rootNodes);

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

  const handleClick = useCallback(
    ({ renderers }: ClickCallbackParams) => {
      // 选中所有点击到的物体
      const nodeIds = renderers.map((r) => r.node.id);
      selectNodes(nodeIds);
    },
    [selectNodes],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建渲染器
    const renderer = new ViewportRenderer({
      canvas: canvasRef.current,
      eventHandlerOptions: {
        onHover: handleHover,
        onClick: handleClick,
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
  }, [setViewportRenderer, handleHover, handleClick]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* 悬浮提示 */}
      {hoverData && <HoverTooltip infos={hoverData.infos} position={hoverData.pos} />}

      {/* 顶部提示 */}
      {rootNodes.length === 0 && (
        <div className="absolute top-1 text-sm text-white/30 flex flex-col gap-1 items-center">
          <span>本查看器完全在浏览器端侧运行，不会上传任何数据</span>
          <span>支持格式: OpenDrive, Apollo</span>
        </div>
      )}
    </div>
  );
}
