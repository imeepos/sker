# Codex Multi-Agent 🤖

[![Crates.io](https://img.shields.io/crates/v/codex-multi-agent.svg)](https://crates.io/crates/codex-multi-agent)
[![Documentation](https://docs.rs/codex-multi-agent/badge.svg)](https://docs.rs/codex-multi-agent)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](https://github.com/codex-team/sker)

**多Agent协同开发系统协议扩展** - 为现代AI驱动的协作开发提供强类型、功能丰富的协议定义。

## 🌟 特性亮点

- 🎯 **渐进式启用** - 通过feature flags按需启用功能模块
- 🔒 **类型安全** - 完整的Rust类型系统和TypeScript支持
- 🏗️ **模块化设计** - 独立的功能模块，易于扩展和维护
- 📊 **丰富的事件系统** - 完整的事件溯源和审计支持
- 🌐 **跨平台兼容** - 支持多种开发环境和工具链
- 📚 **完善的文档** - 详尽的API文档和使用示例

## 🚀 快速开始

### 安装

```toml
[dependencies]
codex-multi-agent = { version = "0.1", features = ["multi-agent"] }
```

### 基础使用

```rust
use codex_multi_agent::*;

// 创建Agent配置
let agent_config = AgentConfig {
    name: "前端开发Agent".to_string(),
    description: "专门负责React开发的AI助手".to_string(),
    prompt_template: "你是一个专业的前端开发工程师...".to_string(),
    capabilities: vec![AgentCapability::FrontendDevelopment],
    max_concurrent_tasks: 2,
    timeout_minutes: 60,
    git_config: None,
    // ... 其他配置
};

// 验证配置
assert!(agent_config.validate().is_ok());

// 创建任务信息
let task = TaskInfo {
    task_id: TaskId::new(),
    title: "实现用户登录页面".to_string(),
    description: "创建响应式的用户登录界面".to_string(),
    task_type: TaskType::Development,
    priority: TaskPriority::High,
    estimated_hours: 8,
    required_capabilities: vec![AgentCapability::FrontendDevelopment],
    // ... 其他字段
};
```

## 📦 功能模块

### 🤖 Agent管理 (`multi-agent-agent-management`)

```rust
use codex_multi_agent::agent_management::*;

let filter = AgentFilter::available_only();
let agents = query_agents(filter).await?;
```

**核心功能：**
- Agent创建、更新、删除
- 能力管理和匹配
- 性能监控和资源限制
- Git配置和版本控制集成

### 📋 项目管理 (`multi-agent-project-management`)

```rust
use codex_multi_agent::project_management::*;

let project = ProjectInfo {
    name: "电商平台".to_string(),
    technology_stack: vec!["React".to_string(), "Rust".to_string()],
    coding_standards: CodingStandards::default(),
    // ... 其他配置
};
```

**核心功能：**
- 项目信息和配置管理
- 编码规范和质量门禁
- 需求文档处理
- 团队成员和权限管理

### 🧠 LLM调度 (`multi-agent-llm-orchestration`)

```rust
use codex_multi_agent::llm_orchestration::*;

let context = ProjectContext {
    codebase_info: analyze_codebase().await?,
    timeline_requirements: Some(timeline),
    risk_assessment: assess_project_risks(),
    // ... 其他上下文
};

let assignments = allocate_tasks(tasks, available_agents, context).await?;
```

**核心功能：**
- 智能需求分解
- 任务自动分配和调度
- 项目上下文分析
- 风险评估和缓解

### 📈 任务执行 (`multi-agent-task-execution`)

```rust
use codex_multi_agent::events::*;

let session = ExecutionSessionId::new();
let progress = ProgressInfo {
    completion_percentage: 0.75,
    current_step: Some("运行测试".to_string()),
    // ... 其他进度信息
};
```

**核心功能：**
- 实时任务执行跟踪
- 进度报告和问题检测
- 质量检查和代码审查
- Git操作和分支管理

## 🎛️ Feature Flags配置

根据需要启用不同的功能模块：

```toml
[dependencies]
codex-multi-agent = { 
    version = "0.1", 
    features = [
        "multi-agent",                    # 基础多Agent功能
        "multi-agent-agent-management",   # Agent管理
        "multi-agent-project-management", # 项目管理
        "multi-agent-llm-orchestration",  # LLM调度
        "typescript"                      # TypeScript类型生成
    ] 
}
```

### 可用Features

| Feature | 描述 | 依赖 |
|---------|------|------|
| `multi-agent` | 基础多Agent功能 | `uuid`, `chrono` |
| `multi-agent-agent-management` | Agent管理模块 | - |
| `multi-agent-project-management` | 项目管理模块 | - |
| `multi-agent-llm-orchestration` | LLM调度模块 | - |
| `multi-agent-task-execution` | 任务执行模块 | - |
| `multi-agent-conflict-resolution` | 冲突处理模块 | - |
| `typescript` | TypeScript类型生成 | `ts-rs` |
| `multi-agent-dev` | 开发和调试功能 | 所有功能 |

## 🔧 TypeScript支持

生成TypeScript类型定义：

```bash
# 使用内置工具生成
cargo run --bin generate-ts --features typescript -- -o ./types/multi-agent.d.ts

# 或者在代码中生成
use codex_multi_agent::typescript::TypeScriptGenerator;

let typescript_defs = TypeScriptGenerator::generate_all_types()?;
std::fs::write("types.d.ts", typescript_defs)?;
```

生成的TypeScript类型包含：

```typescript
export interface AgentConfig {
    name: string;
    description: string;
    capabilities: AgentCapability[];
    max_concurrent_tasks: number;
    // ... 其他字段
}

export type AgentCapability = 
    | "frontend_development" 
    | "backend_development" 
    | "testing" 
    | "code_review";

// 工具函数
export function isAgentCapability(value: any): value is AgentCapability;
export function hasRequiredCapabilities(
    agentCapabilities: AgentCapability[],
    requiredCapabilities: AgentCapability[]
): boolean;
```

## 📊 事件系统

完整的事件驱动架构支持：

```rust
use codex_multi_agent::events::*;

// 创建事件
let event = EventFactory::agent_created(
    agent_id,
    agent_config,
    "user-123".to_string()
);

// 事件处理
match event {
    AgentCreatedEvent { agent_id, metadata, .. } => {
        println!("Agent {} 创建于 {}", agent_id, metadata.timestamp);
    }
}

// 事件序列化
let json = serde_json::to_string(&event)?;
```

**支持的事件类型：**
- Agent生命周期事件
- 项目管理事件
- 任务执行事件
- LLM调度事件
- 系统状态事件
- 错误和异常事件

## 🧪 测试

运行完整的测试套件：

```bash
# 运行所有测试
cargo test --all-features

# 运行特定模块测试
cargo test --features multi-agent-agent-management agent_management

# 运行集成测试
cargo test --test integration_tests --all-features

# 性能基准测试
cargo test --release test_performance_benchmarks
```

## 📖 示例项目

查看 `examples/` 目录中的完整示例：

- **basic_agent_setup.rs** - 基础Agent配置和管理
- **project_workflow.rs** - 完整的项目工作流程
- **event_handling.rs** - 事件系统使用示例
- **typescript_integration/** - TypeScript集成示例

## 🔄 版本兼容性

本库遵循[语义化版本控制](https://semver.org/)：

- **0.1.x** - 初始版本，包含核心功能
- **0.2.x** - 扩展功能和性能优化
- **1.0.x** - 稳定版本，生产就绪

### 破坏性更改政策

- 主版本更新可能包含破坏性更改
- 次版本更新保持向后兼容
- 补丁版本仅包含错误修复

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/codex-team/sker.git
cd sker/crates/codex-multi-agent

# 安装依赖
cargo build --all-features

# 运行测试
cargo test --all-features

# 生成文档
cargo doc --all-features --open
```

### 代码规范

- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 检查代码质量
- 为新功能添加测试和文档
- 遵循现有的代码风格和架构模式

### 提交类型

- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `test:` 测试相关
- `refactor:` 重构代码
- `perf:` 性能优化

## 📄 许可证

本项目采用双许可证：

- [MIT License](https://opensource.org/licenses/MIT)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

您可以选择其中任一许可证使用本软件。

## 🔗 相关链接

- [📚 API文档](https://docs.rs/codex-multi-agent)
- [📦 Crates.io](https://crates.io/crates/codex-multi-agent)
- [🐛 问题追踪](https://github.com/codex-team/sker/issues)
- [💬 讨论区](https://github.com/codex-team/sker/discussions)
- [📖 完整文档](https://github.com/codex-team/sker/tree/main/docs)

## 🙏 致谢

感谢所有为本项目做出贡献的开发者和用户！

特别感谢：
- Rust社区提供的优秀工具和库
- TypeScript团队的类型系统设计启发
- 所有早期用户的反馈和建议

---

**让AI协作开发更加智能和高效！** 🚀