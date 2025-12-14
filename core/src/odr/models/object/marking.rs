use wasm_bindgen::prelude::*;

use super::enums::{OdrRoadMarkColor, OdrRoadMarkWeight, OdrSideType};

/// 对象标记
///
/// 描述任何对象的道路标记,例如人行横道、停止线和停车位。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrMarking {
    /// 标记的颜色
    #[wasm_bindgen(getter_with_clone)]
    pub color: OdrRoadMarkColor,

    /// 可见部分的长度
    #[wasm_bindgen(js_name = "lineLength")]
    pub line_length: f64,

    /// 可见部分之间间隙的长度
    #[wasm_bindgen(js_name = "spaceLength")]
    pub space_length: f64,

    /// 标记的宽度(可选)
    pub width: Option<f64>,

    /// 标记的光学"权重"(可选)
    #[wasm_bindgen(getter_with_clone)]
    pub weight: Option<OdrRoadMarkWeight>,

    /// 道路标记在道路上方的高度,即道路标记的厚度(可选)
    #[wasm_bindgen(js_name = "zOffset")]
    pub z_offset: Option<f64>,

    /// 边界框边的侧面
    #[wasm_bindgen(getter_with_clone)]
    pub side: OdrSideType,

    /// 从边界框边起点到第一个标记开始的 u 方向横向偏移
    #[wasm_bindgen(js_name = "startOffset")]
    pub start_offset: f64,

    /// 从边界框边终点到标记结束的 u 方向横向偏移
    #[wasm_bindgen(js_name = "stopOffset")]
    pub stop_offset: f64,

    /// 角点引用列表
    #[wasm_bindgen(getter_with_clone, js_name = "cornerReferences")]
    pub corner_references: Vec<OdrCornerReference>,
}

#[wasm_bindgen]
impl OdrMarking {
    #[wasm_bindgen(constructor)]
    pub fn new(
        color: OdrRoadMarkColor,
        line_length: f64,
        space_length: f64,
        side: OdrSideType,
        start_offset: f64,
        stop_offset: f64,
    ) -> Self {
        Self {
            color,
            line_length,
            space_length,
            width: None,
            weight: None,
            z_offset: None,
            side,
            start_offset,
            stop_offset,
            corner_references: Vec::new(),
        }
    }
}

/// 角点引用
///
/// 通过引用现有轮廓点来指定一个点。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrCornerReference {
    /// 被引用轮廓点的标识符
    pub id: u32,
}

#[wasm_bindgen]
impl OdrCornerReference {
    #[wasm_bindgen(constructor)]
    pub fn new(id: u32) -> Self {
        Self { id }
    }
}
