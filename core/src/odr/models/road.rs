use wasm_bindgen::prelude::*;

use crate::odr::models::road::{
    road_geometry::OdrRoadGeometry, road_type::OdrRoadType, traffic_rule::OdrTrafficRule,
};

pub mod road_geometry;
pub mod road_type;
pub mod traffic_rule;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoad {
    id: String,
    junction: String,
    length: f64,
    name: Option<String>,
    traffic_rule: OdrTrafficRule,
    road_types: Vec<OdrRoadType>,
    plan_view: Vec<OdrRoadGeometry>,
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
    ) -> Self {
        Self {
            id,
            length,
            junction,
            name: name,
            traffic_rule: traffic_rule.unwrap_or_default(),
            plan_view: plan_view.unwrap_or_default(),
            road_types: road_types.unwrap_or_default(),
        }
    }

    pub fn id(&self) -> String {
        self.id.clone()
    }

    pub fn name(&self) -> Option<String> {
        self.name.clone()
    }

    pub fn length(&self) -> f64 {
        self.length
    }

    pub fn junction(&self) -> String {
        self.junction.clone()
    }

    pub fn plan_view(&self) -> Vec<OdrRoadGeometry> {
        self.plan_view.clone()
    }

    pub fn traffic_rule(&self) -> OdrTrafficRule {
        self.traffic_rule
    }

    pub fn road_types(&self) -> Vec<OdrRoadType> {
        self.road_types.clone()
    }
}
