use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, PartialEq, Default)]
pub struct Vec3 {
    x: f64,
    y: f64,
    z: f64,
}

#[wasm_bindgen]
impl Vec3 {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    pub fn x(&self) -> f64 {
        self.x
    }

    pub fn y(&self) -> f64 {
        self.y
    }

    pub fn z(&self) -> f64 {
        self.z
    }

    pub fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }

    pub fn normalize(&self) -> Self {
        let length = self.length();
        Self {
            x: self.x / length,
            y: self.y / length,
            z: self.z / length,
        }
    }

    pub fn add(&self, other: &Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
            z: self.z + other.z,
        }
    }

    pub fn sub(&self, other: &Self) -> Self {
        Self {
            x: self.x - other.x,
            y: self.y - other.y,
            z: self.z - other.z,
        }
    }

    pub fn mul(&self, other: &Self) -> Self {
        Self {
            x: self.x * other.x,
            y: self.y * other.y,
            z: self.z * other.z,
        }
    }

    pub fn div(&self, other: &Self) -> Self {
        Self {
            x: self.x / other.x,
            y: self.y / other.y,
            z: self.z / other.z,
        }
    }

    pub fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    pub fn cross(&self, other: &Self) -> Self {
        Self {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }
}

impl std::ops::Add for Vec3 {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self { x: self.x + other.x, y: self.y + other.y, z: self.z + other.z }
    }
}

impl std::ops::Sub for Vec3 {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Self { x: self.x - other.x, y: self.y - other.y, z: self.z - other.z }
    }
}

impl std::ops::Mul for Vec3 {
    type Output = Self;

    fn mul(self, other: Self) -> Self {
        Self { x: self.x * other.x, y: self.y * other.y, z: self.z * other.z }
    }
}

impl std::ops::Div for Vec3 {
    type Output = Self;

