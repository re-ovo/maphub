use wasm_bindgen::prelude::*;

/// OpenDrive 车道宽度定义
///
/// 使用三次多项式定义车道宽度随距离的变化：
/// `width(ds) = a + b*ds + c*ds² + d*ds³`
/// 其中 `ds = s - s_offset`
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneWidth {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点（单位：米）
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 多项式常数项
    pub a: f64,

    /// 多项式一次项系数
    pub b: f64,

    /// 多项式二次项系数
    pub c: f64,

    /// 多项式三次项系数
    pub d: f64,
}

#[wasm_bindgen]
impl OdrLaneWidth {
    #[wasm_bindgen(constructor)]
    pub fn new(s_offset: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self {
            s_offset,
            a,
            b,
            c,
            d,
        }
    }

    /// 计算当前 width 在 local_ds 处的多项式值
    ///
    /// # 参数
    /// * `local_ds` - 相对于当前 width 起点的距离 (ds - s_offset)
    pub fn eval(&self, local_ds: f64) -> f64 {
        self.a + self.b * local_ds + self.c * local_ds.powi(2) + self.d * local_ds.powi(3)
    }
}

impl OdrLaneWidth {
    /// 从 widths 列表中计算指定 ds 处的宽度值
    ///
    /// # 参数
    /// * `widths` - 宽度定义列表
    /// * `ds` - 相对于 LaneSection 起点的距离
    pub fn eval_widths(widths: &[OdrLaneWidth], ds: f64) -> f64 {
        if widths.is_empty() {
            return 0.0;
        }

        let width = widths
            .iter()
            .filter(|w| w.s_offset <= ds)
            .last()
            .unwrap_or_else(|| widths.first().unwrap());

        let local_ds = ds - width.s_offset;
        width.eval(local_ds)
    }
}

/// OpenDrive 车道边界定义
///
/// 使用三次多项式定义车道边界线相对于参考线的横向偏移：
/// `offset(ds) = a + b*ds + c*ds² + d*ds³`
/// 其中 `ds = s - s_offset`
///
/// 与 LaneWidth 不同，LaneBorder 直接定义边界线的绝对位置，
/// 而不是车道的宽度。通常用于中心车道(id=0)的边界定义。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneBorder {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 多项式常数项
    pub a: f64,

    /// 多项式一次项系数
    pub b: f64,

    /// 多项式二次项系数
    pub c: f64,

    /// 多项式三次项系数
    pub d: f64,
}

#[wasm_bindgen]
impl OdrLaneBorder {
    #[wasm_bindgen(constructor)]
    pub fn new(s_offset: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self {
            s_offset,
            a,
            b,
            c,
            d,
        }
    }
}

/// OpenDrive 车道高度定义
///
/// 车道高度用于实现小规模抬升，例如抬高人行道。
/// 车道高度是指车道在 h 方向上相对于道路（包括标高、超高、形状、横截面表面）的偏移量。
///
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneHeight {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 内侧边界高度偏移
    pub inner: f64,

    /// 外侧边界高度偏移
    pub outer: f64,
}

#[wasm_bindgen]
impl OdrLaneHeight {
    #[wasm_bindgen(constructor)]
    pub fn new(s_offset: f64, inner: f64, outer: f64) -> Self {
        Self {
            s_offset,
            inner,
            outer,
        }
    }
}
