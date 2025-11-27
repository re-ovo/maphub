import type { StateCreator } from 'zustand'
import type { MosaicNode } from 'react-mosaic-component'
import type { ViewId } from '@/viewer/viewer'

export interface PrefSlice {
  // Mosaic layout configuration
  mosaicLayout: MosaicNode<ViewId> | null
  setMosaicLayout: (layout: MosaicNode<ViewId> | null) => void
}

export const createPrefSlice: StateCreator<PrefSlice> = (set) => ({
  mosaicLayout: null,
  setMosaicLayout: (layout) => set({ mosaicLayout: layout }),
})
