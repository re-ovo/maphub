import type { ReactNode, MouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface NodeRefProps {
  /** 目标节点 ID */
  nodeId: string;

  /** 显示内容 */
  children: ReactNode;

  /** 自定义类名 */
  className?: string;

  /** 点击回调 (可选，用于自定义行为) */
  onClick?: (nodeId: string) => void;
}

/**
 * 节点引用组件 - 点击可跳转到场景树对应节点
 *
 * 使用示例:
 * ```tsx
 * <NodeRef nodeId="uuid-xxx">Lane -1</NodeRef>
 * ```
 */
export function NodeRef({
  nodeId,
  children,
  className,
  onClick,
}: NodeRefProps) {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(nodeId);
    } else {
      // TODO: 接入 store
      // 1. 选中该节点: selectionStore.select(nodeId)
      // 2. 场景树展开并滚动: sceneTree.revealNode(nodeId)
      // 3. 视口聚焦: renderer.focusOn(nodeId)
      console.log("[NodeRef] Navigate to node:", nodeId);
    }
  };

  return (
    <a
      href="#"
      className={cn(
        "text-blue-500 hover:text-blue-600 hover:underline cursor-pointer",
        "dark:text-blue-400 dark:hover:text-blue-300",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
