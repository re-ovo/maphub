import type { StoreState } from "./index";
import type { MapNode } from "@/viewer/types/map-node";

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
 * 获取当前选中的节点
 */
export const selectSelectedNode = (state: StoreState): MapNode | null => {
  if (!state.selectedNodeId) return null;
  return findNodeById(state.rootNodes as MapNode[], state.selectedNodeId);
};
