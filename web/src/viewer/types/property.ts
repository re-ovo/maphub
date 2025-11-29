import type { Selectable } from "./selectable";

/** 属性值类型 */
export type PropertyValueType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "vec2"
  | "vec3"
  | "link"
  | "color";

/** 属性值 */
export type PropertyValue = string | number | boolean | number[];

/** 属性项 */
export interface PropertyItem {
  /** 属性键 */
  key: string;

  /** 显示标签 */
  label: string;

  /** 属性值 */
  value: PropertyValue;

  /** 值类型 */
  type: PropertyValueType;

  /** 单位 (可选) */
  unit?: string;

  /** 是否只读 */
  readonly?: boolean;

  /** 点击回调 (type=link 时) */
  onClick?: () => void;
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

/** 属性面板提供者 */
export interface PropertyProvider {
  /** 获取对象的属性组 */
  getProperties(selectable: Selectable): PropertyGroup[];

  /** 获取对象的标题信息 */
  getTitle(selectable: Selectable): { title: string; subtitle?: string };
}
