use wasm_bindgen::prelude::*;

use crate::models::geometry::RoadGeometry;

type PlanView = Vec<RoadGeometry>;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Road {
    id: String,
    name: String,
    length: f64,
    plan_view: PlanView,
}

#[wasm_bindgen]
impl Road {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, name: String, length: f64, plan_view: PlanView) -> Self {
        Self { id, name, length, plan_view }
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

    pub fn plan_view(&self) -> PlanView {
        self.plan_view.clone()
    }
}