import type { OdrLaneSection, OdrRoad } from "@maphub/core";

interface CrossSectionViewProps {
  road: OdrRoad;
  section: OdrLaneSection;
  s: number;
  /** 当前悬停的车道 ID（可选，用于高亮显示） */
  highlightLaneId?: number;
  /** SVG 宽度 */
  width?: number;
  /** SVG 高度 */
  height?: number;
}

/** 默认车道颜色 */
const LANE_COLOR = "#666666";
/** 高亮车道颜色 */
const HIGHLIGHT_COLOR = "#ff9900";

interface LaneGeometry {
  id: number;
  tInner: number; // 内侧边界 t 坐标
  tOuter: number; // 外侧边界 t 坐标
  hInner: number; // 内侧边界高度偏移
  hOuter: number; // 外侧边界高度偏移
}

/** 计算所有车道的几何信息 */
function computeLaneGeometries(road: OdrRoad, section: OdrLaneSection, s: number): LaneGeometry[] {
  const sInSection = s - section.s;
  const laneOffset = road.evalLaneOffset(s);
  const superAngle = road.evalSuperelevation(s);
  const geometries: LaneGeometry[] = [];

  // 处理左侧车道 (id > 0，从内到外递增)
  // 左侧车道按 id 排序，从小到大（即从内到外）
  const leftLanes = [...section.left].sort((a, b) => a.id - b.id);
  let tCurrent = laneOffset; // 从车道偏移开始

  for (const lane of leftLanes) {
    const width = lane.evalWidth(sInSection);
    const height = lane.evalHeight(sInSection);
    const tInner = tCurrent;
    const tOuter = tCurrent + width;

    // 计算考虑超高的高度
    // 超高是绕参考线的旋转，t > 0 时向上，t < 0 时向下（正超高）
    const hBase = (t: number) => {
      const shapeOffset = road.evalShape(s, t);
      return t * Math.tan(superAngle) + shapeOffset;
    };

    geometries.push({
      id: lane.id,
      tInner,
      tOuter,
      hInner: hBase(tInner) + height.x,
      hOuter: hBase(tOuter) + height.y,
    });

    tCurrent = tOuter;
  }

  // 处理右侧车道 (id < 0，从内到外递减)
  // 右侧车道按 id 排序，从大到小（即从内到外）
  const rightLanes = [...section.right].sort((a, b) => b.id - a.id);
  tCurrent = laneOffset; // 重新从车道偏移开始

  for (const lane of rightLanes) {
    const width = lane.evalWidth(sInSection);
    const height = lane.evalHeight(sInSection);
    const tInner = tCurrent;
    const tOuter = tCurrent - width; // 右侧向负方向

    // 计算考虑超高的高度
    const hBase = (t: number) => {
      const shapeOffset = road.evalShape(s, t);
      return t * Math.tan(superAngle) + shapeOffset;
    };

    geometries.push({
      id: lane.id,
      tInner,
      tOuter,
      hInner: hBase(tInner) + height.x,
      hOuter: hBase(tOuter) + height.y,
    });

    tCurrent = tOuter;
  }

  return geometries;
}

export function CrossSectionView({
  road,
  section,
  s,
  highlightLaneId,
  width = 280,
  height = 80,
}: CrossSectionViewProps) {
  const geometries = computeLaneGeometries(road, section, s);

  if (geometries.length === 0) {
    return null;
  }

  // 计算边界
  const tMin = Math.min(...geometries.map((g) => Math.min(g.tInner, g.tOuter)));
  const tMax = Math.max(...geometries.map((g) => Math.max(g.tInner, g.tOuter)));
  const hMin = Math.min(...geometries.map((g) => Math.min(g.hInner, g.hOuter)));
  const hMax = Math.max(...geometries.map((g) => Math.max(g.hInner, g.hOuter)));

  // 添加边距
  const tRange = tMax - tMin || 1;
  const hRange = hMax - hMin || 0.5;
  const padding = 0.1;
  const tPadding = tRange * padding;
  const hPadding = Math.max(hRange * padding, 0.2);

  const viewTMin = tMin - tPadding;
  const viewTMax = tMax + tPadding;
  const viewHMin = hMin - hPadding;
  const viewHMax = hMax + hPadding;

  // 坐标转换函数
  // 注意：t > 0 在左侧，t < 0 在右侧，所以需要翻转 x 轴
  const tToX = (t: number) => ((viewTMax - t) / (viewTMax - viewTMin)) * width;
  const hToY = (h: number) => height - ((h - viewHMin) / (viewHMax - viewHMin)) * height;

  // 绘制参考线位置 (t=0)
  const refLineX = tToX(0);

  return (
    <svg width={width} height={height} className="bg-background/50 rounded border border-border">
      {/* 参考线 */}
      <line
        x1={refLineX}
        y1={0}
        x2={refLineX}
        y2={height}
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeDasharray="2,2"
      />

      {/* 车道 */}
      {geometries.map((geo) => {
        const isHighlight = highlightLaneId === geo.id;

        const x1 = tToX(geo.tInner);
        const x2 = tToX(geo.tOuter);
        const y1 = hToY(geo.hInner);
        const y2 = hToY(geo.hOuter);

        return (
          <g key={geo.id}>
            {/* 车道表面线条 */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isHighlight ? HIGHLIGHT_COLOR : LANE_COLOR}
              strokeWidth={isHighlight ? 3 : 2}
              strokeLinecap="round"
            />
            {/* 车道 ID 标签 */}
            <text
              x={(x1 + x2) / 2}
              y={Math.min(y1, y2) - 4}
              textAnchor="middle"
              fontSize={9}
              fill={isHighlight ? HIGHLIGHT_COLOR : "currentColor"}
              opacity={0.8}
            >
              {geo.id}
            </text>
          </g>
        );
      })}

      {/* 基准线 (h=0) */}
      <line x1={0} y1={hToY(0)} x2={width} y2={hToY(0)} stroke="currentColor" strokeOpacity={0.2} />
    </svg>
  );
}
