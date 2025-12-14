import { describe, it, expect } from "vitest";
import { Quat, Vec3 } from "@maphub/core";
import { Quaternion, Vector3 } from "three";
import {
  coreQuatToThreeQuat,
  threeQuatToCoreQuat,
  odrQuatToThree,
  threeQuatToOdr,
  odrPositionToThree,
  threePositionToOdr,
} from "../math";

describe("odr/math - 坐标系转换工具", () => {
  describe("四元数基本转换", () => {
    it("coreQuatToThreeQuat - 应该正确转换 core Quat 到 Three.js Quaternion", () => {
      const coreQ = new Quat(0.1, 0.2, 0.3, 0.9);
      const threeQ = coreQuatToThreeQuat(coreQ);

      expect(threeQ).toBeInstanceOf(Quaternion);
      expect(threeQ.x).toBeCloseTo(0.1);
      expect(threeQ.y).toBeCloseTo(0.2);
      expect(threeQ.z).toBeCloseTo(0.3);
      expect(threeQ.w).toBeCloseTo(0.9);
    });

    it("threeQuatToCoreQuat - 应该正确转换 Three.js Quaternion 到 core Quat", () => {
      const threeQ = new Quaternion(0.1, 0.2, 0.3, 0.9);
      const coreQ = threeQuatToCoreQuat(threeQ);

      expect(coreQ).toBeInstanceOf(Quat);
      expect(coreQ.x).toBeCloseTo(0.1);
      expect(coreQ.y).toBeCloseTo(0.2);
      expect(coreQ.z).toBeCloseTo(0.3);
      expect(coreQ.w).toBeCloseTo(0.9);
    });

    it("四元数转换应该是可逆的", () => {
      const original = new Quat(0.1, 0.2, 0.3, 0.9);
      const converted = threeQuatToCoreQuat(coreQuatToThreeQuat(original));

      expect(converted.x).toBeCloseTo(original.x, 10);
      expect(converted.y).toBeCloseTo(original.y, 10);
      expect(converted.z).toBeCloseTo(original.z, 10);
      expect(converted.w).toBeCloseTo(original.w, 10);
    });
  });

  describe("位置向量转换 - 无 center", () => {
    it("odrPositionToThree - 应该正确转换 OpenDRIVE 坐标到 Three.js 坐标", () => {
      // OpenDRIVE (x, y, z) -> Three.js (x, z, -y)
      const odrPos = new Vec3(10, 20, 1);
      const threePos = odrPositionToThree(odrPos);

      expect(threePos.x).toBeCloseTo(10);
      expect(threePos.y).toBeCloseTo(1);
      expect(threePos.z).toBeCloseTo(-20);
    });

    it("threePositionToOdr - 应该正确转换 Three.js 坐标到 OpenDRIVE 坐标", () => {
      // Three.js (x, y, z) -> OpenDRIVE (x, -z, y)
      const threePos = new Vector3(10, 1, -20);
      const odrPos = threePositionToOdr(threePos);

      expect(odrPos.x).toBeCloseTo(10);
      expect(odrPos.y).toBeCloseTo(20);
      expect(odrPos.z).toBeCloseTo(1);
    });

    it("位置转换应该是可逆的", () => {
      const original = new Vec3(100, 200, 5);
      const converted = threePositionToOdr(odrPositionToThree(original));

      expect(converted.x).toBeCloseTo(original.x, 10);
      expect(converted.y).toBeCloseTo(original.y, 10);
      expect(converted.z).toBeCloseTo(original.z, 10);
    });

    it("应该正确处理零向量", () => {
      const zero = new Vec3(0, 0, 0);
      const threePos = odrPositionToThree(zero);

      expect(threePos.x).toBeCloseTo(0);
      expect(threePos.y).toBeCloseTo(0);
      expect(threePos.z).toBeCloseTo(0);
    });

    it("应该正确处理负坐标", () => {
      const odrPos = new Vec3(-10, -20, -1);
      const threePos = odrPositionToThree(odrPos);

      expect(threePos.x).toBeCloseTo(-10);
      expect(threePos.y).toBeCloseTo(-1);
      expect(threePos.z).toBeCloseTo(20); // -(-20) = 20
    });
  });

  describe("位置向量转换 - 带 center（大坐标处理）", () => {
    const center = new Vec3(1000000, 2000000, 100);

    it("odrPositionToThree - 应该正确使用 center 处理大坐标", () => {
      const odrPos = new Vec3(1000010, 2000020, 101);
      const threePos = odrPositionToThree(odrPos, center);

      // (10, 20, 1) 相对于 center
      expect(threePos.x).toBeCloseTo(10);
      expect(threePos.y).toBeCloseTo(1);
      expect(threePos.z).toBeCloseTo(-20);
    });

    it("threePositionToOdr - 应该正确使用 center 还原大坐标", () => {
      const threePos = new Vector3(10, 1, -20);
      const odrPos = threePositionToOdr(threePos, center);

      expect(odrPos.x).toBeCloseTo(1000010);
      expect(odrPos.y).toBeCloseTo(2000020);
      expect(odrPos.z).toBeCloseTo(101);
    });

    it("带 center 的位置转换应该是可逆的", () => {
      const original = new Vec3(1000050, 2000100, 105);
      const converted = threePositionToOdr(odrPositionToThree(original, center), center);

      expect(converted.x).toBeCloseTo(original.x, 10);
      expect(converted.y).toBeCloseTo(original.y, 10);
      expect(converted.z).toBeCloseTo(original.z, 10);
    });

    it("center 应该有效减少坐标精度损失", () => {
      // 大坐标
      const largePos = new Vec3(5000000, 6000000, 50);
      const largeCenter = new Vec3(5000000, 6000000, 50);

      const threePos = odrPositionToThree(largePos, largeCenter);
      const recovered = threePositionToOdr(threePos, largeCenter);

      // 使用 center 后，转换应该非常精确
      expect(recovered.x).toBeCloseTo(largePos.x, 5);
      expect(recovered.y).toBeCloseTo(largePos.y, 5);
      expect(recovered.z).toBeCloseTo(largePos.z, 5);
    });
  });

  describe("OpenDRIVE 四元数坐标系转换", () => {
    it("odrQuatToThree - 单位四元数应该正确转换", () => {
      // 单位四元数（无旋转）转换后应该还是单位四元数
      const identity = new Quat(0, 0, 0, 1);
      const threeQ = odrQuatToThree(identity);

      expect(threeQ.w).toBeCloseTo(1, 5);
      expect(threeQ.x).toBeCloseTo(0, 5);
      expect(threeQ.y).toBeCloseTo(0, 5);
      expect(threeQ.z).toBeCloseTo(0, 5);
    });

    it("threeQuatToOdr - 单位四元数应该正确转换", () => {
      // 单位四元数（无旋转）转换后应该还是单位四元数
      const identity = new Quaternion(0, 0, 0, 1);
      const odrQ = threeQuatToOdr(identity);

      expect(odrQ.w).toBeCloseTo(1, 5);
      expect(odrQ.x).toBeCloseTo(0, 5);
      expect(odrQ.y).toBeCloseTo(0, 5);
      expect(odrQ.z).toBeCloseTo(0, 5);
    });

    it("四元数坐标系转换应该是可逆的", () => {
      // 任意四元数
      const original = new Quat(0.1, 0.2, 0.3, 0.9);
      original.normalize();

      const converted = threeQuatToOdr(odrQuatToThree(original));

      expect(converted.x).toBeCloseTo(original.x, 5);
      expect(converted.y).toBeCloseTo(original.y, 5);
      expect(converted.z).toBeCloseTo(original.z, 5);
      expect(converted.w).toBeCloseTo(original.w, 5);
    });

    it("四元数转换应该保持长度归一化", () => {
      const q = new Quat(0.5, 0.5, 0.5, 0.5);
      const threeQ = odrQuatToThree(q);

      const length = Math.sqrt(threeQ.x ** 2 + threeQ.y ** 2 + threeQ.z ** 2 + threeQ.w ** 2);
      expect(length).toBeCloseTo(1, 5);
    });

    it("ODR 绕 Z 轴旋转（heading）应该转换为 Three.js 绕 Y 轴旋转", () => {
      // ODR 绕 Z 轴旋转 90°: (0, 0, sin(45°), cos(45°))
      const odrQ = new Quat(0, 0, Math.SQRT1_2, Math.SQRT1_2);
      const threeQ = odrQuatToThree(odrQ);

      // Three.js 绕 Y 轴旋转 90°: (0, sin(45°), 0, cos(45°))
      expect(threeQ.x).toBeCloseTo(0, 5);
      expect(threeQ.y).toBeCloseTo(Math.SQRT1_2, 5);
      expect(threeQ.z).toBeCloseTo(0, 5);
      expect(threeQ.w).toBeCloseTo(Math.SQRT1_2, 5);
    });

    it("ODR 绕 Y 轴旋转（pitch）应该转换为 Three.js 绕 -Z 轴旋转", () => {
      // ODR 绕 Y 轴旋转 90°: (0, sin(45°), 0, cos(45°))
      const odrQ = new Quat(0, Math.SQRT1_2, 0, Math.SQRT1_2);
      const threeQ = odrQuatToThree(odrQ);

      // Three.js 绕 -Z 轴旋转 90° = 绕 Z 轴旋转 -90°: (0, 0, -sin(45°), cos(45°))
      expect(threeQ.x).toBeCloseTo(0, 5);
      expect(threeQ.y).toBeCloseTo(0, 5);
      expect(threeQ.z).toBeCloseTo(-Math.SQRT1_2, 5);
      expect(threeQ.w).toBeCloseTo(Math.SQRT1_2, 5);
    });

    it("ODR 绕 X 轴旋转（roll）应该转换为 Three.js 绕 X 轴旋转", () => {
      // ODR 绕 X 轴旋转 90°: (sin(45°), 0, 0, cos(45°))
      const odrQ = new Quat(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      const threeQ = odrQuatToThree(odrQ);

      // Three.js 绕 X 轴旋转 90°: (sin(45°), 0, 0, cos(45°))
      expect(threeQ.x).toBeCloseTo(Math.SQRT1_2, 5);
      expect(threeQ.y).toBeCloseTo(0, 5);
      expect(threeQ.z).toBeCloseTo(0, 5);
      expect(threeQ.w).toBeCloseTo(Math.SQRT1_2, 5);
    });
  });

  describe("边界情况", () => {
    it("应该处理极大的坐标值", () => {
      const largePos = new Vec3(1e10, 1e10, 1e10);
      const threePos = odrPositionToThree(largePos);

      expect(threePos.x).toBeCloseTo(1e10);
      expect(threePos.y).toBeCloseTo(1e10);
      expect(threePos.z).toBeCloseTo(-1e10);
    });

    it("应该处理极小的坐标值", () => {
      const smallPos = new Vec3(1e-10, 1e-10, 1e-10);
      const threePos = odrPositionToThree(smallPos);

      expect(threePos.x).toBeCloseTo(1e-10, 15);
      expect(threePos.y).toBeCloseTo(1e-10, 15);
      expect(threePos.z).toBeCloseTo(-1e-10, 15);
    });

    it("center 为零向量时应该与无 center 结果相同", () => {
      const pos = new Vec3(10, 20, 1);
      const zeroCenter = new Vec3(0, 0, 0);

      const withoutCenter = odrPositionToThree(pos);
      const withZeroCenter = odrPositionToThree(pos, zeroCenter);

      expect(withZeroCenter.x).toBeCloseTo(withoutCenter.x);
      expect(withZeroCenter.y).toBeCloseTo(withoutCenter.y);
      expect(withZeroCenter.z).toBeCloseTo(withoutCenter.z);
    });
  });
});
