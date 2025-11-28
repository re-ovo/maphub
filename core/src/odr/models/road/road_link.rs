use wasm_bindgen::prelude::*;

use crate::odr::models::enums::{OdrContactPoint, OdrElementDir};

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadLink {
    #[wasm_bindgen(getter_with_clone, js_name = "elementId")]
    pub element_id: String,

    #[wasm_bindgen(getter_with_clone, js_name = "elementType")]
    pub element_type: OdrRoadLinkElementType,

    #[wasm_bindgen(getter_with_clone, js_name = "contactPoint")]
    pub contact_point: Option<OdrContactPoint>,

    #[wasm_bindgen(getter_with_clone, js_name = "elementDir")]
    pub element_dir: Option<OdrElementDir>,

    #[wasm_bindgen(getter_with_clone, js_name = "elementS")]
    pub element_s: Option<f64>,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadLinkElementType {
    Junction,
    Road,
}