# Codex Database

基于 SeaORM 的多 Agent 协同开发系统数据库访问层。本库提供了完整的数据模型、仓储模式和数据库操作 API。

## 特性

- 🚀 基于 SeaORM 1.0 的现代 ORM
- 📊 支持 SQLite 数据库
- 🔄 自动化数据库迁移
- 🏗️ 完整的仓储模式实现
- 🧪 全面的测试覆盖
- 📝 强类型的实体模型
- 🔍 灵活的查询和分页功能

## 快速开始

### 添加依赖

在你的 `Cargo.toml` 文件中添加：

```toml
[dependencies]
codex-database = { path = "../database" }
tokio = { version = "1.0", features = ["full"] }
uuid = { version = "1.0", features = ["v4"] }
serde_json = "1.0"
```

### 基本用法

#### 1. 初始化数据库

```rust
use codex_database::{initialize_database, DatabaseConfig};

// 配置数据库
let config = DatabaseConfig {
    database_url: "sqlite://database.db".to_string(),
    max_connections: 10,
    min_connections: 1,
    connect_timeout: 30,
    idle_timeout: 600,
    enable_logging: true,
};

// 初始化数据库（包含自动迁移）
let db = initialize_database(&config).await?;
```

#### 2. 用户管理

```rust
use codex_database::repository::{UserRepository, user_repository::CreateUserData};
use uuid::Uuid;

// 创建用户仓储
let user_repo = UserRepository::new(db.clone());

// 创建用户
let user_data = CreateUserData {
    username: "test_user".to_string(),
    email: "test@example.com".to_string(),
    password_hash: "hashed_password".to_string(),
    profile_data: Some(serde_json::json!({
        "display_name": "测试用户",
        "bio": "这是一个测试用户"
    })),
    settings: Some(serde_json::json!({
        "theme": "dark",
        "language": "zh-CN"
    })),
};

let user = user_repo.create(user_data).await?;
println!("创建用户: {}", user.username);

// 查找用户
let found_user = user_repo.find_by_id(user.user_id).await?;
let user_by_email = user_repo.find_by_email("test@example.com").await?;
```

#### 3. 项目管理

```rust
use codex_database::repository::{ProjectRepository, project_repository::CreateProjectData};

// 创建项目仓储
let project_repo = ProjectRepository::new(db.clone());

// 创建项目
let project_data = CreateProjectData {
    user_id: user.user_id,
    name: "我的项目".to_string(),
    description: Some("项目描述".to_string()),
    repository_url: "https://github.com/user/repo.git".to_string(),
    workspace_path: "/workspace/project".to_string(),
};
let project = project_repo.create(project_data).await?;

// 查找用户的所有项目
let user_projects = project_repo.find_by_user(user.user_id).await?;

// 更新项目配置
let updated_project = project_repo.update_config(
    project.project_id,
    Some(serde_json::json!(["rust", "typescript"])), // 技术栈
    Some(serde_json::json!({                         // 编码标准
        "indent": "spaces",
        "max_line_length": 100
    })),
    None, // Git配置
).await?;
```

#### 4. Agent 管理

```rust
use codex_database::repository::{
    AgentRepository, 
    agent_repository::{CreateAgentData, AgentStatistics}
};
use codex_database::entities::agent::AgentStatus;

// 创建 Agent 仓储
let agent_repo = AgentRepository::new(db.clone());

// 创建 Agent
let agent_data = CreateAgentData {
    user_id: user.user_id,
    name: "前端开发专家".to_string(),
    description: Some("专注于前端开发的 AI Agent".to_string()),
    prompt_template: "你是一个专业的前端开发 Agent".to_string(),
    capabilities: serde_json::json!(["FrontendDevelopment", "React", "TypeScript"]),
    config: serde_json::json!({
        "max_concurrent_tasks": 3,
        "preferred_languages": ["typescript", "javascript"]
    }),
    git_config: Some(serde_json::json!({
        "username": "frontend-agent",
        "email": "agent@example.com"
    })),
};

let agent = agent_repo.create(agent_data).await?;

// 查找最佳匹配的 Agent
let best_agent = agent_repo.find_best_match(
    &["FrontendDevelopment".to_string()],
    true // 只考虑空闲的 Agent
).await?;

// 更新 Agent 状态
let task_id = Uuid::new_v4();
let working_agent = agent_repo.update_status(
    agent.agent_id,
    AgentStatus::Working,
    Some(task_id)
).await?;

// 更新统计信息
let stats = AgentStatistics {
    total_tasks_completed: Some(10),
    success_rate: Some(0.95),
    average_completion_time: Some(120), // 秒
};
let updated_agent = agent_repo.update_statistics(agent.agent_id, stats).await?;
```

