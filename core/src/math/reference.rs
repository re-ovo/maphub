use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, PartialEq, Default)]
pub struct ReferenceLineCoord {
    pub s: f64,
    pub t: f64,
    pub h: f64,
}

#[wasm_bindgen]
impl ReferenceLineCoord {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, t: f64, h: f64) -> Self {
        Self { s, t, h }
    }
}
