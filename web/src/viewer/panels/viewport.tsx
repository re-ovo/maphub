import { useEffect, useRef } from "react";
import { ViewportRenderer } from "../viewport-renderer";
import { useStore } from "@/store";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const setViewportRenderer = useStore((s) => s.setViewportRenderer);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建渲染器
    const renderer = new ViewportRenderer({
      canvas: canvasRef.current,
      showGrid: true,
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
  }, [setViewportRenderer]);

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
    </div>
  );
}