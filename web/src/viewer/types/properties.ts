import type { ReactNode } from "react";
import type { ElementNode, ElementType } from "./element";

export interface PropertiesProvider<E extends ElementNode<unknown, ElementType>> {
    getProperties(element: E): PropertyGroup[];
}

export interface PropertyGroup {
    label: string;
    properties: Property[];
}

export interface Property {
    label: string;
    value: string | number | boolean | ReactNode;
}