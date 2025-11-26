use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub struct Geometry {
    pub s: f64,
    pub x: f64,
    pub y: f64,
    pub hdg: f64,
    pub length: f64,
}

pub enum GeometryType {
    Line,
    Spiral {
        curv_start: f64,
        curv_end: f64,
    },
    Arc {
        curvature: f64,
    },
    ParamPoly3 {
        a_u: f64,
        a_v: f64,
        b_u: f64,
        b_v: f64,
        c_u: f64,
        c_v: f64,
        d_u: f64,
        d_v: f64,
        p_range: ParamPoly3PRange,
    },
}

/// Enumerations of the paramPoly3 pRange attribute
#[wasm_bindgen]
pub enum ParamPoly3PRange {
    ArcLength,
    Normalized,
}
