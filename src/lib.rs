mod utils;

use std::collections::HashMap;

use wasm_bindgen::prelude::*;

use crate::models::geometry::Geometry;

pub mod models;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

fn main() {
    let g = Geometry {
        s: 0.0,
        x: 0.0,
        y: 0.0,
        hdg: 0.0,
        length: 0.0,
    };
}