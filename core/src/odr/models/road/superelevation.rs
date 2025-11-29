use wasm_bindgen::prelude::wasm_bindgen;

/// 道路超高剖面记录
///
/// 根据 OpenDrive 规范，超高（横向倾斜）使用三次多项式定义：
/// superelevation(ds) = a + b*ds + c*ds² + d*ds³
/// 其中 ds = s_current - s_start
/// 超高值通常表示为弧度，正值表示道路向右倾斜
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrSuperelevation {
    /// 沿参考线的起始s坐标
    pub s: f64,

    /// 多项式系数 a（常数项，起始超高角度）
    pub a: f64,

    /// 多项式系数 b（一次项）
    pub b: f64,

    /// 多项式系数 c（二次项）
    pub c: f64,

    /// 多项式系数 d（三次项）
    pub d: f64,
}

#[wasm_bindgen]
impl OdrSuperelevation {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self { s, a, b, c, d }
    }
}

#[wasm_bindgen]
impl OdrSuperelevation {
    /// 计算指定位置的超高值
    ///
    /// # 参数
    /// * `s_current` - 当前沿参考线的位置
    ///
    /// # 返回
    /// 计算得到的超高角度（弧度）
    #[wasm_bindgen(js_name = "getSuperelevation")]
    pub fn get_superelevation(&self, s_current: f64) -> f64 {
        let ds = s_current - self.s;
        self.a + self.b * ds + self.c * ds.powi(2) + self.d * ds.powi(3)
    }
}
