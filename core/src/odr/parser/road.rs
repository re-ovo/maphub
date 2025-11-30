use anyhow::{Context, Result};
use quick_xml::Reader;
use quick_xml::events::Event;

use crate::odr::models::enums::{OdrContactPoint, OdrElementDir};
use crate::odr::models::road::OdrRoad;
use crate::odr::models::road::road_elevation::OdrRoadElevation;
use crate::odr::models::road::road_geometry::{OdrParamPoly3PRange, OdrRoadGeometry};
use crate::odr::models::road::road_link::{OdrRoadLink, OdrRoadLinkElementType};
use crate::odr::models::road::road_type::OdrRoadType;
use crate::odr::models::road::shape::OdrShape;
use crate::odr::models::road::superelevation::OdrSuperelevation;
use crate::odr::models::road::traffic_rule::OdrTrafficRule;

/// 解析 Road 元素
pub fn parse_road(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrRoad> {
    let mut id = String::new();
    let mut junction = String::from("-1");
    let mut length = 0.0_f64;
    let mut name: Option<String> = None;
    let mut traffic_rule = OdrTrafficRule::default();

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"id" => {
                id = value.to_string();
            }
            b"junction" => {
                junction = value.to_string();
            }
            b"length" => {
                length = value.parse().context("解析 length 错误")?;
            }
            b"name" => {
                name = Some(value.to_string());
            }
            b"rule" => {
                traffic_rule = match value.as_ref() {
                    "LHT" => OdrTrafficRule::LHT,
                    "RHT" => OdrTrafficRule::RHT,
                    _ => OdrTrafficRule::default(),
                };
            }
            _ => {}
        }
    }

    let mut predecessor: Option<OdrRoadLink> = None;
    let mut successor: Option<OdrRoadLink> = None;
    let mut road_types: Vec<OdrRoadType> = Vec::new();
    let mut plan_view: Vec<OdrRoadGeometry> = Vec::new();
    let mut elevations: Vec<OdrRoadElevation> = Vec::new();
    let mut superelevations: Vec<OdrSuperelevation> = Vec::new();
    let mut shapes: Vec<OdrShape> = Vec::new();
    let mut lane_sections = Vec::new();
    let mut lane_offsets = Vec::new();

    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => match e.name().as_ref() {
                    b"link" => {
                        let (pred, succ) = parse_link(reader)?;
                        predecessor = pred;
                        successor = succ;
                    }
                    b"type" => {
                        let road_type = parse_road_type(reader, e, false)?;
                        road_types.push(road_type);
                    }
                    b"planView" => {
                        plan_view = parse_plan_view(reader)?;
                    }
                    b"elevationProfile" => {
                        elevations = parse_elevation_profile(reader)?;
                    }
                    b"lateralProfile" => {
                        let (supers, shps) = parse_lateral_profile(reader)?;
                        superelevations = supers;
                        shapes = shps;
                    }
                    b"lanes" => {
                        let (sections, offsets) = super::lane::parse_lanes(reader)?;
                        lane_sections = sections;
                        lane_offsets = offsets;
                    }
                    _ => {
                        // 忽略其他子元素
                        reader
                            .read_to_end(e.name())
                            .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                    }
                },
                Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                    b"type" => {
                        let road_type = parse_road_type(reader, e, true)?;
                        road_types.push(road_type);
                    }
                    _ => {}
                },
                Ok(Event::End(ref e)) if e.name().as_ref() == b"road" => {
                    break;
                }
                Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in road")),
                Err(e) => return Err(anyhow::anyhow!("Error parsing road children: {:?}", e)),
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(OdrRoad::new(
        id,
        length,
        junction,
        name,
        Some(traffic_rule),
        Some(road_types),
        Some(plan_view),
        Some(elevations),
        Some(superelevations),
        Some(shapes),
        predecessor,
        successor,
        lane_sections,
        lane_offsets,
    ))
}

