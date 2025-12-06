import { ArrowHelper, Color, Group, Vector3 } from "three";

export interface DirectionArrowsOptions {
  /** 箭头颜色 */
  color?: number;
  /** 箭头间距（米），沿着路径的实际距离 */
  spacing?: number;
  /** 箭头长度 */
  arrowLength?: number;
  /** 箭头头部长度 */
  headLength?: number;
  /** 箭头头部宽度 */
  headWidth?: number;
  /** Y 轴偏移（悬浮高度） */
  offsetY?: number;
  /** 是否反向 */
  reverse?: boolean;
}

/**
 * 方向箭头工具类
 * 根据采样点生成沿路径的方向箭头
 */
export class DirectionArrows extends Group {
  private readonly arrows: ArrowHelper[] = [];
  private readonly options: Required<DirectionArrowsOptions>;

  constructor(points: Vector3[], options: DirectionArrowsOptions = {}) {
    super();

    this.name = "DirectionArrows";

    this.options = {
      color: options.color ?? 0xffff00,
      spacing: options.spacing ?? 10,
      arrowLength: options.arrowLength ?? 2,
      headLength: options.headLength ?? 0.8,
      headWidth: options.headWidth ?? 0.5,
      offsetY: options.offsetY ?? 0.5,
      reverse: options.reverse ?? false,
    };

    this.createArrows(points);
  }

  /**
   * 根据采样点创建箭头
   */
  private createArrows(points: Vector3[]): void {
    if (points.length < 2) return;

    const color = new Color(this.options.color);
    let accumulatedDistance = 0;
    let nextArrowDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      const segmentStart = accumulatedDistance;
      const segmentLength = current.distanceTo(next);
      const segmentEnd = segmentStart + segmentLength;

      // 在当前线段上放置箭头
      while (nextArrowDistance <= segmentEnd) {
        // 计算箭头在当前线段上的位置 (0 到 1)
        const t = (nextArrowDistance - segmentStart) / segmentLength;

        // 插值计算箭头位置
        const position = new Vector3().lerpVectors(current, next, t);

        // 应用 Y 轴偏移
        position.y += this.options.offsetY;

        // 计算方向向量
        const direction = new Vector3().subVectors(next, current).normalize();

        // 如果需要反向
        if (this.options.reverse) {
          direction.negate();
        }

        // 创建箭头
        const arrow = new ArrowHelper(
          direction,
          position,
          this.options.arrowLength,
          color.getHex(),
          this.options.headLength,
          this.options.headWidth,
        );

        this.arrows.push(arrow);
        this.add(arrow);

        // 移动到下一个箭头位置
        nextArrowDistance += this.options.spacing;
      }

      accumulatedDistance = segmentEnd;
    }
  }

  /**
   * 更新箭头颜色
   */
  setColor(color: number): void {
    const newColor = new Color(color);
    for (const arrow of this.arrows) {
      arrow.setColor(newColor);
    }
  }

  /**
   * 更新箭头方向
   */
  setReverse(reverse: boolean): void {
    if (reverse === this.options.reverse) return;

    this.options.reverse = reverse;

    // 反转所有箭头的方向
    for (const arrow of this.arrows) {
      const direction = arrow.line.geometry.getAttribute("position");
      if (direction) {
        // 获取箭头的方向向量并反转
        const dir = new Vector3();
        arrow.getWorldDirection(dir);
        dir.negate();
        arrow.setDirection(dir);
      }
    }
  }

  /**
   * 销毁所有箭头
   */
  dispose(): void {
    for (const arrow of this.arrows) {
      arrow.dispose();
      this.remove(arrow);
    }
    this.arrows.length = 0;
  }
}
