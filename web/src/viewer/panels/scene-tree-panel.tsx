import { useCallback, useMemo, useReducer } from "react";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Route,
  Layers,
  Minus,
  MoreHorizontal,
} from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/store";
import type { SceneNode, Selectable } from "@/viewer/types";

/** 图标映射 */
const ICON_MAP: Record<string, React.ElementType> = {
  file: FileText,
  folder: Folder,
  road: Route,
  layers: Layers,
  minus: Minus,
};

interface TreeItemProps {
  node: SceneNode;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (node: SceneNode) => void;
  onToggleVisibility: (node: SceneNode) => void;
  selectedNodeIds: Set<string>;
}

function TreeItem({
  node,
  level,
  expandedNodes,
  onToggleExpand,
  onSelect,
  onToggleVisibility,
  selectedNodeIds,
}: TreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeIds.has(node.id);
  const IconComponent = ICON_MAP[node.icon || ""] || FileText;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-1 py-0.5 hover:bg-accent cursor-pointer rounded-sm ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        {/* 展开/折叠按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpand(node.id);
            }
          }}
          className="w-4 h-4 flex items-center justify-center shrink-0"
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

        {/* 图标 */}
        <IconComponent className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />

        {/* 名称 */}
        <div
          className="flex-1 text-sm truncate"
          onClick={() => onSelect(node)}
        >
          {node.label}
        </div>

        {/* 可见性切换 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(node);
          }}
          className="w-5 h-5 flex items-center justify-center hover:text-primary opacity-50 hover:opacity-100"
        >
          {node.visible ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>

        {/* 上下文菜单 */}
        {node.actions && node.actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 flex items-center justify-center hover:text-primary opacity-50 hover:opacity-100"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {node.actions.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => action.handler()}
                  disabled={action.disabled}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              selectedNodeIds={selectedNodeIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 收集前两层节点 ID */
function collectFirstTwoLevelIds(
  nodes: SceneNode[],
  level: number = 0
): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (level < 2) {
      ids.push(node.id);
      if (node.children) {
        ids.push(...collectFirstTwoLevelIds(node.children, level + 1));
      }
    }
  }
  return ids;
}

/** 递归查找节点 */
function findNodeById(nodes: SceneNode[], id: string): SceneNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** 展开状态的 reducer action */
type ExpandAction =
  | { type: "toggle"; nodeId: string }
  | { type: "expand"; nodeIds: string[] }
  | { type: "expandToSelection"; selection: Selectable[]; documents: Map<string, { treeProvider: { getNodeIdBySelectable: (s: Selectable) => string | null } }>; treeNodes: SceneNode[] };

/** 展开状态的 reducer */
function expandedReducer(state: Set<string>, action: ExpandAction): Set<string> {
  switch (action.type) {
    case "toggle": {
      const next = new Set(state);
      if (next.has(action.nodeId)) {
        next.delete(action.nodeId);
      } else {
        next.add(action.nodeId);
      }
      return next;
    }
    case "expand": {
      const next = new Set(state);
      for (const id of action.nodeIds) {
        next.add(id);
      }
      return next;
    }
    case "expandToSelection": {
      const { selection, documents, treeNodes } = action;
      if (selection.length === 0) return state;

      const next = new Set(state);
      let changed = false;

      for (const selectable of selection) {
        const doc = documents.get(selectable.documentId);
        if (doc) {
          const nodeId = doc.treeProvider.getNodeIdBySelectable(selectable);
          if (nodeId) {
            const parts = nodeId.split(":");
            let path = "";
            for (let i = 0; i < parts.length - 1; i++) {
              path = path ? `${path}:${parts[i]}` : parts[i];
              const parentNode = findNodeById(treeNodes, path);
              if (parentNode && !next.has(parentNode.id)) {
                next.add(parentNode.id);
                changed = true;
              }
            }
          }
        }
      }

      return changed ? next : state;
    }
    default:
      return state;
  }
}

export default function SceneTreePanel() {
  const { documents, selection, setSelection } = useStore();
  const [expandedNodes, dispatch] = useReducer(expandedReducer, new Set<string>());

  // 从所有文档获取树节点
  const treeNodes = useMemo(() => {
    const nodes: SceneNode[] = [];
    for (const doc of documents.values()) {
      nodes.push(...doc.treeProvider.getRootNodes());
    }
    return nodes;
  }, [documents]);

  // 计算需要默认展开的节点（前两层）
  const defaultExpandedIds = useMemo(() => {
    return collectFirstTwoLevelIds(treeNodes);
  }, [treeNodes]);

  // 合并默认展开和用户操作的展开状态
  const effectiveExpandedNodes = useMemo(() => {
    const combined = new Set(defaultExpandedIds);
    for (const id of expandedNodes) {
      combined.add(id);
    }
    return combined;
  }, [defaultExpandedIds, expandedNodes]);

  // 计算选中的节点 ID
  const selectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const selectable of selection) {
      const doc = documents.get(selectable.documentId);
      if (doc) {
        const nodeId = doc.treeProvider.getNodeIdBySelectable(selectable);
        if (nodeId) {
          ids.add(nodeId);
        }
      }
    }
    return ids;
  }, [documents, selection]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    dispatch({ type: "toggle", nodeId });
  }, []);

  const handleSelect = useCallback(
    (node: SceneNode) => {
      if (node.selectable) {
        setSelection([node.selectable]);
        // 展开到选中节点
        dispatch({
          type: "expandToSelection",
          selection: [node.selectable],
          documents,
          treeNodes,
        });
      }
    },
    [setSelection, documents, treeNodes]
  );

  const handleToggleVisibility = useCallback((node: SceneNode) => {
    if (node.type === "document" && node.id.endsWith(":root")) {
      const docId = node.id.replace(":root", "");
      useStore.getState().setDocumentVisible(docId, !node.visible);
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm">场景树</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-1">
          {treeNodes.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              拖入地图文件开始
            </div>
          ) : (
            treeNodes.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                level={0}
                expandedNodes={effectiveExpandedNodes}
                onToggleExpand={handleToggleExpand}
                onSelect={handleSelect}
                onToggleVisibility={handleToggleVisibility}
                selectedNodeIds={selectedNodeIds}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
