use wasm_bindgen::prelude::*;

use crate::{
    math::{mesh::MeshData, vec3::Vec3},
    odr::models::{
        lane::{OdrLane, lane_geometry::OdrLaneWidth, lane_section::OdrLaneSection},
        road::OdrRoad,
    },
};

/// 车道网格构建器
///
/// 用于将 OpenDRIVE 道路和车道数据转换为可渲染的三角网格
#[wasm_bindgen]
pub struct LaneMeshBuilder {
    /// 沿 s 方向的采样步长（米）
    sample_step: f64,
    /// 地图中心点，用于解决大坐标精度问题，从 OpenDrive.center 获取
    center: Vec3,
}

#[wasm_bindgen]
impl LaneMeshBuilder {
    /// 创建新的车道网格构建器
    ///
    /// # 参数
    /// - `sample_step`: 沿参考线方向的采样间隔（米），默认 1.0
    /// - `center`: 地图中心点，用于解决大坐标精度问题，从 OpenDrive.center 获取
    #[wasm_bindgen(constructor)]
    pub fn new(sample_step: Option<f64>, center: Option<Vec3>) -> Self {
        Self {
            sample_step: sample_step.unwrap_or(1.0),
            center: center.unwrap_or_default(),
        }
    }

    /// 构建单个车道的网格
    ///
    /// # 参数
    /// - `road`: 道路对象
    /// - `lane_section`: 车道段
    /// - `lane`: 要构建网格的车道
    /// - `s_start`: 车道段起始 s 坐标
    /// - `s_end`: 车道段结束 s 坐标
    #[wasm_bindgen(js_name = "buildLaneMesh")]
    pub fn build_lane_mesh(
        &self,
        road: &OdrRoad,
        lane_section: &OdrLaneSection,
        lane: &OdrLane,
        s_start: f64,
        s_end: f64,
    ) -> MeshData {
        // 中心线不渲染
        if lane.id == 0 {
            return MeshData::new(Vec::new(), Vec::new(), Vec::new());
        }

        // 计算采样点数量
        let length = s_end - s_start;
        let num_samples = ((length / self.sample_step).ceil() as usize).max(2);

        let mut vertices = Vec::new();

        // 沿 s 方向采样，生成车道的内外边界顶点
        for i in 0..num_samples {
            let t = i as f64 / (num_samples - 1) as f64;
            let s = s_start + t * length;

            // 计算车道在当前 s 位置的横向边界
            let (t_inner, t_outer) = self.get_lane_t_bounds(lane, lane_section, road, s);

            // 计算高度偏移：考虑横断面形状 (shape)
            let h_inner = road.eval_shape(s, t_inner);
            let h_outer = road.eval_shape(s, t_outer);

            // 转换为笛卡尔坐标
            let inner_point = road.sth_to_xyz(s, t_inner, h_inner);
            let outer_point = road.sth_to_xyz(s, t_outer, h_outer);

            // 添加顶点（内边界和外边界各一个）
            // 坐标系转换：OpenDRIVE (x, y, z) -> WebGL (x, z, -y)
            // 减去 center 解决大坐标精度问题
            vertices.push((inner_point.x - self.center.x) as f32);
            vertices.push((inner_point.z - self.center.z) as f32);
            vertices.push(-(inner_point.y - self.center.y) as f32);

            vertices.push((outer_point.x - self.center.x) as f32);
            vertices.push((outer_point.z - self.center.z) as f32);
            vertices.push(-(outer_point.y - self.center.y) as f32);
        }

        // 生成索引（三角形带）
        let indices = MeshData::generate_strip_indices(num_samples);

        // 计算法线
        let normals = MeshData::calculate_normals(&vertices, &indices);

        MeshData::new(vertices, indices, normals)
    }

    /// 构建整条道路所有车道的网格
    ///
    /// # 参数
    /// - `road`: 道路对象
    #[wasm_bindgen(js_name = "buildRoadMesh")]
    pub fn build_road_mesh(&self, road: &OdrRoad) -> MeshData {
        let mut result = MeshData::empty();

        for (section_idx, lane_section) in road.lanes.iter().enumerate() {
            let s_start = lane_section.s;
            let s_end = if section_idx + 1 < road.lanes.len() {
                road.lanes[section_idx + 1].s
            } else {
                road.length
            };

            // 构建左侧车道
            for lane in &lane_section.left {
                let mesh = self.build_lane_mesh(road, lane_section, lane, s_start, s_end);
                result.merge(mesh);
            }

            // 构建右侧车道
            for lane in &lane_section.right {
                let mesh = self.build_lane_mesh(road, lane_section, lane, s_start, s_end);
                result.merge(mesh);
            }
        }

        result
    }
}

