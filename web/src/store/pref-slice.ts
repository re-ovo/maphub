import type { StateCreator } from "zustand";
import type { MosaicNode } from "@lonli-lokli/react-mosaic-component";
import type { ViewId } from "@/viewer/panels";

// Default mosaic layout configuration
export const DEFAULT_MOSAIC_LAYOUT: MosaicNode<ViewId> = {
  type: "split",
  direction: "row",
  children: [
    {
      type: "split",
      direction: "column",
      children: ["sceneTree", "properties"],
      splitPercentages: [50, 50],
    },
    "viewport",
  ],
  splitPercentages: [20, 80],
};

export interface PrefSlice {
  // Mosaic layout configuration
  mosaicLayout: MosaicNode<ViewId> | null;
  setMosaicLayout: (layout: MosaicNode<ViewId> | null) => void;
  resetLayout: () => void;

  // Viewport preferences
  showSky: boolean;
  setShowSky: (show: boolean) => void;
}

export const createPrefSlice: StateCreator<PrefSlice> = (set) => ({
  mosaicLayout: null,
  setMosaicLayout: (layout) => set({ mosaicLayout: layout }),
  resetLayout: () => set({ mosaicLayout: DEFAULT_MOSAIC_LAYOUT }),
  showSky: false,
  setShowSky: (show) => set({ showSky: show }),
});
