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
} from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store";
import type { SemanticNode } from "@/viewer/types";

/** 图标映射 */
const ICON_MAP: Record<string, React.ElementType> = {
  document: FileText,
  folder: Folder,
  road: Route,
  "lane-section": Layers,
  lane: Minus,
};

/** 将 SemanticNode 树转换为可渲染的结构 */
interface TreeNode {
  id: string;
  label: string;
  type: string;
  children: TreeNode[];
  visible: boolean;
}

function buildTreeNodes(
  nodeIds: string[],
  getNode: (id: string) => SemanticNode | undefined
): TreeNode[] {
  return nodeIds.map((id) => {
    const node = getNode(id);
    if (!node) {
      return { id, label: "Unknown", type: "unknown", children: [], visible: true };
    }
    return {
      id: node.id,
      label: node.label,
      type: node.type,
      children: buildTreeNodes(node.childrenIds, getNode),
      visible: true, // TODO: 从 store 获取可见性状态
    };
  });
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onToggleVisibility: (nodeId: string) => void;
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
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeIds.has(node.id);
  const IconComponent = ICON_MAP[node.type] || FileText;

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
          onClick={() => onSelect(node.id)}
        >
          {node.label}
        </div>

        {/* 可见性切换 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(node.id);
          }}
          className="w-5 h-5 flex items-center justify-center hover:text-primary opacity-50 hover:opacity-100"
        >
          {node.visible ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
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
function collectFirstTwoLevelIds(nodes: TreeNode[], level: number = 0): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (level < 2) {
      ids.push(node.id);
      ids.push(...collectFirstTwoLevelIds(node.children, level + 1));
    }
  }
  return ids;
}

/** 展开状态的 reducer action */
type ExpandAction =
  | { type: "toggle"; nodeId: string }
  | { type: "expand"; nodeIds: string[] }
  | { type: "expandToSelection"; selectedIds: string[]; getNode: (id: string) => SemanticNode | undefined };

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
      const { selectedIds, getNode } = action;
      if (selectedIds.length === 0) return state;

      const next = new Set(state);
      let changed = false;

      for (const nodeId of selectedIds) {
        // 向上遍历展开所有父节点
        let current = getNode(nodeId);
        while (current?.parentId) {
          if (!next.has(current.parentId)) {
            next.add(current.parentId);
            changed = true;
          }
          current = getNode(current.parentId);
        }
      }

      return changed ? next : state;
    }
    default:
      return state;
  }
}

export default function SceneTreePanel() {
  const { documents, selection, setSelection, getNode } = useStore();
  const [expandedNodes, dispatch] = useReducer(expandedReducer, new Set<string>());

  // 从所有文档构建树节点
  const treeNodes = useMemo(() => {
    const nodes: TreeNode[] = [];
    for (const doc of documents.values()) {
      // 文档节点本身就是根节点
      nodes.push({
        id: doc.id,
        label: doc.label,
        type: doc.type,
        children: buildTreeNodes(doc.childrenIds, getNode),
        visible: doc.visible,
      });
    }
    return nodes;
  }, [documents, getNode]);

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

  // 选中的节点 ID Set
  const selectedNodeIds = useMemo(() => new Set(selection), [selection]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    dispatch({ type: "toggle", nodeId });
  }, []);

  const handleSelect = useCallback(
    (nodeId: string) => {
      setSelection([nodeId]);
      // 展开到选中节点
      dispatch({
        type: "expandToSelection",
        selectedIds: [nodeId],
        getNode,
      });
    },
    [setSelection, getNode]
  );

  const handleToggleVisibility = useCallback((nodeId: string) => {
    // 如果是文档节点，切换文档可见性
    const node = getNode(nodeId);
    if (node?.type === "document") {
      useStore.getState().setDocumentVisible(nodeId, !documents.get(nodeId)?.visible);
    } else {
      // 其他节点暂时不支持可见性切换
      // TODO: 实现节点级别的可见性控制
    }
  }, [getNode, documents]);

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
