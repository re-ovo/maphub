import { useMemo } from "react";
import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { formatRegistry } from "@/viewer/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PropertiyGroup } from "@/viewer/types/format";
import type { MapNode } from "@/viewer/types/map-node";
import { Info, ChevronRight } from "lucide-react";

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

interface NodePropertiesProps {
  node: MapNode;
  showTitle?: boolean;
}

function NodeProperties({ node, showTitle = false }: NodePropertiesProps) {
  const properties = useMemo<PropertiyGroup[] | null>(() => {
    const formatHandler = formatRegistry[node.format];
    if (!formatHandler) return null;
    return formatHandler.provideProperties(node as any);
  }, [node]);

  if (!properties || properties.length === 0) {
    return null;
  }

  const content = properties.map((group, index) => <PropertyGroup key={index} group={group} />);

  if (!showTitle) {
    return <div>{content}</div>;
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full px-3 py-2 bg-accent/50 text-sm font-medium text-accent-foreground border-b border-border flex items-center gap-1 hover:bg-accent/70 transition-colors [&[data-state=open]>svg]:rotate-90">
        <ChevronRight className="w-4 h-4 shrink-0 transition-transform" />
        <span className="truncate">{node.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{content}</CollapsibleContent>
    </Collapsible>
  );
}

export default function PropertiesPanel() {
  const selectedNodes = useSelectedNodes();

  if (selectedNodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
        <Info className="w-5 h-5" />
        <span>选择一个节点以查看属性</span>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="py-1 pr-2">
        {selectedNodes.map((node, index) => (
          <div key={node.id}>
            {index > 0 && <hr className="my-2 border-border" />}
            <NodeProperties node={node} showTitle={selectedNodes.length > 1} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
