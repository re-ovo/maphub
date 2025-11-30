use wasm_bindgen::prelude::wasm_bindgen;

/// 道路横断面形状记录 (Shape)
///
/// 根据 OpenDrive 规范，shape 定义了特定横向位置 t 处的高程变化，
/// 使用三次多项式：
/// z(dt) = a + b*dt + c*dt² + d*dt³
/// 其中 dt = t_current - t_start
///
/// Shape 用于定义复杂的横断面形状，如路拱 (road crown)、
/// 道路边缘的高程变化等。与 superelevation 不同的是，shape
/// 可以在同一个 s 位置定义多个不同 t 位置的形状。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrShape {
    /// 沿参考线的起始 s 坐标
    pub s: f64,

    /// 横向起始位置 t（相对于参考线）
    pub t: f64,

    /// 多项式系数 a（常数项，起始高程偏移）
    pub a: f64,

    /// 多项式系数 b（一次项）
    pub b: f64,

    /// 多项式系数 c（二次项）
    pub c: f64,

    /// 多项式系数 d（三次项）
    pub d: f64,
}

#[wasm_bindgen]
impl OdrShape {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, t: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self { s, t, a, b, c, d }
    }

    /// 计算给定 t 位置的高程偏移
    /// dt = t_query - self.t
    pub fn evaluate(&self, t_query: f64) -> f64 {
        let dt = t_query - self.t;
        self.a + self.b * dt + self.c * dt * dt + self.d * dt * dt * dt
    }
}
