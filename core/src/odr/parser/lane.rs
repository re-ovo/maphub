use anyhow::{Context, Result};
use quick_xml::Reader;
use quick_xml::events::Event;

use crate::odr::models::enums::{OdrRoadMarkColor, OdrRoadMarkWeight, OdrSpeedUnit};
use crate::odr::models::lane::OdrLane;
use crate::odr::models::lane::lane_access::{OdrLaneAccess, OdrLaneAccessRule};
use crate::odr::models::lane::lane_geometry::{OdrLaneBorder, OdrLaneHeight, OdrLaneWidth};
use crate::odr::models::lane::lane_link::OdrLaneLink;
use crate::odr::models::lane::lane_material::OdrLaneMaterial;
use crate::odr::models::lane::lane_offset::OdrLaneOffset;
use crate::odr::models::lane::lane_road_mark::{
    OdrRoadMark, OdrRoadMarkExplicit, OdrRoadMarkExplicitLine,
    OdrRoadMarkLaneChange, OdrRoadMarkRule, OdrRoadMarkSway, OdrRoadMarkType,
    OdrRoadMarkTypeDetail, OdrRoadMarkTypeLine,
};
use crate::odr::models::lane::lane_rule::OdrLaneRule;
use crate::odr::models::lane::lane_section::OdrLaneSection;
use crate::odr::models::lane::lane_speed::OdrLaneSpeed;

/// 解析 lanes 元素，返回 (lane_sections, lane_offsets)
pub fn parse_lanes(
    reader: &mut Reader<&[u8]>,
) -> Result<(Vec<OdrLaneSection>, Vec<OdrLaneOffset>)> {
    let mut lane_sections = Vec::new();
    let mut lane_offsets = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"laneOffset" => {
                    let lane_offset = parse_lane_offset(e)?;
                    lane_offsets.push(lane_offset);
                }
                _ => {}
            },
            Ok(Event::Start(ref e)) => match e.name().as_ref() {
                b"laneSection" => {
                    let lane_section = parse_lane_section(reader, e)?;
                    lane_sections.push(lane_section);
                }
                _ => {
                    // 忽略其他子元素
                    reader
                        .read_to_end(e.name())
                        .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                }
            },
            Ok(Event::End(ref e)) if e.name().as_ref() == b"lanes" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in lanes")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing lanes: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok((lane_sections, lane_offsets))
}

/// 解析 laneOffset 元素
fn parse_lane_offset(element: &quick_xml::events::BytesStart) -> Result<OdrLaneOffset> {
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

    Ok(OdrLaneOffset::new(s, a, b, c, d))
}

/// 解析 laneSection 元素
fn parse_lane_section(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
) -> Result<OdrLaneSection> {
    let mut s = 0.0_f64;
    let mut single_side: Option<bool> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"s" => {
                s = value.parse().context("解析 s 错误")?;
            }
            b"singleSide" => {
                single_side = Some(value.as_ref() == "true");
            }
            _ => {}
        }
    }

    let mut left_lanes = Vec::new();
    let mut center_lane: Option<OdrLane> = None;
    let mut right_lanes = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => match e.name().as_ref() {
                b"left" => {
                    left_lanes = parse_lanes_group(reader, b"left")?;
                }
                b"center" => {
                    let lanes = parse_lanes_group(reader, b"center")?;
                    if let Some(lane) = lanes.into_iter().next() {
                        center_lane = Some(lane);
                    }
                }
                b"right" => {
                    right_lanes = parse_lanes_group(reader, b"right")?;
                }
                _ => {
                    // 忽略其他子元素
                    reader
                        .read_to_end(e.name())
                        .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                }
            },
            Ok(Event::End(ref e)) if e.name().as_ref() == b"laneSection" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in laneSection")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing laneSection: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    // center lane 是必须的
    let center = center_lane.ok_or_else(|| anyhow::anyhow!("未找到 center lane"))?;

    Ok(OdrLaneSection::new(
        s,
        left_lanes,
        right_lanes,
        center,
        single_side,
    ))
}

