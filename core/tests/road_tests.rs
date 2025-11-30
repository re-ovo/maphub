use maphub_core::odr::models::{
    lane::{lane_link::OdrLaneLink, lane_section::OdrLaneSection, OdrLane},
    road::{
        road_elevation::OdrRoadElevation, road_geometry::OdrRoadGeometry,
        superelevation::OdrSuperelevation, OdrRoad,
    },
};

/// 创建一个最小的车道用于测试
fn create_test_lane(id: i32) -> OdrLane {
    OdrLane::new(
        id,
        "driving".to_string(),
        None,
        None,
        OdrLaneLink::new(None, None),
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
    )
}

/// 创建一个最小的车道分段用于测试
fn create_test_lane_section(s: f64) -> OdrLaneSection {
    OdrLaneSection::new(s, vec![], vec![], create_test_lane(0), None)
}

/// 创建一条简单直线道路用于测试
fn create_test_road_with_elevation_and_superelevation() -> OdrRoad {
    // 创建一条沿 x 轴的直线道路，起点在原点，长度 100m
    let plan_view = vec![OdrRoadGeometry::create_line(
        0.0,   // s
        0.0,   // x
        0.0,   // y
        0.0,   // hdg (沿 x 轴正方向)
        100.0, // length
    )];

    // 添加高程：z = 10 + 0.1*ds（线性上升）
    let elevations = vec![OdrRoadElevation::new(
        0.0,  // s
        10.0, // a (起始高程 10m)
        0.1,  // b (每米上升 0.1m)
        0.0,  // c
        0.0,  // d
    )];

    // 添加超高：roll = 0.05 弧度（约 2.86 度）
    let superelevations = vec![OdrSuperelevation::new(
        0.0,  // s
        0.05, // a (恒定超高 0.05 弧度)
        0.0,  // b
        0.0,  // c
        0.0,  // d
    )];

    OdrRoad::new(
        "test_road".to_string(),
        100.0,
        "-1".to_string(),
        Some("Test Road".to_string()),
        None,
        None,
        Some(plan_view),
        Some(elevations),
        Some(superelevations),
        None,
        None,
        None,
        vec![create_test_lane_section(0.0)],
        vec![],
    )
}

#[test]
fn test_sth_to_xyz_on_reference_line() {
    let road = create_test_road_with_elevation_and_superelevation();

    // 测试参考线上的点 (t=0, h=0)
    let result = road.sth_to_xyz(50.0, 0.0, 0.0);

    // x 应该等于 s=50（直线沿 x 轴）
    assert!(
        (result.x - 50.0).abs() < 1e-10,
        "x should be 50.0, got {}",
        result.x
    );

    // y 应该等于 0（直线沿 x 轴）
    assert!(
        result.y.abs() < 1e-10,
        "y should be 0.0, got {}",
        result.y
    );

    // z = 10 + 0.1 * 50 = 15
    assert!(
        (result.z - 15.0).abs() < 1e-10,
        "z should be 15.0, got {}",
        result.z
    );
}

#[test]
fn test_sth_to_xyz_with_lateral_offset() {
    let road = create_test_road_with_elevation_and_superelevation();

    // 测试带横向偏移的点 (t=2.0, h=0)
    let result = road.sth_to_xyz(50.0, 2.0, 0.0);

    // x 应该仍然等于 50（直线沿 x 轴，横向偏移垂直于行进方向）
    assert!(
        (result.x - 50.0).abs() < 1e-10,
        "x should be 50.0, got {}",
        result.x
    );

    // y 应该等于 2（横向偏移 t=2 向左）
    assert!(
        (result.y - 2.0).abs() < 1e-10,
        "y should be 2.0, got {}",
        result.y
    );

    // z = 基础高程 + 超高影响 = 15 + 2 * tan(0.05)
    let expected_z = 15.0 + 2.0 * 0.05_f64.tan();
    assert!(
        (result.z - expected_z).abs() < 1e-10,
        "z should be {}, got {}",
        expected_z,
        result.z
    );
}

