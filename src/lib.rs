mod utils;

use wasm_bindgen::prelude::*;

use crate::{math::vec2::Vec2, models::road::Road};

pub mod models;
pub mod math;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn parse_opendrive(opendrive: &str) {
    // todo: parse opendrive
    println!("parse_opendrive: {}", opendrive);
}
