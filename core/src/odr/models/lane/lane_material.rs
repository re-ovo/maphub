use wasm_bindgen::prelude::*;

/// OpenDrive 车道材质定义
///
/// 定义路面材质属性，包括表面类型、摩擦系数和粗糙度。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneMaterial {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点（单位：米）
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 摩擦系数（通常范围 0.0 到 1.0+）
    pub friction: f64,

    /// 材质表面代码
    #[wasm_bindgen(getter_with_clone)]
    pub surface: Option<String>,

    /// 粗糙度
    pub roughness: Option<f64>,
}

#[wasm_bindgen]
impl OdrLaneMaterial {
    #[wasm_bindgen(constructor)]
    pub fn new(
        s_offset: f64,
        friction: f64,
        surface: Option<String>,
        roughness: Option<f64>,
    ) -> Self {
        Self {
            s_offset,
            surface,
            friction,
            roughness,
        }
    }
}
