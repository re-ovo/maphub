mod utils;

use wasm_bindgen::prelude::*;

pub mod apollo;
pub mod fs;
pub mod math;
pub mod odr;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum MapFormatType {
    OpenDrive = "opendrive",
    Apollo = "apollo",
}
