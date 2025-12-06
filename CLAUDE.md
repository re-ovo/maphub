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

# 运行基准测试
cd core && cargo bench
```

### Web 前端 (web/)
```bash
# 开发环境启动
cd web && bun run dev

# 构建生产版本
cd web && bun run build

# 代码检查和格式化
cd web && bun run lint
cd web && bun run fmt

# 预览生产构建
cd web && bun run preview

# 仅构建 core WASM 模块
cd web && bun run build:core

# Cloudflare Pages 部署
cd web && bun run pages:dev      # 本地预览
cd web && bun run pages:deploy   # 部署到 Cloudflare Pages
```

## 代码架构

### Rust WASM 核心 (core/)

**地图格式支持**:
- 通过 `MapFormatType` 枚举定义支持的格式 (`lib.rs`)
- 目前支持: OpenDrive, Apollo
- WASM 接口通过 wasm-bindgen 暴露给 JavaScript

**OpenDRIVE 模块** (`odr/`):
- `models/`: 完整的 OpenDRIVE 数据模型
  - `opendrive.rs`: 主数据结构,包含 header, roads, junctions
  - `road/`: 道路相关模型 (geometry, elevation, superelevation, type, link)
  - `lane/`: 车道模型 (lane_section, width, speed, material, access, rule, road_mark)
  - `junction.rs`: 路口连接定义
  - `enums.rs`: 各种枚举类型定义
- `parser/`: XML 解析器,使用 quick-xml 库
  - 读取 .xodr 文件并构建数据模型
- `mesh/`: 网格生成器
  - `lane_builder.rs`: 将车道的参数化表示转换为三角网格
  - 处理复杂的几何计算(螺旋线、圆弧、参数多项式等)

**数学** (`math/`):
- `vec2.rs`, `vec3.rs`: 二维/三维向量运算
- `reference.rs`: 参考线计算,支持多种几何类型
- `mesh.rs`: 网格数据结构

### Web 前端 (web/)

**技术栈**:
- Vite
- React 19 + TypeScript
- React Compiler (babel-plugin-react-compiler)
- Zustand - 状态管理
- Three.js - 3D 渲染
- shadcn/ui + Radix UI + Tailwind CSS 4 - UI 组件
- React Mosaic - 可拖拽的面板布局
- oxlint/oxfmt - 快速的 linting 和格式化工具

**核心架构模式**:

1. **地图格式抽象** (`viewer/format/`):
   - `MapFormat<F, E, R>` 接口定义了地图格式的统一 API
   - 每个格式实现需提供:
     - `parse()`: 解析文件并生成节点树
     - `provideRenderer()`: 创建对应的 3D 渲染器
     - `provideHoverInfo()`: 提供鼠标悬停信息
     - `provideProperties()`: 提供属性面板内容
     - `provideTreeInfo()`: 提供场景树显示信息
   - 格式通过 `formatRegistry` 注册,支持运行时扩展

2. **节点树结构** (`viewer/types/map-node.ts`):
   - 所有地图元素都是 `MapNode` 类型
   - 每个节点包含: `id`, `parentId`, `children`, `name`, `visible`, `format`, `type`
   - 形成树状层级结构,例如 OpenDRIVE: Map → Roads → Road → LaneSection → Lane

3. **渲染器架构** (`viewer/types/renderer.ts`):
   - `MapRenderer<F, T>` 继承自 Three.js 的 `Group`
   - 与节点树一一对应,形成可见的 3D 场景树
   - 支持嵌套渲染器(父子关系),可见性继承

4. **状态管理** (`store/`):
   - `scene-slice.ts`: 管理场景状态
     - `rootNodes/rootRenderers`: 根节点和渲染器列表
     - `selectedNodeId`: 当前选中的节点
     - `expandedNodeIds`: 场景树中展开的节点集合
     - `hoverData`: 鼠标悬停时的信息
     - `loadFiles()`: 加载地图文件的核心逻辑
     - `toggleNodeVisibility()`: 切换节点可见性
     - `exportGLB()`: 导出为 GLB 格式
   - `pref-slice.ts`: 用户偏好设置
   - `selectors.ts`: Zustand 选择器,用于高效的状态订阅

5. **面板系统** (`viewer/panels/`):
   - `viewport.tsx`: 3D 视口面板
   - `scene-tree.tsx`: 场景树面板,显示地图层级结构
   - `properties.tsx`: 属性面板,显示选中元素的详细信息

**OpenDRIVE 实现示例** (`viewer/format/odr/`):
- `index.tsx`: 实现 `MapFormat` 接口
- `elements.ts`: 定义节点类型 (MapElement, RoadsElement, RoadElement, LaneSectionElement, LaneElement)
- `renderer.ts`: 实现对应的渲染器类
- 节点树结构: Map → Roads → Road → LaneSection → Lane
- 每个层级都可在场景树中展开/折叠,在属性面板中显示详情

**添加新地图格式的步骤**:
1. 在 Rust 端实现解析器和数据模型
2. 在 `web/src/viewer/format/` 创建新文件夹
3. 定义节点元素类型 (继承 `MapNode`)
4. 实现 `MapFormat` 接口的所有方法
5. 实现对应的 `MapRenderer` 类
6. 在 `formatRegistry` 中注册新格式

**关键约定**:
- 使用 `@/` 作为 `web/src/` 的路径别名
- WASM 模块从 `core` 包导入 (指向 `../core/pkg`)
- 使用 React Compiler 时避免手动 memo/useCallback
- Three.js 对象生命周期需要手动管理 (dispose)
