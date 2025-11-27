use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct MeshData {
    #[wasm_bindgen(getter_with_clone)]
    pub vertices: Vec<f32>,
    #[wasm_bindgen(getter_with_clone)]
    pub indices: Vec<u16>,
    #[wasm_bindgen(getter_with_clone)]
    pub normals: Vec<f32>,
}
