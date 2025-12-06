import { useMemo } from "react";
import { useStore } from "@/store";
import { selectSelectedNode } from "@/store/selectors";
import { formatRegistry } from "@/viewer/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PropertiyGroup } from "@/viewer/types/format";
import { Info } from "lucide-react";

interface PropertyGroupProps {
  group: PropertiyGroup;
}

function PropertyGroup({ group }: PropertyGroupProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="px-3 py-2 bg-muted/30 text-sm font-medium text-foreground">{group.label}</div>
      <div className="divide-y divide-border">
        {group.items.map((item, index) => (
          <div key={index} className="px-3 py-1.5 flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
            <span className="text-sm text-foreground text-right truncate">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertiesPanel() {
  const selectedNode = useStore(selectSelectedNode);

  // 获取属性数据
  const properties = useMemo<PropertiyGroup[] | null>(() => {
    if (!selectedNode) return null;
    const formatHandler = formatRegistry[selectedNode.format];
    if (!formatHandler) return null;
    return formatHandler.provideProperties(selectedNode as any);
  }, [selectedNode]);

  // 未选中节点
  if (!selectedNode) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
        <Info className="w-5 h-5" />
        <span>选择一个节点以查看属性</span>
      </div>
    );
  }

  // 没有属性数据
  if (!properties || properties.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
        <Info className="w-5 h-5" />
        <span>无可用属性</span>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="py-1 pr-2">
        {properties.map((group, index) => (
          <PropertyGroup key={index} group={group} />
        ))}
      </div>
    </ScrollArea>
  );
}
