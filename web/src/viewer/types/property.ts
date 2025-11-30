import type { ReactNode } from "react";

/** 属性值类型（用于格式化提示，可选） */
export type PropertyValueType =
  | "string"
  | "number"
  | "boolean"
  | "vec2"
  | "vec3"
  | "color"
  | "enum";

/** 属性值 - 支持基础类型和 ReactNode */
export type PropertyValue = string | number | boolean | number[] | ReactNode;

/** 属性项 */
export interface PropertyItem {
  /** 属性键 */
  key: string;

  /** 显示标签 */
  label: string;

  /** 属性值（支持 ReactNode 自定义渲染） */
  value: PropertyValue;

  /** 值类型（可选，用于格式化） */
  type?: PropertyValueType;

  /** 单位（可选） */
  unit?: string;

  /** 是否只读 */
  readonly?: boolean;
}

/** 属性分组 */
export interface PropertyGroup {
  /** 分组 ID */
  id: string;

  /** 分组标题 */
  title: string;

  /** 是否默认展开 */
  defaultExpanded?: boolean;

  /** 属性项 */
  properties: PropertyItem[];
}
