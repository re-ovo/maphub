use wasm_bindgen::prelude::*;

use super::enums::OdrOutlineFillType;

/// 对象轮廓
///
/// 定义一系列角点,包括对象相对于道路参考线的高度。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrOutline {
    /// 轮廓的 ID,在一个对象内必须唯一
    pub id: Option<u32>,

    /// 如果为 true,轮廓描述一个区域,而不是线性特征
    pub closed: Option<bool>,

    /// 用于填充轮廓内部区域的类型
    #[wasm_bindgen(getter_with_clone, js_name = "fillType")]
    pub fill_type: Option<OdrOutlineFillType>,

    /// 定义轮廓是否为对象的外轮廓
    pub outer: Option<bool>,

    /// 道路坐标系角点列表
    #[wasm_bindgen(getter_with_clone, js_name = "cornerRoad")]
    pub corner_road: Vec<OdrCornerRoad>,

    /// 本地坐标系角点列表
    #[wasm_bindgen(getter_with_clone, js_name = "cornerLocal")]
    pub corner_local: Vec<OdrCornerLocal>,
}

#[wasm_bindgen]
impl OdrOutline {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            id: None,
            closed: None,
            fill_type: None,
            outer: None,
            corner_road: Vec::new(),
            corner_local: Vec::new(),
        }
    }
}

/// 道路坐标系角点
///
/// 在道路坐标系中定义对象轮廓上的角点。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrCornerRoad {
    /// 角点的 ID(可选),在一个轮廓内必须唯一
    pub id: Option<u32>,

    /// 角点的 s 坐标
    pub s: f64,

    /// 角点的 t 坐标
    pub t: f64,

    /// 相对于道路参考线的 dz
    pub dz: f64,

    /// 此角点处对象的高度,沿 z 轴
    pub height: f64,
}

#[wasm_bindgen]
impl OdrCornerRoad {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, t: f64, dz: f64, height: f64) -> Self {
        Self {
            id: None,
            s,
            t,
            dz,
            height,
        }
    }
}

/// 本地坐标系角点
///
/// 在对象本地 u/v 坐标系中定义对象轮廓上的角点。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrCornerLocal {
    /// 角点的 ID(可选),在一个轮廓内必须唯一
    pub id: Option<u32>,

    /// 本地 u 坐标
    pub u: f64,

    /// 本地 v 坐标
    pub v: f64,

    /// 本地 z 坐标
    pub z: f64,

    /// 此角点处对象的高度,沿 z 轴
    pub height: f64,
}

#[wasm_bindgen]
impl OdrCornerLocal {
    #[wasm_bindgen(constructor)]
    pub fn new(u: f64, v: f64, z: f64, height: f64) -> Self {
        Self {
            id: None,
            u,
            v,
            z,
            height,
        }
    }
}
