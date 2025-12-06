import type { ReactNode } from "react";
import { useStore } from "@/store";
import type { Id } from "@/utils/id";

interface MapNodeLinkProps {
  id: Id;
  children: ReactNode;
}

export function MapNodeLink({ id, children }: MapNodeLinkProps) {
  const selectNode = useStore((s) => s.selectNode);

  const handleClick = () => {
    selectNode(id);
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
