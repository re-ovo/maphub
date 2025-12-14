use wasm_bindgen::prelude::*;

mod border;
mod enums;
mod marking;
mod outline;
mod parking;
mod reference;
mod repeat;
mod validity;

// 重新导出所有类型
pub use border::*;
pub use enums::*;
pub use marking::*;
pub use outline::*;
pub use parking::*;
pub use reference::*;
pub use repeat::*;
pub use validity::*;

/// OpenDRIVE Object
///
/// Objects 是影响道路的元素,通过扩展、分隔或补充道路的走向来影响道路。
/// 最常见的例子包括停车位、人行横道和交通护栏。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrObject {
    /// 数据库内的唯一 ID
    #[wasm_bindgen(getter_with_clone)]
    pub id: String,

    /// 对象名称(可自由选择)
    #[wasm_bindgen(getter_with_clone)]
    pub name: Option<String>,

    /// 对象类型(支持自定义类型,如 building, tree, crosswalk, streetLamp 等)
    #[wasm_bindgen(getter_with_clone, js_name = "objectType")]
    pub object_type: Option<String>,

    /// 类型的变体
    #[wasm_bindgen(getter_with_clone)]
    pub subtype: Option<String>,

    /// 对象原点的 s 坐标
    pub s: f64,

    /// 对象原点的 t 坐标
    pub t: f64,

    /// 相对于道路参考线高程的 z 偏移
    #[wasm_bindgen(js_name = "zOffset")]
    pub z_offset: f64,

    /// 对象沿 s 轴的有效长度(点对象为 0.0)
    #[wasm_bindgen(js_name = "validLength")]
    pub valid_length: Option<f64>,

    /// 对象有效的方向
    #[wasm_bindgen(getter_with_clone)]
    pub orientation: Option<OdrOrientation>,

    /// 边界框的长度(与 radius 互斥)
    pub length: Option<f64>,

    /// 边界框的宽度(与 radius 互斥)
    pub width: Option<f64>,

    /// 圆形对象边界框的半径(与 length/width 互斥)
    pub radius: Option<f64>,

    /// 边界框的高度
    pub height: Option<f64>,

    /// 对象相对于道路方向的航向角
    pub hdg: Option<f64>,

    /// 相对于 x/y 平面的俯仰角
    pub pitch: Option<f64>,

    /// 相对于 x/y 平面的横滚角
    pub roll: Option<f64>,

    /// 是否为动态对象(默认为 false,静态)
    pub dynamic: Option<bool>,

    /// 是否垂直于道路表面(如果为 true,则忽略 pitch 和 roll)
    #[wasm_bindgen(js_name = "perpToRoad")]
    pub perp_to_road: Option<bool>,

    /// 重复对象列表
    #[wasm_bindgen(getter_with_clone)]
    pub repeat: Vec<OdrObjectRepeat>,

    /// 轮廓列表
    #[wasm_bindgen(getter_with_clone)]
    pub outlines: Vec<OdrOutline>,

    /// 车道有效性列表
    #[wasm_bindgen(getter_with_clone)]
    pub validity: Vec<OdrLaneValidity>,

    /// 停车位信息(仅用于停车位类型)
    #[wasm_bindgen(getter_with_clone, js_name = "parkingSpace")]
    pub parking_space: Option<OdrParkingSpace>,

    /// 标记列表
    #[wasm_bindgen(getter_with_clone)]
    pub markings: Vec<OdrMarking>,

    /// 边框列表
    #[wasm_bindgen(getter_with_clone)]
    pub borders: Vec<OdrBorder>,
}

#[wasm_bindgen]
impl OdrObject {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, s: f64, t: f64, z_offset: f64) -> Self {
        Self {
            id,
            name: None,
            object_type: None,
            subtype: None,
            s,
            t,
            z_offset,
            valid_length: None,
            orientation: None,
            length: None,
            width: None,
            radius: None,
            height: None,
            hdg: None,
            pitch: None,
            roll: None,
            dynamic: None,
            perp_to_road: None,
            repeat: Vec::new(),
            outlines: Vec::new(),
            validity: Vec::new(),
            parking_space: None,
            markings: Vec::new(),
            borders: Vec::new(),
        }
    }
}
