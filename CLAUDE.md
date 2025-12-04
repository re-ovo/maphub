# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MapHub 是一个超快的在线自动驾驶地图查看器,支持多种地图格式(目前支持 ASAM OpenDRIVE)。
项目采用 Rust + WASM 处理地图解析和几何计算,React + TypeScript 构建前端界面,使用 Three.js 进行 3D 渲染。

## 常用命令

### Rust WASM 核心库 (core/)
```bash
# 构建 WASM 模块(用于开发)
cd core && wasm-pack build

# 发布构建(优化代码大小)
cd core && wasm-pack build --release
```

### Web 前端 (web/)
```bash
# 开发(会自动先构建 core)
cd web && bun run dev

# 构建生产版本(会自动先构建 core)
cd web && bun run build

# 代码检查
cd web && bun run lint

# 预览生产构建
cd web && bun run preview

# 仅构建 core 模块
cd web && bun run build:core
```

## 代码架构

### Rust WASM 核心 (core/)
- **地图格式支持**: 通过 `MapFormatType` 枚举定义支持的地图格式(OpenDrive, Apollo)
- **OpenDRIVE 模块** (`odr/`):
  - `models/`: 数据模型定义(road, lane, junction 等)
  - `parser/`: XML 解析逻辑,使用 quick-xml
  - `mesh/`: 几何网格生成,将道路/车道转换为可渲染的三角网格
- **数学库** (`math/`): 向量、参考线、网格等几何计算
- **WASM 接口**: 通过 wasm-bindgen 暴露给 JavaScript

### Web 前端 (web/)
- **状态管理**: 使用 Zustand
- **UI 组件**: 基于 shadcn/ui + Radix UI + Tailwind CSS 4
- **布局**: 使用 React Mosaic 实现可拖拽的面板布局
