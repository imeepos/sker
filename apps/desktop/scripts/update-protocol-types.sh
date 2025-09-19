#!/bin/bash

# 更新 protocol 类型的脚本
# 此脚本会从 Rust crates 重新生成 TypeScript 类型

set -euo pipefail

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DESKTOP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$DESKTOP_ROOT/src/shared/types"

echo "🔄 更新 Protocol TypeScript 类型..."
echo "📁 项目根目录: $PROJECT_ROOT"
echo "📁 输出目录: $OUTPUT_DIR"

# 确保输出目录存在
mkdir -p "$OUTPUT_DIR/protocol"

# 检查 protocol-ts crate 是否存在
if [ ! -d "$PROJECT_ROOT/crates/protocol-ts" ]; then
    echo "❌ 错误: 找不到 protocol-ts crate"
    echo "   请确保在正确的项目目录中运行此脚本"
    exit 1
fi

# 检查是否已安装 prettier
PRETTIER_PATH="$DESKTOP_ROOT/node_modules/.bin/prettier"
if [ ! -f "$PRETTIER_PATH" ]; then
    echo "⚠️  警告: 找不到 prettier，将跳过代码格式化"
    PRETTIER_PATH=""
fi

# 运行 protocol-ts 生成器
echo "📦 运行 protocol-ts 生成器..."
cd "$PROJECT_ROOT/crates/protocol-ts"

if [ -n "$PRETTIER_PATH" ]; then
    cargo run --bin codex-protocol-ts -- --out "$OUTPUT_DIR/protocol" --prettier "$PRETTIER_PATH"
else
    cargo run --bin codex-protocol-ts -- --out "$OUTPUT_DIR/protocol"
fi

echo "✅ Protocol 类型更新完成!"
echo "📁 生成的文件位于: $OUTPUT_DIR/protocol/"

# 提示用户检查生成的文件
echo ""
echo "💡 提示:"
echo "   - 请检查生成的类型文件是否正确"
echo "   - 如需重新导出特定类型，请更新 src/shared/types/index.ts"
echo "   - 生成的类型会自动覆盖 protocol.ts 中的手动定义"