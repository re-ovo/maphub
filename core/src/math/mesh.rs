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

#[wasm_bindgen]
impl MeshData {
    #[wasm_bindgen(constructor)]
    pub fn new(vertices: Vec<f32>, indices: Vec<u16>, normals: Vec<f32>) -> Self {
        Self {
            vertices,
            indices,
            normals,
        }
    }

    /// 创建空的 MeshData
    pub fn empty() -> Self {
        Self {
            vertices: Vec::new(),
            indices: Vec::new(),
            normals: Vec::new(),
        }
    }
}
