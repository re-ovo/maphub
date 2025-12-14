use wasm_bindgen::prelude::*;

use super::enums::OdrOrientation;
use super::validity::OdrLaneValidity;

/// 对象引用
///
/// 对象引用从多条道路引用一个相同的对象。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrObjectReference {
    /// 数据库内被引用对象的唯一 ID
    #[wasm_bindgen(getter_with_clone)]
    pub id: String,

    /// s 坐标
    pub s: f64,

    /// t 坐标
    pub t: f64,

    /// 相对于道路参考线高程的 z 偏移(可选)
    #[wasm_bindgen(js_name = "zOffset")]
    pub z_offset: Option<f64>,

    /// 对象沿 s 轴的有效长度(点对象为 0.0)
    #[wasm_bindgen(js_name = "validLength")]
    pub valid_length: Option<f64>,

    /// 对象有效的方向
    #[wasm_bindgen(getter_with_clone)]
    pub orientation: OdrOrientation,

    /// 车道有效性列表
    #[wasm_bindgen(getter_with_clone)]
    pub validity: Vec<OdrLaneValidity>,
}

#[wasm_bindgen]
impl OdrObjectReference {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, s: f64, t: f64, orientation: OdrOrientation) -> Self {
        Self {
            id,
            s,
            t,
            z_offset: None,
            valid_length: None,
            orientation,
            validity: Vec::new(),
        }
    }
}
