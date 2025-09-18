
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