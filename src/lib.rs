mod utils;

use wasm_bindgen::prelude::*;

pub mod models;


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}
