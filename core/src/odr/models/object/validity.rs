use wasm_bindgen::prelude::*;

/// 车道有效性
///
/// 车道有效性将信号和对象限制在特定车道。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneValidity {
    /// 对象有效的最小车道 ID
    #[wasm_bindgen(js_name = "fromLane")]
    pub from_lane: i32,

    /// 对象有效的最大车道 ID
    #[wasm_bindgen(js_name = "toLane")]
    pub to_lane: i32,
}

#[wasm_bindgen]
impl OdrLaneValidity {
    #[wasm_bindgen(constructor)]
    pub fn new(from_lane: i32, to_lane: i32) -> Self {
        Self { from_lane, to_lane }
    }
}
