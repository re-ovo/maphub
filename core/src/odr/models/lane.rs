use wasm_bindgen::prelude::wasm_bindgen;

use crate::odr::models::lane::{
    lane_access::OdrLaneAccess,
    lane_geometry::{OdrLaneBorder, OdrLaneHeight, OdrLaneWidth},
    lane_link::OdrLaneLink,
    lane_material::OdrLaneMaterial,
    lane_road_mark::OdrRoadMark,
    lane_rule::OdrLaneRule,
    lane_speed::OdrLaneSpeed,
};

pub mod lane_access;
pub mod lane_geometry;
pub mod lane_link;
pub mod lane_material;
pub mod lane_offset;
pub mod lane_rule;
pub mod lane_section;
pub mod lane_speed;
pub mod lane_road_mark;

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

    /// Lane Speed - 速度限制
    #[wasm_bindgen(getter_with_clone)]
    pub speed: Vec<OdrLaneSpeed>,

    /// Lane Access - 通行规则
    #[wasm_bindgen(getter_with_clone)]
    pub access: Vec<OdrLaneAccess>,

    /// Lane Rule - 车道规则（如禁止超车）
    #[wasm_bindgen(getter_with_clone)]
    pub rule: Vec<OdrLaneRule>,

    /// Lane Material - 路面材质
    #[wasm_bindgen(getter_with_clone)]
    pub material: Vec<OdrLaneMaterial>,

    /// Lane Road Marks - 车道标线（定义车道外边界的标线样式）
    #[wasm_bindgen(getter_with_clone, js_name = "roadMarks")]
    pub road_marks: Vec<OdrRoadMark>,
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
        speed: Vec<OdrLaneSpeed>,
        access: Vec<OdrLaneAccess>,
        rule: Vec<OdrLaneRule>,
        material: Vec<OdrLaneMaterial>,
        road_marks: Vec<OdrRoadMark>,
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
            speed,
            access,
            rule,
            material,
            road_marks,
        }
    }
}
