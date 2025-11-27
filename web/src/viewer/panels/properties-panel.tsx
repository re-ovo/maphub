import { useStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface PropertyRowProps {
  label: string
  value: string | number
  editable?: boolean
  onChange?: (value: string) => void
}

function PropertyRow({ label, value, editable = false, onChange }: PropertyRowProps) {
  return (
    <div className="grid grid-cols-2 gap-2 items-center py-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editable ? (
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-7 text-xs"
        />
      ) : (
        <span className="text-xs">{value}</span>
      )}
    </div>
  )
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold mb-2 px-1">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export default function PropertiesPanel() {
  const { selectedNodes } = useStore()

  if (selectedNodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">属性</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">未选择对象</p>
        </CardContent>
      </div>
    )
  }

  const selectedNode = selectedNodes[0]

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm">属性</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <PropertySection title="基本信息">
              <PropertyRow label="名称" value={selectedNode.name || 'Unnamed'} />
              <PropertyRow label="类型" value={selectedNode.getClassName?.()} />
              <PropertyRow label="ID" value={selectedNode.uniqueId} />
            </PropertySection>

            <PropertySection title="变换">
              <PropertyRow
                label="位置 X"
                value={selectedNode.position?.x.toFixed(2) || '0.00'}
                editable
              />
              <PropertyRow
                label="位置 Y"
                value={selectedNode.position?.y.toFixed(2) || '0.00'}
                editable
              />
              <PropertyRow
                label="位置 Z"
                value={selectedNode.position?.z.toFixed(2) || '0.00'}
                editable
              />
            </PropertySection>

            <PropertySection title="旋转">
              <PropertyRow
                label="旋转 X"
                value={selectedNode.rotation?.x.toFixed(2) || '0.00'}
                editable
              />
              <PropertyRow
                label="旋转 Y"
                value={selectedNode.rotation?.y.toFixed(2) || '0.00'}
                editable
              />
              <PropertyRow
                label="旋转 Z"
                value={selectedNode.rotation?.z.toFixed(2) || '0.00'}
                editable
              />
            </PropertySection>

            <PropertySection title="缩放">
              <PropertyRow
                label="缩放 X"
                value={selectedNode.scaling?.x.toFixed(2) || '1.00'}
                editable
              />
              <PropertyRow
                label="缩放 Y"
                value={selectedNode.scaling?.y.toFixed(2) || '1.00'}
                editable
              />
              <PropertyRow
                label="缩放 Z"
                value={selectedNode.scaling?.z.toFixed(2) || '1.00'}
                editable
              />
            </PropertySection>

            <PropertySection title="可见性">
              <PropertyRow label="可见" value={selectedNode.isEnabled?.() ? '是' : '否'} />
              <PropertyRow label="可选择" value={selectedNode.isPickable ? '是' : '否'} />
            </PropertySection>
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  )
}
