import { useEffect, useRef } from "react";
import { ViewportRenderer } from "../viewport-renderer";

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建渲染器
    rendererRef.current = new ViewportRenderer({
      canvas: canvasRef.current,
      showGrid: true,
    });

    // 清理函数
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

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