import { RenderLayer } from "@/viewer/enums";
import { DoubleSide, Group, Mesh, MeshBasicMaterial, Shape, ShapeGeometry, Vector3 } from "three";

export interface DirectionArrowsOptions {
  /** 箭头颜色 */
  color?: number;
  /** 箭头间距（米），沿着路径的实际距离 */
  spacing?: number;
  /** 箭头长度 */
  arrowLength?: number;
  /** 箭头宽度 */
  arrowWidth?: number;
  /** Y 轴偏移（悬浮高度） */
  offsetY?: number;
  /** 是否反向 */
  reverse?: boolean;
}

/**
 * 方向箭头工具类
 * 根据采样点生成沿路径的2D方向箭头
 */
export class DirectionArrows extends Group {
  private readonly arrows: Mesh[] = [];
  private readonly options: Required<DirectionArrowsOptions>;
  private readonly sharedGeometry: ShapeGeometry;
  private readonly sharedMaterial: MeshBasicMaterial;

  constructor(points: Vector3[], options: DirectionArrowsOptions = {}) {
    super();

    this.name = "DirectionArrows";
    this.options = {
      color: options.color ?? 0xffff00,
      spacing: options.spacing ?? 10,
      arrowLength: options.arrowLength ?? 1.5,
      arrowWidth: options.arrowWidth ?? 0.8,
      offsetY: options.offsetY ?? 0.5,
      reverse: options.reverse ?? false,
    };

    // 创建共享的箭头几何体（2D三角形）
    this.sharedGeometry = this.createArrowGeometry();

    // 创建共享材质
    this.sharedMaterial = new MeshBasicMaterial({
      color: this.options.color,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });

    this.createArrows(points);

    this.traverse((child) => {
      child.layers.set(RenderLayer.Helper);
    });
  }

  /**
   * 创建箭头形状的几何体
   */
  private createArrowGeometry(): ShapeGeometry {
    const length = this.options.arrowLength;
    const width = this.options.arrowWidth;

    // 创建简单的三角形箭头，尖端朝向 +Z 方向
    const shape = new Shape();
    shape.moveTo(0, length / 2); // 顶点（前方）
    shape.lineTo(-width / 2, -length / 2); // 左下角
    shape.lineTo(width / 2, -length / 2); // 右下角
    shape.closePath();

    return new ShapeGeometry(shape);
  }

  /**
   * 根据采样点创建箭头
   */
  private createArrows(points: Vector3[]): void {
    if (points.length < 2) return;

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

        // 创建箭头 mesh
        const arrow = new Mesh(this.sharedGeometry, this.sharedMaterial);
        arrow.position.copy(position);

        // 设置箭头旋转，使其平躺在地面上并指向正确方向
        // ShapeGeometry 默认在 XY 平面，需要旋转到 XZ 平面
        arrow.rotation.x = -Math.PI / 2;
        // 根据方向向量计算 Y 轴旋转角度
        arrow.rotation.z = -Math.atan2(direction.z, direction.x) + Math.PI / 2;

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
    this.sharedMaterial.color.set(color);
  }

  /**
   * 更新箭头方向
   */
  setReverse(reverse: boolean): void {
    if (reverse === this.options.reverse) return;

    this.options.reverse = reverse;

    // 反转所有箭头的方向（旋转180度）
    for (const arrow of this.arrows) {
      arrow.rotation.z += Math.PI;
    }
  }

  /**
   * 销毁所有箭头
   */
  dispose(): void {
    for (const arrow of this.arrows) {
      this.remove(arrow);
    }
    this.arrows.length = 0;

    // 清理共享资源
    this.sharedGeometry.dispose();
    this.sharedMaterial.dispose();
  }
}
