use std::fmt::Display;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Header {
    #[wasm_bindgen(js_name = "revMajor")]
    pub rev_major: i32,
    #[wasm_bindgen(js_name = "revMinor")]
    pub rev_minor: i32,
    #[wasm_bindgen(js_name = "name", getter_with_clone)]
    pub name: Option<String>,
    #[wasm_bindgen(js_name = "date", getter_with_clone)]
    pub date: Option<String>,
    #[wasm_bindgen(js_name = "version", getter_with_clone)]
    pub version: Option<String>,
    #[wasm_bindgen(js_name = "north")]
    pub north: Option<f64>,
    #[wasm_bindgen(js_name = "south")]
    pub south: Option<f64>,
    #[wasm_bindgen(js_name = "east")]
    pub east: Option<f64>,
    #[wasm_bindgen(js_name = "west")]
    pub west: Option<f64>,
    #[wasm_bindgen(js_name = "vendor", getter_with_clone)]
    pub vendor: Option<String>,
    #[wasm_bindgen(js_name = "geoReference", getter_with_clone)]
    pub geo_reference: Option<String>,
}

#[wasm_bindgen]
impl Header {
    #[wasm_bindgen(constructor)]
    pub fn new(
        rev_major: i32,
        rev_minor: i32,
        name: Option<String>,
        version: Option<String>,
        date: Option<String>,
        north: Option<f64>,
        south: Option<f64>,
        east: Option<f64>,
        west: Option<f64>,
        vendor: Option<String>,
        geo_reference: Option<String>,
    ) -> Self {
        Self {
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
        }
    }
}

impl Display for Header {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Header {{ rev_major: {}, rev_minor: {}, name: {:?}, version: {:?}, date: {:?}, north: {:?}, south: {:?}, east: {:?}, west: {:?}, vendor: {:?}, geo_reference: {:?} }}",
            self.rev_major,
            self.rev_minor,
            self.name,
            self.version,
            self.date,
            self.north,
            self.south,
            self.east,
            self.west,
            self.vendor,
            self.geo_reference
        )
    }
}
