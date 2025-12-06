import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStore } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MapNode } from "@/viewer/types/map-node";
import type { MapRenderer } from "@/viewer/types/renderer";
import { formatRegistry } from "@/viewer/format";
import { cn } from "@/lib/utils";
import { ChevronRight, Eye, EyeOff, Layers, Trash2, Focus, MoreHorizontal } from "lucide-react";

interface FlatNode {
  node: MapNode;
  depth: number;
  isRoot: boolean;
}

// 将树结构扁平化为列表，只包含展开的节点
function flattenTree(
  nodes: MapNode[],
  expandedIds: Set<string>,
  depth = 0,
  isRoot = true,
): FlatNode[] {
  const result: FlatNode[] = [];

  for (const node of nodes) {
    result.push({ node, depth, isRoot });

    if (expandedIds.has(node.id) && node.children.length > 0) {
      result.push(...flattenTree(node.children as MapNode[], expandedIds, depth + 1, false));
    }
  }

  return result;
}

// 递归在渲染器树中查找目标节点
function findRenderer(targetId: string, renderers: MapRenderer[]): MapRenderer | null {
  for (const renderer of renderers) {
    if (renderer.node.id === targetId) {
      return renderer;
    }

    const childRenderers = renderer.children.filter(
      (child): child is MapRenderer => "node" in child,
    );
    if (childRenderers.length > 0) {
      const found = findRenderer(targetId, childRenderers);
      if (found) return found;
    }
  }
  return null;
}

interface TreeNodeRowProps {
  flatNode: FlatNode;
}

function TreeNodeRow({ flatNode }: TreeNodeRowProps) {
  const { node, depth, isRoot } = flatNode;

  const {
    selectedNodeId,
    selectNode,
    expandedNodeIds,
    toggleNodeExpanded,
    toggleNodeVisibility,
    removeMap,
    viewportRenderer,
    rootRenderers,
  } = useStore();

  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodeIds.has(node.id);
  const hasChildren = node.children.length > 0;

  // 通过格式处理器获取图标和菜单
  const formatHandler = formatRegistry[node.format];
  const treeInfo = formatHandler?.provideTreeInfo(node as any);
  const icon = treeInfo?.icon ?? <Layers className="w-4 h-4 shrink-0 text-muted-foreground" />;
  const formatMenus = treeInfo?.menus ?? [];

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      toggleNodeExpanded(node.id);
    }
  };

  const handleSelect = () => {
    selectNode(node.id);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeVisibility(node.id);
  };

  const handleRemove = () => {
    if (isRoot) {
      removeMap(node.id);
    }
  };

  const handleFocus = () => {
    if (!viewportRenderer) return;

    const renderer = findRenderer(node.id, rootRenderers);
    if (renderer) {
      viewportRenderer.fitTo(renderer);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center h-7 px-1 pr-4 cursor-pointer select-none rounded-sm group",
        "hover:bg-accent/50",
        isSelected && "bg-accent text-accent-foreground",
      )}
      style={{ paddingLeft: `${depth * 16 + 4}px` }}
      onClick={handleSelect}
    >
      {/* 展开/折叠按钮 */}
      <button
        className={cn(
          "w-4 h-4 flex items-center justify-center shrink-0",
          !hasChildren && "invisible",
        )}
        onClick={handleToggleExpand}
      >
        <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
      </button>

      {/* 图标 */}
      <span className="mr-1.5">{icon}</span>

      {/* 节点名称 */}
      <span className="truncate flex-1 text-sm">{node.name}</span>

      {/* 聚焦按钮 */}
      <button
        className={cn(
          "w-5 h-5 flex items-center justify-center shrink-0 rounded-sm",
          "opacity-0 group-hover:opacity-100 hover:bg-accent",
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleFocus();
        }}
        title="聚焦"
      >
        <Focus className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* 可见性切换按钮 */}
      <button
        className={cn(
          "w-5 h-5 flex items-center justify-center shrink-0 rounded-sm",
          "opacity-0 group-hover:opacity-100 hover:bg-accent",
          !node.visible && "opacity-100",
        )}
        onClick={handleToggleVisibility}
        title={node.visible ? "隐藏" : "显示"}
      >
        {node.visible ? (
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />
        )}
      </button>

      {/* 更多菜单 */}
      {(formatMenus.length > 0 || isRoot) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-5 h-5 flex items-center justify-center shrink-0 rounded-sm",
                "opacity-0 group-hover:opacity-100 hover:bg-accent",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {/* 格式特定菜单 */}
            {formatMenus.map((menu, index) => (
              <DropdownMenuItem key={index} onClick={menu.onClick}>
                {menu.icon}
                {menu.label}
              </DropdownMenuItem>
            ))}

            {/* 公共菜单：删除（仅根节点） */}
            {isRoot && (
              <>
                {formatMenus.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={handleRemove} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

const ROW_HEIGHT = 28; // h-7 = 1.75rem = 28px

export default function SceneTreePanel() {
  const rootNodes = useStore((s) => s.rootNodes);
  const expandedNodeIds = useStore((s) => s.expandedNodeIds);
  const parentRef = useRef<HTMLDivElement>(null);

  // 扁平化树结构
  const flatNodes = useMemo(
    () => flattenTree(rootNodes as MapNode[], expandedNodeIds),
    [rootNodes, expandedNodeIds],
  );

  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (rootNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        拖拽地图文件到此处
      </div>
    );
  }

  return (
    <div ref={parentRef} className="w-full h-full overflow-auto">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const flatNode = flatNodes[virtualRow.index];
          return (
            <div
              key={flatNode.node.id}
              className="absolute left-0 w-full"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TreeNodeRow flatNode={flatNode} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
