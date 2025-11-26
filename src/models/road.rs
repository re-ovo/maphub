use wasm_bindgen::prelude::*;

use crate::models::geometry::RoadGeometry;

type PlanView = Vec<RoadGeometry>;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug)]
pub enum TrafficRule {
    LHT,
    RHT,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Road {
    id: String,
    name: String,
    length: f64,
    junction: String,
    plan_view: PlanView,
    traffic_rule: TrafficRule,
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
    ) -> Self {
        Self {
            id,
            length,
            junction,
            name: name.unwrap_or_default(),
            traffic_rule: traffic_rule.unwrap_or_default(),
            plan_view: Vec::new(),
        }
    }

    pub fn id(&self) -> String {
        self.id.clone()
    }

    pub fn name(&self) -> String {
        self.name.clone()
    }

    pub fn length(&self) -> f64 {
        self.length
    }

    pub fn junction(&self) -> String {
        self.junction.clone()
    }

    pub fn plan_view(&self) -> PlanView {
        self.plan_view.clone()
    }

    pub fn traffic_rule(&self) -> TrafficRule {
        self.traffic_rule
    }
}

impl Default for TrafficRule {
    fn default() -> Self {
        TrafficRule::RHT
    }
}
