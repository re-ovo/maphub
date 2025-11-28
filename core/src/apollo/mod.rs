use prost::Message;
use wasm_bindgen::prelude::wasm_bindgen;

pub mod generated {
    /// Apollo common proto 包（包含基础几何类型）
    pub mod common {
        include!(concat!(env!("OUT_DIR"), "/apollo.common.rs"));
    }

    /// Apollo hdmap proto 包（地图数据结构）
    pub mod hdmap {
        include!(concat!(env!("OUT_DIR"), "/apollo.hdmap.rs"));
    }
}

fn parse_apollo_map_internal(buf: &[u8]) -> Result<generated::hdmap::Map, anyhow::Error> {
    let map = generated::hdmap::Map::decode(buf)
        .map_err(|e| anyhow::anyhow!("Failed to decode Apollo map: {}", e))?;
    Ok(map)
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct ApolloMap {
    map: generated::hdmap::Map,
}

#[wasm_bindgen(js_name = parseApolloMap)]
pub fn parse_apollo_map(buf: &[u8]) -> Result<ApolloMap, String> {
    let map = parse_apollo_map_internal(buf).map_err(|e| e.to_string())?;
    Ok(ApolloMap { map })
}