/// 解析 left/center/right 车道组
fn parse_lanes_group(reader: &mut Reader<&[u8]>, group_name: &[u8]) -> Result<Vec<OdrLane>> {
    let mut lanes = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                if e.name().as_ref() == b"lane" {
                    let lane = parse_lane(reader, e)?;
                    lanes.push(lane);
                } else {
                    // 忽略其他子元素
                    reader
                        .read_to_end(e.name())
                        .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                }
            }
            Ok(Event::End(ref e)) if e.name().as_ref() == group_name => {
                break;
            }
            Ok(Event::Eof) => {
                return Err(anyhow::anyhow!("Unexpected EOF in lanes group"));
            }
            Err(e) => return Err(anyhow::anyhow!("Error parsing lanes group: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(lanes)
}

/// 解析 lane 元素
fn parse_lane(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
) -> Result<OdrLane> {
    let mut id = 0_i32;
    let mut lane_type = String::from("none");
    let mut level: Option<bool> = None;
    let mut road_works: Option<bool> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"id" => {
                id = value.parse().context("解析 id 错误")?;
            }
            b"type" => {
                lane_type = value.to_string();
            }
            b"level" => {
                level = Some(value.as_ref() == "true");
            }
            b"roadWorks" => {
                road_works = Some(value.as_ref() == "true");
            }
            _ => {}
        }
    }

    let mut link = OdrLaneLink::new(None, None);
    let mut width = Vec::new();
    let mut border = Vec::new();
    let mut height = Vec::new();
    let mut speed = Vec::new();
    let mut access = Vec::new();
    let mut rule = Vec::new();
    let mut material = Vec::new();
    let mut road_marks = Vec::new();

    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"width" => {
                    let w = parse_lane_width(e)?;
                    width.push(w);
                }
                b"border" => {
                    let b = parse_lane_border(e)?;
                    border.push(b);
                }
                b"height" => {
                    let h = parse_lane_height(e)?;
                    height.push(h);
                }
                b"speed" => {
                    let sp = parse_lane_speed(e)?;
                    speed.push(sp);
                }
                b"access" => {
                    let acc = parse_lane_access(reader, e, true)?;
                    access.push(acc);
                }
                b"rule" => {
                    let r = parse_lane_rule(e)?;
                    rule.push(r);
                }
                b"material" => {
                    let mat = parse_lane_material(e)?;
                    material.push(mat);
                }
                b"roadMark" => {
                    let rm = parse_road_mark(reader, e, true)?;
                    road_marks.push(rm);
                }
                _ => {}
            },
            Ok(Event::Start(ref e)) => match e.name().as_ref() {
                b"link" => {
                    link = parse_lane_link(reader)?;
                }
                b"access" => {
                    let acc = parse_lane_access(reader, e, false)?;
                    access.push(acc);
                }
                b"roadMark" => {
                    let rm = parse_road_mark(reader, e, false)?;
                    road_marks.push(rm);
                }
                _ => {
                    // 忽略其他子元素
                    reader
                        .read_to_end(e.name())
                        .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                }
            },
            Ok(Event::End(ref e)) if e.name().as_ref() == b"lane" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in lane")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing lane: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(OdrLane::new(
        id, lane_type, level, road_works, link, width, border, height, speed, access, rule,
        material, road_marks,
    ))
}

/// 解析 link 元素
fn parse_lane_link(reader: &mut Reader<&[u8]>) -> Result<OdrLaneLink> {
    let mut predecessor: Option<i32> = None;
    let mut successor: Option<i32> = None;
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"predecessor" => {
                    for attr in e.attributes() {
                        let attr = attr.context("读取属性错误")?;
                        if attr.key.as_ref() == b"id" {
                            let value = attr.unescape_value().context("解析属性值错误")?;
                            predecessor = Some(value.parse().context("解析 id 错误")?);
                        }
                    }
                }
                b"successor" => {
                    for attr in e.attributes() {
                        let attr = attr.context("读取属性错误")?;
                        if attr.key.as_ref() == b"id" {
                            let value = attr.unescape_value().context("解析属性值错误")?;
                            successor = Some(value.parse().context("解析 id 错误")?);
                        }
                    }
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

    Ok(OdrLaneLink::new(predecessor, successor))
}

/// 解析 width 元素
fn parse_lane_width(element: &quick_xml::events::BytesStart) -> Result<OdrLaneWidth> {
    let mut s_offset = 0.0_f64;
    let mut a = 0.0_f64;
    let mut b = 0.0_f64;
    let mut c = 0.0_f64;
    let mut d = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
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

    Ok(OdrLaneWidth::new(s_offset, a, b, c, d))
}

/// 解析 border 元素
fn parse_lane_border(element: &quick_xml::events::BytesStart) -> Result<OdrLaneBorder> {
    let mut s_offset = 0.0_f64;
    let mut a = 0.0_f64;
    let mut b = 0.0_f64;
    let mut c = 0.0_f64;
    let mut d = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
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

    Ok(OdrLaneBorder::new(s_offset, a, b, c, d))
}

/// 解析 height 元素
fn parse_lane_height(element: &quick_xml::events::BytesStart) -> Result<OdrLaneHeight> {
    let mut s_offset = 0.0_f64;
    let mut inner = 0.0_f64;
    let mut outer = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"inner" => {
                inner = value.parse().context("解析 inner 错误")?;
            }
            b"outer" => {
                outer = value.parse().context("解析 outer 错误")?;
            }
            _ => {}
        }
    }

    Ok(OdrLaneHeight::new(s_offset, inner, outer))
}

