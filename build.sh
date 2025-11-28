#!/bin/bash

set -e

echo "🚀 开始构建 OpenDrive Core..."

# 进入 core 目录
cd "$(dirname "$0")/core"

# 检查 wasm-pack 是否安装
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ 错误: wasm-pack 未安装"
    echo "请运行: cargo install wasm-pack"
    exit 1
fi

# 构建 wasm 包
echo "📦 正在编译为 WebAssembly..."
wasm-pack build --target web --out-dir pkg --release

echo "✅ 构建完成！"
echo "📂 输出目录: core/pkg/"

