use wasm_bindgen::prelude::*;

use crate::odr::models::{
    lane::{lane_offset::OdrLaneOffset, lane_section::OdrLaneSection},
    road::{
        road_elevation::OdrRoadElevation, road_geometry::OdrRoadGeometry, road_link::OdrRoadLink,
        road_type::OdrRoadType, traffic_rule::OdrTrafficRule,
    },
};

pub mod road_elevation;
pub mod road_geometry;
pub mod road_link;
pub mod road_type;
pub mod traffic_rule;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoad {
    #[wasm_bindgen(getter_with_clone)]
    pub id: String,

    #[wasm_bindgen(getter_with_clone)]
    pub junction: String,

    pub length: f64,

    #[wasm_bindgen(getter_with_clone)]
    pub name: Option<String>,

    #[wasm_bindgen(getter_with_clone, js_name = "trafficRule")]
    pub traffic_rule: OdrTrafficRule,

    #[wasm_bindgen(getter_with_clone)]
    pub predecessor: Option<OdrRoadLink>,

    #[wasm_bindgen(getter_with_clone)]
    pub successor: Option<OdrRoadLink>,

    #[wasm_bindgen(getter_with_clone, js_name = "roadTypes")]
    pub road_types: Vec<OdrRoadType>,

    #[wasm_bindgen(getter_with_clone, js_name = "planView")]
    pub plan_view: Vec<OdrRoadGeometry>,

    #[wasm_bindgen(getter_with_clone, js_name = "elevations")]
    pub elevations: Vec<OdrRoadElevation>,

    #[wasm_bindgen(getter_with_clone)]
    pub lanes: Vec<OdrLaneSection>,

    #[wasm_bindgen(getter_with_clone)]
    pub lane_offsets: Vec<OdrLaneOffset>,
}

#[wasm_bindgen]
impl OdrRoad {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        length: f64,
        junction: String,
        name: Option<String>,
        traffic_rule: Option<OdrTrafficRule>,
        road_types: Option<Vec<OdrRoadType>>,
        plan_view: Option<Vec<OdrRoadGeometry>>,
        elevations: Option<Vec<OdrRoadElevation>>,
        predecessor: Option<OdrRoadLink>,
        successor: Option<OdrRoadLink>,
        lanes: Vec<OdrLaneSection>,
        lane_offsets: Vec<OdrLaneOffset>,
    ) -> Self {
        Self {
            id,
            length,
            junction,
            name: name,
            traffic_rule: traffic_rule.unwrap_or_default(),
            plan_view: plan_view.unwrap_or_default(),
            road_types: road_types.unwrap_or_default(),
            elevations: elevations.unwrap_or_default(),
            predecessor: predecessor,
            successor: successor,
            lanes: lanes,
            lane_offsets: lane_offsets,
        }
    }
}
