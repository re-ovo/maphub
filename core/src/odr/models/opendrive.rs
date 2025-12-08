use wasm_bindgen::prelude::*;

use crate::{
    math::vec3::Vec3,
    odr::models::{header::OdrHeader, road::OdrRoad},
};

#[wasm_bindgen]
#[derive(Clone)]
pub struct OpenDrive {
    #[wasm_bindgen(getter_with_clone)]
    pub header: OdrHeader,
    #[wasm_bindgen(getter_with_clone)]
    pub roads: Vec<OdrRoad>,
    center: Vec3,
}

#[wasm_bindgen]
impl OpenDrive {
    #[wasm_bindgen(constructor)]
    pub fn new(header: OdrHeader, roads: Vec<OdrRoad>) -> Self {
        let center = Self::compute_center(&roads);
        Self {
            header,
            roads,
            center,
        }
    }

    /// 获取地图的中心点
    #[wasm_bindgen(getter)]
    pub fn center(&self) -> Vec3 {
        self.center
    }
}

impl OpenDrive {
    /// 计算地图的中心点
    ///
    /// 通过计算所有道路几何起点的边界框中心来获取
    /// 返回的坐标是 OpenDRIVE 坐标系 (x, y, 0)
    fn compute_center(roads: &[OdrRoad]) -> Vec3 {
        if roads.is_empty() {
            return Vec3::new(0.0, 0.0, 0.0);
        }

        let mut min_x = f64::MAX;
        let mut max_x = f64::MIN;
        let mut min_y = f64::MAX;
        let mut max_y = f64::MIN;

        for road in roads {
            // 只取第一个 geometry 的起点
            if let Some(geom) = road.plan_view.first() {
                min_x = min_x.min(geom.x);
                max_x = max_x.max(geom.x);
                min_y = min_y.min(geom.y);
                max_y = max_y.max(geom.y);
            }
        }

        // 如果没有找到有效的几何数据
        if min_x == f64::MAX {
            return Vec3::new(0.0, 0.0, 0.0);
        }

        Vec3::new((min_x + max_x) / 2.0, (min_y + max_y) / 2.0, 0.0)
    }
}
