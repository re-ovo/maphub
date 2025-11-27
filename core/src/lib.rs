mod utils;

use wasm_bindgen::prelude::*;

pub mod math;
pub mod odr;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum MapType {
    OpenDrive,
    Apollo,
}