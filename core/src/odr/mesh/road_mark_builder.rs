use wasm_bindgen::prelude::*;

use crate::{
    math::mesh::MeshData,
    odr::models::{
        lane::{
            lane_geometry::OdrLaneWidth,
            lane_road_mark::{OdrRoadMark, OdrRoadMarkColor, OdrRoadMarkSway, OdrRoadMarkType},
            lane_section::OdrLaneSection,
            OdrLane,
        },
        road::OdrRoad,
    },
};

/// Single road mark mesh with its color
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct RoadMarkMeshItem {
    mesh: MeshData,
    color: OdrRoadMarkColor,
}

#[wasm_bindgen]
impl RoadMarkMeshItem {
    #[wasm_bindgen(getter)]
    pub fn mesh(&self) -> MeshData {
        self.mesh.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn color(&self) -> OdrRoadMarkColor {
        self.color.clone()
    }
}

/// List of road mark meshes
///
/// wasm-bindgen doesn't fully support `Vec<T>` for custom types,
/// so we use this wrapper to provide array-like access from JS.
#[wasm_bindgen]
pub struct RoadMarkMeshList {
    items: Vec<RoadMarkMeshItem>,
}

#[wasm_bindgen]
impl RoadMarkMeshList {
    #[wasm_bindgen(getter)]
    pub fn length(&self) -> usize {
        self.items.len()
    }

    pub fn get(&self, index: usize) -> Option<RoadMarkMeshItem> {
        self.items.get(index).cloned()
    }
}

/// Default line width when not specified (meters)
const DEFAULT_LINE_WIDTH: f64 = 0.15;

/// Default line height/thickness above road surface (meters)
const DEFAULT_LINE_HEIGHT: f64 = 0.005;

/// Default broken line length (meters)
const DEFAULT_BROKEN_LENGTH: f64 = 3.0;

/// Default broken line space (meters)
const DEFAULT_BROKEN_SPACE: f64 = 6.0;

/// Default gap between double lines (meters)
const DEFAULT_DOUBLE_LINE_GAP: f64 = 0.1;

/// Internal struct for default line pattern generation
struct DefaultLine {
    t_offset: f64,
    length: f64,
    space: f64,
    width: f64,
}

/// Road marking mesh builder
///
/// Builds triangle meshes for lane road markings (lines on the road surface)
#[wasm_bindgen]
pub struct RoadMarkMeshBuilder {
    /// Sample step along s direction (meters)
    sample_step: f64,
}

#[wasm_bindgen]
impl RoadMarkMeshBuilder {
    /// Create a new road mark mesh builder
    ///
    /// # Arguments
    /// - `sample_step`: Sampling interval along reference line (meters), default 0.2
    #[wasm_bindgen(constructor)]
    pub fn new(sample_step: Option<f64>) -> Self {
        Self {
            sample_step: sample_step.unwrap_or(0.2),
        }
    }

