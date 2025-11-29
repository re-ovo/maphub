use wasm_bindgen::prelude::*;

use crate::odr::models::enums::OdrSpeedUnit;

/// OpenDrive 车道速度限制定义
///
/// 定义车道的速度限制，可以沿着车道在不同位置设置不同的限速。
///
/// ```xml
/// <speed sOffset="50.0" max="100.0" unit="km/h" />
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneSpeed {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点（单位：米）
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 最大速度值
    pub max: f64,

    /// 速度单位（"m/s", "mph", "km/h" 等）
    #[wasm_bindgen(getter_with_clone)]
    pub unit: Option<OdrSpeedUnit>,
}

#[wasm_bindgen]
impl OdrLaneSpeed {
    #[wasm_bindgen(constructor)]
    pub fn new(s_offset: f64, max: f64, unit: Option<OdrSpeedUnit>) -> Self {
        Self {
            s_offset,
            max,
            unit,
        }
    }
}
