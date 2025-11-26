use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, PartialEq, Default)]
pub struct Vec2 {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl Vec2 {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    pub fn x(&self) -> f64 {
        self.x
    }

    pub fn y(&self) -> f64 {
        self.y
    }

    pub fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    pub fn normalize(&self) -> Self {
        let length = self.length();
        Self {
            x: self.x / length,
            y: self.y / length,
        }
    }

    pub fn add(&self, other: &Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }

    pub fn sub(&self, other: &Self) -> Self {
        Self {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }

    pub fn mul(&self, other: &Self) -> Self {
        Self {
            x: self.x * other.x,
            y: self.y * other.y,
        }
    }

    pub fn div(&self, other: &Self) -> Self {
        Self {
            x: self.x / other.x,
            y: self.y / other.y,
        }
    }

    pub fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y
    }

    pub fn cross(&self, other: &Self) -> f64 {
        self.x * other.y - self.y * other.x
    }
}

impl std::ops::Add for Vec2 {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self { x: self.x + other.x, y: self.y + other.y }
    }
}


impl std::ops::Sub for Vec2 {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Self { x: self.x - other.x, y: self.y - other.y }
    }
}

impl std::ops::Mul for Vec2 {
    type Output = Self;

    fn mul(self, other: Self) -> Self {
        Self { x: self.x * other.x, y: self.y * other.y }
    }
}

impl std::ops::Div for Vec2 {
    type Output = Self;

    fn div(self, other: Self) -> Self {
        Self { x: self.x / other.x, y: self.y / other.y }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new() {
        let v = Vec2::new(3.0, 4.0);
        assert_eq!(v.x(), 3.0);
        assert_eq!(v.y(), 4.0);
    }

    #[test]
    fn test_default() {
        let v = Vec2::default();
        assert_eq!(v.x(), 0.0);
        assert_eq!(v.y(), 0.0);
    }

    #[test]
    fn test_length() {
        let v = Vec2::new(3.0, 4.0);
        assert_eq!(v.length(), 5.0);
        
        let v2 = Vec2::new(0.0, 0.0);
        assert_eq!(v2.length(), 0.0);
        
        let v3 = Vec2::new(1.0, 1.0);
        assert!((v3.length() - 1.4142135623730951).abs() < 1e-10);
    }

    #[test]
    fn test_normalize() {
        let v = Vec2::new(3.0, 4.0);
        let normalized = v.normalize();
        assert_eq!(normalized.x(), 0.6);
        assert_eq!(normalized.y(), 0.8);
        assert!((normalized.length() - 1.0).abs() < 1e-10);
        
        let v2 = Vec2::new(5.0, 0.0);
        let normalized2 = v2.normalize();
        assert_eq!(normalized2.x(), 1.0);
        assert_eq!(normalized2.y(), 0.0);
    }

    #[test]
    fn test_add() {
        let v1 = Vec2::new(1.0, 2.0);
        let v2 = Vec2::new(3.0, 4.0);
        let result = v1.add(&v2);
        assert_eq!(result.x(), 4.0);
        assert_eq!(result.y(), 6.0);
    }

    #[test]
    fn test_sub() {
        let v1 = Vec2::new(5.0, 7.0);
        let v2 = Vec2::new(2.0, 3.0);
        let result = v1.sub(&v2);
        assert_eq!(result.x(), 3.0);
        assert_eq!(result.y(), 4.0);
    }

    #[test]
    fn test_mul() {
        let v1 = Vec2::new(2.0, 3.0);
        let v2 = Vec2::new(4.0, 5.0);
        let result = v1.mul(&v2);
        assert_eq!(result.x(), 8.0);
        assert_eq!(result.y(), 15.0);
    }

    #[test]
    fn test_div() {
        let v1 = Vec2::new(8.0, 15.0);
        let v2 = Vec2::new(2.0, 3.0);
        let result = v1.div(&v2);
        assert_eq!(result.x(), 4.0);
        assert_eq!(result.y(), 5.0);
    }

    #[test]
    fn test_dot() {
        let v1 = Vec2::new(1.0, 2.0);
        let v2 = Vec2::new(3.0, 4.0);
        let result = v1.dot(&v2);
        assert_eq!(result, 11.0); // 1*3 + 2*4 = 11
        
        // 测试垂直向量（点积为0）
        let v3 = Vec2::new(1.0, 0.0);
        let v4 = Vec2::new(0.0, 1.0);
        assert_eq!(v3.dot(&v4), 0.0);
    }

    #[test]
    fn test_cross() {
        let v1 = Vec2::new(1.0, 2.0);
        let v2 = Vec2::new(3.0, 4.0);
        let result = v1.cross(&v2);
        assert_eq!(result, -2.0); // 1*4 - 2*3 = -2
        
        // 测试平行向量（叉积为0）
        let v3 = Vec2::new(2.0, 4.0);
        let v4 = Vec2::new(1.0, 2.0);
        assert_eq!(v3.cross(&v4), 0.0);
    }

    #[test]
    fn test_operator_add() {
        let v1 = Vec2::new(1.0, 2.0);
        let v2 = Vec2::new(3.0, 4.0);
        let result = v1 + v2;
        assert_eq!(result.x(), 4.0);
        assert_eq!(result.y(), 6.0);
    }

    #[test]
    fn test_operator_sub() {
        let v1 = Vec2::new(5.0, 7.0);
        let v2 = Vec2::new(2.0, 3.0);
        let result = v1 - v2;
        assert_eq!(result.x(), 3.0);
        assert_eq!(result.y(), 4.0);
    }

    #[test]
    fn test_operator_mul() {
        let v1 = Vec2::new(2.0, 3.0);
        let v2 = Vec2::new(4.0, 5.0);
        let result = v1 * v2;
        assert_eq!(result.x(), 8.0);
        assert_eq!(result.y(), 15.0);
    }

    #[test]
    fn test_operator_div() {
        let v1 = Vec2::new(8.0, 15.0);
        let v2 = Vec2::new(2.0, 3.0);
        let result = v1 / v2;
        assert_eq!(result.x(), 4.0);
        assert_eq!(result.y(), 5.0);
    }

    #[test]
    fn test_clone_and_copy() {
        let v1 = Vec2::new(1.0, 2.0);
        let v2 = v1; // Copy
        let v3 = v1.clone(); // Clone
        assert_eq!(v1, v2);
        assert_eq!(v1, v3);
    }

    #[test]
    fn test_negative_values() {
        let v1 = Vec2::new(-1.0, -2.0);
        let v2 = Vec2::new(1.0, 2.0);
        let result = v1.add(&v2);
        assert_eq!(result.x(), 0.0);
        assert_eq!(result.y(), 0.0);
    }
}