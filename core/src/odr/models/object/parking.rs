use wasm_bindgen::prelude::*;

use super::enums::OdrParkingSpaceAccess;

/// 停车位
///
/// 可以向 object 元素添加停车位的详细信息。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrParkingSpace {
    /// 停车位的访问定义
    #[wasm_bindgen(getter_with_clone)]
    pub access: OdrParkingSpaceAccess,

    /// 自由文本,取决于应用程序
    #[wasm_bindgen(getter_with_clone)]
    pub restrictions: Option<String>,
}

#[wasm_bindgen]
impl OdrParkingSpace {
    #[wasm_bindgen(constructor)]
    pub fn new(access: OdrParkingSpaceAccess) -> Self {
        Self {
            access,
            restrictions: None,
        }
    }
}
