import React from 'react'
import {
  Mosaic,
  MosaicWindow,
  type MosaicNode,
  type MosaicBranch,
} from 'react-mosaic-component'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import ViewportPanel from './panels/viewport-panel'
import SceneTreePanel from './panels/scene-tree-panel'
import PropertiesPanel from './panels/properties-panel'
import { useStore } from '@/store'
import { DEFAULT_MOSAIC_LAYOUT } from '@/store/pref-slice'
import { FileDropZone } from '@/components/file-drop-zone'
import { parseOpendrive } from 'opendrive-core'

export type ViewId = 'viewport' | 'sceneTree' | 'properties'

const ELEMENT_MAP: Record<ViewId, React.ReactNode> = {
  viewport: <ViewportPanel />,
  sceneTree: <SceneTreePanel />,
  properties: <PropertiesPanel />,
}

const TITLE_MAP: Record<ViewId, string> = {
  viewport: '3D 视口',
  sceneTree: '场景树',
  properties: '属性',
}

interface TileProps {
  id: ViewId
  path: MosaicBranch[]
  currentLayout: MosaicNode<ViewId>
  defaultLayout: MosaicNode<ViewId>
  onLayoutChange: (layout: MosaicNode<ViewId>) => void
}

function Tile({
  id,
  path,
  currentLayout,
  defaultLayout,
  onLayoutChange,
}: TileProps) {
  const isExpanded = typeof currentLayout === 'string' && currentLayout === id

  const handleExpand = () => {
    if (isExpanded) {
      onLayoutChange(defaultLayout)
    } else {
      onLayoutChange(id)
    }
  }

  const handleClose = () => {
    if (typeof currentLayout !== 'string') {
      const removeNode = (
        node: MosaicNode<ViewId>,
      ): MosaicNode<ViewId> | null => {
        if (typeof node === 'string') {
          return node === id ? null : node
        }
        const first = removeNode(node.first)
        const second = removeNode(node.second)
        if (!first) return second
        if (!second) return first
        return { ...node, first, second }
      }
      const newLayout = removeNode(currentLayout)
      onLayoutChange(newLayout || defaultLayout)
    }
  }

  return (
    <MosaicWindow<ViewId>
      path={path}
      title={TITLE_MAP[id]}
      toolbarControls={[
        <button
          key="expand"
          className="mosaic-window-control"
          onClick={handleExpand}
          title={isExpanded ? '还原' : '最大化'}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>,
        <button
          key="close"
          className="mosaic-window-control"
          onClick={handleClose}
          title="关闭"
        >
          <X size={14} />
        </button>,
      ]}
    >
      {ELEMENT_MAP[id]}
    </MosaicWindow>
  )
}

export default function Viewer() {
  const { mosaicLayout, setMosaicLayout } = useStore()

  const currentLayout = mosaicLayout || DEFAULT_MOSAIC_LAYOUT

  const handleFilesDropped = async (files: File[]) => {
    const file = files[0]
    if (file) {
      const content = new Uint8Array(await file.arrayBuffer())
      const start = performance.now()
      const odr = parseOpendrive(content)
      const end = performance.now()
      console.log('parse time = ', end - start)
      console.log('odr = ', odr)
    }
  }

  return (
    <FileDropZone
      onFilesDropped={handleFilesDropped}
      className="w-full h-full"
    >
      <Mosaic<ViewId>
        renderTile={(id, path) => (
          <Tile
            id={id}
            path={path}
            currentLayout={currentLayout}
            defaultLayout={DEFAULT_MOSAIC_LAYOUT}
            onLayoutChange={setMosaicLayout}
          />
        )}
        value={currentLayout}
        onChange={setMosaicLayout}
      />
    </FileDropZone>
  )
}