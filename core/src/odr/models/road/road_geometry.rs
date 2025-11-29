use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadGeometry {
    pub s: f64,
    pub x: f64,
    pub y: f64,
    pub hdg: f64,
    pub length: f64,
    pub kind: OdrRoadGeometryKind,

    // Spiral 字段
    #[wasm_bindgen(js_name = "curvStart")]
    pub curv_start: Option<f64>,
    #[wasm_bindgen(js_name = "curvEnd")]
    pub curv_end: Option<f64>,

    // Arc 字段
    pub curvature: Option<f64>,

    // ParamPoly3 字段
    #[wasm_bindgen(js_name = "aU")]
    pub a_u: Option<f64>,
    #[wasm_bindgen(js_name = "aV")]
    pub a_v: Option<f64>,
    #[wasm_bindgen(js_name = "bU")]
    pub b_u: Option<f64>,
    #[wasm_bindgen(js_name = "bV")]
    pub b_v: Option<f64>,
    #[wasm_bindgen(js_name = "cU")]
    pub c_u: Option<f64>,
    #[wasm_bindgen(js_name = "cV")]
    pub c_v: Option<f64>,
    #[wasm_bindgen(js_name = "dU")]
    pub d_u: Option<f64>,
    #[wasm_bindgen(js_name = "dV")]
    pub d_v: Option<f64>,
    #[wasm_bindgen(js_name = "pRange")]
    pub p_range: Option<OdrParamPoly3PRange>,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum OdrRoadGeometryKind {
    Line,
    Spiral,
    Arc,
    ParamPoly3,
}

/// Enumerations of the paramPoly3 pRange attribute
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub enum OdrParamPoly3PRange {
    ArcLength,
    Normalized,
}

#[wasm_bindgen]
impl OdrRoadGeometry {
    #[wasm_bindgen(js_name = "createLine")]
    pub fn create_line(s: f64, x: f64, y: f64, hdg: f64, length: f64) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            kind: OdrRoadGeometryKind::Line,
            curv_start: None,
            curv_end: None,
            curvature: None,
            a_u: None,
            a_v: None,
            b_u: None,
            b_v: None,
            c_u: None,
            c_v: None,
            d_u: None,
            d_v: None,
            p_range: None,
        }
    }

    #[wasm_bindgen(js_name = "createSpiral")]
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
            kind: OdrRoadGeometryKind::Spiral,
            curv_start: Some(curv_start),
            curv_end: Some(curv_end),
            curvature: None,
            a_u: None,
            a_v: None,
            b_u: None,
            b_v: None,
            c_u: None,
            c_v: None,
            d_u: None,
            d_v: None,
            p_range: None,
        }
    }

    #[wasm_bindgen(js_name = "createArc")]
    pub fn create_arc(s: f64, x: f64, y: f64, hdg: f64, length: f64, curvature: f64) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            kind: OdrRoadGeometryKind::Arc,
            curv_start: None,
            curv_end: None,
            curvature: Some(curvature),
            a_u: None,
            a_v: None,
            b_u: None,
            b_v: None,
            c_u: None,
            c_v: None,
            d_u: None,
            d_v: None,
            p_range: None,
        }
    }

    #[wasm_bindgen(js_name = "createParamPoly3")]
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
            kind: OdrRoadGeometryKind::ParamPoly3,
            curv_start: None,
            curv_end: None,
            curvature: None,
            a_u: Some(a_u),
            a_v: Some(a_v),
            b_u: Some(b_u),
            b_v: Some(b_v),
            c_u: Some(c_u),
            c_v: Some(c_v),
            d_u: Some(d_u),
            d_v: Some(d_v),
            p_range: Some(p_range),
        }
    }
}
