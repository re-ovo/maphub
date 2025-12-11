use wasm_bindgen::prelude::*;

/// Priority 定义
///
/// 定义 junction 中道路的优先级关系
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrJunctionPriority {
    /// 高优先级道路 ID
    #[wasm_bindgen(getter_with_clone)]
    pub high: String,

    /// 低优先级道路 ID
    #[wasm_bindgen(getter_with_clone)]
    pub low: String,
}

#[wasm_bindgen]
impl OdrJunctionPriority {
    #[wasm_bindgen(constructor)]
    pub fn new(high: String, low: String) -> Self {
        Self { high, low }
    }
}
