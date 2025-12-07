import { useMemo } from "react";
import type { MapNode } from "@/viewer/types/map-node";
import { useStore } from "@/store";

/**
 * 递归查找指定 ID 的节点
 */
function findNodeById(nodes: MapNode[], targetId: string): MapNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children.length > 0) {
      const found = findNodeById(node.children as MapNode[], targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 获取当前选中的节点列表
 */
export function useSelectedNodes(): MapNode[] {
  const selectedNodeIds = useStore((s) => s.selectedNodeIds);
  const rootNodes = useStore((s) => s.rootNodes);

  return useMemo(() => {
    const result: MapNode[] = [];
    for (const id of selectedNodeIds) {
      const node = findNodeById(rootNodes as MapNode[], id);
      if (node) result.push(node);
    }
    return result;
  }, [selectedNodeIds, rootNodes]);
}
