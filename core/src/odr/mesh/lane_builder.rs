use wasm_bindgen::prelude::*;

use crate::{
    math::{mesh::MeshData, vec3::Vec3},
    odr::models::{
        lane::{lane_geometry::OdrLaneWidth, lane_section::OdrLaneSection, OdrLane},
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
}

#[wasm_bindgen]
impl LaneMeshBuilder {
    /// 创建新的车道网格构建器
    ///
    /// # 参数
    /// - `sample_step`: 沿参考线方向的采样间隔（米），默认 1.0
    #[wasm_bindgen(constructor)]
    pub fn new(sample_step: Option<f64>) -> Self {
        Self {
            sample_step: sample_step.unwrap_or(1.0),
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

            // 计算高度偏移（目前简化为 0）
            let h = 0.0;

            // 转换为笛卡尔坐标
            let inner_point = road.sth_to_xyz(s, t_inner, h);
            let outer_point = road.sth_to_xyz(s, t_outer, h);

            // 添加顶点（内边界和外边界各一个）
            // 坐标系转换：OpenDRIVE (x, y, z) -> WebGL (x, z, -y)
            // X_webgl = x_od, Y_webgl = z_od, Z_webgl = -y_od
            vertices.push(inner_point.x as f32);
            vertices.push(inner_point.z as f32);
            vertices.push(-inner_point.y as f32);

            vertices.push(outer_point.x as f32);
            vertices.push(outer_point.z as f32);
            vertices.push(-outer_point.y as f32);
        }

        // 生成索引（三角形带）
        let indices = self.generate_indices(num_samples);

        // 计算法线
        let normals = self.calculate_normals(&vertices, &indices);

        MeshData::new(vertices, indices, normals)
    }

    /// 构建整条道路所有车道的网格
    ///
    /// # 参数
    /// - `road`: 道路对象
    #[wasm_bindgen(js_name = "buildRoadMesh")]
    pub fn build_road_mesh(&self, road: &OdrRoad) -> MeshData {
        let mut all_vertices = Vec::new();
        let mut all_indices = Vec::new();
        let mut all_normals = Vec::new();

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
                self.merge_mesh(&mut all_vertices, &mut all_indices, &mut all_normals, mesh);
            }

            // 构建右侧车道
            for lane in &lane_section.right {
                let mesh = self.build_lane_mesh(road, lane_section, lane, s_start, s_end);
                self.merge_mesh(&mut all_vertices, &mut all_indices, &mut all_normals, mesh);
            }
        }

        MeshData::new(all_vertices, all_indices, all_normals)
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
        let width = Self::eval_lane_width(&lane.width, ds);

        // 计算 lane offset（道路级别的横向偏移）
        let lane_offset = road.eval_lane_offset(s);

        // 计算内侧车道的累积宽度
        let t_inner = self.calculate_inner_offset(lane.id, section, s) + lane_offset;

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

    /// 计算车道内侧边界的 t 坐标
    ///
    /// 通过累加所有内侧车道的宽度来计算
    fn calculate_inner_offset(&self, lane_id: i32, section: &OdrLaneSection, s: f64) -> f64 {
        let ds = s - section.s;
        let mut offset = 0.0;

        if lane_id > 0 {
            // 左侧车道：累加所有更靠近中心线的车道宽度（ID 更小）
            for other_lane in &section.left {
                if other_lane.id > 0 && other_lane.id < lane_id {
                    offset += Self::eval_lane_width(&other_lane.width, ds);
                }
            }
        } else if lane_id < 0 {
            // 右侧车道：累加所有更靠近中心线的车道宽度（数值更大）
            for other_lane in &section.right {
                if other_lane.id < 0 && other_lane.id > lane_id {
                    offset -= Self::eval_lane_width(&other_lane.width, ds);
                }
            }
        }

        offset
    }

    /// 计算车道宽度的多项式值
    ///
    /// # 参数
    /// - `widths`: 车道宽度定义数组
    /// - `ds`: 相对于车道段起点的距离
    ///
    /// # 返回值
    /// 计算得到的车道宽度
    fn eval_lane_width(widths: &Vec<OdrLaneWidth>, ds: f64) -> f64 {
        // 找到适用的 width 定义（最后一个 s_offset <= ds 的）
        let width = widths
            .iter()
            .filter(|w| w.s_offset <= ds)
            .last()
            .unwrap_or_else(|| widths.first().unwrap());

        let local_ds = ds - width.s_offset;

        // 计算三次多项式：a + b*ds + c*ds² + d*ds³
        width.a
            + width.b * local_ds
            + width.c * local_ds.powi(2)
            + width.d * local_ds.powi(3)
    }

    /// 生成三角形索引（三角形带模式）
    ///
    /// # 参数
    /// - `num_samples`: 采样点数量
    ///
    /// # 返回值
    /// 三角形索引数组
    fn generate_indices(&self, num_samples: usize) -> Vec<u16> {
        let mut indices = Vec::new();

        for i in 0..(num_samples - 1) {
            let base = (i * 2) as u16;

            // 每个四边形分成两个三角形
            // Triangle 1: inner[i], outer[i], inner[i+1]
            indices.push(base);
            indices.push(base + 1);
            indices.push(base + 2);

            // Triangle 2: outer[i], outer[i+1], inner[i+1]
            indices.push(base + 1);
            indices.push(base + 3);
            indices.push(base + 2);
        }

        indices
    }

    /// 计算顶点法线
    ///
    /// 使用面法线的平均值作为顶点法线
    fn calculate_normals(&self, vertices: &[f32], indices: &[u16]) -> Vec<f32> {
        let mut normals = vec![0.0f32; vertices.len()];

        // 遍历每个三角形，累加面法线到顶点
        for triangle in indices.chunks(3) {
            let i0 = triangle[0] as usize * 3;
            let i1 = triangle[1] as usize * 3;
            let i2 = triangle[2] as usize * 3;

            // 获取三角形的三个顶点
            let v0 = Vec3::new(
                vertices[i0] as f64,
                vertices[i0 + 1] as f64,
                vertices[i0 + 2] as f64,
            );
            let v1 = Vec3::new(
                vertices[i1] as f64,
                vertices[i1 + 1] as f64,
                vertices[i1 + 2] as f64,
            );
            let v2 = Vec3::new(
                vertices[i2] as f64,
                vertices[i2 + 1] as f64,
                vertices[i2 + 2] as f64,
            );

            // 计算面法线
            let edge1 = v1 - v0;
            let edge2 = v2 - v0;
            let normal = edge1.cross(&edge2);

            // 累加到三个顶点
            for &idx in &[i0, i1, i2] {
                normals[idx] += normal.x as f32;
                normals[idx + 1] += normal.y as f32;
                normals[idx + 2] += normal.z as f32;
            }
        }

        // 归一化所有法线
        for i in (0..normals.len()).step_by(3) {
            let len = (normals[i].powi(2) + normals[i + 1].powi(2) + normals[i + 2].powi(2)).sqrt();
            if len > 1e-6 {
                normals[i] /= len;
                normals[i + 1] /= len;
                normals[i + 2] /= len;
            } else {
                // 如果法线长度太小，使用默认向上方向（Y 轴）
                normals[i] = 0.0;
                normals[i + 1] = 1.0;
                normals[i + 2] = 0.0;
            }
        }

        normals
    }

    /// 合并网格数据
    ///
    /// 将新的网格数据添加到已有的网格中
    fn merge_mesh(
        &self,
        all_vertices: &mut Vec<f32>,
        all_indices: &mut Vec<u16>,
        all_normals: &mut Vec<f32>,
        mesh: MeshData,
    ) {
        let vertex_offset = (all_vertices.len() / 3) as u16;

        // 添加顶点
        all_vertices.extend_from_slice(&mesh.vertices);

        // 添加索引（需要加上偏移量）
        for idx in mesh.indices {
            all_indices.push(idx + vertex_offset);
        }

        // 添加法线
        all_normals.extend_from_slice(&mesh.normals);
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

        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 0.0), 3.5);
        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 10.0), 3.5);
        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 100.0), 3.5);
    }

    #[test]
    fn test_eval_lane_width_linear() {
        // 测试线性变化的宽度：width = 3.0 + 0.1*ds
        let widths = vec![OdrLaneWidth::new(0.0, 3.0, 0.1, 0.0, 0.0)];

        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 0.0), 3.0);
        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 10.0), 4.0);
        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 20.0), 5.0);
    }

    #[test]
    fn test_eval_lane_width_multiple_segments() {
        // 测试多段宽度定义
        let widths = vec![
            OdrLaneWidth::new(0.0, 3.5, 0.0, 0.0, 0.0),
            OdrLaneWidth::new(10.0, 4.0, 0.0, 0.0, 0.0),
            OdrLaneWidth::new(20.0, 3.0, 0.1, 0.0, 0.0),
        ];

        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 5.0), 3.5);
        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 15.0), 4.0);
        assert_eq!(LaneMeshBuilder::eval_lane_width(&widths, 25.0), 3.5); // 3.0 + 0.1*5
    }

    #[test]
    fn test_generate_indices() {
        let builder = LaneMeshBuilder::new(None);

        // 3 个采样点应该生成 4 个三角形（12个索引）
        let indices = builder.generate_indices(3);
        assert_eq!(indices.len(), 12);

        // 验证第一个四边形的索引
        assert_eq!(&indices[0..6], &[0, 1, 2, 1, 3, 2]);
    }

    #[test]
    fn test_calculate_normals_flat_surface() {
        let builder = LaneMeshBuilder::new(None);

        // 创建一个水平面（y=0，即 XZ 平面）
        let vertices = vec![
            0.0, 0.0, 0.0, // 顶点 0
            0.0, 0.0, 1.0, // 顶点 1
            1.0, 0.0, 0.0, // 顶点 2
        ];

        // 单个三角形
        let indices = vec![0, 1, 2];

        let normals = builder.calculate_normals(&vertices, &indices);

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

        let left = vec![build_lane(4, 4.0), build_lane(3, 3.0), build_lane(2, 2.0), build_lane(1, 1.0)];
        let right = vec![
            build_lane(-1, 1.0),
            build_lane(-2, 2.0),
            build_lane(-3, 3.0),
            build_lane(-4, 4.0),
        ];

        let section = OdrLaneSection::new(0.0, left, right, build_lane(0, 0.0), None);
        let builder = LaneMeshBuilder::new(None);
        let s = 5.0; // 任意 s，宽度恒定

        assert!((builder.calculate_inner_offset(1, &section, s) - 0.0).abs() < 1e-6);
        assert!((builder.calculate_inner_offset(2, &section, s) - 1.0).abs() < 1e-6);
        assert!((builder.calculate_inner_offset(3, &section, s) - 3.0).abs() < 1e-6);
        assert!((builder.calculate_inner_offset(4, &section, s) - 6.0).abs() < 1e-6);

        assert!((builder.calculate_inner_offset(-1, &section, s) - 0.0).abs() < 1e-6);
        assert!((builder.calculate_inner_offset(-2, &section, s) + 1.0).abs() < 1e-6);
        assert!((builder.calculate_inner_offset(-3, &section, s) + 3.0).abs() < 1e-6);
        assert!((builder.calculate_inner_offset(-4, &section, s) + 6.0).abs() < 1e-6);
    }
}
