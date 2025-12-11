use anyhow::{Context, Result};
use quick_xml::Reader;
use quick_xml::events::Event;

use crate::odr::models::junction::{
    OdrJunction, OdrJunctionType,
    connection::OdrConnection,
    lane_link::OdrJunctionLaneLink,
    priority::OdrJunctionPriority,
};

/// 从 XML 元素解析 Junction
pub fn parse_junction(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrJunction> {
    let mut id: Option<String> = None;
    let mut name: Option<String> = None;
    let mut junction_type = OdrJunctionType::Default;
    let mut main_road: Option<String> = None;
    let mut s_start: Option<f64> = None;
    let mut s_end: Option<f64> = None;
    let mut orientation: Option<String> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取 junction 属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析 junction 属性值错误")?;

        match key {
            b"id" => {
                id = Some(value.to_string());
            }
            b"name" => {
                name = Some(value.to_string());
            }
            b"type" => {
                junction_type = match value.as_ref() {
                    "default" => OdrJunctionType::Default,
                    "direct" => OdrJunctionType::Direct,
                    "virtual" => OdrJunctionType::Virtual,
                    "crossing" => OdrJunctionType::Crossing,
                    _ => OdrJunctionType::Default, // 默认类型
                };
            }
            b"mainRoad" => {
                main_road = Some(value.to_string());
            }
            b"sStart" => {
                s_start = value.parse().ok();
            }
            b"sEnd" => {
                s_end = value.parse().ok();
            }
            b"orientation" => {
                orientation = Some(value.to_string());
            }
            _ => {}
        }
    }

    let id = id.context("junction 缺少 id 属性")?;

    let mut junction = OdrJunction::new(id, name, junction_type);

    // 设置 Virtual Junction 的属性
    if let (Some(main_road), Some(s_start), Some(s_end), Some(orientation)) =
        (main_road, s_start, s_end, orientation)
    {
        junction.set_virtual_junction_props(main_road, s_start, s_end, orientation);
    }

    // 如果不是空元素，解析子元素
    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    match e.name().as_ref() {
                        b"connection" => {
                            let connection = parse_connection(reader, e, false)?;
                            junction.add_connection(connection);
                        }
                        b"priority" => {
                            let priority = parse_priority(reader, e, false)?;
                            junction.priorities.push(priority);
                        }
                        _ => {
                            // 跳过其他子元素（如 controller 等）
                            reader
                                .read_to_end(e.name())
                                .context("跳过 junction 子元素错误")?;
                        }
                    }
                }
                Ok(Event::Empty(ref e)) => {
                    match e.name().as_ref() {
                        b"connection" => {
                            let connection = parse_connection(reader, e, true)?;
                            junction.add_connection(connection);
                        }
                        b"priority" => {
                            let priority = parse_priority(reader, e, true)?;
                            junction.priorities.push(priority);
                        }
                        _ => {}
                    }
                }
                Ok(Event::End(ref e)) if e.name().as_ref() == b"junction" => {
                    break;
                }
                Ok(Event::Eof) => {
                    return Err(anyhow::anyhow!("在 junction 中遇到意外的 EOF"));
                }
                Err(e) => {
                    return Err(anyhow::anyhow!("解析 junction 子元素错误: {:?}", e));
                }
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(junction)
}

/// 从 XML 元素解析 Connection
fn parse_connection(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrConnection> {
    let mut id: Option<String> = None;
    let mut incoming_road: Option<String> = None;
    let mut connecting_road: Option<String> = None;
    let mut linked_road: Option<String> = None;
    let mut contact_point: Option<String> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取 connection 属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析 connection 属性值错误")?;

        match key {
            b"id" => {
                id = Some(value.to_string());
            }
            b"incomingRoad" => {
                incoming_road = Some(value.to_string());
            }
            b"connectingRoad" => {
                connecting_road = Some(value.to_string());
            }
            b"linkedRoad" => {
                linked_road = Some(value.to_string());
            }
            b"contactPoint" => {
                contact_point = Some(value.to_string());
            }
            _ => {}
        }
    }

    let id = id.context("connection 缺少 id 属性")?;

    let mut connection = OdrConnection::new(
        id,
        incoming_road,
        connecting_road,
        linked_road,
        contact_point,
    );

    // 如果不是空元素，解析子元素
    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    match e.name().as_ref() {
                        b"laneLink" => {
                            let lane_link = parse_lane_link(reader, e, false)?;
                            connection.add_lane_link(lane_link);
                        }
                        _ => {
                            // 跳过其他子元素（如 predecessor, successor 等）
                            reader
                                .read_to_end(e.name())
                                .context("跳过 connection 子元素错误")?;
                        }
                    }
                }
                Ok(Event::Empty(ref e)) => {
                    if e.name().as_ref() == b"laneLink" {
                        let lane_link = parse_lane_link(reader, e, true)?;
                        connection.add_lane_link(lane_link);
                    }
                    // 其他空元素直接跳过
                }
                Ok(Event::End(ref e)) if e.name().as_ref() == b"connection" => {
                    break;
                }
                Ok(Event::Eof) => {
                    return Err(anyhow::anyhow!("在 connection 中遇到意外的 EOF"));
                }
                Err(e) => {
                    return Err(anyhow::anyhow!("解析 connection 子元素错误: {:?}", e));
                }
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(connection)
}

