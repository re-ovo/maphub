use wasm_bindgen::prelude::*;

use crate::odr::models::{header::OdrHeader, road::OdrRoad};

#[wasm_bindgen]
#[derive(Clone)]
pub struct OpenDrive {
    #[wasm_bindgen(getter_with_clone)]
    pub header: OdrHeader,
    #[wasm_bindgen(getter_with_clone)]
    pub roads: Vec<OdrRoad>,
}

#[wasm_bindgen]
impl OpenDrive {
    #[wasm_bindgen(constructor)]
    pub fn new(header: OdrHeader, roads: Vec<OdrRoad>) -> Self {
        Self { header, roads }
    }
}
