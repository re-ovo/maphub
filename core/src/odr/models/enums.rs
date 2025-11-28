/// 存储一些公共的enum

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrContactPoint {
    Start,
    End
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrElementDir {
    Positive,
    Negative,
}