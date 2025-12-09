use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrJunctionType {
    /// 默认类型，普通路口，车道可以重叠且交通可以交叉
    Default = "default",
    /// 直接连接，车道可以重叠用于分流或合流，但交通不会交叉
    Direct = "direct",
    /// 虚拟交叉口，例如通往停车场的小路和入口
    Virtual = "virtual",
    /// 未连接的交叉口，例如铁路或人行横道
    Crossing = "crossing",
}

/// Junction 定义
///
/// 在 OpenDRIVE 中，junction 用于连接多条道路
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrJunction {
    /// Junction ID
    #[wasm_bindgen(getter_with_clone)]
    pub id: String,

    /// Junction 名称（可选）
    #[wasm_bindgen(getter_with_clone)]
    pub name: Option<String>,

    /// Junction 类型
    #[wasm_bindgen(getter_with_clone)]
    pub junction_type: OdrJunctionType,
}

#[wasm_bindgen]
impl OdrJunction {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, name: Option<String>, junction_type: OdrJunctionType) -> Self {
        Self {
            id,
            name,
            junction_type,
        }
    }
}