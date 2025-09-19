
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

# 工作流程规范

## 方案设计与实施流程

**严格遵循以下工作流程，禁止跳过任何阶段：**

### 第一阶段：方案设计
1. **仅提供文字描述的方案**
2. **明确列出方案的优缺点**
3. **提供多个选项供用户选择**
4. **不进行任何实际的文件操作**

### 第二阶段：等待确认
1. **明确询问用户意见**
2. **等待用户明确同意后再继续**
3. **如用户有修改建议，回到第一阶段**

### 第三阶段：详细规划
1. **制定具体的实施步骤**
2. **列出需要创建/修改的文件**
3. **说明每一步的具体操作**
4. **预估工作量和风险点**

### 第四阶段：再次确认
1. **向用户展示详细执行计划**
2. **确认是否开始执行**
3. **获得明确授权后才开始操作**

### 第五阶段：执行实施
1. **严格按照确认的计划执行**
2. **每完成一个重要步骤及时汇报**
3. **遇到问题立即停止并询问用户**
4. **不得擅自修改原定计划**

## 禁止行为
- ❌ 在方案设计阶段就开始创建文件/目录
- ❌ 未经确认就执行任何文件操作
- ❌ 边规划边实施
- ❌ 假设用户同意而直接执行
- ❌ 创建错误后再清理，而不是提前规划好

## 正确示例
```
用户："重构项目结构"
助手：
1. [方案设计] 我建议使用features架构，具体方案是...
2. [等待确认] 你觉得这个方案如何？
用户："同意"
助手：
3. [详细规划] 具体执行步骤：第一步创建目录...第二步移动文件...
4. [再次确认] 是否开始执行这个计划？
用户："开始"
助手：
5. [执行实施] 正在执行第一步...
```


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