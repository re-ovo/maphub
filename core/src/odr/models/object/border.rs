use wasm_bindgen::prelude::*;

use super::enums::OdrBorderType;
use super::marking::OdrCornerReference;

/// 对象边框
///
/// 对象边框是具有定义宽度的框架,例如用于描述交通岛。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrBorder {
    /// 要使用的轮廓的 ID
    #[wasm_bindgen(js_name = "outlineId")]
    pub outline_id: u32,

    /// 边框的外观类型
    #[wasm_bindgen(getter_with_clone, js_name = "borderType")]
    pub border_type: OdrBorderType,

    /// 边框宽度
    pub width: f64,

    /// 使用所有轮廓点作为边框(默认为 true)
    #[wasm_bindgen(js_name = "useCompleteOutline")]
    pub use_complete_outline: Option<bool>,

    /// 角点引用列表(当 useCompleteOutline 为 false 时使用)
    #[wasm_bindgen(getter_with_clone, js_name = "cornerReferences")]
    pub corner_references: Vec<OdrCornerReference>,
}

#[wasm_bindgen]
impl OdrBorder {
    #[wasm_bindgen(constructor)]
    pub fn new(outline_id: u32, border_type: OdrBorderType, width: f64) -> Self {
        Self {
            outline_id,
            border_type,
            width,
            use_complete_outline: None,
            corner_references: Vec::new(),
        }
    }
}