#### 5. 需求文档管理

```rust
use codex_database::repository::{
    RequirementDocumentRepository, 
    requirement_document_repository::CreateRequirementDocumentData
};

// 创建需求文档仓储
let doc_repo = RequirementDocumentRepository::new(db.clone());

// 创建需求文档
let document_data = CreateRequirementDocumentData {
    project_id: project.project_id,
    title: "用户登录功能".to_string(),
    content: "用户应该能够通过邮箱和密码登录系统，支持记住登录状态".to_string(),
    document_type: "user_story".to_string(), // 文档类型：user_story, technical_spec, api_doc
};
let document = doc_repo.create(document_data).await?;

// 查找项目的所有文档
let project_docs = doc_repo.find_by_project(project.project_id).await?;

// 更新 LLM 处理结果
let structured_content = serde_json::json!({
    "actors": ["用户", "系统"],
    "actions": ["登录", "验证", "记住状态"],
    "acceptance_criteria": [
        "用户能成功登录",
        "错误提示清晰",
        "支持记住登录状态"
    ]
});

let session_id = Uuid::new_v4();
let processed_document = doc_repo.update_llm_processing(
    document.document_id,
    structured_content.to_string(),
    session_id,
).await?;
```

#### 6. 任务管理

```rust
use codex_database::repository::{TaskRepository, task_repository::CreateTaskData};

// 创建任务仓储
let task_repo = TaskRepository::new(db.clone());

// 创建任务
let task_data = CreateTaskData {
    project_id: project.project_id,
    parent_task_id: None, // 父任务ID（可选）
    llm_session_id: None, // LLM会话ID（可选）
    title: "实现用户登录功能".to_string(),
    description: "用户应该能够使用邮箱和密码登录".to_string(),
    task_type: "development".to_string(), // 任务类型：development, testing, review
};
let task = task_repo.create(task_data).await?;

// 更新任务状态
let updated_task = task_repo.update_status(task.task_id, "in_progress").await?;

// 分配任务给Agent
let agent_id = Uuid::new_v4();
let assigned_task = task_repo.assign_to_agent(
    task.task_id,
    agent_id,
    "请实现这个登录功能".to_string(),
).await?;
```

#### 7. LLM会话管理

```rust
use codex_database::repository::{
    LlmSessionRepository, LlmConversationRepository,
    llm_session_repository::CreateLlmSessionData,
    llm_conversation_repository::CreateConversationMessageData,
};

// 创建LLM会话仓储
let session_repo = LlmSessionRepository::new(db.clone());

// 创建LLM会话
let session_data = CreateLlmSessionData {
    project_id: project.project_id,
    user_id: user.user_id,
    session_type: "requirement_decomposition".to_string(),
    system_prompt: Some("你是一个需求分析专家".to_string()),
    decomposition_prompt: Some("请分解以下需求".to_string()),
};
let session = session_repo.create(session_data).await?;

// 创建对话消息
let conv_repo = LlmConversationRepository::new(db.clone());
let message_data = CreateConversationMessageData {
    session_id: session.session_id,
    role: "user".to_string(),
    content: "请帮我分解这个需求".to_string(),
    message_order: 1,
    token_count: Some(15),
    model_used: Some("gpt-4".to_string()),
    processing_time_ms: Some(1200),
};
let message = conv_repo.create(message_data).await?;
```

## 数据结构总览

所有Repository的create方法都使用统一的数据结构模式：