#[test]
fn test_sth_to_xyz_with_height_offset() {
    let road = create_test_road_with_elevation_and_superelevation();

    // 测试带高度偏移的点 (t=0, h=3.0)
    let result = road.sth_to_xyz(50.0, 0.0, 3.0);

    assert!(
        (result.x - 50.0).abs() < 1e-10,
        "x should be 50.0, got {}",
        result.x
    );
    assert!(
        result.y.abs() < 1e-10,
        "y should be 0.0, got {}",
        result.y
    );

    // z = 基础高程 + h = 15 + 3 = 18
    assert!(
        (result.z - 18.0).abs() < 1e-10,
        "z should be 18.0, got {}",
        result.z
    );
}

#[test]
fn test_sth_to_xyz_with_all_offsets() {
    let road = create_test_road_with_elevation_and_superelevation();

    // 测试同时带横向和高度偏移的点 (t=-3.0, h=2.0)
    // 负的 t 表示向右偏移
    let result = road.sth_to_xyz(50.0, -3.0, 2.0);

    assert!(
        (result.x - 50.0).abs() < 1e-10,
        "x should be 50.0, got {}",
        result.x
    );

    // y = -3（向右偏移）
    assert!(
        (result.y - (-3.0)).abs() < 1e-10,
        "y should be -3.0, got {}",
        result.y
    );

    // z = 基础高程 + 超高影响 + h = 15 + (-3) * tan(0.05) + 2
    let expected_z = 15.0 + (-3.0) * 0.05_f64.tan() + 2.0;
    assert!(
        (result.z - expected_z).abs() < 1e-10,
        "z should be {}, got {}",
        expected_z,
        result.z
    );
}

#[test]
fn test_sth_to_xyz_with_polynomial_elevation() {
    // 创建带多项式高程的道路
    let plan_view = vec![OdrRoadGeometry::create_line(0.0, 0.0, 0.0, 0.0, 100.0)];

    // 高程使用三次多项式：z = 5 + 0.1*ds + 0.001*ds^2 + 0.00001*ds^3
    let elevations = vec![OdrRoadElevation::new(
        0.0,     // s
        5.0,     // a
        0.1,     // b
        0.001,   // c
        0.00001, // d
    )];

    let road = OdrRoad::new(
        "poly_road".to_string(),
        100.0,
        "-1".to_string(),
        None,
        None,
        None,
        Some(plan_view),
        Some(elevations),
        None,
        None,
        None,
        None,
        vec![create_test_lane_section(0.0)],
        vec![],
    );

    let result = road.sth_to_xyz(20.0, 0.0, 0.0);

    // z = 5 + 0.1*20 + 0.001*20^2 + 0.00001*20^3
    //   = 5 + 2 + 0.4 + 0.08 = 7.48
    let expected_z = 5.0 + 0.1 * 20.0 + 0.001 * 400.0 + 0.00001 * 8000.0;
    assert!(
        (result.z - expected_z).abs() < 1e-10,
        "z should be {}, got {}",
        expected_z,
        result.z
    );
}

#[test]
fn test_sth_to_xyz_with_polynomial_superelevation() {
    // 创建带多项式超高的道路
    let plan_view = vec![OdrRoadGeometry::create_line(0.0, 0.0, 0.0, 0.0, 100.0)];

    // 超高使用二次多项式：roll = 0.01 + 0.001*ds + 0.00001*ds^2
    let superelevations = vec![OdrSuperelevation::new(
        0.0,     // s
        0.01,    // a
        0.001,   // b
        0.00001, // c
        0.0,     // d
    )];

    let road = OdrRoad::new(
        "super_road".to_string(),
        100.0,
        "-1".to_string(),
        None,
        None,
        None,
        Some(plan_view),
        None,
        Some(superelevations),
        None,
        None,
        None,
        vec![create_test_lane_section(0.0)],
        vec![],
    );

    let result = road.sth_to_xyz(30.0, 5.0, 0.0);

    // roll = 0.01 + 0.001*30 + 0.00001*30^2 = 0.01 + 0.03 + 0.009 = 0.049
    let expected_roll: f64 = 0.01 + 0.001 * 30.0 + 0.00001 * 900.0;
    let expected_z = 5.0 * expected_roll.tan();

    assert!(
        (result.z - expected_z).abs() < 1e-10,
        "z should be {}, got {}",
        expected_z,
        result.z
    );
}

