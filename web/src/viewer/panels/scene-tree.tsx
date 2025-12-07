import { useRef, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStore } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { HighlightedText } from "@/components/highlighted-text";
import type { MapNode } from "@/viewer/types/map-node";
import type { MapRenderer } from "@/viewer/types/renderer";
import { formatRegistry } from "@/viewer/format";
import { cn } from "@/lib/utils";
import { fuzzyMatch } from "@/utils/fuzzy-match";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Trash2,
  Focus,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

interface FlatNode {
  node: MapNode;
  depth: number;
  isRoot: boolean;
  matchesSearch?: boolean;
}

// 检查节点或其子节点是否匹配搜索
function nodeMatchesSearch(node: MapNode, searchQuery: string): boolean {
  if (fuzzyMatch(node.name, searchQuery)) return true;
  for (const child of node.children) {
    if (nodeMatchesSearch(child as MapNode, searchQuery)) return true;
  }
  return false;
}

// 将树结构扁平化为列表，只包含展开的节点
function flattenTree(
  nodes: MapNode[],
  expandedIds: Set<string>,
  searchQuery = "",
  depth = 0,
  isRoot = true,
): FlatNode[] {
  const result: FlatNode[] = [];
  const hasSearch = searchQuery.length > 0;

  for (const node of nodes) {
    const selfMatches = hasSearch && fuzzyMatch(node.name, searchQuery);
    const childrenMatch = hasSearch && !selfMatches && nodeMatchesSearch(node, searchQuery);

    // 如果有搜索词，只显示匹配的节点及其祖先/后代
    if (hasSearch && !selfMatches && !childrenMatch) {
      continue;
    }

    result.push({ node, depth, isRoot, matchesSearch: selfMatches });

    // 搜索模式下自动展开有匹配子节点的节点，否则按正常展开状态
    const shouldExpand = hasSearch ? selfMatches || childrenMatch : expandedIds.has(node.id);

    if (shouldExpand && node.children.length > 0) {
      result.push(
        ...flattenTree(node.children as MapNode[], expandedIds, searchQuery, depth + 1, false),
      );
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
  searchQuery: string;
}

function TreeNodeRow({ flatNode, searchQuery }: TreeNodeRowProps) {
  const { node, depth, isRoot } = flatNode;

  const {
    selectedNodeIds,
    selectNodes,
    expandedNodeIds,
    toggleNodeExpanded,
    toggleNodeVisibility,
    removeMap,
    viewportRenderer,
    rootRenderers,
  } = useStore();

  const isSelected = selectedNodeIds.includes(node.id);
  const isExpanded = expandedNodeIds.has(node.id);
  const hasChildren = node.children.length > 0;

  // 通过格式处理器获取图标和菜单
  const formatHandler = formatRegistry[node.format];
  const treeInfo = formatHandler?.provideTreeInfo(node as any);
  const icon = treeInfo?.icon ?? <Layers className="w-4 h-4 shrink-0 text-muted-foreground" />;
  const formatMenus = treeInfo?.menus ?? [];
  const isVirtual = treeInfo?.virtual ?? false;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      toggleNodeExpanded(node.id);
    }
  };

  const handleSelect = () => {
    // 单击选择单个节点
    selectNodes([node.id]);
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
      <span className="truncate flex-1 text-sm">
        {searchQuery ? <HighlightedText text={node.name} pattern={searchQuery} /> : node.name}
      </span>

      {/* 聚焦按钮 */}
      {!isVirtual && (
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
      )}

      {/* 可见性切换按钮 */}
      {!isVirtual && (
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
      )}

      {/* 更多菜单 */}
      {!isVirtual && (formatMenus.length > 0 || isRoot) && (
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
  const [searchQuery, setSearchQuery] = useState("");

  // 扁平化树结构
  const flatNodes = useMemo(
    () => flattenTree(rootNodes as MapNode[], expandedNodeIds, searchQuery),
    [rootNodes, expandedNodeIds, searchQuery],
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
    <div className="w-full h-full flex flex-col">
      {/* 搜索框 */}
      <div className="px-2 py-1.5 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 pr-7 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 树列表 */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {flatNodes.length === 0 && searchQuery ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            未找到匹配的节点
          </div>
        ) : (
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
                  <TreeNodeRow flatNode={flatNode} searchQuery={searchQuery} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
