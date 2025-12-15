# MapHub

超快的在线自动驾驶驾驶地图查看器，支持多种地图格式

## 支持的地图格式

- ASAM OpenDRIVE (xodr)

## 功能

- 支持多种地图格式
- 多地图同时加载
- 模糊搜索地图元素
- 完善的信息面板
- 极速加载和渲染

## 技术栈

- Rust + WASM (wasm-pack)
- React + TypeScript + shadcn/ui + Tailwind CSS
- ThreeJS
- Turbo Repo

## 项目结构

```
maphub/
├── core/               # Rust WASM 核心库
├── web/                # React Web 前端
└── README.md           # 项目说明
```

## 开发

开发之前请先确保安装了 Rust 和 Bun

```bash
# 配置rust工具链
cargo install cargo-watch
cargo install wasm-pack

# 安装前端依赖
bun install

# 启动开发服务器
bun dev
```

## 构建

```bash
# 构建 wasm
cd core && wasm-pack build

# 构建 web 前端
cd web && bun run build
```

然后把 web/dist 目录下的文件部署到你的 web 服务器上即可, 也可以部署到Cloudflare或者Vercel等平台。

## License

TODO
