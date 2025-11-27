use wasm_bindgen::prelude::*;

/// 道路类型
/// s: 道路类型在道路上的位置
/// road_type: 道路类型
/// country: 国家代码
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadType {
    #[wasm_bindgen(js_name = "s")]
    pub s: f64,
    #[wasm_bindgen(js_name = "roadType", getter_with_clone)]
    pub road_type: String,
    #[wasm_bindgen(js_name = "country", getter_with_clone)]
    pub country: Option<String>,
}

#[wasm_bindgen]
impl OdrRoadType {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, road_type: String, country: Option<String>) -> Self {
        Self {
            s,
            road_type,
            country,
        }
    }
}
