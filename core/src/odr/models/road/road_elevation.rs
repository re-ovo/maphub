use wasm_bindgen::prelude::wasm_bindgen;

/// 道路高程剖面记录
///
/// 根据 OpenDrive 规范，高程使用三次多项式定义：
/// h(ds) = a + b*ds + c*ds² + d*ds³
/// 其中 ds = s_current - s_start
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadElevation {
    /// 沿参考线的起始s坐标
    pub s: f64,

    /// 多项式系数 a（常数项，起始高程）
    pub a: f64,

    /// 多项式系数 b（一次项）
    pub b: f64,

    /// 多项式系数 c（二次项）
    pub c: f64,

    /// 多项式系数 d（三次项）
    pub d: f64,
}

#[wasm_bindgen]
impl OdrRoadElevation {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self { s, a, b, c, d }
    }
}
