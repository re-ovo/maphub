import type { ReactNode } from "react";
import { useStore } from "@/store";
import type { Id } from "@/utils/id";

interface MapNodeLinkProps {
  id: Id | Id[];
  children: ReactNode;
}

export function MapNodeLink({ id, children }: MapNodeLinkProps) {
  const selectNode = useStore((s) => s.selectNodes);

  const handleClick = () => {
    selectNode(Array.isArray(id) ? id : [id]);
  };

  return (
    <button
      type="button"
      className="text-primary hover:underline cursor-pointer"
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
