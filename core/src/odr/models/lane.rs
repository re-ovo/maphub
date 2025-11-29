use wasm_bindgen::prelude::wasm_bindgen;

use crate::odr::models::lane::{
    lane_geometry::{OdrLaneBorder, OdrLaneHeight, OdrLaneWidth},
    lane_link::OdrLaneLink,
};

pub mod lane_geometry;
pub mod lane_link;
pub mod lane_offset;
pub mod lane_section;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLane {
    pub id: i32,

    #[wasm_bindgen(js_name = "type", getter_with_clone)]
    pub lane_type: String,

    /// "true" = keep lane on level, that is, do not apply superelevation;
    /// "false" = apply superelevation to this lane (default, also used if attribute level is missing)
    pub level: bool,

    /// If true, lane is under construction.
    #[wasm_bindgen(js_name = "roadWorks")]
    pub road_works: Option<bool>,

    /// Lane Link
    #[wasm_bindgen(getter_with_clone)]
    pub link: OdrLaneLink,

    /// Lane Width
    #[wasm_bindgen(getter_with_clone)]
    pub width: Vec<OdrLaneWidth>,

    /// Lane Border
    #[wasm_bindgen(getter_with_clone)]
    pub border: Vec<OdrLaneBorder>,

    /// Lane Height
    #[wasm_bindgen(getter_with_clone)]
    pub height: Vec<OdrLaneHeight>,
}

#[wasm_bindgen]
impl OdrLane {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: i32,
        lane_type: String,
        level: Option<bool>,
        road_works: Option<bool>,
        link: OdrLaneLink,
        width: Vec<OdrLaneWidth>,
        border: Vec<OdrLaneBorder>,
        height: Vec<OdrLaneHeight>,
    ) -> Self {
        Self {
            id,
            lane_type,
            level: level.unwrap_or(false),
            road_works,
            link,
            width,
            border,
            height,
        }
    }
}