/// 从 XML 元素解析 LaneLink
fn parse_lane_link(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrJunctionLaneLink> {
    let mut from: Option<i32> = None;
    let mut to: Option<i32> = None;
    let mut overlap_zone: Option<f64> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取 laneLink 属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析 laneLink 属性值错误")?;

        match key {
            b"from" => {
                from = value.parse().ok();
            }
            b"to" => {
                to = value.parse().ok();
            }
            b"overlapZone" => {
                overlap_zone = value.parse().ok();
            }
            _ => {}
        }
    }

    let from = from.context("laneLink 缺少 from 属性")?;
    let to = to.context("laneLink 缺少 to 属性")?;

    // 如果不是空元素，跳过到结束标签
    if !is_empty {
        reader
            .read_to_end_into(element.name(), &mut Vec::new())
            .context("跳过 laneLink 内容错误")?;
    }

    Ok(OdrJunctionLaneLink::new(from, to, overlap_zone))
}

/// 从 XML 元素解析 Priority
fn parse_priority(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrJunctionPriority> {
    let mut high: Option<String> = None;
    let mut low: Option<String> = None;

    // 解析属性
    for attr in element.attributes() {
        let attr = attr.context("读取 priority 属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析 priority 属性值错误")?;

        match key {
            b"high" => {
                high = Some(value.to_string());
            }
            b"low" => {
                low = Some(value.to_string());
            }
            _ => {}
        }
    }

    let high = high.context("priority 缺少 high 属性")?;
    let low = low.context("priority 缺少 low 属性")?;

    // 如果不是空元素，跳过到结束标签
    if !is_empty {
        reader
            .read_to_end_into(element.name(), &mut Vec::new())
            .context("跳过 priority 内容错误")?;
    }

    Ok(OdrJunctionPriority::new(high, low))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_junction_minimal() {
        let xml = r#"<junction id="1"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_junction(&mut reader, &e, true);
            assert!(result.is_ok());

            let junction = result.unwrap();
            assert_eq!(junction.id, "1");
            assert_eq!(junction.name, None);
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_junction_with_name() {
        let xml = r#"<junction id="1" name="Intersection1"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_junction(&mut reader, &e, true);
            assert!(result.is_ok());

            let junction = result.unwrap();
            assert_eq!(junction.id, "1");
            assert_eq!(junction.name, Some("Intersection1".to_string()));
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_junction_with_type_default() {
        let xml = r#"<junction id="1" type="default"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_junction(&mut reader, &e, true);
            assert!(result.is_ok());

            let junction = result.unwrap();
            assert_eq!(junction.id, "1");
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_junction_with_type_direct() {
        let xml = r#"<junction id="2" name="Exit" type="direct"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_junction(&mut reader, &e, true);
            assert!(result.is_ok());

            let junction = result.unwrap();
            assert_eq!(junction.id, "2");
            assert_eq!(junction.name, Some("Exit".to_string()));
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_junction_with_type_virtual() {
        let xml = r#"<junction id="3" type="virtual"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_junction(&mut reader, &e, true);
            assert!(result.is_ok());

            let junction = result.unwrap();
            assert_eq!(junction.id, "3");
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_junction_with_type_crossing() {
        let xml = r#"<junction id="4" type="crossing"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_junction(&mut reader, &e, true);
            assert!(result.is_ok());

            let junction = result.unwrap();
            assert_eq!(junction.id, "4");
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_junction_with_connections() {
        let xml = r#"
        <junction id="1" name="Intersection1" type="default">
            <connection id="0" incomingRoad="1" connectingRoad="3" contactPoint="start">
                <laneLink from="-1" to="-1"/>
                <laneLink from="-2" to="-2"/>
            </connection>
            <connection id="1" incomingRoad="2" connectingRoad="4" contactPoint="end">
                <laneLink from="1" to="1"/>
            </connection>
            <priority high="1" low="2"/>
        </junction>
        "#;
        let mut reader = quick_xml::Reader::from_str(xml);
        reader.config_mut().trim_text(true);
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"junction" {
                        let result = parse_junction(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let junction = result.unwrap();
                        assert_eq!(junction.id, "1");
                        assert_eq!(junction.name, Some("Intersection1".to_string()));

                        // 验证 connections
                        assert_eq!(junction.connections.len(), 2);

                        let conn0 = &junction.connections[0];
                        assert_eq!(conn0.id, "0");
                        assert_eq!(conn0.incoming_road, Some("1".to_string()));
                        assert_eq!(conn0.connecting_road, Some("3".to_string()));
                        assert_eq!(conn0.contact_point, Some("start".to_string()));
                        assert_eq!(conn0.lane_links.len(), 2);

                        let lane_link0 = &conn0.lane_links[0];
                        assert_eq!(lane_link0.from, -1);
                        assert_eq!(lane_link0.to, -1);

                        let lane_link1 = &conn0.lane_links[1];
                        assert_eq!(lane_link1.from, -2);
                        assert_eq!(lane_link1.to, -2);

                        let conn1 = &junction.connections[1];
                        assert_eq!(conn1.id, "1");
                        assert_eq!(conn1.incoming_road, Some("2".to_string()));
                        assert_eq!(conn1.connecting_road, Some("4".to_string()));
                        assert_eq!(conn1.contact_point, Some("end".to_string()));
                        assert_eq!(conn1.lane_links.len(), 1);

                        // 验证 priorities
                        assert_eq!(junction.priorities.len(), 1);
                        assert_eq!(junction.priorities[0].high, "1");
                        assert_eq!(junction.priorities[0].low, "2");

                        break;
                    }
                }
                Ok(Event::Eof) => panic!("未找到 junction"),
                _ => {}
            }
            buf.clear();
        }
    }

    #[test]
    fn test_parse_junction_virtual_with_props() {
        let xml = r#"
        <junction id="5" name="VirtualJunction" type="virtual" mainRoad="10" sStart="100.0" sEnd="200.0" orientation="+">
            <connection id="0" connectingRoad="11" contactPoint="start">
                <laneLink from="-1" to="-1"/>
            </connection>
        </junction>
        "#;
        let mut reader = quick_xml::Reader::from_str(xml);
        reader.config_mut().trim_text(true);
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"junction" {
                        let result = parse_junction(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let junction = result.unwrap();
                        assert_eq!(junction.id, "5");
                        assert_eq!(junction.name, Some("VirtualJunction".to_string()));

                        // 验证 Virtual Junction 属性
                        assert_eq!(junction.main_road, Some("10".to_string()));
                        assert_eq!(junction.s_start, Some(100.0));
                        assert_eq!(junction.s_end, Some(200.0));
                        assert_eq!(junction.orientation, Some("+".to_string()));

                        // 验证 connection
                        assert_eq!(junction.connections.len(), 1);
                        let conn = &junction.connections[0];
                        assert_eq!(conn.id, "0");
                        assert_eq!(conn.incoming_road, None);
                        assert_eq!(conn.connecting_road, Some("11".to_string()));

                        break;
                    }
                }
                Ok(Event::Eof) => panic!("未找到 junction"),
                _ => {}
            }
            buf.clear();
        }
    }

    #[test]
    fn test_parse_junction_direct_with_linked_road() {
        let xml = r#"
        <junction id="6" name="DirectJunction" type="direct">
            <connection id="0" incomingRoad="1" linkedRoad="2">
                <laneLink from="-1" to="-1" overlapZone="5.0"/>
            </connection>
        </junction>
        "#;
        let mut reader = quick_xml::Reader::from_str(xml);
        reader.config_mut().trim_text(true);
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"junction" {
                        let result = parse_junction(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let junction = result.unwrap();
                        assert_eq!(junction.id, "6");

                        // 验证 Direct Junction 的 connection
                        assert_eq!(junction.connections.len(), 1);
                        let conn = &junction.connections[0];
                        assert_eq!(conn.linked_road, Some("2".to_string()));
                        assert_eq!(conn.connecting_road, None);

                        // 验证 laneLink 的 overlapZone
                        let lane_link = &conn.lane_links[0];
                        assert_eq!(lane_link.overlap_zone, Some(5.0));

                        break;
                    }
                }
                Ok(Event::Eof) => panic!("未找到 junction"),
                _ => {}
            }
            buf.clear();
        }
    }

    #[test]
    fn test_parse_empty_connection() {
        let xml = r#"
        <junction id="7" name="Test">
            <connection id="0" incomingRoad="1" connectingRoad="3" contactPoint="start"/>
        </junction>
        "#;
        let mut reader = quick_xml::Reader::from_str(xml);
        reader.config_mut().trim_text(true);
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"junction" {
                        let result = parse_junction(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let junction = result.unwrap();
                        assert_eq!(junction.connections.len(), 1);
                        let conn = &junction.connections[0];
                        assert_eq!(conn.lane_links.len(), 0);
                        break;
                    }
                }
                Ok(Event::Eof) => panic!("未找到 junction"),
                _ => {}
            }
            buf.clear();
        }
    }
}