### 用户相关
- `CreateUserData`: 创建用户的数据结构

### 项目相关
- `CreateProjectData`: 创建项目的数据结构
- `CreateRequirementDocumentData`: 创建需求文档的数据结构

### Agent相关
- `CreateAgentData`: 创建Agent的数据结构

### 任务相关
- `CreateTaskData`: 创建任务的数据结构

### LLM相关
- `CreateLlmSessionData`: 创建LLM会话的数据结构
- `CreateConversationMessageData`: 创建对话消息的数据结构

这种统一的设计模式提供了：
- **类型安全**: 编译时检查所有必需字段
- **扩展性**: 新增字段时不会破坏现有代码
- **可读性**: 明确的字段名称和结构化数据
- **一致性**: 所有Repository使用相同的模式

### 测试用法

```rust
use codex_database::establish_connection;

// 创建内存数据库用于测试
async fn setup_test_db() -> codex_database::DatabaseConnection {
    let db = establish_connection("sqlite::memory:").await.unwrap();
    codex_database::Migrator::up(&db, None).await.unwrap();
    db
}

#[tokio::test]
async fn test_user_creation() {
    let db = setup_test_db().await;
    let user_repo = UserRepository::new(db);
    
    let user_data = CreateUserData {
        username: "test_user".to_string(),
        email: "test@example.com".to_string(),
        password_hash: "password_hash".to_string(),
        profile_data: None,
        settings: None,
    };
    
    let user = user_repo.create(user_data).await.unwrap();
    assert_eq!(user.username, "test_user");
    assert!(user.is_active);
}
```

## 核心实体

### User (用户)
- 用户账户管理
- 个人资料和设置存储
- 支持 JSON 格式的配置数据
- 登录状态和活跃状态跟踪

### Project (项目)
- 项目信息管理
- Git 仓库集成
- 技术栈和编码标准配置
- 项目上下文和代码库信息

### Agent (AI 代理)
- AI 代理配置和管理
- 能力和状态跟踪
- 性能统计和匹配算法
- Git配置和工作历史

### RequirementDocument (需求文档)
- 需求文档存储和管理
- LLM 处理结果跟踪
- 结构化内容支持
- 版本控制和优先级管理

### Task (任务)
- 任务执行和状态管理
- 优先级和依赖关系
- Agent分配和进度跟踪
- 估算时间和完成统计

### LlmSession (LLM会话)
- LLM 交互会话管理
- 会话类型和提示词配置
- 结果数据和状态跟踪
- 项目和用户关联

### LlmConversation (LLM对话)
- 对话消息存储
- 角色和内容管理
- Token 计数和模型信息
- 处理时间统计

### Conflict (冲突)
- 代码冲突检测和管理
- 冲突类型和严重程度
- 自动解决和人工决策
- 解决历史跟踪

### ExecutionSession (执行会话)
- 代码执行会话管理
- 执行配置和环境设置
- 状态监控和超时处理
- 结果和日志记录

## 仓储模式

所有数据访问都通过统一的仓储模式实现，提供：

### 设计原则
- **实例方法调用**: 所有Repository使用 `repo.method()` 而不是 `Repository::method()`
- **数据结构参数**: create方法使用 `CreateXxxData` 结构体而不是多个独立参数
- **类型安全**: 强类型的 Rust 接口，编译时验证
- **异步操作**: 全异步 API 设计
- **错误处理**: 统一的错误处理机制
- **分页支持**: 内置分页查询功能
- **事务支持**: SeaORM 事务支持

### 支持的Repository
- `UserRepository`: 用户管理
- `ProjectRepository`: 项目管理
- `AgentRepository`: AI代理管理
- `RequirementDocumentRepository`: 需求文档管理
- `TaskRepository`: 任务管理
- `LlmSessionRepository`: LLM会话管理
- `LlmConversationRepository`: LLM对话管理
- `ConflictRepository`: 冲突管理
- `ExecutionSessionRepository`: 执行会话管理

## 查询功能

### 基本查询
```rust
// 根据 ID 查找
let user = user_repo.find_by_id(user_id).await?;

// 根据条件查找
let user = user_repo.find_by_email("user@example.com").await?;
```

