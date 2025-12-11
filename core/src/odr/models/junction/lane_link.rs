use wasm_bindgen::prelude::*;

/// 车道连接定义
///
/// 定义 junction 中进入道路和连接道路之间的车道映射关系
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrJunctionLaneLink {
    /// 进入道路的车道 ID
    pub from: i32,

    /// 连接道路的车道 ID
    pub to: i32,

    /// 重叠区域的长度（单位：米）
    /// 仅用于 Direct Junction，定义两条重叠车道共享空间的区域长度
    #[wasm_bindgen(getter_with_clone, js_name = "overlapZone")]
    pub overlap_zone: Option<f64>,
}

#[wasm_bindgen]
impl OdrJunctionLaneLink {
    #[wasm_bindgen(constructor)]
    pub fn new(from: i32, to: i32, overlap_zone: Option<f64>) -> Self {
        Self {
            from,
            to,
            overlap_zone,
        }
    }
}
