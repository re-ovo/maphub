import type { Id } from "@/utils/id";
import type { ElementNode } from "@/viewer/types/element";
import type { StateCreator } from "zustand";

export interface SceneSlice {
  elements: ElementNode[];
  addElement: (element: ElementNode) => void;
  removeElement: (id: Id) => void;
  toggleElementVisibility: (id: Id) => void;
}

export const createSceneSlice: StateCreator<SceneSlice, [], [], SceneSlice> = (
  set,
  get
) => ({
  elements: [],
  addElement: (element: ElementNode) => {
    set((state) => ({ elements: [...state.elements, element] }));
  },
  removeElement: (id: Id) => {
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== id),
    }));
  },
  toggleElementVisibility: (id: Id) => {
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, visible: !element.visible } : element
      ),
    }));
  },
});
