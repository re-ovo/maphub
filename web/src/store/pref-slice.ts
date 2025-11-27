import type { StateCreator } from 'zustand'
import type { MosaicNode } from 'react-mosaic-component'
import type { ViewId } from '@/viewer/viewer'

export interface PrefSlice {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Mosaic layout configuration
  mosaicLayout: MosaicNode<ViewId> | null
  setMosaicLayout: (layout: MosaicNode<ViewId> | null) => void

  // Panel visibility
  panelVisibility: {
    viewport: boolean
    sceneTree: boolean
    properties: boolean
  }
  togglePanel: (panel: keyof PrefSlice['panelVisibility']) => void
}

export const createPrefSlice: StateCreator<PrefSlice> = (set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  mosaicLayout: null,
  setMosaicLayout: (layout) => set({ mosaicLayout: layout }),

  panelVisibility: {
    viewport: true,
    sceneTree: true,
    properties: true,
  },
  togglePanel: (panel) =>
    set((state) => ({
      panelVisibility: {
        ...state.panelVisibility,
        [panel]: !state.panelVisibility[panel],
      },
    })),
})
