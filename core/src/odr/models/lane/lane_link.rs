use wasm_bindgen::prelude::*;

/// OpenDrive 车道连接 (Lane Link)
///
/// 定义车道与相邻 lane section 中车道的连接关系。
/// 每个车道可以有前驱车道(predecessor)和后继车道(successor)。
///
/// # 规则
/// - 前驱车道位于当前 lane section 之前的 lane section 中
/// - 后继车道位于当前 lane section 之后的 lane section 中
/// - 车道 ID 的符号必须匹配（左侧车道连接左侧车道，右侧车道连接右侧车道）
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrLaneLink {
    /// 前驱车道 ID（可选）
    /// 指向前一个 lane section 中连接到当前车道的车道 ID
    pub predecessor: Option<i32>,

    /// 后继车道 ID（可选）
    /// 指向后一个 lane section 中从当前车道连接出去的车道 ID
    pub successor: Option<i32>,
}

#[wasm_bindgen]
impl OdrLaneLink {
    /// 创建新的车道连接
    ///
    /// # 参数
    /// - `predecessor`: 前驱车道 ID（可选）
    /// - `successor`: 后继车道 ID（可选）
    #[wasm_bindgen(constructor)]
    pub fn new(predecessor: Option<i32>, successor: Option<i32>) -> Self {
        Self {
            predecessor,
            successor,
        }
    }

    /// 检查是否有前驱车道
    #[wasm_bindgen(js_name = "hasPredecessor")]
    pub fn has_predecessor(&self) -> bool {
        self.predecessor.is_some()
    }

    /// 检查是否有后继车道
    #[wasm_bindgen(js_name = "hasSuccessor")]
    pub fn has_successor(&self) -> bool {
        self.successor.is_some()
    }

    /// 检查车道是否与任何其他车道连接
    #[wasm_bindgen(js_name = "isConnected")]
    pub fn is_connected(&self) -> bool {
        self.has_predecessor() || self.has_successor()
    }
}
