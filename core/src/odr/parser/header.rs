use anyhow::{Context, Result};
use quick_xml::Reader;
use quick_xml::events::Event;

use crate::odr::models::header::{OdrHeader, OdrOffset};

/// 从 XML 元素解析 Header
pub fn parse_header(
    reader: &mut Reader<&[u8]>,
    element: &quick_xml::events::BytesStart,
    is_empty: bool,
) -> Result<OdrHeader> {
    let mut rev_major = 1i32;
    let mut rev_minor = 8i32;
    let mut name: Option<String> = None;
    let mut version: Option<String> = None;
    let mut date: Option<String> = None;
    let mut north: Option<f64> = None;
    let mut south: Option<f64> = None;
    let mut east: Option<f64> = None;
    let mut west: Option<f64> = None;
    let mut vendor: Option<String> = None;
    let mut geo_reference: Option<String> = None;
    let mut offset: Option<OdrOffset> = None;

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
                name = Some(value.to_string());
            }
            b"version" => {
                version = Some(value.to_string());
            }
            b"date" => {
                date = Some(value.to_string());
            }
            b"north" => {
                north = Some(value.parse().context("解析 north 错误")?);
            }
            b"south" => {
                south = Some(value.parse().context("解析 south 错误")?);
            }
            b"east" => {
                east = Some(value.parse().context("解析 east 错误")?);
            }
            b"west" => {
                west = Some(value.parse().context("解析 west 错误")?);
            }
            b"vendor" => {
                vendor = Some(value.to_string());
            }
            b"geoReference" => {
                geo_reference = Some(value.to_string());
            }
            _ => {}
        }
    }

    if !is_empty {
        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    if e.name().as_ref() == b"geoReference" {
                        let mut geo_buf = Vec::new();
                        let mut content = String::new();
                        loop {
                            match reader.read_event_into(&mut geo_buf) {
                                Ok(Event::CData(c)) => {
                                    content.push_str(&String::from_utf8_lossy(&c));
                                }
                                Ok(Event::Text(t)) => {
                                    content.push_str(&String::from_utf8_lossy(&t));
                                }
                                Ok(Event::End(ref end))
                                    if end.name().as_ref() == b"geoReference" =>
                                {
                                    break;
                                }
                                Ok(Event::Eof) => {
                                    return Err(anyhow::anyhow!("Unexpected EOF in geoReference"));
                                }
                                Err(e) => {
                                    return Err(anyhow::anyhow!(
                                        "Error parsing geoReference: {:?}",
                                        e
                                    ));
                                }
                                _ => {}
                            }
                            geo_buf.clear();
                        }
                        if !content.trim().is_empty() {
                            geo_reference = Some(content.trim().to_string());
                        }
                    } else if e.name().as_ref() == b"offset" {
                        offset = Some(parse_offset(e)?);
                        reader
                            .read_to_end(e.name())
                            .map_err(|e| anyhow::anyhow!("Error skipping offset end tag: {:?}", e))?;
                    } else {
                        // 忽略其他子元素
                        reader
                            .read_to_end(e.name())
                            .map_err(|e| anyhow::anyhow!("Error skipping tag: {:?}", e))?;
                    }
                }
                Ok(Event::Empty(ref e)) => {
                    if e.name().as_ref() == b"offset" {
                        offset = Some(parse_offset(e)?);
                    }
                    // 忽略其他空元素
                }
                Ok(Event::End(ref e)) if e.name().as_ref() == b"header" => {
                    break;
                }
                Ok(Event::Eof) => return Err(anyhow::anyhow!("Unexpected EOF in header")),
                Err(e) => return Err(anyhow::anyhow!("Error parsing header children: {:?}", e)),
                _ => {}
            }
            buf.clear();
        }
    }

    Ok(OdrHeader::new(
        rev_major,
        rev_minor,
        name,
        version,
        date,
        north,
        south,
        east,
        west,
        vendor,
        geo_reference,
        offset,
    ))
}

