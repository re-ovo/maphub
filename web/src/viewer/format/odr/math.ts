/**
 * OpenDRIVE 与 Three.js 坐标系转换工具
 *
 * OpenDRIVE 坐标系: 右手坐标系，X 轴向东，Y 轴向北，Z 轴向上
 * Three.js 坐标系: 右手坐标系，X 轴向右，Y 轴向上，Z 轴向外（朝向观察者）
 *
 * 转换关系:
 * - OpenDRIVE (x, y, z) -> Three.js (x, z, -y)
 * - Three.js (x, y, z) -> OpenDRIVE (x, -z, y)
 */

import { Vec3 } from "core";
import { Vector3 } from "three";

/**
 * 将 OpenDRIVE 坐标转换为 Three.js 坐标
 *
 * @param pos - OpenDRIVE 坐标系中的位置向量
 * @returns Three.js 坐标系中的位置向量
 *
 * @example
 * ```ts
 * const odrPos = new Vec3(10, 20, 1);
 * const threePos = odrPositionToThree(odrPos);
 * // threePos: (10, 1, -20)
 * ```
 */
export function odrPositionToThree(pos: Vec3): Vector3 {
  return new Vector3(pos.x, pos.z, -pos.y);
}

/**
 * 将 Three.js 坐标转换为 OpenDRIVE 坐标
 *
 * @param pos - Three.js 坐标系中的位置向量
 * @returns OpenDRIVE 坐标系中的位置向量
 *
 * @example
 * ```ts
 * const threePos = new Vector3(10, 1, -20);
 * const odrPos = threePositionToOdr(threePos);
 * // odrPos: Vec3(10, 20, 1)
 * ```
 */
export function threePositionToOdr(pos: Vector3): Vec3 {
  return new Vec3(pos.x, -pos.z, pos.y);
}