    fn div(self, other: Self) -> Self {
        Self { x: self.x / other.x, y: self.y / other.y, z: self.z / other.z }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new() {
        let v = Vec3::new(1.0, 2.0, 3.0);
        assert_eq!(v.x(), 1.0);
        assert_eq!(v.y(), 2.0);
        assert_eq!(v.z(), 3.0);
    }

    #[test]
    fn test_default() {
        let v = Vec3::default();
        assert_eq!(v.x(), 0.0);
        assert_eq!(v.y(), 0.0);
        assert_eq!(v.z(), 0.0);
    }

    #[test]
    fn test_length() {
        let v = Vec3::new(2.0, 3.0, 6.0);
        assert_eq!(v.length(), 7.0); // sqrt(4 + 9 + 36) = 7
        
        let v2 = Vec3::new(0.0, 0.0, 0.0);
        assert_eq!(v2.length(), 0.0);
        
        let v3 = Vec3::new(1.0, 1.0, 1.0);
        assert!((v3.length() - 1.7320508075688772).abs() < 1e-10);
    }

    #[test]
    fn test_normalize() {
        let v = Vec3::new(2.0, 3.0, 6.0);
        let normalized = v.normalize();
        assert!((normalized.x() - 2.0/7.0).abs() < 1e-10);
        assert!((normalized.y() - 3.0/7.0).abs() < 1e-10);
        assert!((normalized.z() - 6.0/7.0).abs() < 1e-10);
        assert!((normalized.length() - 1.0).abs() < 1e-10);
        
        let v2 = Vec3::new(5.0, 0.0, 0.0);
        let normalized2 = v2.normalize();
        assert_eq!(normalized2.x(), 1.0);
        assert_eq!(normalized2.y(), 0.0);
        assert_eq!(normalized2.z(), 0.0);
    }

    #[test]
    fn test_add() {
        let v1 = Vec3::new(1.0, 2.0, 3.0);
        let v2 = Vec3::new(4.0, 5.0, 6.0);
        let result = v1.add(&v2);
        assert_eq!(result.x(), 5.0);
        assert_eq!(result.y(), 7.0);
        assert_eq!(result.z(), 9.0);
    }

    #[test]
    fn test_sub() {
        let v1 = Vec3::new(7.0, 9.0, 11.0);
        let v2 = Vec3::new(3.0, 4.0, 5.0);
        let result = v1.sub(&v2);
        assert_eq!(result.x(), 4.0);
        assert_eq!(result.y(), 5.0);
        assert_eq!(result.z(), 6.0);
    }

    #[test]
    fn test_mul() {
        let v1 = Vec3::new(2.0, 3.0, 4.0);
        let v2 = Vec3::new(5.0, 6.0, 7.0);
        let result = v1.mul(&v2);
        assert_eq!(result.x(), 10.0);
        assert_eq!(result.y(), 18.0);
        assert_eq!(result.z(), 28.0);
    }

    #[test]
    fn test_div() {
        let v1 = Vec3::new(10.0, 18.0, 28.0);
        let v2 = Vec3::new(2.0, 3.0, 4.0);
        let result = v1.div(&v2);
        assert_eq!(result.x(), 5.0);
        assert_eq!(result.y(), 6.0);
        assert_eq!(result.z(), 7.0);
    }

    #[test]
    fn test_dot() {
        let v1 = Vec3::new(1.0, 2.0, 3.0);
        let v2 = Vec3::new(4.0, 5.0, 6.0);
        let result = v1.dot(&v2);
        assert_eq!(result, 32.0); // 1*4 + 2*5 + 3*6 = 32
        
        // 测试垂直向量（点积为0）
        let v3 = Vec3::new(1.0, 0.0, 0.0);
        let v4 = Vec3::new(0.0, 1.0, 0.0);
        assert_eq!(v3.dot(&v4), 0.0);
    }

    #[test]
    fn test_cross() {
        // 测试标准基向量
        let v1 = Vec3::new(1.0, 0.0, 0.0);
        let v2 = Vec3::new(0.0, 1.0, 0.0);
        let result = v1.cross(&v2);
        assert_eq!(result.x(), 0.0);
        assert_eq!(result.y(), 0.0);
        assert_eq!(result.z(), 1.0);
        
        // 测试一般向量
        let v3 = Vec3::new(1.0, 2.0, 3.0);
        let v4 = Vec3::new(4.0, 5.0, 6.0);
        let result2 = v3.cross(&v4);
        assert_eq!(result2.x(), -3.0);  // 2*6 - 3*5 = -3
        assert_eq!(result2.y(), 6.0);   // 3*4 - 1*6 = 6
        assert_eq!(result2.z(), -3.0);  // 1*5 - 2*4 = -3
        
        // 测试平行向量（叉积为零向量）
        let v5 = Vec3::new(2.0, 4.0, 6.0);
        let v6 = Vec3::new(1.0, 2.0, 3.0);
        let result3 = v5.cross(&v6);
        assert_eq!(result3.x(), 0.0);
        assert_eq!(result3.y(), 0.0);
        assert_eq!(result3.z(), 0.0);
    }

    #[test]
    fn test_operator_add() {
        let v1 = Vec3::new(1.0, 2.0, 3.0);
        let v2 = Vec3::new(4.0, 5.0, 6.0);
        let result = v1 + v2;
        assert_eq!(result.x(), 5.0);
        assert_eq!(result.y(), 7.0);
        assert_eq!(result.z(), 9.0);
    }

    #[test]
    fn test_operator_sub() {
        let v1 = Vec3::new(7.0, 9.0, 11.0);
        let v2 = Vec3::new(3.0, 4.0, 5.0);
        let result = v1 - v2;
        assert_eq!(result.x(), 4.0);
        assert_eq!(result.y(), 5.0);
        assert_eq!(result.z(), 6.0);
    }

    #[test]
    fn test_operator_mul() {
        let v1 = Vec3::new(2.0, 3.0, 4.0);
        let v2 = Vec3::new(5.0, 6.0, 7.0);
        let result = v1 * v2;
        assert_eq!(result.x(), 10.0);
        assert_eq!(result.y(), 18.0);
        assert_eq!(result.z(), 28.0);
    }

    #[test]
    fn test_operator_div() {
        let v1 = Vec3::new(10.0, 18.0, 28.0);
        let v2 = Vec3::new(2.0, 3.0, 4.0);
        let result = v1 / v2;
        assert_eq!(result.x(), 5.0);
        assert_eq!(result.y(), 6.0);
        assert_eq!(result.z(), 7.0);
    }

    #[test]
    fn test_clone_and_copy() {
        let v1 = Vec3::new(1.0, 2.0, 3.0);
        let v2 = v1; // Copy
        let v3 = v1.clone(); // Clone
        assert_eq!(v1, v2);
        assert_eq!(v1, v3);
    }

    #[test]
    fn test_negative_values() {
        let v1 = Vec3::new(-1.0, -2.0, -3.0);
        let v2 = Vec3::new(1.0, 2.0, 3.0);
        let result = v1.add(&v2);
        assert_eq!(result.x(), 0.0);
        assert_eq!(result.y(), 0.0);
        assert_eq!(result.z(), 0.0);
    }

    #[test]
    fn test_cross_product_properties() {
        let v1 = Vec3::new(1.0, 2.0, 3.0);
        let v2 = Vec3::new(4.0, 5.0, 6.0);
        
        // 叉积结果与两个输入向量都垂直
        let cross_result = v1.cross(&v2);
        assert!((v1.dot(&cross_result)).abs() < 1e-10);
        assert!((v2.dot(&cross_result)).abs() < 1e-10);
        
        // 反交换律：v1 × v2 = -(v2 × v1)
        let cross_reverse = v2.cross(&v1);
        assert_eq!(cross_result.x(), -cross_reverse.x());
        assert_eq!(cross_result.y(), -cross_reverse.y());
        assert_eq!(cross_result.z(), -cross_reverse.z());
    }
}