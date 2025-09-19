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
use codex_database::repository::ProjectRepository;

// 创建项目仓储
let project_repo = ProjectRepository::new(db.clone());

// 创建项目
let project = project_repo.create(
    user.user_id,
    "我的项目".to_string(),
    Some("项目描述".to_string()),
    "https://github.com/user/repo.git".to_string(),
    "/workspace/project".to_string(),
).await?;

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
    None, // 部署配置
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
use codex_database::repository::RequirementDocumentRepository;

// 创建需求文档仓储
let doc_repo = RequirementDocumentRepository::new(db.clone());

// 创建需求文档
let document = doc_repo.create(
    project.project_id,
    "用户登录功能".to_string(),
    "用户应该能够通过邮箱和密码登录系统，支持记住登录状态".to_string(),
    "user_story".to_string(), // 文档类型：user_story, technical_spec, api_doc
).await?;

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

### Project (项目)
- 项目信息管理
- Git 仓库集成
- 技术栈和编码标准配置

### Agent (AI 代理)
- AI 代理配置和管理
- 能力和状态跟踪
- 性能统计和匹配算法

### RequirementDocument (需求文档)
- 需求文档存储和管理
- LLM 处理结果跟踪
- 结构化内容支持

### Task (任务)
- 任务执行和状态管理
- 优先级和依赖关系
- 执行历史记录

## 仓储模式

所有数据访问都通过仓储模式实现，提供：

- **类型安全**: 强类型的 Rust 接口
- **异步操作**: 全异步 API 设计
- **错误处理**: 统一的错误处理机制
- **分页支持**: 内置分页查询功能
- **事务支持**: SeaORM 事务支持

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
# 运行所有测试
cargo test

# 运行特定测试
cargo test user_tests
cargo test agent_repository_tests
```

### 测试数据库

测试使用内存 SQLite 数据库，每个测试都有独立的数据库实例，确保测试隔离。

## 依赖关系

- **SeaORM 1.0**: 现代 Rust ORM
- **SQLite**: 轻量级数据库
- **UUID**: 唯一标识符生成
- **Serde**: JSON 序列化支持
- **Tokio**: 异步运行时
- **Chrono/Time**: 时间处理

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。