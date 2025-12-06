import { useStore } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Trash2,
  Focus,
  MoreHorizontal,
} from "lucide-react";

interface TreeNodeProps {
  node: MapNode;
  depth: number;
  isRoot?: boolean;
}

function TreeNode({ node, depth, isRoot = false }: TreeNodeProps) {
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
  const icon = treeInfo?.icon ?? (
    <Layers className="w-4 h-4 shrink-0 text-muted-foreground" />
  );
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

    // 递归在渲染器树中查找目标节点
    const findRenderer = (
      targetId: string,
      renderers: MapRenderer[]
    ): MapRenderer | null => {
      for (const renderer of renderers) {
        if (renderer.node.id === targetId) {
          return renderer;
        }

        // 递归查找子渲染器
        const childRenderers = renderer.children.filter(
          (child): child is MapRenderer => "node" in child
        );
        if (childRenderers.length > 0) {
          const found = findRenderer(targetId, childRenderers);
          if (found) return found;
        }
      }
      return null;
    };

    const renderer = findRenderer(node.id, rootRenderers);
    if (renderer) {
      viewportRenderer.fitTo(renderer);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center h-7 px-1 pr-4 cursor-pointer select-none rounded-sm group",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleSelect}
      >
        {/* 展开/折叠按钮 */}
        <button
          className={cn(
            "w-4 h-4 flex items-center justify-center shrink-0",
            !hasChildren && "invisible"
          )}
          onClick={handleToggleExpand}
        >
          <ChevronRight
            className={cn(
              "w-3 h-3 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* 图标 */}
        <span className="mr-1.5">{icon}</span>

        {/* 节点名称 */}
        <span className="truncate flex-1 text-sm">{node.name}</span>

        {/* 可见性切换按钮 */}
        <button
          className={cn(
            "w-5 h-5 flex items-center justify-center shrink-0 rounded-sm",
            "opacity-0 group-hover:opacity-100 hover:bg-accent",
            !node.visible && "opacity-100"
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-5 h-5 flex items-center justify-center shrink-0 rounded-sm",
                "opacity-0 group-hover:opacity-100 hover:bg-accent"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {/* 公共菜单：聚焦 */}
            <DropdownMenuItem onClick={handleFocus}>
              <Focus className="w-4 h-4 mr-2" />
              聚焦
            </DropdownMenuItem>

            {/* 格式特定菜单 */}
            {formatMenus.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {formatMenus.map((menu, index) => (
                  <DropdownMenuItem key={index} onClick={menu.onClick}>
                    {menu.icon}
                    {menu.label}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* 公共菜单：删除（仅根节点） */}
            {isRoot && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRemove} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SceneTreePanel() {
  const rootNodes = useStore((s) => s.rootNodes);

  if (rootNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        拖拽地图文件到此处
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="py-1">
        {rootNodes.map((node) => (
          <TreeNode key={node.id} node={node as MapNode} depth={0} isRoot />
        ))}
      </div>
    </ScrollArea>
  );
}
