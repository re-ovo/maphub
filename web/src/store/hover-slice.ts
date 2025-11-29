import type { StateCreator } from "zustand";
import type { Selectable, HoverInfo } from "@/viewer/types";

export interface HoverSlice {
  /** 当前悬浮对象 */
  hovered: Selectable | null;

  /** 悬浮信息 */
  hoverInfo: HoverInfo | null;

  /** 鼠标位置（屏幕坐标） */
  hoverPosition: { x: number; y: number } | null;

  /** 设置悬浮 */
  setHover: (
    item: Selectable | null,
    info?: HoverInfo | null,
    position?: { x: number; y: number }
  ) => void;

  /** 清除悬浮 */
  clearHover: () => void;
}

export const createHoverSlice: StateCreator<HoverSlice, [], [], HoverSlice> = (
  set
) => ({
  hovered: null,
  hoverInfo: null,
  hoverPosition: null,

  setHover: (item, info, position) =>
    set({
      hovered: item,
      hoverInfo: info ?? null,
      hoverPosition: position ?? null,
    }),

  clearHover: () =>
    set({
      hovered: null,
      hoverInfo: null,
      hoverPosition: null,
    }),
});
