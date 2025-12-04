import type { Id } from "@/utils/id";
import type { ReactNode } from "react";
import type { StateCreator } from "zustand";

export interface SceneSlice {
  hoverData: HoverData | null;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (
  set,
  get
) => ({
  elements: [],
  hoverData: null,
  setHoverData: (data: HoverData | null) => set({ hoverData: data }),
});

interface HoverData {
  pos: {
    x: number;
    y: number;
  };
  content: ReactNode;
}
