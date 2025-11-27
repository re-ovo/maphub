import type { StateCreator } from 'zustand'
import type { MosaicNode } from 'react-mosaic-component'
import type { ViewId } from '@/viewer/viewer'

// Default mosaic layout configuration
export const DEFAULT_MOSAIC_LAYOUT: MosaicNode<ViewId> = {
  direction: 'row',
  first: {
    direction: 'column',
    first: 'sceneTree',
    second: 'properties',
    splitPercentage: 50,
  },
  second: 'viewport',
  splitPercentage: 20,
}

export interface PrefSlice {
  // Mosaic layout configuration
  mosaicLayout: MosaicNode<ViewId> | null
  setMosaicLayout: (layout: MosaicNode<ViewId> | null) => void
  resetLayout: () => void
}

export const createPrefSlice: StateCreator<PrefSlice> = (set) => ({
  mosaicLayout: null,
  setMosaicLayout: (layout) => set({ mosaicLayout: layout }),
  resetLayout: () => set({ mosaicLayout: DEFAULT_MOSAIC_LAYOUT }),
})
