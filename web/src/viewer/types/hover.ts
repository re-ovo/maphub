import type { ReactNode } from "react";

/** 悬浮信息项 */
export interface HoverInfoItem {
  /** 标签 */
  label: string;

  /** 值（支持 ReactNode 自定义渲染） */
  value: string | ReactNode;
}

/** 悬浮信息 */
export interface HoverInfo {
  /** 标题 */
  title: string | ReactNode;

  /** 副标题 */
  subtitle?: string | ReactNode;

  /** 快速信息列表 */
  items: HoverInfoItem[];
}
