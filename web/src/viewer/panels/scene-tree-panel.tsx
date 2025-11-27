import { useState } from 'react'
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TreeNode {
  id: string
  name: string
  type: string
  visible: boolean
  children?: TreeNode[]
}

interface TreeItemProps {
  node: TreeNode
  level: number
  onSelect: (node: TreeNode) => void
  onToggleVisibility: (node: TreeNode) => void
  isSelected: boolean
}

function TreeItem({ node, level, onSelect, onToggleVisibility, isSelected }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="w-4 h-4 flex items-center justify-center"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-2" onClick={() => onSelect(node)}>
          <span className="text-xs text-muted-foreground">{node.type}</span>
          <span className="text-sm">{node.name}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(node)
          }}
          className="w-4 h-4 flex items-center justify-center hover:text-primary"
        >
          {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              isSelected={isSelected}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SceneTreePanel() {
  const [treeData, setTreeData] = useState<TreeNode[]>([
    {
      id: 'root',
      name: 'Scene',
      type: 'Scene',
      visible: true,
      children: [
        {
          id: 'cameras',
          name: 'Cameras',
          type: 'Folder',
          visible: true,
          children: [
            { id: 'camera-1', name: 'Main Camera', type: 'Camera', visible: true },
          ],
        },
        {
          id: 'lights',
          name: 'Lights',
          type: 'Folder',
          visible: true,
          children: [
            { id: 'light-1', name: 'Hemispheric Light', type: 'Light', visible: true },
          ],
        },
        {
          id: 'meshes',
          name: 'Meshes',
          type: 'Folder',
          visible: true,
          children: [
            { id: 'ground', name: 'Ground', type: 'Mesh', visible: true },
          ],
        },
      ],
    },
  ])

  const handleSelect = (node: TreeNode) => {
    // TODO: Implement actual node selection from Babylon.js scene
    console.log('Selected node:', node)
  }

  const handleToggleVisibility = (node: TreeNode) => {
    // TODO: Implement actual visibility toggle
    console.log('Toggle visibility:', node)
    setTreeData((prev) => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((n) => {
          if (n.id === node.id) {
            return { ...n, visible: !n.visible }
          }
          if (n.children) {
            return { ...n, children: updateNode(n.children) }
          }
          return n
        })
      }
      return updateNode(prev)
    })
  }

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-sm">场景树</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {treeData.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                level={0}
                onSelect={handleSelect}
                onToggleVisibility={handleToggleVisibility}
                isSelected={false}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  )
}
