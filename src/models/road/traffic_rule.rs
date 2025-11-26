use wasm_bindgen::prelude::*;

/// 交通规则
/// LHT: 左行交通规则
/// RHT: 右行交通规则
#[wasm_bindgen]
#[derive(Copy, Clone, Debug)]
pub enum TrafficRule {
    LHT,
    RHT,
}

impl Default for TrafficRule {
    fn default() -> Self {
        TrafficRule::RHT
    }
}
