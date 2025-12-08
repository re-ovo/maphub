use wasm_bindgen::prelude::*;

use super::vec3::Vec3;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct MeshData {
    #[wasm_bindgen(getter_with_clone)]
    pub vertices: Vec<f32>,
    #[wasm_bindgen(getter_with_clone)]
    pub indices: Vec<u16>,
    #[wasm_bindgen(getter_with_clone)]
    pub normals: Vec<f32>,
}

#[wasm_bindgen]
impl MeshData {
    #[wasm_bindgen(constructor)]
    pub fn new(vertices: Vec<f32>, indices: Vec<u16>, normals: Vec<f32>) -> Self {
        Self {
            vertices,
            indices,
            normals,
        }
    }

    /// 创建空的 MeshData
    pub fn empty() -> Self {
        Self {
            vertices: Vec::new(),
            indices: Vec::new(),
            normals: Vec::new(),
        }
    }
}

impl MeshData {
    /// 合并另一个 mesh 到当前 mesh
    ///
    /// 自动处理索引偏移
    pub fn merge(&mut self, other: MeshData) {
        if other.vertices.is_empty() {
            return;
        }

        let vertex_offset = (self.vertices.len() / 3) as u16;

        self.vertices.extend_from_slice(&other.vertices);

        for idx in other.indices {
            self.indices.push(idx + vertex_offset);
        }

        self.normals.extend_from_slice(&other.normals);
    }

    /// 生成三角形带索引
    ///
    /// 用于由成对顶点（内侧/外侧）组成的条带网格
    ///
    /// # 参数
    /// * `num_samples` - 采样点数量（每个采样点有 2 个顶点）
    pub fn generate_strip_indices(num_samples: usize) -> Vec<u16> {
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
    pub fn calculate_normals(vertices: &[f32], indices: &[u16]) -> Vec<f32> {
        let mut normals = vec![0.0f32; vertices.len()];

        // 遍历每个三角形，累加面法线到顶点
        for triangle in indices.chunks(3) {
            let i0 = triangle[0] as usize * 3;
            let i1 = triangle[1] as usize * 3;
            let i2 = triangle[2] as usize * 3;

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

            let edge1 = v1 - v0;
            let edge2 = v2 - v0;
            let normal = edge1.cross(&edge2);

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
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct LineMeshData {
    #[wasm_bindgen(getter_with_clone)]
    pub vertices: Vec<f32>,
}

#[wasm_bindgen]
impl LineMeshData {
    #[wasm_bindgen(constructor)]
    pub fn new(vertices: Vec<f32>) -> Self {
        Self { vertices }
    }

    pub fn empty() -> Self {
        Self {
            vertices: Vec::new(),
        }
    }
}
