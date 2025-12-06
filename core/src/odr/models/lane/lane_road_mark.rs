use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkColor {
    Black = "black",
    Blue = "blue",
    Green = "green",
    Orange = "orange",
    Red = "red",
    Standard = "standard",
    /// equivalent to white
    Violet = "violet",
    White = "white",
    Yellow = "yellow",
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkType {
    BottsDots = "botts dots",
    BrokenBroken = "broken broken",
    BrokenSolid = "broken solid",
    Broken = "broken",
    Curb = "curb",
    Custom = "custom",
    Edge = "edge",
    Grass = "grass",
    None = "none",
    SolidBroken = "solid broken",
    SolidSolid = "solid solid",
    Solid = "solid",
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkWeight {
    Bold = "bold",
    Standard = "standard",
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkLaneChange {
    Both = "both",
    Decrease = "decrease",
    Increase = "increase",
    None = "none",
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub enum OdrRoadMarkRule {
    Caution = "caution",
    NoPassing = "no passing",
    None = "none",
}

/// <roadMark> element defines the style of the line at the outer border of a lane
///
/// For left lanes, this is the left border; for right lanes, the right border.
/// The center line separating left and right lanes is determined by the road mark for the center lane.
///
/// Road markings can be defined in two ways:
/// 1. Simple keyword type using @mark_type attribute (solid, broken, etc.)
/// 2. Detailed definition using <type> or <explicit> child elements
///
/// ```xml
/// <roadMark sOffset="0.0" type="solid" color="standard" width="0.15" />
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadMark {
    /// s-coordinate of start position, relative to the preceding <laneSection>
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// Type of the road mark (simplified keyword type)
    #[wasm_bindgen(getter_with_clone, js_name = "markType")]
    pub mark_type: OdrRoadMarkType,

    /// Color of the road mark
    #[wasm_bindgen(getter_with_clone)]
    pub color: OdrRoadMarkColor,

    /// Width of the road mark
    pub width: Option<f64>,

    /// Height of road mark above the road (thickness)
    pub height: Option<f64>,

    /// Material of the road mark
    #[wasm_bindgen(getter_with_clone)]
    pub material: Option<String>,

    /// Weight of the road mark (bold/standard)
    #[wasm_bindgen(getter_with_clone)]
    pub weight: Option<OdrRoadMarkWeight>,

    /// Lane change permission (both/increase/decrease/none)
    #[wasm_bindgen(getter_with_clone, js_name = "laneChange")]
    pub lane_change: Option<OdrRoadMarkLaneChange>,

    /// Detailed type definition with line patterns (<type> element)
    /// More specific than the @mark_type attribute
    #[wasm_bindgen(getter_with_clone, js_name = "typeDetail")]
    pub type_detail: Option<OdrRoadMarkTypeDetail>,

    /// Explicit road marking definition (<explicit> element)
    /// For irregular markings that cannot be described by repetitive patterns
    #[wasm_bindgen(getter_with_clone)]
    pub explicit: Option<OdrRoadMarkExplicit>,

    /// Lateral offset curves (<sway> elements)
    /// Defines sideway curves for non-straight lane markings
    #[wasm_bindgen(getter_with_clone)]
    pub sways: Vec<OdrRoadMarkSway>,
}

/// <type> element defines the type of the road mark
///
/// Contains detailed line patterns for road markings. Each type definition contains
/// one or more <line> elements with additional information about the lines that compose
/// the road mark. This is more specific than using the simple @type attribute.
///
/// ```xml
/// <type name="doubleSolid" width="0.34">
///   <line width="0.12" tOffset="-0.11" ... />
///   <line width="0.12" tOffset="0.11" ... />
/// </type>
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadMarkTypeDetail {
    /// Name of the road mark type (freely chosen identifier)
    #[wasm_bindgen(getter_with_clone)]
    pub name: String,

    /// Accumulated width of the road mark
    /// Sum of all line widths and spaces in between, supersedes <roadMark> width
    #[wasm_bindgen(getter_with_clone)]
    pub width: f64,

    /// Line definitions that compose this road mark type
    #[wasm_bindgen(getter_with_clone)]
    pub lines: Vec<OdrRoadMarkTypeLine>,
}

/// <line> element within <type> for repetitive road marking patterns
///
/// A road mark may consist of one or more line elements, usually positioned side-by-side.
/// Line definitions are valid for a given length and will be repeated automatically along the lane.
///
/// The outline is described by @length (visible part) and @space (gap between visible parts).
///
/// ```xml
/// <line length="3.0" space="3.0" tOffset="0.0" width="0.15" sOffset="0.0" />
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadMarkTypeLine {
    /// Initial longitudinal offset from the start of the road mark definition
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// Length of the visible part of the line
    pub length: f64,

    /// Length of the gap between visible parts (spacing)
    pub space: f64,

    /// Lateral offset from the lane border
    /// If <sway> is present, the offset follows the sway curve
    #[wasm_bindgen(js_name = "tOffset")]
    pub t_offset: f64,

    /// Line color, supersedes the <roadMark> color if specified
    #[wasm_bindgen(getter_with_clone)]
    pub color: Option<OdrRoadMarkColor>,

    /// Traffic rule for passing from inside (lower to higher lane ID)
    #[wasm_bindgen(getter_with_clone)]
    pub rule: Option<OdrRoadMarkRule>,

    /// Line width (optional)
    pub width: Option<f64>,
}

/// <explicit> element for irregular road markings that cannot be described by repetitive patterns
///
/// Lines defined in explicit elements will NOT be repeated automatically.
/// Typically used for measurement data.
///
/// ```xml
/// <explicit>
///   <line sOffset="0.0" length="3.0" tOffset="0.0" width="0.15" />
///   <line sOffset="5.0" length="2.5" tOffset="0.05" width="0.15" />
/// </explicit>
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadMarkExplicit {
    #[wasm_bindgen(getter_with_clone)]
    pub lines: Vec<OdrRoadMarkExplicitLine>,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadMarkExplicitLine {
    /// s-coordinate offset relative to the @sOffset given in the <roadMark> element
    #[wasm_bindgen(js_name = "sOffset")]
    pub s_offset: f64,

    /// Length of the visible line
    pub length: f64,

    /// Lateral offset from the lane border
    /// If <sway> element is present, the lateral offset follows the sway
    #[wasm_bindgen(js_name = "tOffset")]
    pub t_offset: f64,

    /// Line width (supersedes the definition in <roadMark>)
    pub width: Option<f64>,

    /// Rule that must be observed when passing the line from inside
    #[wasm_bindgen(getter_with_clone)]
    pub rule: Option<OdrRoadMarkRule>,
}

/// <sway> element defines lateral offset curves for road markings
///
/// Relocates the lateral reference position for the following type definition.
/// The sway offset is relative to the lane border.
///
/// Formula: tOffset(ds) = a + b*ds + c*ds² + d*ds³
///
/// ```xml
/// <sway ds="0.0" a="0.0" b="0.05" c="0.0" d="0.0" />
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadMarkSway {
    /// s-coordinate of start position, relative to @sOffset in <roadMark>
    pub ds: f64,

    /// Polynom parameter a, sway value at @ds (ds=0)
    pub a: f64,

    /// Polynom parameter b
    pub b: f64,

    /// Polynom parameter c
    pub c: f64,

    /// Polynom parameter d
    pub d: f64,
}
