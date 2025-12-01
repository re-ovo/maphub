/// 存储一些公共的enum
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrContactPoint {
    Start = "start",
    End = "end",
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrElementDir {
    Positive = "+",
    Negative = "-",
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrSpeedUnit {
    /// km/h
    KMH = "km/h",
    /// m/s
    MPS = "m/s",
    /// mph
    MPH = "mph",
}
