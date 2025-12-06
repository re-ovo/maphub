import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPrefSlice, type PrefSlice } from "./pref-slice";
import { createSceneSlice, type SceneSlice } from "./scene-slice";

export type StoreState = PrefSlice & SceneSlice;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createPrefSlice(...a),
      ...createSceneSlice(...a),
    }),
    {
      name: "maphub-viewer-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist preference slice
      partialize: (state) => ({
        mosaicLayout: state.mosaicLayout,
      }),
    },
  ),
);

// Export slices for convenience
export type { PrefSlice, SceneSlice };
