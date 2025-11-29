import type { StateCreator } from "zustand";
import type { Selectable } from "@/viewer/types";
import { selectableEquals } from "@/viewer/types";

export interface SelectionSlice {
  /** 当前选中项 */
  selection: Selectable[];

  /** 设置选择 (替换) */
  setSelection: (items: Selectable[]) => void;

  /** 添加到选择 */
  addToSelection: (item: Selectable) => void;

  /** 从选择中移除 */
  removeFromSelection: (item: Selectable) => void;

  /** 清空选择 */
  clearSelection: () => void;

  /** 切换选择 */
  toggleSelection: (item: Selectable) => void;

  /** 获取主选择（最后选中的） */
  getPrimarySelection: () => Selectable | null;
}

export const createSelectionSlice: StateCreator<
  SelectionSlice,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  selection: [],

  setSelection: (items) => set({ selection: items }),

  addToSelection: (item) =>
    set((state) => {
      // 避免重复添加
      const exists = state.selection.some((s) => selectableEquals(s, item));
      if (exists) return state;
      return { selection: [...state.selection, item] };
    }),

  removeFromSelection: (item) =>
    set((state) => ({
      selection: state.selection.filter((s) => !selectableEquals(s, item)),
    })),

  clearSelection: () => set({ selection: [] }),

  toggleSelection: (item) =>
    set((state) => {
      const exists = state.selection.some((s) => selectableEquals(s, item));
      if (exists) {
        return {
          selection: state.selection.filter((s) => !selectableEquals(s, item)),
        };
      }
      return { selection: [...state.selection, item] };
    }),

  getPrimarySelection: () => {
    const selection = get().selection;
    return selection.length > 0 ? selection[selection.length - 1] : null;
  },
});
