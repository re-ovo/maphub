use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub enum OdrRoadLinkElementType {
    Junction,
    Road,
}

#[wasm_bindgen]
pub enum OdrContactPoint {
    Start,
    End
}