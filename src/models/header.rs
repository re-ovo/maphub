use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Header {
    rev_major: u8,
    rev_minor: u8,
    name: String,
    version: String,
    date: String,
    north: f64,
    south: f64,
    east: f64,
    west: f64,
    vendor: String,
}

#[wasm_bindgen]
impl Header {
    #[wasm_bindgen(constructor)]
    pub fn new(
        rev_major: u8,
        rev_minor: u8,
        name: String,
        version: String,
        date: String,
        north: f64,
        south: f64,
        east: f64,
        west: f64,
        vendor: String,
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
        }
    }

    pub fn rev_major(&self) -> u8 {
        self.rev_major
    }

    pub fn rev_minor(&self) -> u8 {
        self.rev_minor
    }

    pub fn name(&self) -> String {
        self.name.clone()
    }

    pub fn version(&self) -> String {
        self.version.clone()
    }

    pub fn date(&self) -> String {
        self.date.clone()
    }

    pub fn north(&self) -> f64 {
        self.north
    }

    pub fn south(&self) -> f64 {
        self.south
    }

    pub fn east(&self) -> f64 {
        self.east
    }

    pub fn west(&self) -> f64 {
        self.west
    }

    pub fn vendor(&self) -> String {
        self.vendor.clone()
    }
}

impl Default for Header {
    fn default() -> Self {
        Self {
            rev_major: 1,
            rev_minor: 8,
            name: "".to_string(),
            version: "1.00".to_string(),
            date: "".to_string(),
            north: 0.0,
            south: 0.0,
            east: 0.0,
            west: 0.0,
            vendor: "".to_string(),
        }
    }
}
