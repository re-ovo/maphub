use wasm_bindgen::prelude::wasm_bindgen;

use crate::math::vec2::Vec2;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadGeometry {
    s: f64,
    x: f64,
    y: f64,
    hdg: f64,
    length: f64,
    geometry_type: OdrRoadGeometryType,
}

#[derive(Clone, Debug)]
pub enum OdrRoadGeometryType {
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
        p_range: OdrParamPoly3PRange,
    },
}

/// Enumerations of the paramPoly3 pRange attribute
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrParamPoly3PRange {
    ArcLength,
    Normalized,
}

impl OdrRoadGeometry {
    pub fn new(
        s: f64,
        x: f64,
        y: f64,
        hdg: f64,
        length: f64,
        geometry_type: OdrRoadGeometryType,
    ) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            geometry_type,
        }
    }
}

#[wasm_bindgen]
impl OdrRoadGeometry {
    pub fn create_line(s: f64, x: f64, y: f64, hdg: f64, length: f64) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            geometry_type: OdrRoadGeometryType::Line,
        }
    }

    pub fn create_spiral(
        s: f64,
        x: f64,
        y: f64,
        hdg: f64,
        length: f64,
        curv_start: f64,
        curv_end: f64,
    ) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            geometry_type: OdrRoadGeometryType::Spiral {
                curv_start,
                curv_end,
            },
        }
    }

    pub fn create_arc(s: f64, x: f64, y: f64, hdg: f64, length: f64, curvature: f64) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            geometry_type: OdrRoadGeometryType::Arc { curvature },
        }
    }

    pub fn create_param_poly3(
        s: f64,
        x: f64,
        y: f64,
        hdg: f64,
        length: f64,
        a_u: f64,
        a_v: f64,
        b_u: f64,
        b_v: f64,
        c_u: f64,
        c_v: f64,
        d_u: f64,
        d_v: f64,
        p_range: OdrParamPoly3PRange,
    ) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            geometry_type: OdrRoadGeometryType::ParamPoly3 {
                a_u,
                a_v,
                b_u,
                b_v,
                c_u,
                c_v,
                d_u,
                d_v,
                p_range,
            },
        }
    }

    pub fn get_xy(&self, s: f64) -> Vec2 {
        return Vec2::default();
    }
}
