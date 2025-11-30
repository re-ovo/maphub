use wasm_bindgen::prelude::wasm_bindgen;

/// OpenDRIVE 道路横断面形状定义
///
/// Shape 定义路面相对于参考平面的高程偏移。参考平面由 elevation（纵向高程）
/// 和 superelevation（横向超高）共同确定，而 shape 则描述路面在此基础上的
/// 微观起伏，例如：
/// - 路拱 (road crown)：路面中心高、两侧低，用于排水
/// - 车辙、坑洼等路面不平整
/// - 复杂的横断面几何形状
///
/// 使用三次多项式计算高程偏移：
/// ```text
/// z(dt) = a + b·dt + c·dt² + d·dt³
/// 其中 dt = t_query - t_start
/// ```
///
/// 与 superelevation 的区别：
/// - superelevation：整个横断面的统一倾斜角度（如弯道超高）
/// - shape：横断面上不同 t 位置可以有不同的高程偏移曲线
///
/// ```xml
/// <lateralProfile>
///     <shape s="0.0" t="-3.0" a="0.0" b="0.02" c="0.0" d="0.0"/>
///     <shape s="0.0" t="0.0" a="0.05" b="0.0" c="-0.01" d="0.0"/>
///     <shape s="0.0" t="3.0" a="0.0" b="-0.02" c="0.0" d="0.0"/>
/// </lateralProfile>
/// ```
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrShape {
    /// 沿参考线的 s 坐标（单位：米）
    pub s: f64,

    /// 横向起始位置 t，多项式从此位置开始计算（单位：米）
    pub t: f64,

    /// 多项式系数 a（常数项，t 位置处的高程偏移）
    pub a: f64,

    /// 多项式系数 b（一次项，斜率）
    pub b: f64,

    /// 多项式系数 c（二次项）
    pub c: f64,

    /// 多项式系数 d（三次项）
    pub d: f64,
}

#[wasm_bindgen]
impl OdrShape {
    #[wasm_bindgen(constructor)]
    pub fn new(s: f64, t: f64, a: f64, b: f64, c: f64, d: f64) -> Self {
        Self { s, t, a, b, c, d }
    }

    /// 计算给定横向位置的高程偏移
    ///
    /// # 参数
    /// - `t_query`: 查询的横向位置
    ///
    /// # 返回
    /// 路面相对于参考平面的高程偏移值（单位：米）
    pub fn evaluate(&self, t_query: f64) -> f64 {
        let dt = t_query - self.t;
        self.a + self.b * dt + self.c * dt * dt + self.d * dt * dt * dt
    }
}