/// 解析 link 元素，返回 (predecessor, successor)
fn parse_link(reader: &mut Reader<&[u8]>) -> Result<(Option<OdrRoadLink>, Option<OdrRoadLink>)> {
    let mut predecessor: Option<OdrRoadLink> = None;
    let mut successor: Option<OdrRoadLink> = None;
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"predecessor" => {
                    predecessor = Some(parse_road_link(e)?);
                }
                b"successor" => {
                    successor = Some(parse_road_link(e)?);
                }
                _ => {}
            },
            Ok(Event::End(ref e)) if e.name().as_ref() == b"link" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in link")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing link: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok((predecessor, successor))
}

/// 解析 predecessor/successor 元素
fn parse_road_link(element: &quick_xml::events::BytesStart) -> Result<OdrRoadLink> {
    let mut element_id = String::new();
    let mut element_type = OdrRoadLinkElementType::Road;
    let mut contact_point: Option<OdrContactPoint> = None;
    let mut element_dir: Option<OdrElementDir> = None;
    let mut element_s: Option<f64> = None;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"elementId" => {
                element_id = value.to_string();
            }
            b"elementType" => {
                element_type = match value.as_ref() {
                    "junction" => OdrRoadLinkElementType::Junction,
                    "road" => OdrRoadLinkElementType::Road,
                    _ => OdrRoadLinkElementType::Road,
                };
            }
            b"contactPoint" => {
                contact_point = Some(match value.as_ref() {
                    "start" => OdrContactPoint::Start,
                    "end" => OdrContactPoint::End,
                    _ => OdrContactPoint::Start,
                });
            }
            b"elementDir" => {
                element_dir = Some(match value.as_ref() {
                    "+" => OdrElementDir::Positive,
                    "-" => OdrElementDir::Negative,
                    _ => OdrElementDir::Positive,
                });
            }
            b"elementS" => {
                element_s = Some(value.parse().context("解析 elementS 错误")?);
            }
            _ => {}
        }
    }

    Ok(OdrRoadLink {
        element_id,
        element_type,
        contact_point,
        element_dir,
        element_s,
    })
}

/// 解析 type 元素
fn parse_road_type(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrRoadType> {
    let mut s = 0.0_f64;
    let mut road_type = String::from("unknown");
    let mut country: Option<String> = None;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"s" => {
                s = value.parse().context("解析 s 错误")?;
            }
            b"type" => {
                road_type = value.to_string();
            }
            b"country" => {
                country = Some(value.to_string());
            }
            _ => {}
        }
    }

    if !is_empty {
        // 如果不是空元素，读取到结束标签
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::End(ref e)) if e.name().as_ref() == b"type" => {
                    break;
                }
                Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in type")),
                Err(e) => return Err(anyhow::anyhow!("Error parsing type: {:?}", e)),
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(OdrRoadType::new(s, road_type, country))
}

/// 解析 planView 元素
fn parse_plan_view(reader: &mut Reader<&[u8]>) -> Result<Vec<OdrRoadGeometry>> {
    let mut geometries = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                if e.name().as_ref() == b"geometry" {
                    let geometry = parse_geometry(reader, e)?;
                    geometries.push(geometry);
                } else {
                    // 忽略其他子元素
                    reader
                        .read_to_end(e.name())
                        .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                }
            }
            Ok(Event::End(ref e)) if e.name().as_ref() == b"planView" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in planView")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing planView: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(geometries)
}

