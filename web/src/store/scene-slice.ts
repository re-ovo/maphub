import type { StateCreator } from 'zustand'
import type { Scene, TransformNode } from '@babylonjs/core'

export interface SceneSlice {
  // Babylon.js scene
  scene: Scene | null
  setScene: (scene: Scene | null) => void

  // Viewport settings
  showGrid: boolean
  showAxis: boolean
  toggleGrid: () => void
  toggleAxis: () => void
}

export const createSceneSlice: StateCreator<SceneSlice> = (set) => ({
  scene: null,
  setScene: (scene) => set({ scene }),

  showGrid: true,
  showAxis: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAxis: () => set((state) => ({ showAxis: !state.showAxis })),
})
