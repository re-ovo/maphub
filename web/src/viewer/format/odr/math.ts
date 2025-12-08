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

import { Vec3 } from "@maphub/core";
import { Vector3 } from "three";

/**
 * 将 OpenDRIVE 坐标转换为 Three.js 坐标
 *
 * @param pos - OpenDRIVE 坐标系中的位置向量
 * @param center - 可选的地图中心点（OpenDRIVE 坐标系），用于解决大坐标精度问题，从 OpenDrive.center 获取
 * @returns Three.js 坐标系中的位置向量
 *
 * @example
 * ```ts
 * const odrPos = new Vec3(10, 20, 1);
 * const threePos = odrPositionToThree(odrPos);
 * // threePos: (10, 1, -20)
 *
 * // 使用 center 解决大坐标问题
 * const center = map.center; // 从 OpenDrive 获取
 * const threePos = odrPositionToThree(odrPos, center);
 * ```
 */
export function odrPositionToThree(pos: Vec3, center?: Vec3): Vector3 {
  if (center) {
    return new Vector3(pos.x - center.x, pos.z - center.z, -(pos.y - center.y));
  }
  return new Vector3(pos.x, pos.z, -pos.y);
}

/**
 * 将 Three.js 坐标转换为 OpenDRIVE 坐标
 *
 * @param pos - Three.js 坐标系中的位置向量
 * @param center - 可选的地图中心点（OpenDRIVE 坐标系），用于还原大坐标，从 OpenDrive.center 获取
 * @returns OpenDRIVE 坐标系中的位置向量
 *
 * @example
 * ```ts
 * const threePos = new Vector3(10, 1, -20);
 * const odrPos = threePositionToOdr(threePos);
 * // odrPos: Vec3(10, 20, 1)
 *
 * // 使用 center 还原大坐标
 * const center = map.center; // 从 OpenDrive 获取
 * const odrPos = threePositionToOdr(threePos, center);
 * ```
 */
export function threePositionToOdr(pos: Vector3, center?: Vec3): Vec3 {
  if (center) {
    return new Vec3(pos.x + center.x, -pos.z + center.y, pos.y + center.z);
  }
  return new Vec3(pos.x, -pos.z, pos.y);
}
