mod utils;

use wasm_bindgen::prelude::*;

use crate::math::vec2::Vec2;

pub mod models;
pub mod math;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

fn main() {
    let vec2 = Vec2::default();
    let vec2_2 = Vec2::new(1.0, 2.0);
    let vec2_3 = vec2 + vec2_2;
    print!("{:?}", vec2_3);
    print!("{:?}", vec2_2);
    print!("{:?}", vec2);
}