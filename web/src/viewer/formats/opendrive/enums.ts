import { Color } from "three";

/** 车道类型对应的颜色配置 */
export const LANE_COLORS: Record<string, Color> = {
  // 行驶相关
  driving: new Color(0.3, 0.3, 0.3), // 普通行车道 - 深灰色
  entry: new Color(0.35, 0.35, 0.4), // 加速车道 - 略带蓝的灰色
  exit: new Color(0.4, 0.35, 0.35), // 减速车道 - 略带红的灰色
  onRamp: new Color(0.3, 0.35, 0.4), // 上匝道 - 蓝灰色
  offRamp: new Color(0.4, 0.35, 0.3), // 下匝道 - 橙灰色
  connectingRamp: new Color(0.35, 0.35, 0.45), // 连接匝道 - 偏蓝灰
  slipLane: new Color(0.35, 0.4, 0.35), // 右转/续行车道 - 略绿灰

  // 结构 / 分隔
  median: new Color(0.35, 0.45, 0.35), // 中央分隔带 - 草绿
  border: new Color(0.4, 0.4, 0.4), // 路面边界 - 灰色
  curb: new Color(0.5, 0.5, 0.5), // 路缘石 - 浅灰色
  shoulder: new Color(0.5, 0.5, 0.5), // 路肩 - 浅灰色
  stop: new Color(0.6, 0.5, 0.3), // 应急停车带 - 橙黄色
  none: new Color(0.2, 0.2, 0.2), // 虚拟空车道 - 深灰色

  // 行人 / 非机动车
  biking: new Color(0.2, 0.5, 0.3), // 自行车道 - 绿色
  walking: new Color(0.6, 0.55, 0.5), // 人行区域 - 米色
  sidewalk: new Color(0.6, 0.55, 0.5), // 人行道 - 米色

  // 特殊用途
  parking: new Color(0.3, 0.4, 0.5), // 停车位 - 蓝灰色
  restricted: new Color(0.5, 0.3, 0.3), // 禁止通行区域 - 棕红色
};

/** 默认车道颜色 */
export const DEFAULT_LANE_COLOR = new Color(0.35, 0.35, 0.35);
