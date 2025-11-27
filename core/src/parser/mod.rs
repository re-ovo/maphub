mod header;

use anyhow::{Result, anyhow};
use quick_xml::Reader;
use quick_xml::events::Event;
use wasm_bindgen::prelude::*;

use crate::models::opendrive::OpenDrive;

pub use header::parse_header;

/// 解析 OpenDrive XML 字符串（内部实现）
fn parse_opendrive_internal(xml: &str) -> Result<OpenDrive> {
    let mut reader = Reader::from_str(xml);

    let mut header_opt = None;
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => match e.name().as_ref() {
                b"header" => {
                    header_opt = Some(header::parse_header(&mut reader, e, false)?);
                }
                _ => {}
            },
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"header" => {
                    header_opt = Some(header::parse_header(&mut reader, e, true)?);
                }
                _ => {}
            },
            Ok(Event::Eof) => break,
            Err(e) => return Err(anyhow!("XML 解析错误: {:?}", e)),
            _ => {}
        }
        buf.clear();
    }

    let header = header_opt.ok_or_else(|| anyhow!("未找到 header 元素"))?;
    let roads = Vec::new(); // 暂时不解析 roads

    Ok(OpenDrive::new(header, roads))
}

/// 解析 OpenDrive XML 字符串
#[wasm_bindgen]
pub fn parse_opendrive(xml: &str) -> Result<OpenDrive, String> {
    parse_opendrive_internal(xml).map_err(|e| e.to_string())
}
