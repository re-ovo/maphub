import type { Selectable } from "./selectable";

/** 悬浮信息项 */
export interface HoverInfoItem {
  label: string;
  value: string;
}

/** 悬浮信息 */
export interface HoverInfo {
  /** 标题 */
  title: string;

  /** 副标题 */
  subtitle?: string;

  /** 快速信息列表 */
  items: HoverInfoItem[];
}

/** 悬浮信息提供者 */
export interface HoverInfoProvider {
  /** 获取悬浮信息 */
  getHoverInfo(selectable: Selectable): HoverInfo | null;
}
