use wasm_bindgen::prelude::*;

use crate::models::{header::Header, road::Road};

#[wasm_bindgen]
#[derive(Clone)]
pub struct OpenDrive {
    header: Header,
    roads: Vec<Road>,
}

#[wasm_bindgen]
impl OpenDrive {
    #[wasm_bindgen(constructor)]
    pub fn new(header: Header, roads: Vec<Road>) -> Self {
        Self { header, roads }
    }

    pub fn header(&self) -> Header {
        self.header.clone()
    }

    pub fn roads(&self) -> Vec<Road> {
        self.roads.clone()
    }
}