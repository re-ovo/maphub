# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个支持多种地图文件的 Web 查看器项目，使用 Rust + WASM 进行文件解析，React + BabylonJS 进行 3D 渲染和交互。

## 项目结构

```
opendrive-core/
├── core/               # Rust WASM 核心库
│   └── src/
│       ├── odr/        # OpenDrive 格式相关
│       │   ├── models/ # OpenDrive 数据模型（header, road, object 等）
│       │   └── parser/ # XML 解析器（使用 quick-xml）
│       ├── apollo/     # Apollo 格式相关
│       └── math/       # 数学工具（vec2, vec3）
└── web/                # React Web 前端
    └── src/
        ├── viewer/     # 查看器主界面（使用 react-mosaic-component）
        │   └── panels/ # viewport, scene-tree, properties 面板
        ├── store/      # Zustand 状态管理
        └── components/ # UI 组件（基于 Radix UI + Tailwind）
```

## 常用命令

### Rust 核心库（core/）

```bash
# 构建 Rust 库
cd core && cargo build

# 运行测试
cd core && cargo test

# 构建 WASM（供 web 使用）
cd core && wasm-pack build --target web
```

### Web 前端（web/）

```bash
# 安装依赖（使用 bun）
cd web && bun install

# 开发服务器
cd web && bun run dev

# 构建生产版本
cd web && bun run build

# 代码检查
cd web && bun run lint

# 预览构建
cd web && bun run preview
```

## 架构要点

### Rust WASM 核心

- **编译目标**: `cdylib` 和 `rlib`，用于生成 WASM 模块
- **XML 解析**: 使用 `quick-xml` 进行流式解析 OpenDrive XML 文件
- **WASM 绑定**: 使用 `wasm-bindgen` 导出给 JavaScript 调用
- **错误处理**: 内部使用 `anyhow::Result`，导出时转换为 `Result<T, String>`
- **数据模型**: core/src/odr/models/ 中定义了 OpenDrive 规范的各种结构（Header, Road, Junction, Lane, Object 等）
- **解析器位置**: core/src/odr/parser/mod.rs 提供了 `parse_opendrive()` 函数

### Web 前端

- **构建工具**: Vite（使用 rolldown-vite）+ TypeScript
- **UI 框架**: React 19 + Tailwind CSS 4
- **3D 渲染**: BabylonJS（core, gui, loaders, materials）
- **状态管理**: Zustand with persistence（localStorage）
  - `pref-slice`: 用户偏好设置（面板布局、网格显示、坐标轴显示）
  - `scene-slice`: 场景状态
- **面板系统**: 使用 `react-mosaic-component` 实现可拖拽、可调整大小的面板布局
  - viewport: 3D 渲染视口（BabylonJS）
  - sceneTree: 场景树（对象层级）
  - properties: 属性面板
- **主题**: 支持明暗主题切换
- **WASM 集成**: 通过 `vite-plugin-wasm` 加载 core/pkg 中的 WASM 模块

### 模块依赖

- web 依赖 core 构建的 WASM 包：`"core": "file:../core/pkg"`
- 在修改 core 后需要重新构建 WASM 并重启 web 开发服务器

### 状态持久化

Zustand store 使用 localStorage 持久化以下状态：
- mosaicLayout: 面板布局配置
- showGrid: 是否显示网格
- showAxis: 是否显示坐标轴

## 开发工作流

1. 修改 core Rust 代码后，需要在 core/ 目录运行 `wasm-pack build --target web`
2. web 开发服务器会自动检测 WASM 变化并热更新
3. UI 组件基于 shadcn/ui（Radix UI），配置在 web/components.json

## 代码风格

- TypeScript 严格模式
- 使用 ESLint（配置在 web/eslint.config.js）
- Rust 2024 edition
- 路径别名：`@` 映射到 `web/src/`
