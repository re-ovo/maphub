use wasm_bindgen::prelude::*;

use crate::odr::models::junction::connection::OdrConnection;
use crate::odr::models::junction::priority::OdrJunctionPriority;

pub mod connection;
pub mod lane_link;
pub mod priority;

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
    #[wasm_bindgen(getter_with_clone, js_name = "junctionType")]
    pub junction_type: OdrJunctionType,

    /// 主道路 ID（仅用于 Virtual Junction）
    #[wasm_bindgen(getter_with_clone, js_name = "mainRoad")]
    pub main_road: Option<String>,

    /// 主道路起点的 s 坐标（仅用于 Virtual Junction）
    #[wasm_bindgen(getter_with_clone, js_name = "sStart")]
    pub s_start: Option<f64>,

    /// 主道路终点的 s 坐标（仅用于 Virtual Junction）
    #[wasm_bindgen(getter_with_clone, js_name = "sEnd")]
    pub s_end: Option<f64>,

    /// 方向（仅用于 Virtual Junction）："+" 或 "-"
    #[wasm_bindgen(getter_with_clone)]
    pub orientation: Option<String>,

    /// 连接列表（内部使用，不直接暴露给 WASM）
    #[wasm_bindgen(getter_with_clone)]
    pub connections: Vec<OdrConnection>,

    /// 优先级列表
    #[wasm_bindgen(getter_with_clone)]
    pub priorities: Vec<OdrJunctionPriority>,
}

#[wasm_bindgen]
impl OdrJunction {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, name: Option<String>, junction_type: OdrJunctionType) -> Self {
        Self {
            id,
            name,
            junction_type,
            main_road: None,
            s_start: None,
            s_end: None,
            orientation: None,
            connections: Vec::new(),
            priorities: Vec::new(),
        }
    }

    pub fn add_connection(&mut self, connection: OdrConnection) {
        self.connections.push(connection);
    }

    pub fn set_virtual_junction_props(&mut self, main_road: String, s_start: f64, s_end: f64, orientation: String) {
        self.main_road = Some(main_road);
        self.s_start = Some(s_start);
        self.s_end = Some(s_end);
        self.orientation = Some(orientation);
    }
}
