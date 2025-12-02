import type { ReactNode } from "react";
import type { ElementNode, ElementType } from "./element";

export interface PropertiesProvider<E extends ElementNode<unknown, ElementType>> {
    getProperties(element: E): PropertyGroup[];
}

export interface PropertyGroup {
    label: string;
    properties: PropertyItem[];
}

export interface PropertyItem {
    label: string;
    value: PropertyValue;
}

export type PropertyValue = string | number | ReactNode | null;