use wasm_bindgen::prelude::*;

// 重新导出公共枚举
pub use super::super::enums::{OdrOrientation, OdrRoadMarkColor, OdrRoadMarkWeight};

/// 轮廓填充类型枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrOutlineFillType {
    Grass,
    Concrete,
    Cobble,
    Asphalt,
    Pavement,
    Gravel,
    Soil,
}

/// 边框类型枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrBorderType {
    Concrete,
    Curb,
}

/// 停车位访问规则枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrParkingSpaceAccess {
    All,
    Car,
    Women,
    Handicapped,
    Bus,
    Truck,
    Electric,
    Residents,
}

/// 边侧类型枚举
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrSideType {
    Left,
    Right,
    Front,
    Rear,
}
