/// 存储一些公共的enum
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrContactPoint {
    Start,
    End,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrElementDir {
    Positive,
    Negative,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrSpeedUnit {
    /// km/h
    KMH,
    /// m/s
    MPS,
    /// mph
    MPH,
}
