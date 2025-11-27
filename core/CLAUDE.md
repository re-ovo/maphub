# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个用 Rust 编写的 OpenDrive 格式解析库，支持编译为 WebAssembly (WASM)。OpenDrive 是一种用于描述道路网络的 XML 格式标准。

## 构建和测试命令

### 构建项目
```bash
# 构建 Rust 库
cargo build

# 构建发布版本（优化为小体积）
cargo build --release

# 构建 WASM 目标
wasm-pack build --target web
```

### 运行测试
```bash
# 运行所有测试
cargo test

# 运行特定模块的测试
cargo test vec2  # 运行 Vec2 模块测试
cargo test vec3  # 运行 Vec3 模块测试

# 运行 WASM 测试
wasm-pack test --headless --firefox
```

### 代码检查
```bash
# 运行 clippy 检查代码质量
cargo clippy

# 格式化代码
cargo fmt
```

## 代码架构

### 核心模块结构

1. **models/** - OpenDrive 数据模型
   - `opendrive.rs`: 顶层 OpenDrive 结构，包含 header 和 roads
   - `header.rs`: OpenDrive 头部信息
   - `road.rs`: 道路定义，包含 id、name、length 和 plan_view
   - `geometry.rs`: 道路几何定义（Line、Spiral、Arc、ParamPoly3）
   - `object.rs`: 道路对象定义

2. **math/** - 数学工具库
   - `vec2.rs`: 二维向量，支持基本运算（加减乘除、点积、叉积、归一化）
   - `vec3.rs`: 三维向量，类似 Vec2 的功能

3. **核心功能**
   - `lib.rs`: 库入口，导出 WASM 接口，包含 `parse_opendrive()` 函数（待实现）
   - `main.rs`: 可执行文件入口
   - `utils.rs`: 工具函数
   - `error.rs`: 错误处理

### 关键设计模式

- **WASM 绑定**: 所有公开的结构体都使用 `#[wasm_bindgen]` 宏标注，以便从 JavaScript 调用
- **数据模型设计**: 模型结构映射 OpenDrive XML 格式的层次结构
- **几何类型**: `RoadGeometry` 使用枚举 `RoadGeometryType` 支持多种几何类型（直线、螺旋线、圆弧、参数多项式）
- **数学库**: Vec2/Vec3 实现了 Rust 操作符重载（Add、Sub、Mul、Div）和 WASM 导出的方法

### 测试规范

- 测试位于各模块文件末尾的 `#[cfg(test)] mod tests` 块中
- Vec2 和 Vec3 模块有完整的单元测试覆盖
- 测试使用标准的 `assert_eq!` 和浮点数比较 `(value - expected).abs() < 1e-10`

## 开发注意事项

- Rust edition 设置为 2024
- 编译目标包括 `cdylib`（用于 WASM）和 `rlib`（用于 Rust 库）
- Release 配置使用 `opt-level = "s"` 优化代码体积（适合 WASM）
- 依赖项：
  - `wasm-bindgen`: WASM JavaScript 绑定
  - `quick-xml`: XML 解析（用于解析 OpenDrive 文件）
  - `anyhow`: 错误处理
  - `console_error_panic_hook`: WASM panic 信息输出（可选）