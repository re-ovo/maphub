use wasm_bindgen::prelude::*;

use super::vec3::Vec3;

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, PartialEq, Default)]
pub struct Quat {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub w: f64,
}

#[wasm_bindgen]
impl Quat {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, z: f64, w: f64) -> Self {
        Self { x, y, z, w }
    }

    /// 创建单位四元数（无旋转）
    pub fn identity() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
        }
    }

    /// 从轴角创建四元数
    /// axis: 旋转轴（需要是单位向量）
    /// angle: 旋转角度（弧度）
    pub fn from_axis_angle(axis: &Vec3, angle: f64) -> Self {
        let half_angle = angle * 0.5;
        let s = half_angle.sin();
        Self {
            x: axis.x * s,
            y: axis.y * s,
            z: axis.z * s,
            w: half_angle.cos(),
        }
    }

    /// 从 HPR 角创建四元数（XYZ 顺序）
    /// heading: 绕 Z 轴旋转（弧度）
    /// pitch: 绕 Y 轴旋转（弧度）
    /// roll: 绕 X 轴旋转（弧度）
    pub fn from_hpr(heading: f64, pitch: f64, roll: f64) -> Self {
        let half_roll = roll * 0.5;
        let half_pitch = pitch * 0.5;
        let half_heading = heading * 0.5;

        let cr = half_roll.cos();
        let sr = half_roll.sin();
        let cp = half_pitch.cos();
        let sp = half_pitch.sin();
        let ch = half_heading.cos();
        let sh = half_heading.sin();

        Self {
            x: sr * cp * ch - cr * sp * sh,
            y: cr * sp * ch + sr * cp * sh,
            z: cr * cp * sh - sr * sp * ch,
            w: cr * cp * ch + sr * sp * sh,
        }
    }

    /// 计算四元数的模长
    #[wasm_bindgen(getter)]
    pub fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z + self.w * self.w).sqrt()
    }

    /// 归一化四元数
    pub fn normalize(&self) -> Self {
        let len = self.length();
        if len == 0.0 {
            return Self::identity();
        }
        Self {
            x: self.x / len,
            y: self.y / len,
            z: self.z / len,
            w: self.w / len,
        }
    }

    /// 四元数共轭
    pub fn conjugate(&self) -> Self {
        Self {
            x: -self.x,
            y: -self.y,
            z: -self.z,
            w: self.w,
        }
    }

    /// 四元数逆
    pub fn inverse(&self) -> Self {
        let len_sq = self.x * self.x + self.y * self.y + self.z * self.z + self.w * self.w;
        if len_sq == 0.0 {
            return Self::identity();
        }
        let inv_len_sq = 1.0 / len_sq;
        Self {
            x: -self.x * inv_len_sq,
            y: -self.y * inv_len_sq,
            z: -self.z * inv_len_sq,
            w: self.w * inv_len_sq,
        }
    }

    /// 四元数乘法
    pub fn mul(&self, other: &Self) -> Self {
        Self {
            x: self.w * other.x + self.x * other.w + self.y * other.z - self.z * other.y,
            y: self.w * other.y - self.x * other.z + self.y * other.w + self.z * other.x,
            z: self.w * other.z + self.x * other.y - self.y * other.x + self.z * other.w,
            w: self.w * other.w - self.x * other.x - self.y * other.y - self.z * other.z,
        }
    }

    /// 点积
    pub fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z + self.w * other.w
    }

    /// 使用四元数旋转向量
    pub fn rotate_vector(&self, v: &Vec3) -> Vec3 {
        let qv = Self {
            x: v.x,
            y: v.y,
            z: v.z,
            w: 0.0,
        };
        let result = self.mul(&qv).mul(&self.conjugate());
        Vec3::new(result.x, result.y, result.z)
    }

}

impl std::ops::Mul for Quat {
    type Output = Self;

    fn mul(self, other: Self) -> Self {
        Self {
            x: self.w * other.x + self.x * other.w + self.y * other.z - self.z * other.y,
            y: self.w * other.y - self.x * other.z + self.y * other.w + self.z * other.x,
            z: self.w * other.z + self.x * other.y - self.y * other.x + self.z * other.w,
            w: self.w * other.w - self.x * other.x - self.y * other.y - self.z * other.z,
        }
    }
}

impl std::ops::Mul<f64> for Quat {
    type Output = Self;