/// 解析 geometry 元素
fn parse_geometry(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
) -> Result<OdrRoadGeometry> {
    let mut s = 0.0_f64;
    let mut x = 0.0_f64;
    let mut y = 0.0_f64;
    let mut hdg = 0.0_f64;
    let mut length = 0.0_f64;

    // 解析 geometry 属性
    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"s" => {
                s = value.parse().context("解析 s 错误")?;
            }
            b"x" => {
                x = value.parse().context("解析 x 错误")?;
            }
            b"y" => {
                y = value.parse().context("解析 y 错误")?;
            }
            b"hdg" => {
                hdg = value.parse().context("解析 hdg 错误")?;
            }
            b"length" => {
                length = value.parse().context("解析 length 错误")?;
            }
            _ => {}
        }
    }

    // 解析几何类型子元素
    let mut geometry: Option<OdrRoadGeometry> = None;
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"line" => {
                    geometry = Some(OdrRoadGeometry::create_line(s, x, y, hdg, length));
                }
                b"spiral" => {
                    geometry = Some(parse_spiral(e, s, x, y, hdg, length)?);
                }
                b"arc" => {
                    geometry = Some(parse_arc(e, s, x, y, hdg, length)?);
                }
                b"paramPoly3" => {
                    geometry = Some(parse_param_poly3(e, s, x, y, hdg, length)?);
                }
                _ => {}
            },
            Ok(Event::End(ref e)) if e.name().as_ref() == b"geometry" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in geometry")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing geometry: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    geometry.ok_or_else(|| anyhow::anyhow!("未找到几何类型"))
}

/// 解析 spiral 元素
fn parse_spiral(
    element: &quick_xml::events::BytesStart,
    s: f64,
    x: f64,
    y: f64,
    hdg: f64,
    length: f64,
) -> Result<OdrRoadGeometry> {
    let mut curv_start = 0.0_f64;
    let mut curv_end = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"curvStart" => {
                curv_start = value.parse().context("解析 curvStart 错误")?;
            }
            b"curvEnd" => {
                curv_end = value.parse().context("解析 curvEnd 错误")?;
            }
            _ => {}
        }
    }

    Ok(OdrRoadGeometry::create_spiral(
        s, x, y, hdg, length, curv_start, curv_end,
    ))
}

/// 解析 arc 元素
fn parse_arc(
    element: &quick_xml::events::BytesStart,
    s: f64,
    x: f64,
    y: f64,
    hdg: f64,
    length: f64,
) -> Result<OdrRoadGeometry> {
    let mut curvature = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"curvature" => {
                curvature = value.parse().context("解析 curvature 错误")?;
            }
            _ => {}
        }
    }

    Ok(OdrRoadGeometry::create_arc(s, x, y, hdg, length, curvature))
}

/// 解析 paramPoly3 元素
fn parse_param_poly3(
    element: &quick_xml::events::BytesStart,
    s: f64,
    x: f64,
    y: f64,
    hdg: f64,
    length: f64,
) -> Result<OdrRoadGeometry> {
    let mut a_u = 0.0_f64;
    let mut a_v = 0.0_f64;
    let mut b_u = 0.0_f64;
    let mut b_v = 0.0_f64;
    let mut c_u = 0.0_f64;
    let mut c_v = 0.0_f64;
    let mut d_u = 0.0_f64;
    let mut d_v = 0.0_f64;
    let mut p_range = OdrParamPoly3PRange::Normalized;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"aU" => {
                a_u = value.parse().context("解析 aU 错误")?;
            }
            b"aV" => {
                a_v = value.parse().context("解析 aV 错误")?;
            }
            b"bU" => {
                b_u = value.parse().context("解析 bU 错误")?;
            }
            b"bV" => {
                b_v = value.parse().context("解析 bV 错误")?;
            }
            b"cU" => {
                c_u = value.parse().context("解析 cU 错误")?;
            }
            b"cV" => {
                c_v = value.parse().context("解析 cV 错误")?;
            }
            b"dU" => {
                d_u = value.parse().context("解析 dU 错误")?;
            }
            b"dV" => {
                d_v = value.parse().context("解析 dV 错误")?;
            }
            b"pRange" => {
                p_range = match value.as_ref() {
                    "arcLength" => OdrParamPoly3PRange::ArcLength,
                    "normalized" => OdrParamPoly3PRange::Normalized,
                    _ => OdrParamPoly3PRange::Normalized,
                };
            }
            _ => {}
        }
    }

    Ok(OdrRoadGeometry::create_param_poly3(
        s, x, y, hdg, length, a_u, a_v, b_u, b_v, c_u, c_v, d_u, d_v, p_range,
    ))
}

