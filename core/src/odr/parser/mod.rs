mod header;
mod lane;
mod road;

use anyhow::{Result, anyhow};
use quick_xml::Reader;
use quick_xml::events::Event;
use wasm_bindgen::prelude::*;

pub use header::parse_header;
pub use lane::parse_lanes;
pub use road::parse_road;

use crate::fs::Files;
use crate::odr::models::opendrive::OpenDrive;

/// 解析 OpenDrive XML
#[wasm_bindgen(js_name = parseOpendrive)]
pub fn parse_opendrive(xml: &[u8]) -> Result<OpenDrive, String> {
    parse_opendrive_internal(xml).map_err(|e| e.to_string())
}

/// 从 Files 中解析多个 OpenDrive
#[wasm_bindgen(js_name = parseOpendriveFromFiles)]
pub fn parse_opendrive_from_files(files: &Files) -> Result<Vec<OpenDrive>, String> {
    // 查找所有 .xodr 文件
    let xodr_files = files.filter_by_extension(".xodr");

    if xodr_files.is_empty() {
        return Err("未找到 .xodr 格式的文件".to_string());
    }

    // 解析所有文件
    let mut opendrives = Vec::new();
    for file in xodr_files {
        let opendrive = parse_opendrive_internal(file.get_data()).map_err(|e| e.to_string())?;
        opendrives.push(opendrive);
    }

    Ok(opendrives)
}

fn parse_opendrive_internal(xml: &[u8]) -> Result<OpenDrive> {
    let mut reader = Reader::from_reader(xml);

    let mut header_opt = None;
    let mut roads = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => match e.name().as_ref() {
                b"header" => {
                    header_opt = Some(header::parse_header(&mut reader, e, false)?);
                }
                b"road" => {
                    let road = road::parse_road(&mut reader, e, false)?;
                    roads.push(road);
                }
                _ => {}
            },
            Ok(Event::Empty(ref e)) => match e.name().as_ref() {
                b"header" => {
                    header_opt = Some(header::parse_header(&mut reader, e, true)?);
                }
                b"road" => {
                    let road = road::parse_road(&mut reader, e, true)?;
                    roads.push(road);
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

    Ok(OpenDrive::new(header, roads))
}