    /// Build road mark meshes for a single lane
    ///
    /// Returns a list of meshes, each with its own color, allowing proper
    /// multi-color rendering when a lane has multiple road marks.
    ///
    /// # Arguments
    /// - `road`: Road object
    /// - `lane_section`: Lane section
    /// - `lane`: Lane to build road marks for
    /// - `s_start`: Lane section start s-coordinate
    /// - `s_end`: Lane section end s-coordinate
    #[wasm_bindgen(js_name = "buildLaneRoadMarks")]
    pub fn build_lane_road_marks(
        &self,
        road: &OdrRoad,
        lane_section: &OdrLaneSection,
        lane: &OdrLane,
        s_start: f64,
        s_end: f64,
    ) -> RoadMarkMeshList {
        let mut items = Vec::new();

        // Process each road mark definition
        for (i, road_mark) in lane.road_marks.iter().enumerate() {
            // Skip None type
            if matches!(road_mark.mark_type, OdrRoadMarkType::None) {
                continue;
            }

            // Calculate valid s range for this road mark
            let mark_s_start = s_start + road_mark.s_offset;
            let mark_s_end = if i + 1 < lane.road_marks.len() {
                s_start + lane.road_marks[i + 1].s_offset
            } else {
                s_end
            };

            // Skip if range is invalid
            if mark_s_end <= mark_s_start {
                continue;
            }

            // Build mesh based on definition type
            let mesh = if road_mark.explicit.is_some() {
                self.build_explicit_lines(road, lane_section, lane, road_mark, mark_s_start)
            } else if road_mark.type_detail.is_some() {
                self.build_type_lines(
                    road,
                    lane_section,
                    lane,
                    road_mark,
                    mark_s_start,
                    mark_s_end,
                )
            } else {
                self.build_default_lines(
                    road,
                    lane_section,
                    lane,
                    road_mark,
                    mark_s_start,
                    mark_s_end,
                )
            };

            // Only add non-empty meshes
            if !mesh.vertices.is_empty() {
                items.push(RoadMarkMeshItem {
                    mesh,
                    color: road_mark.color.clone(),
                });
            }
        }

        RoadMarkMeshList { items }
    }
}

impl RoadMarkMeshBuilder {
    /// Build mesh for <type> defined road marks (automatically repeated)
    fn build_type_lines(
        &self,
        road: &OdrRoad,
        section: &OdrLaneSection,
        lane: &OdrLane,
        road_mark: &OdrRoadMark,
        mark_s_start: f64,
        mark_s_end: f64,
    ) -> MeshData {
        let type_detail = road_mark.type_detail.as_ref().unwrap();
        let mut result = MeshData::empty();

        let default_width = road_mark.width.unwrap_or(DEFAULT_LINE_WIDTH);

        for line in &type_detail.lines {
            let line_width = line.width.unwrap_or(default_width);
            let pattern_length = line.length + line.space;

            // Handle solid lines (space = 0)
            if line.space <= 0.0 || line.length <= 0.0 {
                // Solid line - render as single segment
                let s_start_actual = mark_s_start + line.s_offset;
                if s_start_actual < mark_s_end {
                    let mesh = self.build_line_segment(
                        road,
                        section,
                        lane,
                        road_mark,
                        s_start_actual,
                        mark_s_end,
                        line.t_offset,
                        line_width,
                    );
                    result.merge(mesh);
                }
            } else {
                // Dashed line - repeat pattern
                let mut s = mark_s_start + line.s_offset;

                while s < mark_s_end {
                    let segment_end = (s + line.length).min(mark_s_end);

                    if segment_end > s {
                        let mesh = self.build_line_segment(
                            road,
                            section,
                            lane,
                            road_mark,
                            s,
                            segment_end,
                            line.t_offset,
                            line_width,
                        );
                        result.merge(mesh);
                    }

                    s += pattern_length;
                }
            }
        }

        result
    }

    /// Build mesh for <explicit> defined road marks (no repetition)
    fn build_explicit_lines(
        &self,
        road: &OdrRoad,
        section: &OdrLaneSection,
        lane: &OdrLane,
        road_mark: &OdrRoadMark,
        mark_s_start: f64,
    ) -> MeshData {
        let explicit = road_mark.explicit.as_ref().unwrap();
        let mut result = MeshData::empty();

        let default_width = road_mark.width.unwrap_or(DEFAULT_LINE_WIDTH);

        for line in &explicit.lines {
            let s_start = mark_s_start + line.s_offset;
            let s_end = s_start + line.length;
            let line_width = line.width.unwrap_or(default_width);

            let mesh = self.build_line_segment(
                road,
                section,
                lane,
                road_mark,
                s_start,
                s_end,
                line.t_offset,
                line_width,
            );
            result.merge(mesh);
        }

        result
    }

