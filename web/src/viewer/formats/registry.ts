import type { MapFormat } from "../types";

/** 地图格式注册表 */
class MapFormatRegistry {
  private formats = new Map<string, MapFormat>();

  /** 注册一个格式 */
  register<T>(format: MapFormat<T>): void {
    if (this.formats.has(format.id)) {
      console.warn(`MapFormat "${format.id}" is already registered, overwriting.`);
    }
    this.formats.set(format.id, format as MapFormat);
  }

  /** 获取指定 ID 的格式 */
  get(id: string): MapFormat | undefined {
    return this.formats.get(id);
  }

  /** 根据文件内容和名称检测格式 */
  detectFormat(content: Uint8Array, filename: string): MapFormat | null {
    // 首先通过扩展名快速匹配
    const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
    for (const format of this.formats.values()) {
      if (format.extensions.includes(ext)) {
        if (format.detect(content, filename)) {
          return format;
        }
      }
    }

    // 扩展名不匹配时，尝试内容检测
    for (const format of this.formats.values()) {
      if (format.detect(content, filename)) {
        return format;
      }
    }

    return null;
  }

  /** 获取所有已注册的格式 */
  getAll(): MapFormat[] {
    return Array.from(this.formats.values());
  }

  /** 获取支持的文件扩展名列表 */
  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    for (const format of this.formats.values()) {
      format.extensions.forEach((ext) => extensions.add(ext));
    }
    return Array.from(extensions);
  }
}

/** 全局格式注册表实例 */
export const formatRegistry = new MapFormatRegistry();
