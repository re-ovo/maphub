# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MapHub 是一个超快的在线自动驾驶地图查看器,支持多种地图格式(目前支持 ASAM OpenDRIVE)。
项目采用 Rust + WASM 处理地图解析和几何计算,React + TypeScript 构建前端界面,使用 BabylonJS 进行 3D 渲染。

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

## 架构设计

### 双模块架构

1. **core/ - Rust WASM 核心库**
   - 使用 wasm-pack 编译为 WebAssembly
   - 负责高性能的地图解析和几何计算
   - 编译产物在 `core/pkg/` 目录,通过 `"core": "file:../core/pkg"` 被 web 模块引用
   - 主要模块:
     - `odr/` - OpenDRIVE 格式支持(解析器和模型)
     - `apollo/` - Apollo 格式支持(规划中)
     - `math/` - 数学工具函数

2. **web/ - React 前端应用**
   - 使用 Vite (rolldown-vite) 作为构建工具
   - shadcn/ui + Tailwind CSS 4.x 构建界面
   - 主要模块:
     - `viewer/` - 地图查看器核心
     - `store/` - Zustand 状态管理
     - `components/` - UI 组件

### 地图格式插件系统

MapHub 使用插件化的地图格式系统,位于 `web/src/viewer/`:

- **MapFormat 接口** (`types/map-format.ts`): 每种地图格式需实现此接口
  - `parse()` - 解析文件内容
  - `detect()` - 检测文件格式
  - `createRenderer()` - 创建 BabylonJS 渲染器
  - `createTreeProvider()` - 创建场景树节点
  - `createPropertyProvider()` - 创建属性面板数据
  - `createHoverProvider()` - 创建悬浮信息

- **MapFormatRegistry** (`formats/registry.ts`): 全局格式注册表
  - 管理所有已注册的地图格式
  - 提供格式检测和匹配功能

- **格式实现示例**: `formats/opendrive/` 展示了完整的 OpenDRIVE 格式实现

### 状态管理(Zustand Slices)

状态按功能拆分为多个 slice (`web/src/store/`):

- `pref-slice` - 用户偏好设置(布局、网格、坐标轴显示等,持久化到 localStorage)
- `scene-slice` - BabylonJS 场景对象管理
- `document-slice` - 已加载的地图文档管理
- `selection-slice` - 场景元素选择状态
- `hover-slice` - 鼠标悬停信息

所有 slice 通过 `store/index.ts` 组合成统一的 store。

### BabylonJS 渲染架构

- 使用 React Mosaic Component 实现多面板布局
- 主要面板:
  - `viewport-panel` - 3D 视口
  - `scene-tree-panel` - 场景树(层级结构)
  - `properties-panel` - 属性面板
- 渲染器实现 `MapRenderer` 接口,负责将地图数据转换为 BabylonJS 几何体

## 添加新地图格式

要添加新的地图格式支持:

1. 在 `core/src/` 创建新的解析模块(Rust)
2. 在 `web/src/viewer/formats/` 创建格式实现目录
3. 实现 `MapFormat<TData>` 接口的所有方法
4. 在 `formats/index.ts` 中注册格式到 `formatRegistry`

参考 `web/src/viewer/formats/opendrive/` 作为实现模板。

## 技术栈细节

- **包管理**: Bun
- **构建工具**: Vite
- **样式**: Tailwind CSS 4.x (使用 @tailwindcss/vite)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **3D 渲染**: BabylonJS (core, gui, loaders, materials)
- **状态管理**: Zustand (带 persist 中间件)
- **布局**: React Mosaic Component
- **WASM**: wasm-bindgen + wasm-pack
- **XML 解析**: quick-xml (Rust)

## 开发注意事项

- Web 模块的 `predev` 和 `prebuild` hooks 会自动构建 core 模块
- Core 模块使用 `edition = "2024"` (Rust)
- Release 构建优化代码大小 (`opt-level = "s"`)
- WASM 插件配置: 使用 vite-plugin-wasm 和 vite-plugin-top-level-await
- 持久化只针对 pref-slice 的部分字段(mosaicLayout, showGrid, showAxis)