impl LaneMeshBuilder {
    /// 计算车道在指定 s 位置的横向边界 (t_inner, t_outer)
    ///
    /// # 参数
    /// - `lane`: 车道对象
    /// - `section`: 车道所在的车道段
    /// - `road`: 道路对象（用于获取 lane offset）
    /// - `s`: 全局 s 坐标
    ///
    /// # 返回值
    /// (t_inner, t_outer) - 车道的内边界和外边界横向坐标
    fn get_lane_t_bounds(
        &self,
        lane: &OdrLane,
        section: &OdrLaneSection,
        road: &OdrRoad,
        s: f64,
    ) -> (f64, f64) {
        let ds = s - section.s;

        // 计算当前车道的宽度
        let width = OdrLaneWidth::eval_widths(&lane.width, ds);

        // 计算 lane offset（道路级别的横向偏移）
        let lane_offset = road.eval_lane_offset(s);

        // 计算内侧车道的累积宽度
        let t_inner = section.calculate_inner_offset(lane.id, s) + lane_offset;

        // 外边界 = 内边界 + 宽度（考虑正负方向）
        let t_outer = if lane.id > 0 {
            // 左侧车道，向正方向累加
            t_inner + width
        } else {
            // 右侧车道，向负方向累加
            t_inner - width
        };

        (t_inner, t_outer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::odr::models::lane::lane_link::OdrLaneLink;

    #[test]
    fn test_eval_lane_width_constant() {
        // 测试常数宽度
        let widths = vec![OdrLaneWidth::new(0.0, 3.5, 0.0, 0.0, 0.0)];

        assert_eq!(OdrLaneWidth::eval_widths(&widths, 0.0), 3.5);
        assert_eq!(OdrLaneWidth::eval_widths(&widths, 10.0), 3.5);
        assert_eq!(OdrLaneWidth::eval_widths(&widths, 100.0), 3.5);
    }

    #[test]
    fn test_eval_lane_width_linear() {
        // 测试线性变化的宽度：width = 3.0 + 0.1*ds
        let widths = vec![OdrLaneWidth::new(0.0, 3.0, 0.1, 0.0, 0.0)];

        assert_eq!(OdrLaneWidth::eval_widths(&widths, 0.0), 3.0);
        assert_eq!(OdrLaneWidth::eval_widths(&widths, 10.0), 4.0);
        assert_eq!(OdrLaneWidth::eval_widths(&widths, 20.0), 5.0);
    }

    #[test]
    fn test_eval_lane_width_multiple_segments() {
        // 测试多段宽度定义
        let widths = vec![
            OdrLaneWidth::new(0.0, 3.5, 0.0, 0.0, 0.0),
            OdrLaneWidth::new(10.0, 4.0, 0.0, 0.0, 0.0),
            OdrLaneWidth::new(20.0, 3.0, 0.1, 0.0, 0.0),
        ];

        assert_eq!(OdrLaneWidth::eval_widths(&widths, 5.0), 3.5);
        assert_eq!(OdrLaneWidth::eval_widths(&widths, 15.0), 4.0);
        assert_eq!(OdrLaneWidth::eval_widths(&widths, 25.0), 3.5); // 3.0 + 0.1*5
    }

    #[test]
    fn test_generate_indices() {
        // 3 个采样点应该生成 4 个三角形（12个索引）
        let indices = MeshData::generate_strip_indices(3);
        assert_eq!(indices.len(), 12);

        // 验证第一个四边形的索引
        assert_eq!(&indices[0..6], &[0, 1, 2, 1, 3, 2]);
    }

    #[test]
    fn test_calculate_normals_flat_surface() {
        // 创建一个水平面（y=0，即 XZ 平面）
        let vertices = vec![
            0.0, 0.0, 0.0, // 顶点 0
            0.0, 0.0, 1.0, // 顶点 1
            1.0, 0.0, 0.0, // 顶点 2
        ];

        // 单个三角形
        let indices = vec![0, 1, 2];

        let normals = MeshData::calculate_normals(&vertices, &indices);

        // 水平面的法线应该指向 Y 轴正方向
        assert_eq!(normals.len(), 9);
        // 每个顶点的法线都应该是 (0, 1, 0)
        for i in (0..normals.len()).step_by(3) {
            assert!((normals[i] - 0.0).abs() < 1e-5);
            assert!((normals[i + 1] - 1.0).abs() < 1e-5);
            assert!((normals[i + 2] - 0.0).abs() < 1e-5);
        }
    }

    #[test]
    fn test_calculate_inner_offset_with_descending_lane_ids() {
        fn build_lane(id: i32, width: f64) -> OdrLane {
            OdrLane {
                id,
                lane_type: "driving".into(),
                level: false,
                road_works: None,
                link: OdrLaneLink::new(None, None),
                width: vec![OdrLaneWidth::new(0.0, width, 0.0, 0.0, 0.0)],
                border: Vec::new(),
                height: Vec::new(),
                speed: Vec::new(),
                access: Vec::new(),
                rule: Vec::new(),
                material: Vec::new(),
                road_marks: Vec::new(),
            }
        }

        let left = vec![
            build_lane(4, 4.0),
            build_lane(3, 3.0),
            build_lane(2, 2.0),
            build_lane(1, 1.0),
        ];
        let right = vec![
            build_lane(-1, 1.0),
            build_lane(-2, 2.0),
            build_lane(-3, 3.0),
            build_lane(-4, 4.0),
        ];

        let section = OdrLaneSection::new(0.0, left, right, build_lane(0, 0.0), None);
        let s = 5.0; // 任意 s，宽度恒定

        assert!((section.calculate_inner_offset(1, s) - 0.0).abs() < 1e-6);
        assert!((section.calculate_inner_offset(2, s) - 1.0).abs() < 1e-6);
        assert!((section.calculate_inner_offset(3, s) - 3.0).abs() < 1e-6);
        assert!((section.calculate_inner_offset(4, s) - 6.0).abs() < 1e-6);

        assert!((section.calculate_inner_offset(-1, s) - 0.0).abs() < 1e-6);
        assert!((section.calculate_inner_offset(-2, s) + 1.0).abs() < 1e-6);
        assert!((section.calculate_inner_offset(-3, s) + 3.0).abs() < 1e-6);
        assert!((section.calculate_inner_offset(-4, s) + 6.0).abs() < 1e-6);
    }
}
