import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPrefSlice, type PrefSlice } from "./pref-slice";
import { createSceneSlice, type SceneSlice } from "./scene-slice";
import { createDocumentSlice, type DocumentSlice } from "./document-slice";
import { createSelectionSlice, type SelectionSlice } from "./selection-slice";
import { createHoverSlice, type HoverSlice } from "./hover-slice";

export type StoreState = PrefSlice &
  SceneSlice &
  DocumentSlice &
  SelectionSlice &
  HoverSlice;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createPrefSlice(...a),
      ...createSceneSlice(...a),
      ...createDocumentSlice(...a),
      ...createSelectionSlice(...a),
      ...createHoverSlice(...a),
    }),
    {
      name: "maphub-viewer-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist preference slice
      partialize: (state) => ({
        mosaicLayout: state.mosaicLayout,
        showGrid: state.showGrid,
        showAxis: state.showAxis,
      }),
    }
  )
);

// Export slices for convenience
export type { PrefSlice, SceneSlice, DocumentSlice, SelectionSlice, HoverSlice };