/// 解析 elevationProfile 元素
fn parse_elevation_profile(reader: &mut Reader<&[u8]>) -> Result<Vec<OdrRoadElevation>> {
    let mut elevations = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => {
                if e.name().as_ref() == b"elevation" {
                    let elevation = parse_elevation(e)?;
                    elevations.push(elevation);
                }
            }
            Ok(Event::End(ref e)) if e.name().as_ref() == b"elevationProfile" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in elevationProfile")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing elevationProfile: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(elevations)
}

/// 解析 elevation 元素
fn parse_elevation(element: &quick_xml::events::BytesStart) -> Result<OdrRoadElevation> {
    let mut s = 0.0_f64;
    let mut a = 0.0_f64;
    let mut b = 0.0_f64;
    let mut c = 0.0_f64;
    let mut d = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"s" => {
                s = value.parse().context("解析 s 错误")?;
            }
            b"a" => {
                a = value.parse().context("解析 a 错误")?;
            }
            b"b" => {
                b = value.parse().context("解析 b 错误")?;
            }
            b"c" => {
                c = value.parse().context("解析 c 错误")?;
            }
            b"d" => {
                d = value.parse().context("解析 d 错误")?;
            }
            _ => {}
        }
    }

    Ok(OdrRoadElevation::new(s, a, b, c, d))
}

/// 解析 lateralProfile 元素
fn parse_lateral_profile(reader: &mut Reader<&[u8]>) -> Result<(Vec<OdrSuperelevation>, Vec<OdrShape>)> {
    let mut superelevations = Vec::new();
    let mut shapes = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => {
                match e.name().as_ref() {
                    b"superelevation" => {
                        let superelevation = parse_superelevation(e)?;
                        superelevations.push(superelevation);
                    }
                    b"shape" => {
                        let shape = parse_shape(e)?;
                        shapes.push(shape);
                    }
                    _ => {}
                }
            }
            Ok(Event::End(ref e)) if e.name().as_ref() == b"lateralProfile" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in lateralProfile")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing lateralProfile: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok((superelevations, shapes))
}

/// 解析 superelevation 元素
fn parse_superelevation(element: &quick_xml::events::BytesStart) -> Result<OdrSuperelevation> {
    let mut s = 0.0_f64;
    let mut a = 0.0_f64;
    let mut b = 0.0_f64;
    let mut c = 0.0_f64;
    let mut d = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"s" => {
                s = value.parse().context("解析 s 错误")?;
            }
            b"a" => {
                a = value.parse().context("解析 a 错误")?;
            }
            b"b" => {
                b = value.parse().context("解析 b 错误")?;
            }
            b"c" => {
                c = value.parse().context("解析 c 错误")?;
            }
            b"d" => {
                d = value.parse().context("解析 d 错误")?;
            }
            _ => {}
        }
    }

    Ok(OdrSuperelevation::new(s, a, b, c, d))
}

/// 解析 shape 元素
fn parse_shape(element: &quick_xml::events::BytesStart) -> Result<OdrShape> {
    let mut s = 0.0_f64;
    let mut t = 0.0_f64;
    let mut a = 0.0_f64;
    let mut b = 0.0_f64;
    let mut c = 0.0_f64;
    let mut d = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"s" => {
                s = value.parse().context("解析 s 错误")?;
            }
            b"t" => {
                t = value.parse().context("解析 t 错误")?;
            }
            b"a" => {
                a = value.parse().context("解析 a 错误")?;
            }
            b"b" => {
                b = value.parse().context("解析 b 错误")?;
            }
            b"c" => {
                c = value.parse().context("解析 c 错误")?;
            }
            b"d" => {
                d = value.parse().context("解析 d 错误")?;
            }
            _ => {}
        }
    }

    Ok(OdrShape::new(s, t, a, b, c, d))
}
