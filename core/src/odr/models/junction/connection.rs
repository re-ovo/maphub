use wasm_bindgen::prelude::*;

use super::lane_link::OdrJunctionLaneLink;

/// Connection 定义
///
/// 定义 junction 中道路之间的连接关系
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrConnection {
    /// Connection ID
    #[wasm_bindgen(getter_with_clone)]
    pub id: String,

    /// 进入道路的 ID（可选，virtual junction 中可能不存在）
    #[wasm_bindgen(getter_with_clone, js_name = "incomingRoad")]
    pub incoming_road: Option<String>,

    /// 连接道路的 ID（用于 Common Junction 和 Virtual Junction）
    #[wasm_bindgen(getter_with_clone, js_name = "connectingRoad")]
    pub connecting_road: Option<String>,

    /// 链接道路的 ID（用于 Direct Junction）
    #[wasm_bindgen(getter_with_clone, js_name = "linkedRoad")]
    pub linked_road: Option<String>,

    /// 接触点：连接道路的起点或终点（可选，virtual junction 中可能不存在）
    /// - "start": 连接道路沿着 laneLink 指示的方向延伸
    /// - "end": 连接道路沿着 laneLink 相反的方向延伸
    #[wasm_bindgen(getter_with_clone, js_name = "contactPoint")]
    pub contact_point: Option<String>,

    /// 车道连接列表（内部使用，不直接暴露给 WASM）
    #[wasm_bindgen(skip)]
    pub lane_links: Vec<OdrJunctionLaneLink>,
}

#[wasm_bindgen]
impl OdrConnection {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        incoming_road: Option<String>,
        connecting_road: Option<String>,
        linked_road: Option<String>,
        contact_point: Option<String>,
    ) -> Self {
        Self {
            id,
            incoming_road,
            connecting_road,
            linked_road,
            contact_point,
            lane_links: Vec::new(),
        }
    }

    /// 添加车道连接
    #[wasm_bindgen(js_name = "addLaneLink")]
    pub fn add_lane_link(&mut self, lane_link: OdrJunctionLaneLink) {
        self.lane_links.push(lane_link);
    }

    /// 获取车道连接数量
    #[wasm_bindgen(js_name = "laneLinkCount")]
    pub fn lane_link_count(&self) -> usize {
        self.lane_links.len()
    }

    /// 获取指定索引的车道连接
    #[wasm_bindgen(js_name = "getLaneLink")]
    pub fn get_lane_link(&self, index: usize) -> Option<OdrJunctionLaneLink> {
        self.lane_links.get(index).cloned()
    }
}
