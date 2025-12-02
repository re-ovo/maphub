import type { ReactNode } from "react";
import type { ElementNode, ElementType } from "./element";

export interface TreeProvider<E extends ElementNode<unknown, ElementType>> {
    getActions(element: E): TreeAction[];
}

export interface TreeAction {
    icon?: ReactNode;
    label: string | ReactNode;
    onClick: () => void;
}
