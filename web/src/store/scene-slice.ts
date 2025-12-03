import type { Id } from "@/utils/id";
import type { ElementNode } from "@/viewer/types/element";
import type { StateCreator } from "zustand";

export interface SceneSlice {
  elements: ElementNode[];
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (
  set,
  get
) => ({
  elements: [],
  toggleElementVisibility: (id: Id) => {
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, visible: !element.visible } : element
      ),
    }));

    // TODO: update renderer?
  },
});
