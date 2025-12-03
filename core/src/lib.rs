mod utils;

use wasm_bindgen::prelude::*;

pub mod apollo;
pub mod math;
pub mod odr;
pub mod fs;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum MapFormatType {
    OpenDrive,
    Apollo,
}