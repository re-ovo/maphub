import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store";
import { formatRegistry } from "@/viewer/formats";
import type { PropertyGroup, PropertyItem, PropertyValue } from "@/viewer/types";

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

/** 检查是否是 ReactNode（非原始值） */
function isReactNode(value: PropertyValue): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return false;
  if (Array.isArray(value) && value.every(v => typeof v === "number")) return false;
  return true;
}

/** 属性项组件 */
function PropertyItemView({ item }: { item: PropertyItem }) {
  const renderValue = () => {
    const { value, type, unit } = item;

    // 如果是 ReactNode，直接渲染
    if (isReactNode(value)) {
      return <>{value}</>;
    }

    // 基于 type 或值类型渲染
    if (typeof value === "boolean" || type === "boolean") {
      return (
        <span className={value ? "text-green-500" : "text-red-500"}>
          {value ? "true" : "false"}
        </span>
      );
    }

    if (typeof value === "number" || type === "number") {
      return (
        <span>
          {typeof value === "number" ? value.toFixed(3) : value}
          {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
        </span>
      );
    }

    if (Array.isArray(value) && (type === "vec2" || type === "vec3")) {
      return (
        <span className="font-mono text-xs">
          [{value.map((v) => v.toFixed(2)).join(", ")}]
        </span>
      );
    }

    // 默认字符串渲染
    return <span>{String(value)}</span>;
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
  const { documents, selection, getNode } = useStore();

  // 获取主选择的属性
  const { title, subtitle, groups } = useMemo(() => {
    if (selection.length === 0) {
      return { title: null, subtitle: null, groups: [] };
    }

    if (selection.length > 1) {
      return { title: null, subtitle: null, groups: [] };
    }

    const nodeId = selection[0];
    const node = getNode(nodeId);
    if (!node) {
      return { title: null, subtitle: null, groups: [] };
    }

    // 向上查找到文档节点以获取 formatId
    let current = node;
    while (current.parentId) {
      const parent = getNode(current.parentId);
      if (!parent) break;
      current = parent;
    }

    const doc = documents.get(current.id);
    if (!doc) {
      return { title: null, subtitle: null, groups: [] };
    }

    const format = formatRegistry.getFormat(doc.formatId);
    if (!format) {
      return { title: null, subtitle: null, groups: [] };
    }

    const titleInfo = format.getTitle(node);
    const propGroups = format.getProperties(node);

    return {
      title: titleInfo.title,
      subtitle: titleInfo.subtitle,
      groups: propGroups,
    };
  }, [documents, selection, getNode]);

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
      <ScrollArea className="flex-1 min-h-0">
        <div>
          {groups.map((group) => (
            <PropertyGroupView key={group.id} group={group} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
