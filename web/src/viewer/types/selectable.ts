import type { AbstractMesh } from "@babylonjs/core";

/** 可选择/可交互的对象 */
export interface Selectable {
  /** 文档 ID */
  documentId: string;

  /** 对象类型 */
  type: string;

  /** 对象路径/ID (格式因格式而异，如 road:1/lane:2) */
  path: string;

  /** 关联的 Mesh (用于高亮) */
  meshes: AbstractMesh[];
}

/** 比较两个 Selectable 是否相等 */
export function selectableEquals(a: Selectable, b: Selectable): boolean {
  return (
    a.documentId === b.documentId && a.type === b.type && a.path === b.path
  );
}

/** 获取 Selectable 的唯一键 */
export function selectableKey(s: Selectable): string {
  return `${s.documentId}:${s.type}:${s.path}`;
}