    /// Build mesh using default patterns based on mark_type
    fn build_default_lines(
        &self,
        road: &OdrRoad,
        section: &OdrLaneSection,
        lane: &OdrLane,
        road_mark: &OdrRoadMark,
        mark_s_start: f64,
        mark_s_end: f64,
    ) -> MeshData {
        let default_lines = self.get_default_lines_for_type(road_mark);

        if default_lines.is_empty() {
            return MeshData::empty();
        }

        let mut result = MeshData::empty();

        for line in default_lines {
            if line.space <= 0.0 {
                // Solid line
                let mesh = self.build_line_segment(
                    road,
                    section,
                    lane,
                    road_mark,
                    mark_s_start,
                    mark_s_end,
                    line.t_offset,
                    line.width,
                );
                result.merge(mesh);
            } else {
                // Dashed line
                let pattern_length = line.length + line.space;
                let mut s = mark_s_start;

                while s < mark_s_end {
                    let segment_end = (s + line.length).min(mark_s_end);

                    if segment_end > s {
                        let mesh = self.build_line_segment(
                            road,
                            section,
                            lane,
                            road_mark,
                            s,
                            segment_end,
                            line.t_offset,
                            line.width,
                        );
                        result.merge(mesh);
                    }

                    s += pattern_length;
                }
            }
        }

        result
    }

    /// Get default line patterns based on road mark type
    fn get_default_lines_for_type(&self, road_mark: &OdrRoadMark) -> Vec<DefaultLine> {
        let width = road_mark.width.unwrap_or(DEFAULT_LINE_WIDTH);
        let half_width = width / 2.0;
        let gap = DEFAULT_DOUBLE_LINE_GAP;

        match road_mark.mark_type {
            OdrRoadMarkType::Solid | OdrRoadMarkType::Edge => {
                vec![DefaultLine {
                    t_offset: 0.0,
                    length: f64::MAX,
                    space: 0.0,
                    width,
                }]
            }
            OdrRoadMarkType::Broken => {
                vec![DefaultLine {
                    t_offset: 0.0,
                    length: DEFAULT_BROKEN_LENGTH,
                    space: DEFAULT_BROKEN_SPACE,
                    width,
                }]
            }
            OdrRoadMarkType::SolidSolid => {
                vec![
                    DefaultLine {
                        t_offset: -(half_width + gap / 2.0),
                        length: f64::MAX,
                        space: 0.0,
                        width: half_width,
                    },
                    DefaultLine {
                        t_offset: half_width + gap / 2.0,
                        length: f64::MAX,
                        space: 0.0,
                        width: half_width,
                    },
                ]
            }
            OdrRoadMarkType::BrokenBroken => {
                vec![
                    DefaultLine {
                        t_offset: -(half_width + gap / 2.0),
                        length: DEFAULT_BROKEN_LENGTH,
                        space: DEFAULT_BROKEN_SPACE,
                        width: half_width,
                    },
                    DefaultLine {
                        t_offset: half_width + gap / 2.0,
                        length: DEFAULT_BROKEN_LENGTH,
                        space: DEFAULT_BROKEN_SPACE,
                        width: half_width,
                    },
                ]
            }
            OdrRoadMarkType::SolidBroken => {
                vec![
                    DefaultLine {
                        t_offset: -(half_width + gap / 2.0),
                        length: f64::MAX,
                        space: 0.0,
                        width: half_width,
                    },
                    DefaultLine {
                        t_offset: half_width + gap / 2.0,
                        length: DEFAULT_BROKEN_LENGTH,
                        space: DEFAULT_BROKEN_SPACE,
                        width: half_width,
                    },
                ]
            }
            OdrRoadMarkType::BrokenSolid => {
                vec![
                    DefaultLine {
                        t_offset: -(half_width + gap / 2.0),
                        length: DEFAULT_BROKEN_LENGTH,
                        space: DEFAULT_BROKEN_SPACE,
                        width: half_width,
                    },
                    DefaultLine {
                        t_offset: half_width + gap / 2.0,
                        length: f64::MAX,
                        space: 0.0,
                        width: half_width,
                    },
                ]
            }
            OdrRoadMarkType::BottsDots => {
                // Botts dots: small squares with spacing
                vec![DefaultLine {
                    t_offset: 0.0,
                    length: 0.1,
                    space: 0.3,
                    width: 0.1,
                }]
            }
            // Skip types that don't render visible lines
            OdrRoadMarkType::None
            | OdrRoadMarkType::Grass
            | OdrRoadMarkType::Curb
            | OdrRoadMarkType::Custom => {
                vec![]
            }
            // Handle wasm-bindgen generated invalid variant
            _ => vec![],
        }
    }

