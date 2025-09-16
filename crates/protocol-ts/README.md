# Protocol TypeScript 绑定生成器

这是一个 **TypeScript 绑定生成器**，用于从 Rust 代码自动生成 TypeScript 类型定义。

## 用途

1. **自动生成 TypeScript 类型**：从 Rust 的协议类型（如 `mcp_protocol` 和 `mcp_types`）生成对应的 TypeScript 类型定义
2. **统一的类型导出**：生成 `index.ts` 文件，集中导出所有生成的类型
3. **代码格式化**：可选择使用 Prettier 格式化生成的 TypeScript 代码
4. **添加标识头**：为生成的文件添加 "GENERATED CODE! DO NOT MODIFY BY HAND!" 标识

## 生成的类型包括

- MCP 协议相关类型（会话管理、用户消息、登录认证等）
- 服务器请求和响应类型
- 通知类型
- 各种配置和状态类型

## 使用方法

### 1. 命令行使用

```bash
# 基本用法 - 生成到指定目录
cargo run --bin codex-protocol-ts -- --out /path/to/output

# 使用 Prettier 格式化
cargo run --bin codex-protocol-ts -- --out /path/to/output --prettier /path/to/prettier
```

### 2. 使用便捷脚本

```bash
# 运行 generate-ts 脚本（会使用临时目录并自动格式化）
./generate-ts
```

### 3. 在代码中使用

```rust
use codex_protocol_ts::generate_ts;

// 生成 TypeScript 绑定
generate_ts(&output_dir, Some(&prettier_path))?;
```

## 命令行参数

- `-o, --out <DIR>`: 输出目录，TypeScript 文件将写入此目录
- `-p, --prettier <PRETTIER_BIN>`: 可选的 Prettier 可执行文件路径，用于格式化生成的文件

这个工具主要用于确保 Rust 后端和 TypeScript 前端之间的类型一致性，避免手动维护类型定义。