#[test]
fn test_sth_to_xyz_with_multiple_elevation_segments() {
    // 创建带多段高程的道路
    let plan_view = vec![OdrRoadGeometry::create_line(0.0, 0.0, 0.0, 0.0, 100.0)];

    // 两段高程：
    // 0-50m: z = 10 + 0.1*ds
    // 50-100m: z = 20 + 0.2*ds
    let elevations = vec![
        OdrRoadElevation::new(0.0, 10.0, 0.1, 0.0, 0.0),
        OdrRoadElevation::new(50.0, 20.0, 0.2, 0.0, 0.0),
    ];

    let road = OdrRoad::new(
        "multi_elev_road".to_string(),
        100.0,
        "-1".to_string(),
        None,
        None,
        None,
        Some(plan_view),
        Some(elevations),
        None,
        None,
        None,
        None,
        vec![create_test_lane_section(0.0)],
        vec![],
    );

    // 测试第一段 s=30
    let result1 = road.sth_to_xyz(30.0, 0.0, 0.0);
    let expected_z1 = 10.0 + 0.1 * 30.0; // = 13
    assert!(
        (result1.z - expected_z1).abs() < 1e-10,
        "z at s=30 should be {}, got {}",
        expected_z1,
        result1.z
    );

    // 测试第二段 s=70
    let result2 = road.sth_to_xyz(70.0, 0.0, 0.0);
    let expected_z2 = 20.0 + 0.2 * 20.0; // ds = 70 - 50 = 20, z = 24
    assert!(
        (result2.z - expected_z2).abs() < 1e-10,
        "z at s=70 should be {}, got {}",
        expected_z2,
        result2.z
    );
}

#[test]
fn test_sth_to_xyz_with_combined_elevation_and_superelevation() {
    // 创建同时带高程和超高的道路，验证两者的组合效果
    let plan_view = vec![OdrRoadGeometry::create_line(0.0, 0.0, 0.0, 0.0, 100.0)];

    // 高程：z = 5 + 0.05*ds
    let elevations = vec![OdrRoadElevation::new(0.0, 5.0, 0.05, 0.0, 0.0)];

    // 超高：roll = 0.1 弧度（约 5.7 度，较大的超高便于测试）
    let superelevations = vec![OdrSuperelevation::new(0.0, 0.1, 0.0, 0.0, 0.0)];

    let road = OdrRoad::new(
        "combined_road".to_string(),
        100.0,
        "-1".to_string(),
        None,
        None,
        None,
        Some(plan_view),
        Some(elevations),
        Some(superelevations),
        None,
        None,
        None,
        vec![create_test_lane_section(0.0)],
        vec![],
    );

    // 测试 s=40, t=4, h=1
    let result = road.sth_to_xyz(40.0, 4.0, 1.0);

    // 基础高程 = 5 + 0.05 * 40 = 7
    // 超高影响 = 4 * tan(0.1) ≈ 0.4017
    // 最终 z = 7 + 0.4017 + 1 = 8.4017
    let base_elevation = 5.0 + 0.05 * 40.0;
    let superelevation_effect = 4.0 * 0.1_f64.tan();
    let expected_z = base_elevation + superelevation_effect + 1.0;

    assert!(
        (result.x - 40.0).abs() < 1e-10,
        "x should be 40.0, got {}",
        result.x
    );
    assert!(
        (result.y - 4.0).abs() < 1e-10,
        "y should be 4.0, got {}",
        result.y
    );
    assert!(
        (result.z - expected_z).abs() < 1e-10,
        "z should be {}, got {}",
        expected_z,
        result.z
    );
}
