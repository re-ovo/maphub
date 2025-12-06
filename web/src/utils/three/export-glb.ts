import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { MapRenderer } from "@/viewer/types/renderer";

/**
 * 导出渲染器为 GLB 文件
 * @param renderers 要导出的渲染器列表
 * @param filename 导出的文件名（不含扩展名），默认使用时间戳
 */
export async function exportGLB(renderers: MapRenderer[], filename?: string): Promise<void> {
  // 检查是否有可用的渲染器
  if (renderers.length === 0) {
    console.warn("No renderers to export");
    return;
  }

  // 创建导出器
  const exporter = new GLTFExporter();

  try {
    // 导出为二进制 GLB 格式
    const result = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        renderers,
        (gltf) => {
          resolve(gltf as ArrayBuffer);
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    });

    // 创建 Blob 并下载
    const blob = new Blob([result], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename || `map_export_${new Date().getTime()}`}.glb`;
    link.click();
    URL.revokeObjectURL(url);

    console.log("GLB exported successfully");
  } catch (error) {
    console.error("Failed to export GLB:", error);
    throw error;
  }
}
