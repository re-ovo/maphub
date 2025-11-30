use wasm_bindgen::prelude::*;

use crate::{
    math::vec3::Vec3,
    odr::models::{
        lane::{lane_offset::OdrLaneOffset, lane_section::OdrLaneSection},
        road::{
            road_elevation::OdrRoadElevation,
            road_geometry::{OdrRoadGeometry, PosHdg},
            road_link::OdrRoadLink,
            road_type::OdrRoadType,
            shape::OdrShape,
            superelevation::OdrSuperelevation,
            traffic_rule::OdrTrafficRule,
        },
    },
};

pub mod road_elevation;
pub mod road_geometry;
pub mod road_link;
pub mod road_type;
pub mod shape;
pub mod superelevation;
pub mod traffic_rule;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoad {
    #[wasm_bindgen(getter_with_clone)]
    pub id: String,

    #[wasm_bindgen(getter_with_clone)]
    pub junction: String,

    pub length: f64,

    #[wasm_bindgen(getter_with_clone)]
    pub name: Option<String>,

    #[wasm_bindgen(getter_with_clone, js_name = "trafficRule")]
    pub traffic_rule: OdrTrafficRule,

    #[wasm_bindgen(getter_with_clone)]
    pub predecessor: Option<OdrRoadLink>,

    #[wasm_bindgen(getter_with_clone)]
    pub successor: Option<OdrRoadLink>,

    #[wasm_bindgen(getter_with_clone, js_name = "roadTypes")]
    pub road_types: Vec<OdrRoadType>,

    #[wasm_bindgen(getter_with_clone, js_name = "planView")]
    pub plan_view: Vec<OdrRoadGeometry>,

    #[wasm_bindgen(getter_with_clone, js_name = "elevations")]
    pub elevations: Vec<OdrRoadElevation>,

    #[wasm_bindgen(getter_with_clone, js_name = "superelevations")]
    pub superelevations: Vec<OdrSuperelevation>,

    #[wasm_bindgen(getter_with_clone, js_name = "shapes")]
    pub shapes: Vec<OdrShape>,

    #[wasm_bindgen(getter_with_clone)]
    pub lanes: Vec<OdrLaneSection>,

    #[wasm_bindgen(getter_with_clone)]
    pub lane_offsets: Vec<OdrLaneOffset>,
}

#[wasm_bindgen]
impl OdrRoad {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        length: f64,
        junction: String,
        name: Option<String>,
        traffic_rule: Option<OdrTrafficRule>,
        road_types: Option<Vec<OdrRoadType>>,
        plan_view: Option<Vec<OdrRoadGeometry>>,
        elevations: Option<Vec<OdrRoadElevation>>,
        superelevations: Option<Vec<OdrSuperelevation>>,
        shapes: Option<Vec<OdrShape>>,
        predecessor: Option<OdrRoadLink>,
        successor: Option<OdrRoadLink>,
        lanes: Vec<OdrLaneSection>,
        lane_offsets: Vec<OdrLaneOffset>,
    ) -> Self {
        Self {
            id,
            length,
            junction,
            name: name,
            traffic_rule: traffic_rule.unwrap_or_default(),
            plan_view: plan_view.unwrap_or_default(),
            road_types: road_types.unwrap_or_default(),
            elevations: elevations.unwrap_or_default(),
            superelevations: superelevations.unwrap_or_default(),
            shapes: shapes.unwrap_or_default(),
            predecessor: predecessor,
            successor: successor,
            lanes: lanes,
            lane_offsets: lane_offsets,
        }
    }

    /// 将道路坐标 (s, t, h) 转换为笛卡尔坐标 (x, y, z)
    ///
    /// # 参数
    /// - `s`: 沿参考线的纵向距离
    /// - `t`: 垂直于参考线的横向偏移（正值=左，负值=右）
    /// - `h`: 相对于参考平面的高度偏移
    #[wasm_bindgen(js_name = "sthToXyz")]
    pub fn sth_to_xyz(&self, s: f64, t: f64, h: f64) -> Vec3 {
        // 1. 获取参考线点和切线方向
        let pos_hdg = self.eval_reference_line(s);

        // 2. 计算基础高程
        let base_z = self.eval_elevation(s);

        // 3. 计算超高角度
        let roll = self.eval_superelevation(s);

        // 4. 应用横向偏移（垂直于切线方向）
        let normal = pos_hdg.hdg + std::f64::consts::FRAC_PI_2;
        let x = pos_hdg.x + t * normal.cos();
        let y = pos_hdg.y + t * normal.sin();

        // 5. 高度 = 基础高程 + 超高影响 + h
        let z = base_z + t * roll.tan() + h;

        Vec3::new(x, y, z)
    }

    /// 计算参考线上 s 位置的点和切线方向
    fn eval_reference_line(&self, s: f64) -> PosHdg {
        // 找到包含该 s 值的几何段
        let geom = self
            .plan_view
            .iter()
            .filter(|g| g.s <= s)
            .last()
            .unwrap_or_else(|| self.plan_view.first().expect("plan_view is empty"));

        let ds = s - geom.s;
        geom.eval_at(ds)
    }

    /// 计算 s 位置的基础高程
    fn eval_elevation(&self, s: f64) -> f64 {
        let elev = self.elevations.iter().filter(|e| e.s <= s).last();

        match elev {
            Some(e) => {
                let ds = s - e.s;
                e.a + e.b * ds + e.c * ds.powi(2) + e.d * ds.powi(3)
            }
            None => 0.0,
        }
    }

    /// 计算 s 位置的超高角度（弧度）
    fn eval_superelevation(&self, s: f64) -> f64 {
        let se = self.superelevations.iter().filter(|e| e.s <= s).last();

        match se {
            Some(e) => {
                let ds = s - e.s;
                e.a + e.b * ds + e.c * ds.powi(2) + e.d * ds.powi(3)
            }
            None => 0.0,
        }
    }
}
