use anyhow::{Context, Result};
use quick_xml::Reader;
use quick_xml::events::Event;

use crate::odr::models::junction::{OdrJunction, OdrJunctionType};

/// 从 XML 元素解析 Junction
pub fn parse_junction(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrJunction> {
    let mut id: Option<String> = None;
    let mut name: Option<String> = None;
    let mut junction_type = OdrJunctionType::Default;

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
            _ => {}
        }
    }

    let id = id.context("junction 缺少 id 属性")?;

    // 如果不是空元素，需要跳过子元素直到遇到结束标签
    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    // 跳过所有子元素（connection, priority 等）
                    reader
                        .read_to_end(e.name())
                        .context("跳过 junction 子元素错误")?;
                }
                Ok(Event::Empty(_)) => {
                    // 跳过空元素
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

    Ok(OdrJunction::new(id, name, junction_type))
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
    fn test_parse_junction_with_children() {
        let xml = r#"
        <junction id="1" name="Intersection1" type="default">
            <connection id="0" incomingRoad="1" connectingRoad="3" contactPoint="start">
                <laneLink from="-1" to="-1"/>
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