/// 解析 speed 元素
fn parse_lane_speed(element: &quick_xml::events::BytesStart) -> Result<OdrLaneSpeed> {
    let mut s_offset = 0.0_f64;
    let mut max = 0.0_f64;
    let mut unit: Option<OdrSpeedUnit> = None;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"max" => {
                max = value.parse().context("解析 max 错误")?;
            }
            b"unit" => {
                unit = Some(match value.as_ref() {
                    "km/h" => OdrSpeedUnit::KMH,
                    "m/s" => OdrSpeedUnit::MPS,
                    "mph" => OdrSpeedUnit::MPH,
                    _ => OdrSpeedUnit::KMH,
                });
            }
            _ => {}
        }
    }

    Ok(OdrLaneSpeed::new(s_offset, max, unit))
}

/// 解析 access 元素
fn parse_lane_access(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrLaneAccess> {
    let mut s_offset = 0.0_f64;
    let mut rule: Option<OdrLaneAccessRule> = None;
    let mut restriction = Vec::new();

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"rule" => {
                rule = Some(match value.as_ref() {
                    "allow" => OdrLaneAccessRule::Allow,
                    "deny" => OdrLaneAccessRule::Deny,
                    _ => OdrLaneAccessRule::Allow,
                });
            }
            b"restriction" => {
                // 旧版本的单个 restriction 属性
                restriction.push(value.to_string());
            }
            _ => {}
        }
    }

    // 如果不是空元素，解析 <restriction> 子元素
    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Empty(ref e)) => {
                    if e.name().as_ref() == b"restriction" {
                        for attr in e.attributes() {
                            let attr = attr.context("读取属性错误")?;
                            if attr.key.as_ref() == b"type" {
                                let value = attr.unescape_value().context("解析属性值错误")?;
                                restriction.push(value.to_string());
                            }
                        }
                    }
                }
                Ok(Event::End(ref e)) if e.name().as_ref() == b"access" => {
                    break;
                }
                Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in access")),
                Err(e) => return Err(anyhow::anyhow!("Error parsing access: {:?}", e)),
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(OdrLaneAccess::new(s_offset, restriction, rule))
}

/// 解析 rule 元素
fn parse_lane_rule(element: &quick_xml::events::BytesStart) -> Result<OdrLaneRule> {
    let mut s_offset = 0.0_f64;
    let mut value_str = String::new();

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"value" => {
                value_str = value.to_string();
            }
            _ => {}
        }
    }

    Ok(OdrLaneRule::new(s_offset, value_str))
}

/// 解析 material 元素
fn parse_lane_material(element: &quick_xml::events::BytesStart) -> Result<OdrLaneMaterial> {
    let mut s_offset = 0.0_f64;
    let mut friction = 1.0_f64;
    let mut surface: Option<String> = None;
    let mut roughness: Option<f64> = None;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"friction" => {
                friction = value.parse().context("解析 friction 错误")?;
            }
            b"surface" => {
                surface = Some(value.to_string());
            }
            b"roughness" => {
                roughness = Some(value.parse().context("解析 roughness 错误")?);
            }
            _ => {}
        }
    }

    Ok(OdrLaneMaterial::new(s_offset, friction, surface, roughness))
}

