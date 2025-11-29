use wasm_bindgen::prelude::*;

/// OpenDrive 车道规则定义
///
/// 可以为某些未在 ASAM OpenDRIVE 标准中明确定义的车道定义特殊规则，这些规则存储在所使用的应用程序中。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneRule {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点（单位：米）
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 自定义规则
    #[wasm_bindgen(getter_with_clone)]
    pub value: String,
}

#[wasm_bindgen]
impl OdrLaneRule {
    #[wasm_bindgen(constructor)]
    pub fn new(s_offset: f64, value: String) -> Self {
        Self { s_offset, value }
    }
}
