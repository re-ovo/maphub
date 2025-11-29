import type { Scene } from "@babylonjs/core";
import { parseOpendrive, type OpenDrive } from "core";
import type { MapFormat } from "../../types";
import { OpenDriveRenderer } from "./opendrive-renderer";
import { OpenDriveTreeProvider } from "./opendrive-tree";
import { OpenDrivePropertyProvider } from "./opendrive-properties";
import { OpenDriveHoverProvider } from "./opendrive-hover";

/** OpenDrive 格式定义 */
export const openDriveFormat: MapFormat<OpenDrive> = {
  id: "opendrive",
  name: "OpenDRIVE",
  extensions: [".xodr", ".xml"],

  async parse(content: Uint8Array): Promise<OpenDrive> {
    return parseOpendrive(content);
  },

  detect(content: Uint8Array, filename: string): boolean {
    // 通过扩展名快速检测
    if (filename.toLowerCase().endsWith(".xodr")) {
      return true;
    }

    // 检查 XML 内容
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(content.slice(0, 1000));
      return text.includes("<OpenDRIVE") || text.includes("<opendrive");
    } catch {
      return false;
    }
  },

  createRenderer(scene: Scene, data: OpenDrive, documentId: string) {
    return new OpenDriveRenderer(scene, data, documentId);
  },

  createTreeProvider(data: OpenDrive, documentId: string) {
    return new OpenDriveTreeProvider(data, documentId);
  },

  createPropertyProvider(data: OpenDrive) {
    return new OpenDrivePropertyProvider(data);
  },

  createHoverProvider(data: OpenDrive) {
    return new OpenDriveHoverProvider(data);
  },
};
