use wasm_bindgen::prelude::*;

use crate::models::road::{road_geometry::RoadGeometry, road_type::RoadType, traffic_rule::TrafficRule};

pub mod road_type;
pub mod traffic_rule;
pub mod road_geometry;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Road {
    id: String,
    junction: String,
    length: f64,
    name: Option<String>,
    traffic_rule: TrafficRule,
    road_types: Vec<RoadType>,
    plan_view: Vec<RoadGeometry>,
}

#[wasm_bindgen]
impl Road {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        length: f64,
        junction: String,
        name: Option<String>,
        traffic_rule: Option<TrafficRule>,
        road_types: Option<Vec<RoadType>>,
        plan_view: Option<Vec<RoadGeometry>>,
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

    pub fn plan_view(&self) -> Vec<RoadGeometry> {
        self.plan_view.clone()
    }

    pub fn traffic_rule(&self) -> TrafficRule {
        self.traffic_rule
    }

    pub fn road_types(&self) -> Vec<RoadType> {
        self.road_types.clone()
    }
}
