import type { StateCreator } from 'zustand'
import type { Scene, TransformNode } from '@babylonjs/core'

export interface SceneSlice {
  // Babylon.js scene
  scene: Scene | null
  setScene: (scene: Scene | null) => void

  // Selected objects
  selectedNodes: TransformNode[]
  setSelectedNodes: (nodes: TransformNode[]) => void
  selectNode: (node: TransformNode) => void
  deselectNode: (nodeId: string) => void
  clearSelection: () => void

  // OpenDrive data
  openDriveData: unknown
  setOpenDriveData: (data: unknown) => void

  // Camera state
  cameraPosition: { x: number; y: number; z: number } | null
  setCameraPosition: (position: { x: number; y: number; z: number }) => void

  // Viewport settings
  showGrid: boolean
  showAxis: boolean
  toggleGrid: () => void
  toggleAxis: () => void
}

export const createSceneSlice: StateCreator<SceneSlice> = (set) => ({
  scene: null,
  setScene: (scene) => set({ scene }),

  selectedNodes: [],
  setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
  selectNode: (node) =>
    set((state) => {
      const exists = state.selectedNodes.find((n) => n.uniqueId === node.uniqueId)
      if (exists) return state
      return { selectedNodes: [...state.selectedNodes, node] }
    }),
  deselectNode: (nodeId) =>
    set((state) => ({
      selectedNodes: state.selectedNodes.filter((n) => n.uniqueId.toString() !== nodeId),
    })),
  clearSelection: () => set({ selectedNodes: [] }),

  openDriveData: null,
  setOpenDriveData: (data) => set({ openDriveData: data }),

  cameraPosition: null,
  setCameraPosition: (position) => set({ cameraPosition: position }),

  showGrid: true,
  showAxis: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAxis: () => set((state) => ({ showAxis: !state.showAxis })),
})
