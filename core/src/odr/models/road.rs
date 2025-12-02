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

    /// 将笛卡尔坐标 (x, y, z) 转换为道路坐标 (s, t, h)
    ///
    /// # 参数
    /// - `x`: 笛卡尔坐标 x
    /// - `y`: 笛卡尔坐标 y
    /// - `z`: 笛卡尔坐标 z
    ///
    /// # 返回值
    /// 返回 Vec3，其中 x=s, y=t, z=h
    ///
    /// # 算法
    /// 使用牛顿迭代法找到参考线上距离目标点最近的 s 值，
    /// 然后计算横向偏移 t 和高度偏移 h
    #[wasm_bindgen(js_name = "xyzToSth")]
    pub fn xyz_to_sth(&self, x: f64, y: f64, z: f64) -> Vec3 {
        // 使用牛顿迭代法找到最近的 s 值
        let s = self.find_closest_s(x, y);

        // 获取参考线上该点的位置和方向
        let pos_hdg = self.eval_reference_line(s);

        // 计算从参考线点到目标点的向量
        let dx = x - pos_hdg.x;
        let dy = y - pos_hdg.y;

        // 计算 t：将向量投影到法线方向（垂直于切线）
        // 法线方向 = hdg + π/2
        let normal = pos_hdg.hdg + std::f64::consts::FRAC_PI_2;
        let t = dx * normal.cos() + dy * normal.sin();

        // 计算 h：z - 基础高程 - 超高影响
        let base_z = self.eval_elevation(s);
        let roll = self.eval_superelevation(s);
        let h = z - base_z - t * roll.tan();

        Vec3::new(s, t, h)
    }

    /// 使用牛顿迭代法找到参考线上距离点 (x, y) 最近的 s 值
    fn find_closest_s(&self, x: f64, y: f64) -> f64 {
        const MAX_ITERATIONS: usize = 50;
        const TOLERANCE: f64 = 1e-8;

        // 初始猜测：在参考线上采样找到最近点
        let mut best_s = self.initial_s_guess(x, y);

        for _ in 0..MAX_ITERATIONS {
            let pos_hdg = self.eval_reference_line(best_s);

            // 计算从参考线点到目标点的向量
            let dx = x - pos_hdg.x;
            let dy = y - pos_hdg.y;

            // 切线方向向量
            let tx = pos_hdg.hdg.cos();
            let ty = pos_hdg.hdg.sin();

            // 计算沿切线方向的距离（这就是 s 需要调整的量）
            let ds = dx * tx + dy * ty;

            if ds.abs() < TOLERANCE {
                break;
            }

            // 更新 s，但限制在道路范围内
            best_s = (best_s + ds).clamp(0.0, self.length);
        }

        best_s
    }

    /// 通过采样找到初始 s 猜测值
    fn initial_s_guess(&self, x: f64, y: f64) -> f64 {
        let num_samples = 100.max((self.length / 5.0) as usize);
        let step = self.length / num_samples as f64;

        let mut best_s = 0.0;
        let mut min_dist_sq = f64::MAX;

        for i in 0..=num_samples {
            let s = (i as f64) * step;
            let pos_hdg = self.eval_reference_line(s);

            let dx = x - pos_hdg.x;
            let dy = y - pos_hdg.y;
            let dist_sq = dx * dx + dy * dy;

            if dist_sq < min_dist_sq {
                min_dist_sq = dist_sq;
                best_s = s;
            }
        }

        best_s
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

    /// 计算 s 位置的车道偏移量
    ///
    /// 车道偏移量定义了所有车道相对于道路参考线的横向偏移
    /// 使用三次多项式计算：offset(ds) = a + b*ds + c*ds² + d*ds³
    ///
    /// # 参数
    /// - `s`: 沿参考线的纵向距离
    ///
    /// # 返回值
    /// 横向偏移量（米），正值表示向左偏移，负值表示向右偏移
    pub(crate) fn eval_lane_offset(&self, s: f64) -> f64 {
        let offset = self.lane_offsets.iter().filter(|o| o.s <= s).last();

        match offset {
            Some(o) => {
                let ds = s - o.s;
                o.a + o.b * ds + o.c * ds.powi(2) + o.d * ds.powi(3)
            }
            None => 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eval_lane_offset_no_offset() {
        // 测试没有 lane offset 的情况
        let road = OdrRoad::new(
            "road1".to_string(),
            100.0,
            "-1".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            vec![],
            vec![],
        );

        assert_eq!(road.eval_lane_offset(0.0), 0.0);
        assert_eq!(road.eval_lane_offset(50.0), 0.0);
        assert_eq!(road.eval_lane_offset(100.0), 0.0);
    }

    #[test]
    fn test_eval_lane_offset_constant() {
        // 测试常数偏移
        let lane_offsets = vec![OdrLaneOffset::new(0.0, 2.0, 0.0, 0.0, 0.0)];

        let road = OdrRoad::new(
            "road1".to_string(),
            100.0,
            "-1".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            vec![],
            lane_offsets,
        );

        assert_eq!(road.eval_lane_offset(0.0), 2.0);
        assert_eq!(road.eval_lane_offset(50.0), 2.0);
        assert_eq!(road.eval_lane_offset(100.0), 2.0);
    }

    #[test]
    fn test_eval_lane_offset_linear() {
        // 测试线性变化：offset = 1.0 + 0.1*ds
        let lane_offsets = vec![OdrLaneOffset::new(0.0, 1.0, 0.1, 0.0, 0.0)];

        let road = OdrRoad::new(
            "road1".to_string(),
            100.0,
            "-1".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            vec![],
            lane_offsets,
        );

        assert_eq!(road.eval_lane_offset(0.0), 1.0);
        assert_eq!(road.eval_lane_offset(10.0), 2.0); // 1.0 + 0.1*10
        assert_eq!(road.eval_lane_offset(50.0), 6.0); // 1.0 + 0.1*50
    }

    #[test]
    fn test_eval_lane_offset_multiple_segments() {
        // 测试多段 lane offset
        let lane_offsets = vec![
            OdrLaneOffset::new(0.0, 0.0, 0.0, 0.0, 0.0),    // s=0: offset=0
            OdrLaneOffset::new(25.0, 2.0, 0.0, 0.0, 0.0),   // s=25: offset=2
            OdrLaneOffset::new(75.0, 2.0, -0.04, 0.0, 0.0), // s=75: offset=2-0.04*ds
        ];

        let road = OdrRoad::new(
            "road1".to_string(),
            100.0,
            "-1".to_string(),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            vec![],
            lane_offsets,
        );

        assert_eq!(road.eval_lane_offset(10.0), 0.0);
        assert_eq!(road.eval_lane_offset(30.0), 2.0);
        assert_eq!(road.eval_lane_offset(50.0), 2.0);
        assert_eq!(road.eval_lane_offset(100.0), 1.0); // 2.0 - 0.04*25
    }
}
