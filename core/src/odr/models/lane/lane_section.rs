use wasm_bindgen::prelude::*;

use crate::odr::models::lane::{lane_geometry::OdrLaneWidth, OdrLane};

/// OpenDrive 车道分段 (Lane Section)
///
/// 在 OpenDrive 规范中，道路被划分为多个车道分段，每个分段定义了该位置的车道布局。
/// 车道分段包含左侧车道、右侧车道和中心车道
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneSection {
    /// 车道分段起点沿道路参考线的 s 坐标
    pub s: f64,

    /// 是否为单侧车道分段（可选）
    /// 如果为 true，表示该分段只有一侧有车道
    pub single_side: Option<bool>,

    /// 左侧车道列表
    /// 按照 OpenDrive 规范，左侧车道 ID 为正数，从中心线向左递增
    #[wasm_bindgen(getter_with_clone)]
    pub left: Vec<OdrLane>,

    /// 右侧车道列表
    /// 按照 OpenDrive 规范，右侧车道 ID 为负数，从中心线向右递减
    #[wasm_bindgen(getter_with_clone)]
    pub right: Vec<OdrLane>,

    /// 中心车道（参考线）
    /// ID 为0，作为左右车道的分界线，中心车道是必选且唯一的
    #[wasm_bindgen(getter_with_clone)]
    pub center: OdrLane,
}

#[wasm_bindgen]
impl OdrLaneSection {
    /// 创建新的车道分段
    ///
    /// # 参数
    /// * `s` - 车道分段起点的 s 坐标
    /// * `left` - 左侧车道列表
    /// * `right` - 右侧车道列表
    /// * `center` - 中心车道
    /// * `single_side` - 是否为单侧车道分段
    #[wasm_bindgen(constructor)]
    pub fn new(
        s: f64,
        left: Vec<OdrLane>,
        right: Vec<OdrLane>,
        center: OdrLane,
        single_side: Option<bool>,
    ) -> Self {
        Self {
            s,
            left,
            right,
            center,
            single_side,
        }
    }
}

impl OdrLaneSection {
    /// 计算车道内侧边界的累计偏移
    ///
    /// 通过累加从中心线到目标车道之间所有车道的宽度来计算偏移
    ///
    /// # 参数
    /// * `lane_id` - 目标车道 ID
    /// * `s` - 道路参考线上的 s 坐标
    pub fn calculate_inner_offset(&self, lane_id: i32, s: f64) -> f64 {
        let ds = s - self.s;
        let mut offset = 0.0;

        if lane_id > 0 {
            // 左侧车道：累加所有更靠近中心线的车道宽度（ID 更小）
            for other_lane in &self.left {
                if other_lane.id > 0 && other_lane.id < lane_id {
                    offset += OdrLaneWidth::eval_widths(&other_lane.width, ds);
                }
            }
        } else if lane_id < 0 {
            // 右侧车道：累加所有更靠近中心线的车道宽度（数值更大）
            for other_lane in &self.right {
                if other_lane.id < 0 && other_lane.id > lane_id {
                    offset -= OdrLaneWidth::eval_widths(&other_lane.width, ds);
                }
            }
        }

        offset
    }
}
