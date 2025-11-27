# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 OpenDrive Web Viewer 项目，使用 React + TypeScript + Vite 构建。项目依赖于 `opendrive-core` Rust/WASM 库（位于 `../core`）来解析 OpenDrive 文件，并使用 Babylon.js 进行 3D 渲染。

OpenDrive 是一种用于描述道路网络的 XML 格式标准，本项目旨在提供一个 Web 端的查看器。

## 构建和开发命令

### 依赖管理和构建
```bash
# 安装依赖（使用 bun）
bun install

# 启动开发服务器
bun run dev

# 构建生产版本
bun run build

# 预览生产构建
bun run preview

# 运行 ESLint 检查
bun run lint
```

### 构建 WASM 依赖
项目依赖于本地的 `opendrive-core` WASM 包。如果需要更新 WASM 代码：
```bash
cd ../core
wasm-pack build --target web
# WASM 输出将在 ../core/pkg 目录
```

## 代码架构

### 技术栈
- **构建工具**: Vite (使用 rolldown-vite 7.2.5)
- **前端框架**: React 19.2.0
- **UI 组件库**: Radix UI + Tailwind CSS 4.1
- **3D 渲染引擎**: Babylon.js 8.38.0
- **状态管理**: Zustand 5.0.8
- **布局**: react-mosaic-component 6.1
- **主题**: next-themes 0.4.6
- **动画**: motion 12.23.24
- **通知**: sonner 2.0.7

### 目录结构
```
src/
├── components/
│   ├── ui/          # Radix UI 组件封装（button, card, dialog, input 等）
│   └── viewer/      # OpenDrive 查看器相关组件
├── lib/
│   └── utils.ts     # 工具函数（cn - 用于 className 合并）
├── render/          # 3D 渲染相关代码
├── assets/          # 静态资源
├── App.tsx          # 主应用组件
├── main.tsx         # 应用入口
└── index.css        # 全局样式（Tailwind + 主题变量）
```

### 关键配置

#### Vite 配置 (vite.config.ts)
- **插件**:
  - `@vitejs/plugin-react`: React 支持
  - `vite-plugin-wasm`: WASM 支持（用于加载 opendrive-core）
  - `@tailwindcss/vite`: Tailwind CSS 4.x 支持
- **路径别名**: `@/*` 映射到 `./src/*`

#### TypeScript 配置
- 使用项目引用模式：`tsconfig.app.json` (应用代码) 和 `tsconfig.node.json` (构建配置)
- 路径别名：`@/*` 映射到 `./src/*`

#### 样式系统
- 使用 Tailwind CSS 4.x + `@theme inline` 语法定义设计令牌
- 支持深色模式，通过 `.dark` 类切换
- 使用 OKLCH 颜色空间定义颜色变量
- CSS 变量命名遵循 shadcn/ui 规范（`--background`, `--foreground`, `--primary` 等）

### 关键依赖说明

#### opendrive-core
- **来源**: `file:../core/pkg` (本地 WASM 包)
- **作用**: 解析 OpenDrive XML 文件，提供道路数据模型
- **使用方式**: 通过 WASM 绑定在 JavaScript 中调用 Rust 函数

#### Babylon.js
- **包**: `@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/loaders`, `@babylonjs/materials`
- **作用**: 3D 场景渲染引擎，用于可视化道路网络

#### react-mosaic-component
- **作用**: 提供窗口分割布局（类似 IDE 面板布局）
- **样式**: 需要导入 `react-mosaic-component/react-mosaic-component.css`

## 开发注意事项

### WASM 集成
- Vite 使用 `vite-plugin-wasm` 和 `vite-plugin-top-level-await` 支持 WASM
- WASM 包位于 `../core/pkg`，更新后需要重启开发服务器

### 包管理器
- 项目使用 **bun** 作为包管理器（从 `bun.lock` 可见）
- 使用 npm overrides 强制 Vite 使用 rolldown-vite 变体

### UI 组件开发
- UI 组件基于 Radix UI 原语，使用 Tailwind 样式化
- 使用 `cn()` 工具函数（来自 `lib/utils.ts`）合并 className
- 组件遵循 shadcn/ui 设计规范

### 样式约定
- 使用 Tailwind 实用类优先
- 自定义颜色使用 CSS 变量（在 index.css 中定义）
- 深色模式通过 `dark:` 前缀或 `.dark` 类应用样式
