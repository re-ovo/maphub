use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub struct Road {
    id: String,
    name: String,
    length: f64,
}
