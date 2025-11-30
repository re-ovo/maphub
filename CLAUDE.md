# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MapHub 是一个高性能的在线自动驾驶地图查看器,支持多种地图格式。项目采用 Rust + WASM 处理核心解析逻辑,React + TypeScript + BabylonJS 构建前端界面。

## 核心架构

### 1. 双层架构设计

```
core/          # Rust WASM 核心库 - 负责地图格式解析
web/           # React 前端 - 负责 UI 和 3D 渲染
```

**核心库 (core/)** 使用 Rust 编译为 WASM:
- 地图格式解析器位于 `core/src/{format}/parser/`
- 数据模型定义在 `core/src/{format}/models/`
- 使用 `wasm-bindgen` 导出 API 供 TypeScript 调用
- 目前支持 OpenDRIVE (.xodr) 格式,扩展点在 `core/src/lib.rs` 的 `MapType` 枚举

**Web 前端 (web/)** 负责渲染和交互:
- BabylonJS 场景管理在 `web/src/viewer/panels/viewport-panel.tsx`
- Zustand 状态管理拆分为多个 slice: `pref`, `scene`, `document`, `selection`, `hover`
- React Mosaic 提供可拖拽分栏布局

### 2. Provider 模式实现跨格式抽象

位于 `web/src/viewer/formats/` 的格式注册系统:

```typescript
// registry.ts 提供统一的格式检测和注册机制
MapFormat {
  id, name, extensions,
  detect(content, filename),     // 格式检测
  parse(content),                 // 解析为数据模型
  createRenderer(scene, data),    // 创建 3D 渲染器
  createTreeProvider(data),       // 创建场景树 provider
  createPropertyProvider(data),   // 创建属性面板 provider
  createHoverProvider(data)       // 创建悬停提示 provider
}
```

**添加新地图格式的步骤**:
1. 在 `core/src/{format}/` 添加 Rust 解析器和数据模型
2. 在 `web/src/viewer/formats/{format}/` 实现对应的 provider
3. 在 `web/src/viewer/formats/index.ts` 注册格式

### 3. OpenDRIVE 解析流程

- `core/src/odr/parser/mod.rs` 是入口,导出 `parseOpendrive(xml: &[u8])`
- 使用 `quick-xml` 进行 SAX 风格的流式解析
- `parse_header`, `parse_road`, `parse_lanes` 模块化解析各个元素
- 数据模型使用 `#[wasm_bindgen]` 宏导出给 JS

### 4. 状态管理架构

Zustand store (web/src/store/) 分为 5 个 slice:

- **PrefSlice**: 用户偏好(布局、显示选项),持久化到 localStorage
- **SceneSlice**: BabylonJS 场景对象引用
- **DocumentSlice**: 已加载的地图文档列表 (MapDocument[])
- **SelectionSlice**: 当前选中的地图元素
- **HoverSlice**: 鼠标悬停的地图元素

**MapDocument** 结构:
```typescript
{
  id, filename, formatId, data,
  renderer,           // 负责 3D 渲染
  treeProvider,       // 提供场景树数据
  propertyProvider,   // 提供属性面板数据
  hoverProvider,      // 提供悬停提示
  visible             // 是否显示
}
```

## 常用开发命令

### 构建 WASM 核心库
```bash
cd core
wasm-pack build
```

### 前端开发
```bash
cd web
bun install          # 首次安装依赖
bun run dev          # 启动开发服务器
bun run lint         # 运行 ESLint
bun run build        # 生产构建
```

### 完整构建流程
```bash
# 1. 构建 WASM (每次修改 Rust 代码后需要重新构建)
cd core && wasm-pack build

# 2. 前端会自动通过 package.json 中的 "core": "file:../core/pkg" 引用 WASM
cd ../web && bun run build
```

## 关键实现细节

### Rust WASM 导出规范
- 所有导出的 struct 需要 `#[wasm_bindgen]` 和 `#[derive(Clone)]`
- 复杂类型(String, Vec, Option)字段需要 `#[wasm_bindgen(getter_with_clone)]`
- snake_case 字段名使用 `#[wasm_bindgen(js_name = "camelCase")]` 转换
- 解析函数使用 `Result<T, String>` 将错误信息传递给 JS

### 文件加载流程 (viewer.tsx)
1. 用户拖拽文件到 FileDropZone
2. `formatRegistry.detectFormat()` 检测格式
3. `format.parse(content)` 调用 WASM 解析器
4. 创建 renderer、treeProvider、propertyProvider、hoverProvider
5. `renderer.render()` 在 BabylonJS 场景中渲染
6. `addDocument()` 添加到 store

### 3D 渲染器职责
- 实现 `render()` 方法创建 BabylonJS Mesh
- 监听 selection/hover 变化更新高亮状态
- 提供 `dispose()` 方法清理资源

### 场景树 Provider
- 返回树形结构数据供 `scene-tree-panel.tsx` 展示
- 节点需包含 `id`, `label`, `type`, `children` 属性
- 点击节点触发 selection 更新

## 技术栈依赖

- **Rust**: `wasm-bindgen`, `quick-xml`, `anyhow`
- **构建工具**: `wasm-pack`, Vite (使用 rolldown-vite fork)
- **前端框架**: React 19, TypeScript
- **3D 引擎**: BabylonJS 8.x
- **状态管理**: Zustand (带 persist 中间件)
- **UI 库**: shadcn/ui (基于 Radix UI), Tailwind CSS 4
- **布局**: React Mosaic Component
- **包管理**: Bun

## 性能优化要点

1. WASM 编译使用 `opt-level = "s"` 优化体积
2. Rust 解析器使用流式解析避免大量内存分配
3. 前端使用 Vite 的 rolldown 引擎加速构建
4. BabylonJS 渲染使用实例化几何体减少 draw call
