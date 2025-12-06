use wasm_bindgen::prelude::*;

/// OpenDrive 车道通行规则定义
///
/// 定义哪些类型的车辆可以使用该车道。
///
/// ```xml
/// <access sOffset="50.0" rule="allow">
///     <restriction type="bicycle" />
///     <restriction type="bus" />
/// </access>
/// ```
///
/// 也可以这样定义 (1.8.0版本弃用):
/// ```xml
/// <access sOffset="50.0" rule="deny" restriction="bicycle" />
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneAccess {
    /// s 坐标起始位置，相对于所属 LaneSection 的起点（单位：米）
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// 规则
    #[wasm_bindgen(getter_with_clone)]
    pub rule: Option<OdrLaneAccessRule>,

    /// 限制类型列表
    #[wasm_bindgen(getter_with_clone)]
    pub restriction: Vec<String>,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrLaneAccessRule {
    Allow = "allow",
    Deny = "deny",
}

#[wasm_bindgen]
impl OdrLaneAccess {
    #[wasm_bindgen(constructor)]
    pub fn new(s_offset: f64, restriction: Vec<String>, rule: Option<OdrLaneAccessRule>) -> Self {
        Self {
            s_offset,
            rule,
            restriction,
        }
    }
}
