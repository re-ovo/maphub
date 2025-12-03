import type { Id } from "@/utils/id";
import type { ElementNode } from "@/viewer/types/element";
import type { ReactNode } from "react";
import type { StateCreator } from "zustand";

export interface SceneSlice {
  elements: ElementNode[];
  hoverData: HoverData | null;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (
  set,
  get
) => ({
  elements: [],
  hoverData: null,

  toggleElementVisibility: (id: Id) => {
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, visible: !element.visible } : element
      ),
    }));

    // TODO: update renderer?
  },
});

interface HoverData {
  pos: {
    x: number;
    y: number;
  };
  content: ReactNode;
}
