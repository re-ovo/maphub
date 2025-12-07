use wasm_bindgen::prelude::*;

use crate::MapFormatType;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Files {
    files: Vec<File>,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct File {
    name: String,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl Files {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { files: Vec::new() }
    }

    #[wasm_bindgen(js_name = addFile)]
    pub fn add_file(&mut self, file: File) {
        self.files.push(file);
    }

    #[wasm_bindgen(js_name = detectFormat)]
    pub fn detect_format(&self) -> Result<MapFormatType, String> {
        for file in &self.files {
            if file.name.ends_with(".xodr") {
                return Ok(MapFormatType::OpenDrive);
            }
        }
        Err("No format detected".to_string())
    }
}

impl Files {
    /// 获取所有文件
    pub fn get_files(&self) -> &[File] {
        &self.files
    }

    /// 根据扩展名查找第一个匹配的文件
    pub fn find_by_extension(&self, extension: &str) -> Option<&File> {
        self.files.iter().find(|f| f.name.ends_with(extension))
    }

    /// 根据扩展名筛选所有匹配的文件
    pub fn filter_by_extension(&self, extension: &str) -> Vec<&File> {
        self.files
            .iter()
            .filter(|f| f.name.ends_with(extension))
            .collect()
    }
}

#[wasm_bindgen]
impl File {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, data: Vec<u8>) -> Self {
        Self { name, data }
    }
}

impl File {
    /// 获取文件名
    pub fn get_name(&self) -> &str {
        &self.name
    }

    /// 获取文件数据
    pub fn get_data(&self) -> &[u8] {
        &self.data
    }
}
