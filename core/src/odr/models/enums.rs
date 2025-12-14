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

/// Object 方向枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrOrientation {
    /// 在正 s 方向有效
    Positive = "+",
    /// 在负 s 方向有效
    Negative = "-",
    /// 在两个方向都有效
    None = "none",
}

/// 道路标记颜色枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkColor {
    Black = "black",
    Blue = "blue",
    Green = "green",
    Orange = "orange",
    Red = "red",
    Standard = "standard",
    /// equivalent to white
    Violet = "violet",
    White = "white",
    Yellow = "yellow",
}

/// 道路标记权重枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkWeight {
    Bold = "bold",
    Standard = "standard",
}
