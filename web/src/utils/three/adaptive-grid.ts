import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  Vector3,
} from "three";

export interface AdaptiveGridOptions {
  /** 网格线主颜色（每隔一定距离的线） */
  primaryColor?: number;
  /** 网格线次颜色 */
  secondaryColor?: number;
  /** 网格透明度 */
  opacity?: number;
  /** 网格线到 mesh 底部的距离 */
  offsetY?: number;
  /** 主网格线间隔（次网格线数量） */
  primaryInterval?: number;
  /** 边界扩展比例 */
  padding?: number;
}

/**
 * 自适应网格
 * 根据目标对象的 bounding box 自动调整大小和位置
 */
export class AdaptiveGrid extends LineSegments {
  private _target: Object3D | null = null;
  private options: Required<AdaptiveGridOptions>;

  constructor(options: AdaptiveGridOptions = {}) {
    const geometry = new BufferGeometry();
    const material = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: options.opacity ?? 0.5,
    });

    super(geometry, material);

    this.name = "AdaptiveGrid";

    this.options = {
      primaryColor: options.primaryColor ?? 0x444444,
      secondaryColor: options.secondaryColor ?? 0x222222,
      opacity: options.opacity ?? 0.5,
      offsetY: options.offsetY ?? 0.5,
      primaryInterval: options.primaryInterval ?? 10,
      padding: options.padding ?? 0.1,
    };
  }

  /**
   * 根据目标对象更新网格
   */
  updateFromTarget(target: Object3D): void {
    this._target = target;
    this.updateGrid();
  }

  /**
   * 更新网格几何体
   */
  private updateGrid(): void {
    if (!this._target) return;

    // 计算目标的 bounding box
    const box = new Box3().setFromObject(this._target);

    if (box.isEmpty()) return;

    const min = box.min;
    const max = box.max;

    // 计算尺寸
    const sizeX = max.x - min.x;
    const sizeZ = max.z - min.z;

    // 添加 padding
    const paddingX = sizeX * this.options.padding;
    const paddingZ = sizeZ * this.options.padding;

    const gridMinX = min.x - paddingX;
    const gridMaxX = max.x + paddingX;
    const gridMinZ = min.z - paddingZ;
    const gridMaxZ = max.z + paddingZ;

    const gridSizeX = gridMaxX - gridMinX;
    const gridSizeZ = gridMaxZ - gridMinZ;

    // 根据尺寸计算合适的网格间隔
    const cellSize = this.calculateCellSize(Math.max(gridSizeX, gridSizeZ));

    // 计算网格线数量
    const countX = Math.ceil(gridSizeX / cellSize) + 1;
    const countZ = Math.ceil(gridSizeZ / cellSize) + 1;

    // 对齐到网格单元
    const alignedMinX = Math.floor(gridMinX / cellSize) * cellSize;
    const alignedMinZ = Math.floor(gridMinZ / cellSize) * cellSize;

    // 计算 Y 坐标（在 mesh 底部下方）
    const gridY = min.y - this.options.offsetY;

    // 创建网格线顶点和颜色
    const vertices: number[] = [];
    const colors: number[] = [];

    const primaryColor = new Vector3(
      ((this.options.primaryColor >> 16) & 0xff) / 255,
      ((this.options.primaryColor >> 8) & 0xff) / 255,
      (this.options.primaryColor & 0xff) / 255,
    );
    const secondaryColor = new Vector3(
      ((this.options.secondaryColor >> 16) & 0xff) / 255,
      ((this.options.secondaryColor >> 8) & 0xff) / 255,
      (this.options.secondaryColor & 0xff) / 255,
    );

    // 绘制 X 方向的线（沿 Z 轴排列）
    for (let i = 0; i < countZ; i++) {
      const z = alignedMinZ + i * cellSize;
      const isPrimary = Math.abs(Math.round(z / cellSize)) % this.options.primaryInterval === 0;
      const color = isPrimary ? primaryColor : secondaryColor;

      vertices.push(alignedMinX, gridY, z);
      vertices.push(alignedMinX + (countX - 1) * cellSize, gridY, z);

      colors.push(color.x, color.y, color.z);
      colors.push(color.x, color.y, color.z);
    }

    // 绘制 Z 方向的线（沿 X 轴排列）
    for (let i = 0; i < countX; i++) {
      const x = alignedMinX + i * cellSize;
      const isPrimary = Math.abs(Math.round(x / cellSize)) % this.options.primaryInterval === 0;
      const color = isPrimary ? primaryColor : secondaryColor;

      vertices.push(x, gridY, alignedMinZ);
      vertices.push(x, gridY, alignedMinZ + (countZ - 1) * cellSize);

      colors.push(color.x, color.y, color.z);
      colors.push(color.x, color.y, color.z);
    }

    // 更新几何体
    const geometry = this.geometry as BufferGeometry;
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
  }

  /**
   * 根据尺寸计算合适的网格单元大小
   */
  private calculateCellSize(size: number): number {
    // 目标是大约 50-100 条网格线
    const targetLines = 50;
    const rawSize = size / targetLines;

    // 找到最接近的 "好看" 的数字 (1, 2, 5, 10, 20, 50, 100, ...)
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawSize)));
    const normalized = rawSize / magnitude;

    let nice: number;
    if (normalized <= 1.5) {
      nice = 1;
    } else if (normalized <= 3.5) {
      nice = 2;
    } else if (normalized <= 7.5) {
      nice = 5;
    } else {
      nice = 10;
    }

    return nice * magnitude;
  }

  /**
   * 销毁网格
   */
  dispose(): void {
    this.geometry.dispose();
    if (this.material instanceof LineBasicMaterial) {
      this.material.dispose();
    }
  }
}
