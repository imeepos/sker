
# Language

Please use Chinese to solve user problems, write code comments, and related documentation.

# [Rust](/crates)

In the crates folder where the rust code lives:

- Crate names are prefixed with `codex-`. For example, the `core` folder's crate is named `codex-core`
- When using format! and you can inline variables into {}, always do that.

# [Typescript](/packages)

In the packages folder where the typescript code lives:

- create names are prefixed with `@sker/`. For example, the `core` folder's crate is named `@sker/core`

# [Cli](/apps/cli)

In the apps/cli folder where the cli application code lives:

# [Desktop](/apps/desktop)

In the apps/desktop folder where the desktop application code lives:

# [Doc](/docs)

In the crates folder where the markdown file lives:

- [database](/docs/databases) Location for storing table structure definition markdown files
- [api](/docs/apis) Location for storing API documentation

# [Agents](/.claude/agents)


使用@tanstack/react-query管理API状态
使用Zustand管理组件及页面状态


- 后端数据库结构设计：crates\database
- Agent交互事件协议：apps\desktop\src\shared\types\protocol\EventMsg.ts
- 多智能体协议：crates\codex-multi-agent
- 后端接口定义：apps\desktop\src-tauri\src\lib.rs

# 开发规范

- **务必遵守**包管理工具用pnpm
- **务必遵守**我已启动 pnpm run --filter=@sker/desktop tauri dev 请勿重复启动
- **务必遵守**解决错误时，先分析错误的根本原因然后逐步修复，千万不要简化实现，先分析查询借鉴相关最佳实践
- **务必遵守**类型应该统一,禁止出现因参数类型不一致，而采取的类型转换和字段映射，移除类型不一致的实现，重写相关逻辑
- **务必遵守**唯一ID统一用uuid生成



- 导入 invoke
正确
```rs
import { invoke } from '@tauri-apps/api/core'
```
错误
```rs
import { invoke } from '@tauri-apps/api/tauri'
```

- 检查rust类型错误

```
cargo check --lib
```

- 检查typescript类型错误

```
pnpm run --filter=@sker/desktop build
```



## 务实比展示重要，能运行的代码比华丽的文档有价值

1. 先修复编译错误 - 让基础代码能运行
2. 运行现有测试 - 看哪些真的能通过
3. 逐步补充 - 基于能工作的代码写测试
4. 实际验证 - 每写一个测试都要跑一遍


  ```bash
  # 检查所有测试编译
  cargo check --tests

  # 运行所有测试
  cargo test

  # 检查代码格式和 lint
  cargo fmt --check && cargo clippy -- -D warnings

  测试开发规范

  - 新测试文件必须能编译通过
  - 使用 #[ignore] 标记未完成的测试
  - 使用 todo!() 标记未实现的方法


  关闭端口号：
  Bash(powershell "Stop-Process -Id 10052 -Force")