### 分页查询
```rust
let (agents, total_pages) = agent_repo.find_with_pagination(
    0,    // 页码
    10    // 每页大小
).await?;
```

### 条件查询
```rust
// 查找特定能力的 Agent
let frontend_agents = agent_repo.find_by_capabilities(
    &["FrontendDevelopment".to_string()]
).await?;

// 查找特定状态的 Agent
let idle_agents = agent_repo.find_by_status(AgentStatus::Idle).await?;
```

## 数据库配置

```rust
use codex_database::DatabaseConfig;

let config = DatabaseConfig {
    database_url: "sqlite://path/to/database.db".to_string(),
    max_connections: 10,        // 最大连接数
    min_connections: 1,         // 最小连接数
    connect_timeout: 30,        // 连接超时（秒）
    idle_timeout: 600,          // 空闲超时（秒）
    enable_logging: true,       // 启用 SQL 日志
};
```

## 错误处理

库使用统一的错误处理机制：

```rust
use codex_database::{Result, DatabaseError};

async fn handle_database_operation() -> Result<()> {
    match user_repo.create(user_data).await {
        Ok(user) => println!("用户创建成功: {}", user.username),
        Err(DatabaseError::UniqueConstraintViolation(_)) => {
            println!("用户名或邮箱已存在");
        }
        Err(err) => {
            eprintln!("数据库错误: {}", err);
        }
    }
    Ok(())
}
```

## 迁移管理

数据库迁移通过 `initialize_database` 函数自动执行：

```rust
// 初始化时自动运行所有迁移
let db = initialize_database(&config).await?;

// 手动运行迁移
use codex_database::Migrator;
Migrator::up(&db, None).await?;
```

## 健康检查

```rust
use codex_database::health_check;

// 检查数据库连接健康状态
match health_check(&db).await {
    Ok(()) => println!("数据库连接正常"),
    Err(err) => eprintln!("数据库连接异常: {}", err),
}
```

## 开发和测试

### 运行测试

```bash
# 运行所有测试（82个测试）
cargo test --package codex-database

# 运行特定测试文件
cargo test --package codex-database --test user_tests
cargo test --package codex-database --test agent_repository_tests
cargo test --package codex-database --test project_tests
cargo test --package codex-database --test integration_tests
cargo test --package codex-database --test llm_scheduling_tests

# 运行单元测试
cargo test --package codex-database --lib

# 运行特定模块测试
cargo test repository::user_repository::tests
cargo test repository::agent_repository::tests
```

### 测试覆盖

- **单元测试**: 25个测试，覆盖所有Repository基本功能
- **集成测试**: 57个测试，覆盖完整工作流程
- **总计**: 82个测试，确保系统稳定性

### 测试数据库

测试使用内存 SQLite 数据库，每个测试都有独立的数据库实例，确保测试隔离。所有测试都使用统一的 `setup_test_db()` 函数创建测试环境。

## 依赖关系

- **SeaORM 1.0**: 现代 Rust ORM
- **SQLite**: 轻量级数据库
- **UUID**: 唯一标识符生成
- **Serde**: JSON 序列化支持
- **Tokio**: 异步运行时
- **Chrono/Time**: 时间处理

## 版本更新

### v0.1.0 (当前版本)
- ✅ 统一所有Repository为实例方法调用模式
- ✅ 标准化create方法使用数据结构参数
- ✅ 完整的9个Repository实现
- ✅ 82个测试全部通过
- ✅ 支持用户、项目、Agent、任务、需求文档、LLM会话等完整功能
- ✅ 统一的错误处理和类型安全设计

### 设计改进
在最新版本中，我们对数据库层进行了全面的设计统一：

1. **API调用模式统一**: 从混合的静态/实例方法调用改为统一的实例方法调用
2. **参数模式统一**: 从混合的多参数/数据结构参数改为统一的数据结构参数
3. **错误处理统一**: 所有Repository使用相同的错误处理模式
4. **测试覆盖完整**: 82个测试确保所有功能正常工作

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。