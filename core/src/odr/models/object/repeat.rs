use wasm_bindgen::prelude::*;

/// 重复对象
///
/// 为避免冗长的 XML 代码,可以重复相同类型的对象。
/// 主要用于描述栏杆、栏杆柱和路灯。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrObjectRepeat {
    /// 起始位置的 s 坐标,覆盖原始 object 记录中的对应参数
    pub s: f64,

    /// 重复区域的长度,沿 s 方向
    pub length: f64,

    /// 两个对象实例之间的距离;如果为 0,则对象被视为连续特征
    pub distance: f64,

    /// 在 s 处对象参考点的横向偏移
    #[wasm_bindgen(js_name = "tStart")]
    pub t_start: f64,

    /// 在 s + length 处对象参考点的横向偏移
    #[wasm_bindgen(js_name = "tEnd")]
    pub t_end: f64,

    /// 在 s 处的对象高度
    #[wasm_bindgen(js_name = "heightStart")]
    pub height_start: f64,

    /// 在 s + length 处的对象高度
    #[wasm_bindgen(js_name = "heightEnd")]
    pub height_end: f64,

    /// 在 s 处的对象长度(可选)
    #[wasm_bindgen(js_name = "lengthStart")]
    pub length_start: Option<f64>,

    /// 在 s + length 处的对象长度(可选)
    #[wasm_bindgen(js_name = "lengthEnd")]
    pub length_end: Option<f64>,

    /// 在 s 处的对象宽度(可选)
    #[wasm_bindgen(js_name = "widthStart")]
    pub width_start: Option<f64>,

    /// 在 s + length 处的对象宽度(可选)
    #[wasm_bindgen(js_name = "widthEnd")]
    pub width_end: Option<f64>,

    /// 在 s 处的对象半径(可选)
    #[wasm_bindgen(js_name = "radiusStart")]
    pub radius_start: Option<f64>,

    /// 在 s + length 处的对象半径(可选)
    #[wasm_bindgen(js_name = "radiusEnd")]
    pub radius_end: Option<f64>,

    /// 在 s 处相对于道路参考线高程的 z 偏移
    #[wasm_bindgen(js_name = "zOffsetStart")]
    pub z_offset_start: f64,

    /// 在 s + length 处相对于道路参考线高程的 z 偏移
    #[wasm_bindgen(js_name = "zOffsetEnd")]
    pub z_offset_end: f64,

    /// 如果为 true,起点和终点以直线连接,不跟随道路参考线
    #[wasm_bindgen(js_name = "detachFromReferenceLine")]
    pub detach_from_reference_line: Option<bool>,
}

#[wasm_bindgen]
impl OdrObjectRepeat {
    #[wasm_bindgen(constructor)]
    pub fn new(
        s: f64,
        length: f64,
        distance: f64,
        t_start: f64,
        t_end: f64,
        height_start: f64,
        height_end: f64,
        z_offset_start: f64,
        z_offset_end: f64,
    ) -> Self {
        Self {
            s,
            length,
            distance,
            t_start,
            t_end,
            height_start,
            height_end,
            length_start: None,
            length_end: None,
            width_start: None,
            width_end: None,
            radius_start: None,
            radius_end: None,
            z_offset_start,
            z_offset_end,
            detach_from_reference_line: None,
        }
    }
}
