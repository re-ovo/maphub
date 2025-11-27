mod utils;

use wasm_bindgen::prelude::*;

pub mod math;
pub mod models;
pub mod parser;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}