    fn mul(self, scalar: f64) -> Self {
        Self {
            x: self.x * scalar,
            y: self.y * scalar,
            z: self.z * scalar,
            w: self.w * scalar,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new() {
        let q = Quat::new(1.0, 2.0, 3.0, 4.0);
        assert_eq!(q.x, 1.0);
        assert_eq!(q.y, 2.0);
        assert_eq!(q.z, 3.0);
        assert_eq!(q.w, 4.0);
    }

    #[test]
    fn test_identity() {
        let q = Quat::identity();
        assert_eq!(q.x, 0.0);
        assert_eq!(q.y, 0.0);
        assert_eq!(q.z, 0.0);
        assert_eq!(q.w, 1.0);
    }

    #[test]
    fn test_length() {
        let q = Quat::new(1.0, 2.0, 2.0, 2.0);
        // sqrt(1 + 4 + 4 + 4) = sqrt(13) ≈ 3.606
        assert!((q.length() - 13.0_f64.sqrt()).abs() < 1e-10);

        let q_identity = Quat::identity();
        assert_eq!(q_identity.length(), 1.0);

        let q2 = Quat::new(0.0, 3.0, 0.0, 4.0);
        assert_eq!(q2.length(), 5.0); // sqrt(9 + 16) = 5
    }

    #[test]
    fn test_normalize() {
        let q = Quat::new(0.0, 3.0, 0.0, 4.0);
        let normalized = q.normalize();
        assert!((normalized.length() - 1.0).abs() < 1e-10);
        assert_eq!(normalized.x, 0.0);
        assert_eq!(normalized.y, 0.6); // 3/5
        assert_eq!(normalized.z, 0.0);
        assert_eq!(normalized.w, 0.8); // 4/5
    }

    #[test]
    fn test_conjugate() {
        let q = Quat::new(1.0, 2.0, 3.0, 4.0);
        let conj = q.conjugate();
        assert_eq!(conj.x, -1.0);
        assert_eq!(conj.y, -2.0);
        assert_eq!(conj.z, -3.0);
        assert_eq!(conj.w, 4.0);
    }

    #[test]
    fn test_inverse() {
        let q = Quat::new(1.0, 2.0, 2.0, 2.0);
        let inv = q.inverse();
        let product = q.mul(&inv);
        assert!((product.x - 0.0).abs() < 1e-10);
        assert!((product.y - 0.0).abs() < 1e-10);
        assert!((product.z - 0.0).abs() < 1e-10);
        assert!((product.w - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_mul() {
        let q1 = Quat::identity();
        let q2 = Quat::new(1.0, 2.0, 3.0, 4.0);
        let result = q1.mul(&q2);
        assert_eq!(result.x, q2.x);
        assert_eq!(result.y, q2.y);
        assert_eq!(result.z, q2.z);
        assert_eq!(result.w, q2.w);
    }

    #[test]
    fn test_dot() {
        let q1 = Quat::new(1.0, 2.0, 3.0, 4.0);
        let q2 = Quat::new(5.0, 6.0, 7.0, 8.0);
        let dot = q1.dot(&q2);
        assert_eq!(dot, 70.0); // 1*5 + 2*6 + 3*7 + 4*8 = 70
    }

    #[test]
    fn test_from_axis_angle() {
        use std::f64::consts::PI;

        // 绕 Z 轴旋转 90 度
        let axis = Vec3::new(0.0, 0.0, 1.0);
        let q = Quat::from_axis_angle(&axis, PI / 2.0);

        let v = Vec3::new(1.0, 0.0, 0.0);
        let rotated = q.rotate_vector(&v);

        assert!((rotated.x - 0.0).abs() < 1e-10);
        assert!((rotated.y - 1.0).abs() < 1e-10);
        assert!((rotated.z - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_from_hpr() {
        use std::f64::consts::PI;

        // 绕 Z 轴旋转 90 度（heading = PI/2）
        let q = Quat::from_hpr(PI / 2.0, 0.0, 0.0);

        let v = Vec3::new(1.0, 0.0, 0.0);
        let rotated = q.rotate_vector(&v);

        assert!((rotated.x - 0.0).abs() < 1e-10);
        assert!((rotated.y - 1.0).abs() < 1e-10);
        assert!((rotated.z - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_rotate_vector() {
        use std::f64::consts::PI;

        // 绕 Y 轴旋转 180 度
        let axis = Vec3::new(0.0, 1.0, 0.0);
        let q = Quat::from_axis_angle(&axis, PI);

        let v = Vec3::new(1.0, 0.0, 0.0);
        let rotated = q.rotate_vector(&v);

        assert!((rotated.x - (-1.0)).abs() < 1e-10);
        assert!((rotated.y - 0.0).abs() < 1e-10);
        assert!((rotated.z - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_operator_mul() {
        let q1 = Quat::identity();
        let q2 = Quat::new(1.0, 2.0, 3.0, 4.0);
        let result = q1 * q2;
        assert_eq!(result.x, q2.x);
        assert_eq!(result.y, q2.y);
        assert_eq!(result.z, q2.z);
        assert_eq!(result.w, q2.w);
    }

    #[test]
    fn test_scalar_mul() {
        let q = Quat::new(1.0, 2.0, 3.0, 4.0);
        let result = q * 2.0;
        assert_eq!(result.x, 2.0);
        assert_eq!(result.y, 4.0);
        assert_eq!(result.z, 6.0);
        assert_eq!(result.w, 8.0);
    }

    #[test]
    fn test_quaternion_properties() {
        let q = Quat::from_axis_angle(&Vec3::new(0.0, 1.0, 0.0), 1.0);

        // 单位四元数的长度应该为 1
        assert!((q.length() - 1.0).abs() < 1e-10);

        // q * q^(-1) = identity
        let inv = q.inverse();
        let product = q.mul(&inv);
        assert!((product.w - 1.0).abs() < 1e-10);
        assert!(product.x.abs() < 1e-10);
        assert!(product.y.abs() < 1e-10);
        assert!(product.z.abs() < 1e-10);
    }
}