/// 解析 roadMark 元素
fn parse_road_mark(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrRoadMark> {
    let mut s_offset = 0.0_f64;
    let mut mark_type = OdrRoadMarkType::None;
    let mut color = OdrRoadMarkColor::Standard;
    let mut width: Option<f64> = None;
    let mut height: Option<f64> = None;
    let mut material: Option<String> = None;
    let mut weight: Option<OdrRoadMarkWeight> = None;
    let mut lane_change: Option<OdrRoadMarkLaneChange> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"type" => {
                mark_type = match value.as_ref() {
                    "none" => OdrRoadMarkType::None,
                    "solid" => OdrRoadMarkType::Solid,
                    "broken" => OdrRoadMarkType::Broken,
                    "solid solid" => OdrRoadMarkType::SolidSolid,
                    "solid broken" => OdrRoadMarkType::SolidBroken,
                    "broken solid" => OdrRoadMarkType::BrokenSolid,
                    "broken broken" => OdrRoadMarkType::BrokenBroken,
                    "botts dots" => OdrRoadMarkType::BottsDots,
                    "grass" => OdrRoadMarkType::Grass,
                    "curb" => OdrRoadMarkType::Curb,
                    "custom" => OdrRoadMarkType::Custom,
                    "edge" => OdrRoadMarkType::Edge,
                    _ => OdrRoadMarkType::None,
                };
            }
            b"color" => {
                color = match value.as_ref() {
                    "standard" => OdrRoadMarkColor::Standard,
                    "white" => OdrRoadMarkColor::White,
                    "yellow" => OdrRoadMarkColor::Yellow,
                    "red" => OdrRoadMarkColor::Red,
                    "blue" => OdrRoadMarkColor::Blue,
                    "green" => OdrRoadMarkColor::Green,
                    "black" => OdrRoadMarkColor::Black,
                    "orange" => OdrRoadMarkColor::Orange,
                    "violet" => OdrRoadMarkColor::Violet,
                    _ => OdrRoadMarkColor::Standard,
                };
            }
            b"width" => {
                width = Some(value.parse().context("解析 width 错误")?);
            }
            b"height" => {
                height = Some(value.parse().context("解析 height 错误")?);
            }
            b"material" => {
                material = Some(value.to_string());
            }
            b"weight" => {
                weight = Some(match value.as_ref() {
                    "standard" => OdrRoadMarkWeight::Standard,
                    "bold" => OdrRoadMarkWeight::Bold,
                    _ => OdrRoadMarkWeight::Standard,
                });
            }
            b"laneChange" => {
                lane_change = Some(match value.as_ref() {
                    "increase" => OdrRoadMarkLaneChange::Increase,
                    "decrease" => OdrRoadMarkLaneChange::Decrease,
                    "both" => OdrRoadMarkLaneChange::Both,
                    "none" => OdrRoadMarkLaneChange::None,
                    _ => OdrRoadMarkLaneChange::None,
                });
            }
            _ => {}
        }
    }

    let mut type_detail: Option<OdrRoadMarkTypeDetail> = None;
    let mut explicit: Option<OdrRoadMarkExplicit> = None;
    let mut sways = Vec::new();

    // 解析子元素
    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => match e.name().as_ref() {
                    b"type" => {
                        type_detail = Some(parse_road_mark_type(reader, e)?);
                    }
                    b"explicit" => {
                        explicit = Some(parse_road_mark_explicit(reader)?);
                    }
                    _ => {
                        // 忽略其他子元素
                        reader
                            .read_to_end(e.name())
                            .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                    }
                },
                Ok(Event::Empty(ref e)) => {
                    if e.name().as_ref() == b"sway" {
                        let sway = parse_road_mark_sway(e)?;
                        sways.push(sway);
                    }
                }
                Ok(Event::End(ref e)) if e.name().as_ref() == b"roadMark" => {
                    break;
                }
                Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in roadMark")),
                Err(e) => return Err(anyhow::anyhow!("Error parsing roadMark: {:?}", e)),
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(OdrRoadMark {
        s_offset,
        mark_type,
        color,
        width,
        height,
        material,
        weight,
        lane_change,
        type_detail,
        explicit,
        sways,
    })
}

/// 解析 roadMark > type 元素
fn parse_road_mark_type(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
) -> Result<OdrRoadMarkTypeDetail> {
    let mut name = String::new();
    let mut width = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"name" => {
                name = value.to_string();
            }
            b"width" => {
                width = value.parse().context("解析 width 错误")?;
            }
            _ => {}
        }
    }

    let mut lines = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => {
                if e.name().as_ref() == b"line" {
                    let line = parse_road_mark_type_line(e)?;
                    lines.push(line);
                }
            }
            Ok(Event::End(ref e)) if e.name().as_ref() == b"type" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in type")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing type: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(OdrRoadMarkTypeDetail { name, width, lines })
}

