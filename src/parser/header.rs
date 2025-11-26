use crate::models::header::Header;
use anyhow::{Context, Result};

/// 从 XML 元素解析 Header
pub fn parse_header(element: &quick_xml::events::BytesStart) -> Result<Header> {
    let mut rev_major = 1u8;
    let mut rev_minor = 8u8;
    let mut name = String::new();
    let mut version = String::from("1.00");
    let mut date = String::new();
    let mut north = 0.0f64;
    let mut south = 0.0f64;
    let mut east = 0.0f64;
    let mut west = 0.0f64;

    for attr in element.attributes() {
        let attr = attr.context("读取属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析属性值错误")?;

        match key {
            b"revMajor" => {
                rev_major = value.parse().context("解析 revMajor 错误")?;
            }
            b"revMinor" => {
                rev_minor = value.parse().context("解析 revMinor 错误")?;
            }
            b"name" => {
                name = value.to_string();
            }
            b"version" => {
                version = value.to_string();
            }
            b"date" => {
                date = value.to_string();
            }
            b"north" => {
                north = value.parse().context("解析 north 错误")?;
            }
            b"south" => {
                south = value.parse().context("解析 south 错误")?;
            }
            b"east" => {
                east = value.parse().context("解析 east 错误")?;
            }
            b"west" => {
                west = value.parse().context("解析 west 错误")?;
            }
            _ => {}
        }
    }

    Ok(Header::new(
        rev_major, rev_minor, name, version, date, north, south, east, west,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_header_with_all_attributes() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad" version="1.00" date="2024-01-01" north="100.0" south="-100.0" east="200.0" west="-200.0"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(quick_xml::events::Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_header(&e);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major(), 1);
            assert_eq!(header.rev_minor(), 8);
            assert_eq!(header.name(), "TestRoad");
            assert_eq!(header.version(), "1.00");
            assert_eq!(header.date(), "2024-01-01");
            assert_eq!(header.north(), 100.0);
            assert_eq!(header.south(), -100.0);
            assert_eq!(header.east(), 200.0);
            assert_eq!(header.west(), -200.0);
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_header_minimal() {
        let xml = r#"<header revMajor="1" revMinor="4"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(quick_xml::events::Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_header(&e);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major(), 1);
            assert_eq!(header.rev_minor(), 4);
        } else {
            panic!("无法解析 XML 事件");
        }
    }
}