    /// Build mesh for a single line segment
    fn build_line_segment(
        &self,
        road: &OdrRoad,
        section: &OdrLaneSection,
        lane: &OdrLane,
        road_mark: &OdrRoadMark,
        s_start: f64,
        s_end: f64,
        t_offset: f64,
        width: f64,
    ) -> MeshData {
        let height = road_mark.height.unwrap_or(DEFAULT_LINE_HEIGHT);
        let half_width = width / 2.0;

        let length = s_end - s_start;
        let num_samples = ((length / self.sample_step).ceil() as usize).max(2);

        let mut vertices = Vec::new();

        // Direction sign: left lanes (+), right lanes (-)
        let sign = if lane.id >= 0 { 1.0 } else { -1.0 };

        for i in 0..num_samples {
            let t = i as f64 / (num_samples - 1) as f64;
            let s = s_start + t * length;

            // ds relative to road mark start
            let ds = s - (section.s + road_mark.s_offset);

            // Get lane outer border t coordinate
            let t_base = self.get_lane_outer_t(lane, section, road, s);

            // Calculate sway offset
            let sway_offset = Self::eval_sway_offset(&road_mark.sways, ds);

            // Final t position = base + (sway + tOffset) * sign
            let t_center = t_base + sign * (sway_offset + t_offset);

            // Line inner/outer boundaries
            let t_inner = t_center - sign * half_width;
            let t_outer = t_center + sign * half_width;

            // Convert to 3D coordinates (line above road surface)
            let inner_pt = road.sth_to_xyz(s, t_inner, height);
            let outer_pt = road.sth_to_xyz(s, t_outer, height);

            // Coordinate system conversion: OpenDRIVE -> WebGL
            // X_webgl = x_od, Y_webgl = z_od, Z_webgl = -y_od
            vertices.push(inner_pt.x as f32);
            vertices.push(inner_pt.z as f32);
            vertices.push(-inner_pt.y as f32);

            vertices.push(outer_pt.x as f32);
            vertices.push(outer_pt.z as f32);
            vertices.push(-outer_pt.y as f32);
        }

        let indices = MeshData::generate_strip_indices(num_samples);
        let normals = MeshData::calculate_normals(&vertices, &indices);

        MeshData::new(vertices, indices, normals)
    }

    /// Get lane outer border t coordinate at given s
    fn get_lane_outer_t(
        &self,
        lane: &OdrLane,
        section: &OdrLaneSection,
        road: &OdrRoad,
        s: f64,
    ) -> f64 {
        let ds = s - section.s;

        // Calculate current lane width
        let width = OdrLaneWidth::eval_widths(&lane.width, ds);

        // Get lane offset (road-level lateral offset)
        let lane_offset = road.eval_lane_offset(s);

        // Calculate inner offset (accumulated width of inner lanes)
        let t_inner = section.calculate_inner_offset(lane.id, s) + lane_offset;

        // Outer border = inner + width (considering direction)
        if lane.id > 0 {
            t_inner + width
        } else if lane.id < 0 {
            t_inner - width
        } else {
            // Center lane (id=0): return lane offset
            lane_offset
        }
    }