/// 从 XML 元素解析 Offset
fn parse_offset(element: &quick_xml::events::BytesStart) -> Result<OdrOffset> {
    let mut x = 0.0f64;
    let mut y = 0.0f64;
    let mut z = 0.0f64;
    let mut hdg = 0.0f64;

    for attr in element.attributes() {
        let attr = attr.context("读取 offset 属性错误")?;
        let key = attr.key.as_ref();
        let value = attr.unescape_value().context("解析 offset 属性值错误")?;

        match key {
            b"x" => x = value.parse().context("解析 offset x 错误")?,
            b"y" => y = value.parse().context("解析 offset y 错误")?,
            b"z" => z = value.parse().context("解析 offset z 错误")?,
            b"hdg" => hdg = value.parse().context("解析 offset hdg 错误")?,
            _ => {}
        }
    }

    Ok(OdrOffset::new(x, y, z, hdg))
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
            let result = parse_header(&mut reader, &e, true);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major, 1);
            assert_eq!(header.rev_minor, 8);
            assert_eq!(header.name, Some("TestRoad".to_string()));
            assert_eq!(header.version, Some("1.00".to_string()));
            assert_eq!(header.date, Some("2024-01-01".to_string()));
            assert_eq!(header.north, Some(100.0));
            assert_eq!(header.south, Some(-100.0));
            assert_eq!(header.east, Some(200.0));
            assert_eq!(header.west, Some(-200.0));
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
            let result = parse_header(&mut reader, &e, true);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major, 1);
            assert_eq!(header.rev_minor, 4);
            assert_eq!(header.name, None);
            assert_eq!(header.version, None);
            assert_eq!(header.vendor, None);
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_header_with_vendor() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad" vendor="TestVendor"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(quick_xml::events::Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_header(&mut reader, &e, true);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major, 1);
            assert_eq!(header.rev_minor, 8);
            assert_eq!(header.name, Some("TestRoad".to_string()));
            assert_eq!(header.vendor, Some("TestVendor".to_string()));
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_header_with_start_end_tags() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad" version="1.00" date="2024-01-01"></header>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(quick_xml::events::Event::Start(e)) = reader.read_event_into(&mut buf) {
            let result = parse_header(&mut reader, &e, false);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major, 1);
            assert_eq!(header.rev_minor, 8);
            assert_eq!(header.name, Some("TestRoad".to_string()));
            assert_eq!(header.version, Some("1.00".to_string()));
            assert_eq!(header.date, Some("2024-01-01".to_string()));
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_header_with_start_end_tags_and_all_attributes() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad" version="1.00" date="2024-01-01" north="100.0" south="-100.0" east="200.0" west="-200.0" vendor="TestVendor"></header>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(quick_xml::events::Event::Start(e)) = reader.read_event_into(&mut buf) {
            let result = parse_header(&mut reader, &e, false);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major, 1);
            assert_eq!(header.rev_minor, 8);
            assert_eq!(header.name, Some("TestRoad".to_string()));
            assert_eq!(header.version, Some("1.00".to_string()));
            assert_eq!(header.date, Some("2024-01-01".to_string()));
            assert_eq!(header.north, Some(100.0));
            assert_eq!(header.south, Some(-100.0));
            assert_eq!(header.east, Some(200.0));
            assert_eq!(header.west, Some(-200.0));
            assert_eq!(header.vendor, Some("TestVendor".to_string()));
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_header_with_geo_reference() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad" geoReference="+proj=utm +zone=32 +datum=WGS84"/>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        if let Ok(quick_xml::events::Event::Empty(e)) = reader.read_event_into(&mut buf) {
            let result = parse_header(&mut reader, &e, true);
            assert!(result.is_ok());

            let header = result.unwrap();
            assert_eq!(header.rev_major, 1);
            assert_eq!(header.rev_minor, 8);
            assert_eq!(header.name, Some("TestRoad".to_string()));
            assert_eq!(
                header.geo_reference,
                Some("+proj=utm +zone=32 +datum=WGS84".to_string())
            );
        } else {
            panic!("无法解析 XML 事件");
        }
    }

    #[test]
    fn test_parse_header_with_geo_reference_cdata() {
        let xml = r#"
        <header revMajor="1" revMinor="8" name="TestRoad">
            <geoReference>
                <![CDATA[+proj=tmerc +lat_0=30 +lon_0=120]]>
            </geoReference>
        </header>
        "#;
        let mut reader = quick_xml::Reader::from_str(xml);
        reader.config_mut().trim_text(true); // ignore whitespace
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"header" {
                        let result = parse_header(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let header = result.unwrap();
                        assert_eq!(
                            header.geo_reference,
                            Some("+proj=tmerc +lat_0=30 +lon_0=120".to_string())
                        );
                        break;
                    }
                }
                Ok(Event::Eof) => panic!("Did not find header"),
                _ => {}
            }
            buf.clear();
        }
    }

    #[test]
    fn test_parse_header_with_offset() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad">
            <offset x="456789.123" y="1234567.456" z="100.0" hdg="1.5708"/>
        </header>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        reader.config_mut().trim_text(true);
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"header" {
                        let result = parse_header(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let header = result.unwrap();
                        let offset = header.offset().expect("offset should be present");
                        assert!((offset.x - 456789.123).abs() < 1e-6);
                        assert!((offset.y - 1234567.456).abs() < 1e-6);
                        assert!((offset.z - 100.0).abs() < 1e-6);
                        assert!((offset.hdg - 1.5708).abs() < 1e-6);
                        break;
                    }
                }
                Ok(Event::Eof) => panic!("Did not find header"),
                _ => {}
            }
            buf.clear();
        }
    }

    #[test]
    fn test_parse_header_with_empty_offset() {
        let xml = r#"<header revMajor="1" revMinor="8" name="TestRoad"><offset x="123.0" y="456.0" z="0.0" hdg="0.0"/></header>"#;
        let mut reader = quick_xml::Reader::from_str(xml);
        let mut buf = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    if e.name().as_ref() == b"header" {
                        let result = parse_header(&mut reader, &e, false);
                        assert!(result.is_ok());
                        let header = result.unwrap();
                        let offset = header.offset().expect("offset should be present");
                        assert!((offset.x - 123.0).abs() < 1e-6);
                        assert!((offset.y - 456.0).abs() < 1e-6);
                        break;
                    }
                }
                Ok(Event::Eof) => panic!("Did not find header"),
                _ => {}
            }
            buf.clear();
        }
    }
}
