#[wasm_bindgen]
pub struct OdrRoadLink {
    #[wasm_bindgen(getter_with_clone)]
    pub elementId: String,
    #[wasm_bindgen(getter_with_clone)]
    pub elementType: OdrRoadLinkElementType,
}

