use wasm_bindgen::prelude::*;

/// OpenDrive 车道偏移量
///
/// 使用三次多项式定义车道相对于道路参考线的横向偏移：
/// ```text
/// offset(ds) = a + b*ds + c*ds² + d*ds³
/// ```
/// 其中 `ds = s - s_start`
///
/// # 字段说明
/// - `s`: 起始s坐标
/// - `a`: 三次多项式常数项
/// - `b`: 三次多项式一次项系数
/// - `c`: 三次多项式二次项系数
/// - `d`: 三次多项式三次项系数
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneOffset {
    pub s: f64,
    pub a: f64,
    pub b: f64,
    pub c: f64,
    pub d: f64,
}

#[wasm_bindgen]
impl OdrLaneOffset {
    /// 创建新的车道偏移量实例
    ///
    /// # 参数
    /// - `s`: 起始s坐标
    /// - `a`: 常数项
    /// - `b`: 一次项系数
    /// - `c`: 二次项系数
    /// - `d`: 三次项系数
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self { s, a, b, c, d }
    }
}
