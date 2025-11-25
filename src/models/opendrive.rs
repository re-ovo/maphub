use wasm_bindgen::prelude::*;

use crate::models::{header::Header, road::Road};

#[wasm_bindgen]
pub struct OpenDrive {
    header: Header,
    roads: Vec<Road>,
}