/// 解析 roadMark > type > line 元素
fn parse_road_mark_type_line(
    element: &quick_xml::events::BytesStart,
) -> Result<OdrRoadMarkTypeLine> {
    let mut s_offset = 0.0_f64;
    let mut length = 0.0_f64;
    let mut space = 0.0_f64;
    let mut t_offset = 0.0_f64;
    let mut color: Option<OdrRoadMarkColor> = None;
    let mut rule: Option<OdrRoadMarkRule> = None;
    let mut width: Option<f64> = None;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"length" => {
                length = value.parse().context("解析 length 错误")?;
            }
            b"space" => {
                space = value.parse().context("解析 space 错误")?;
            }
            b"tOffset" => {
                t_offset = value.parse().context("解析 tOffset 错误")?;
            }
            b"color" => {
                color = Some(match value.as_ref() {
                    "standard" => OdrRoadMarkColor::Standard,
                    "white" => OdrRoadMarkColor::White,
                    "yellow" => OdrRoadMarkColor::Yellow,
                    "red" => OdrRoadMarkColor::Red,
                    "blue" => OdrRoadMarkColor::Blue,
                    "green" => OdrRoadMarkColor::Green,
                    "black" => OdrRoadMarkColor::Black,
                    "orange" => OdrRoadMarkColor::Orange,
                    "violet" => OdrRoadMarkColor::Violet,
                    _ => OdrRoadMarkColor::Standard,
                });
            }
            b"rule" => {
                rule = Some(match value.as_ref() {
                    "no passing" => OdrRoadMarkRule::NoPassing,
                    "caution" => OdrRoadMarkRule::Caution,
                    "none" => OdrRoadMarkRule::None,
                    _ => OdrRoadMarkRule::None,
                });
            }
            b"width" => {
                width = Some(value.parse().context("解析 width 错误")?);
            }
            _ => {}
        }
    }

    Ok(OdrRoadMarkTypeLine {
        s_offset,
        length,
        space,
        t_offset,
        color,
        rule,
        width,
    })
}

/// 解析 roadMark > explicit 元素
fn parse_road_mark_explicit(reader: &mut Reader<&[u8]>) -> Result<OdrRoadMarkExplicit> {
    let mut lines = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Empty(ref e)) => {
                if e.name().as_ref() == b"line" {
                    let line = parse_road_mark_explicit_line(e)?;
                    lines.push(line);
                }
            }
            Ok(Event::End(ref e)) if e.name().as_ref() == b"explicit" => {
                break;
            }
            Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in explicit")),
            Err(e) => return Err(anyhow::anyhow!("Error parsing explicit: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(OdrRoadMarkExplicit { lines })
}

/// 解析 roadMark > explicit > line 元素
fn parse_road_mark_explicit_line(
    element: &quick_xml::events::BytesStart,
) -> Result<OdrRoadMarkExplicitLine> {
    let mut s_offset = 0.0_f64;
    let mut length = 0.0_f64;
    let mut t_offset = 0.0_f64;
    let mut width: Option<f64> = None;
    let mut rule: Option<OdrRoadMarkRule> = None;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"sOffset" => {
                s_offset = value.parse().context("解析 sOffset 错误")?;
            }
            b"length" => {
                length = value.parse().context("解析 length 错误")?;
            }
            b"tOffset" => {
                t_offset = value.parse().context("解析 tOffset 错误")?;
            }
            b"width" => {
                width = Some(value.parse().context("解析 width 错误")?);
            }
            b"rule" => {
                rule = Some(match value.as_ref() {
                    "no passing" => OdrRoadMarkRule::NoPassing,
                    "caution" => OdrRoadMarkRule::Caution,
                    "none" => OdrRoadMarkRule::None,
                    _ => OdrRoadMarkRule::None,
                });
            }
            _ => {}
        }
    }

    Ok(OdrRoadMarkExplicitLine {
        s_offset,
        length,
        t_offset,
        width,
        rule,
    })
}

/// 解析 roadMark > sway 元素
fn parse_road_mark_sway(element: &quick_xml::events::BytesStart) -> Result<OdrRoadMarkSway> {
    let mut ds = 0.0_f64;
    let mut a = 0.0_f64;
    let mut b = 0.0_f64;
    let mut c = 0.0_f64;
    let mut d = 0.0_f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"ds" => {
                ds = value.parse().context("解析 ds 错误")?;
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

    Ok(OdrRoadMarkSway { ds, a, b, c, d })
}
