use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OdrRoadGeometry {
    pub s: f64,
    pub x: f64,
    pub y: f64,
    pub hdg: f64,
    pub length: f64,
    pub kind: OdrRoadGeometryKind,

    // Spiral 字段
    #[wasm_bindgen(js_name = "curvStart")]
    pub curv_start: Option<f64>,
    #[wasm_bindgen(js_name = "curvEnd")]
    pub curv_end: Option<f64>,

    // Arc 字段
    pub curvature: Option<f64>,

    // ParamPoly3 字段
    #[wasm_bindgen(js_name = "aU")]
    pub a_u: Option<f64>,
    #[wasm_bindgen(js_name = "aV")]
    pub a_v: Option<f64>,
    #[wasm_bindgen(js_name = "bU")]
    pub b_u: Option<f64>,
    #[wasm_bindgen(js_name = "bV")]
    pub b_v: Option<f64>,
    #[wasm_bindgen(js_name = "cU")]
    pub c_u: Option<f64>,
    #[wasm_bindgen(js_name = "cV")]
    pub c_v: Option<f64>,
    #[wasm_bindgen(js_name = "dU")]
    pub d_u: Option<f64>,
    #[wasm_bindgen(js_name = "dV")]
    pub d_v: Option<f64>,
    #[wasm_bindgen(js_name = "pRange")]
    pub p_range: Option<OdrParamPoly3PRange>,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum OdrRoadGeometryKind {
    Line,
    Spiral,
    Arc,
    ParamPoly3,
}

/// Enumerations of the paramPoly3 pRange attribute
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub enum OdrParamPoly3PRange {
    ArcLength,
    Normalized,
}

/// 参考线上某点的位置和切线方向
#[derive(Debug, Clone, Copy)]
pub struct PosHdg {
    pub x: f64,
    pub y: f64,
    pub hdg: f64,
}

/// 内部方法（不暴露给 WASM）
impl OdrRoadGeometry {
    /// 计算几何段上距离起点 ds 处的位置和切线方向
    ///
    /// # 参数
    /// - `ds`: 沿几何段的距离（从几何段起点开始）
    ///
    /// # 返回
    /// 位置 (x, y) 和切线方向 hdg
    pub fn eval_at(&self, ds: f64) -> PosHdg {
        match self.kind {
            OdrRoadGeometryKind::Line => self.eval_line(ds),
            OdrRoadGeometryKind::Arc => self.eval_arc(ds),
            OdrRoadGeometryKind::Spiral => self.eval_spiral(ds),
            OdrRoadGeometryKind::ParamPoly3 => self.eval_param_poly3(ds),
        }
    }

    /// 直线几何
    fn eval_line(&self, ds: f64) -> PosHdg {
        PosHdg {
            x: self.x + ds * self.hdg.cos(),
            y: self.y + ds * self.hdg.sin(),
            hdg: self.hdg,
        }
    }

    /// 圆弧几何
    fn eval_arc(&self, ds: f64) -> PosHdg {
        let curv = self.curvature.unwrap_or(0.0);

        if curv.abs() < 1e-15 {
            // 曲率为零，退化为直线
            return self.eval_line(ds);
        }

        let radius = 1.0 / curv;
        let theta = ds * curv; // 走过的角度

        // 圆心在起点的左侧（曲率为正）或右侧（曲率为负）
        let center_angle = self.hdg + std::f64::consts::FRAC_PI_2;
        let cx = self.x + radius * center_angle.cos();
        let cy = self.y + radius * center_angle.sin();

        PosHdg {
            x: cx + radius * (center_angle + theta).cos(),
            y: cy + radius * (center_angle + theta).sin(),
            hdg: self.hdg + theta,
        }
    }

    /// 回旋曲线（欧拉螺旋）- 使用数值积分
    fn eval_spiral(&self, ds: f64) -> PosHdg {
        let curv_start = self.curv_start.unwrap_or(0.0);
        let curv_end = self.curv_end.unwrap_or(0.0);

        // 曲率线性变化：k(s) = curv_start + (curv_end - curv_start) * s / length
        let curv_rate = if self.length > 1e-15 {
            (curv_end - curv_start) / self.length
        } else {
            0.0
        };

        // 使用辛普森积分计算位置
        let (local_x, local_y, delta_hdg) = self.integrate_spiral(ds, curv_start, curv_rate);

        // 旋转到全局坐标系
        let cos_hdg = self.hdg.cos();
        let sin_hdg = self.hdg.sin();

        PosHdg {
            x: self.x + local_x * cos_hdg - local_y * sin_hdg,
            y: self.y + local_x * sin_hdg + local_y * cos_hdg,
            hdg: self.hdg + delta_hdg,
        }
    }

    /// 辛普森积分计算回旋曲线
    fn integrate_spiral(&self, ds: f64, curv_start: f64, curv_rate: f64) -> (f64, f64, f64) {
        const N: usize = 100; // 积分步数
        let step = ds / N as f64;

        let mut x = 0.0;
        let mut y = 0.0;

        for i in 0..N {
            let s0 = i as f64 * step;
            let s1 = s0 + step * 0.5;
            let s2 = s0 + step;

            // 各点的切线角度：theta(s) = curv_start * s + 0.5 * curv_rate * s^2
            let theta0 = curv_start * s0 + 0.5 * curv_rate * s0 * s0;
            let theta1 = curv_start * s1 + 0.5 * curv_rate * s1 * s1;
            let theta2 = curv_start * s2 + 0.5 * curv_rate * s2 * s2;

            // 辛普森法则
            x += step / 6.0 * (theta0.cos() + 4.0 * theta1.cos() + theta2.cos());
            y += step / 6.0 * (theta0.sin() + 4.0 * theta1.sin() + theta2.sin());
        }

        let delta_hdg = curv_start * ds + 0.5 * curv_rate * ds * ds;
        (x, y, delta_hdg)
    }

    /// 参数三次多项式
    fn eval_param_poly3(&self, ds: f64) -> PosHdg {
        let a_u = self.a_u.unwrap_or(0.0);
        let b_u = self.b_u.unwrap_or(0.0);
        let c_u = self.c_u.unwrap_or(0.0);
        let d_u = self.d_u.unwrap_or(0.0);
        let a_v = self.a_v.unwrap_or(0.0);
        let b_v = self.b_v.unwrap_or(0.0);
        let c_v = self.c_v.unwrap_or(0.0);
        let d_v = self.d_v.unwrap_or(0.0);

        // 计算参数 p
        let p = match self.p_range {
            Some(OdrParamPoly3PRange::Normalized) => {
                if self.length > 1e-15 {
                    ds / self.length
                } else {
                    0.0
                }
            }
            _ => ds, // ArcLength 或默认
        };

        let p2 = p * p;
        let p3 = p2 * p;

        // 局部坐标
        let local_u = a_u + b_u * p + c_u * p2 + d_u * p3;
        let local_v = a_v + b_v * p + c_v * p2 + d_v * p3;

        // 切线方向（对 p 求导）
        let du_dp = b_u + 2.0 * c_u * p + 3.0 * d_u * p2;
        let dv_dp = b_v + 2.0 * c_v * p + 3.0 * d_v * p2;
        let local_hdg = dv_dp.atan2(du_dp);

        // 旋转到全局坐标系
        let cos_hdg = self.hdg.cos();
        let sin_hdg = self.hdg.sin();

        PosHdg {
            x: self.x + local_u * cos_hdg - local_v * sin_hdg,
            y: self.y + local_u * sin_hdg + local_v * cos_hdg,
            hdg: self.hdg + local_hdg,
        }
    }
}

#[wasm_bindgen]
impl OdrRoadGeometry {
    #[wasm_bindgen(js_name = "createLine")]
    pub fn create_line(s: f64, x: f64, y: f64, hdg: f64, length: f64) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            kind: OdrRoadGeometryKind::Line,
            curv_start: None,
            curv_end: None,
            curvature: None,
            a_u: None,
            a_v: None,
            b_u: None,
            b_v: None,
            c_u: None,
            c_v: None,
            d_u: None,
            d_v: None,
            p_range: None,
        }
    }

    #[wasm_bindgen(js_name = "createSpiral")]
    pub fn create_spiral(
        s: f64,
        x: f64,
        y: f64,
        hdg: f64,
        length: f64,
        curv_start: f64,
        curv_end: f64,
    ) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            kind: OdrRoadGeometryKind::Spiral,
            curv_start: Some(curv_start),
            curv_end: Some(curv_end),
            curvature: None,
            a_u: None,
            a_v: None,
            b_u: None,
            b_v: None,
            c_u: None,
            c_v: None,
            d_u: None,
            d_v: None,
            p_range: None,
        }
    }

    #[wasm_bindgen(js_name = "createArc")]
    pub fn create_arc(s: f64, x: f64, y: f64, hdg: f64, length: f64, curvature: f64) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            kind: OdrRoadGeometryKind::Arc,
            curv_start: None,
            curv_end: None,
            curvature: Some(curvature),
            a_u: None,
            a_v: None,
            b_u: None,
            b_v: None,
            c_u: None,
            c_v: None,
            d_u: None,
            d_v: None,
            p_range: None,
        }
    }

    #[wasm_bindgen(js_name = "createParamPoly3")]
    pub fn create_param_poly3(
        s: f64,
        x: f64,
        y: f64,
        hdg: f64,
        length: f64,
        a_u: f64,
        a_v: f64,
        b_u: f64,
        b_v: f64,
        c_u: f64,
        c_v: f64,
        d_u: f64,
        d_v: f64,
        p_range: OdrParamPoly3PRange,
    ) -> Self {
        Self {
            s,
            x,
            y,
            hdg,
            length,
            kind: OdrRoadGeometryKind::ParamPoly3,
            curv_start: None,
            curv_end: None,
            curvature: None,
            a_u: Some(a_u),
            a_v: Some(a_v),
            b_u: Some(b_u),
            b_v: Some(b_v),
            c_u: Some(c_u),
            c_v: Some(c_v),
            d_u: Some(d_u),
            d_v: Some(d_v),
            p_range: Some(p_range),
        }
    }
}