    /// Evaluate sway offset polynomial
    fn eval_sway_offset(sways: &[OdrRoadMarkSway], ds: f64) -> f64 {
        let sway = sways.iter().filter(|s| s.ds <= ds).last();

        match sway {
            Some(s) => {
                let local_ds = ds - s.ds;
                s.a + s.b * local_ds + s.c * local_ds.powi(2) + s.d * local_ds.powi(3)
            }
            None => 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::odr::models::lane::lane_link::OdrLaneLink;
    use crate::odr::models::lane::lane_road_mark::OdrRoadMarkColor;

    fn build_test_lane(id: i32, width: f64) -> OdrLane {
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

    fn build_test_road_mark(mark_type: OdrRoadMarkType) -> OdrRoadMark {
        OdrRoadMark {
            s_offset: 0.0,
            mark_type,
            color: OdrRoadMarkColor::White,
            width: Some(0.15),
            height: Some(0.005),
            material: None,
            weight: None,
            lane_change: None,
            type_detail: None,
            explicit: None,
            sways: Vec::new(),
        }
    }

    #[test]
    fn test_eval_sway_offset_empty() {
        let sways: Vec<OdrRoadMarkSway> = vec![];
        assert_eq!(RoadMarkMeshBuilder::eval_sway_offset(&sways, 5.0), 0.0);
    }

    #[test]
    fn test_eval_sway_offset_linear() {
        let sways = vec![OdrRoadMarkSway {
            ds: 0.0,
            a: 0.0,
            b: 0.1,
            c: 0.0,
            d: 0.0,
        }];
        assert!((RoadMarkMeshBuilder::eval_sway_offset(&sways, 10.0) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_eval_sway_offset_multiple_segments() {
        let sways = vec![
            OdrRoadMarkSway {
                ds: 0.0,
                a: 0.0,
                b: 0.1,
                c: 0.0,
                d: 0.0,
            },
            OdrRoadMarkSway {
                ds: 10.0,
                a: 1.0,
                b: 0.0,
                c: 0.0,
                d: 0.0,
            },
        ];
        // At ds=5, use first sway: 0 + 0.1*5 = 0.5
        assert!((RoadMarkMeshBuilder::eval_sway_offset(&sways, 5.0) - 0.5).abs() < 1e-6);
        // At ds=15, use second sway: 1.0 + 0*(15-10) = 1.0
        assert!((RoadMarkMeshBuilder::eval_sway_offset(&sways, 15.0) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_get_default_lines_for_solid() {
        let builder = RoadMarkMeshBuilder::new(None);
        let road_mark = build_test_road_mark(OdrRoadMarkType::Solid);
        let lines = builder.get_default_lines_for_type(&road_mark);

        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0].space, 0.0);
    }

    #[test]
    fn test_get_default_lines_for_broken() {
        let builder = RoadMarkMeshBuilder::new(None);
        let road_mark = build_test_road_mark(OdrRoadMarkType::Broken);
        let lines = builder.get_default_lines_for_type(&road_mark);

        assert_eq!(lines.len(), 1);
        assert!(lines[0].space > 0.0);
        assert!(lines[0].length > 0.0);
    }

    #[test]
    fn test_get_default_lines_for_double() {
        let builder = RoadMarkMeshBuilder::new(None);
        let road_mark = build_test_road_mark(OdrRoadMarkType::SolidSolid);
        let lines = builder.get_default_lines_for_type(&road_mark);

        assert_eq!(lines.len(), 2);
        // Two lines should be on opposite sides
        assert!(lines[0].t_offset * lines[1].t_offset < 0.0);
    }

    #[test]
    fn test_get_default_lines_for_none() {
        let builder = RoadMarkMeshBuilder::new(None);
        let road_mark = build_test_road_mark(OdrRoadMarkType::None);
        let lines = builder.get_default_lines_for_type(&road_mark);

        assert!(lines.is_empty());
    }

    #[test]
    fn test_generate_indices() {
        let indices = MeshData::generate_strip_indices(3);

        // 3 samples -> 2 quads -> 4 triangles -> 12 indices
        assert_eq!(indices.len(), 12);
        assert_eq!(&indices[0..6], &[0, 1, 2, 1, 3, 2]);
    }
}
