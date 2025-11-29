import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store";
import type { PropertyGroup, PropertyItem } from "@/viewer/types";

/** 属性分组组件 */
function PropertyGroupView({
  group,
  defaultExpanded = true,
}: {
  group: PropertyGroup;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(
    group.defaultExpanded ?? defaultExpanded
  );

  return (
    <div className="border-b border-border last:border-b-0">
      {/* 分组标题 */}
      <button
        className="w-full flex items-center gap-1 px-3 py-1.5 hover:bg-accent text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="text-xs font-medium">{group.title}</span>
      </button>

      {/* 属性列表 */}
      {isExpanded && (
        <div className="px-3 pb-2">
          {group.properties.map((prop) => (
            <PropertyItemView key={prop.key} item={prop} />
          ))}
        </div>
      )}
    </div>
  );
}

/** 属性项组件 */
function PropertyItemView({ item }: { item: PropertyItem }) {
  const renderValue = () => {
    switch (item.type) {
      case "boolean":
        return (
          <span className={item.value ? "text-green-500" : "text-red-500"}>
            {item.value ? "true" : "false"}
          </span>
        );
      case "number":
        return (
          <span>
            {typeof item.value === "number" ? item.value.toFixed(3) : item.value}
            {item.unit && (
              <span className="text-muted-foreground ml-1">{item.unit}</span>
            )}
          </span>
        );
      case "link":
        return (
          <button
            className="text-blue-500 hover:underline"
            onClick={item.onClick}
          >
            {String(item.value)}
          </button>
        );
      case "vec2":
      case "vec3":
        if (Array.isArray(item.value)) {
          return (
            <span className="font-mono text-xs">
              [{item.value.map((v) => v.toFixed(2)).join(", ")}]
            </span>
          );
        }
        return <span>{String(item.value)}</span>;
      default:
        return <span>{String(item.value)}</span>;
    }
  };

  return (
    <div className="flex items-center justify-between py-0.5 text-xs">
      <span className="text-muted-foreground truncate mr-2">{item.label}</span>
      <span className="text-right truncate max-w-[60%]">{renderValue()}</span>
    </div>
  );
}

/** 空状态 */
function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      选择一个对象查看属性
    </div>
  );
}

/** 多选状态 */
function MultiSelectState({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      已选择 {count} 个对象
    </div>
  );
}

export default function PropertiesPanel() {
  const { documents, selection } = useStore();

  // 获取主选择的属性
  const { title, subtitle, groups } = useMemo(() => {
    if (selection.length === 0) {
      return { title: null, subtitle: null, groups: [] };
    }

    if (selection.length > 1) {
      return { title: null, subtitle: null, groups: [] };
    }

    const selectable = selection[0];
    const doc = documents.get(selectable.documentId);
    if (!doc) {
      return { title: null, subtitle: null, groups: [] };
    }

    const titleInfo = doc.propertyProvider.getTitle(selectable);
    const propGroups = doc.propertyProvider.getProperties(selectable);

    return {
      title: titleInfo.title,
      subtitle: titleInfo.subtitle,
      groups: propGroups,
    };
  }, [documents, selection]);

  if (selection.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm">属性</CardTitle>
        </CardHeader>
        <EmptyState />
      </div>
    );
  }

  if (selection.length > 1) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm">属性</CardTitle>
        </CardHeader>
        <MultiSelectState count={selection.length} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="py-2 px-3 space-y-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <ScrollArea className="flex-1">
        <div>
          {groups.map((group) => (
            <PropertyGroupView key={group.id} group={group} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
