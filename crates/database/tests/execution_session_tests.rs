//! 执行会话实体单元测试

use codex_database::entities::{
    execution_session::{self, Entity as ExecutionSession, ActiveModel, ExecutionStatus},
    task::{self, Entity as Task},
    agent::{self, Entity as Agent, AgentStatus},
    project::{self, Entity as Project},
    user::{self, Entity as User},
};
use codex_database::{initialize_database, DatabaseConfig};
use sea_orm::{ActiveValue::Set, EntityTrait, ActiveModelTrait};
use serde_json::json;
use tempfile::tempdir;
use uuid::Uuid;

/// 创建测试数据库连接
async fn create_test_db() -> codex_database::DatabaseConnection {
    let temp_dir = tempdir().expect("创建临时目录失败");
    let db_path = temp_dir.path().join("test_execution.db");
    let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
    
    let config = DatabaseConfig {
        database_url,
        max_connections: 1,
        min_connections: 1,
        connect_timeout: 10,
        idle_timeout: 60,
        enable_logging: false,
    };
    
    initialize_database(&config).await.expect("初始化测试数据库失败")
}

/// 创建测试数据
async fn create_test_data(db: &codex_database::DatabaseConnection) -> (user::Model, project::Model, agent::Model, task::Model) {
    // 创建用户
    let user = user::ActiveModel {
        user_id: Set(Uuid::new_v4()),
        username: Set("testuser".to_string()),
        email: Set("test@example.com".to_string()),
        password_hash: Set("hashed_password".to_string()),
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
        profile_data: Set(None),
        settings: Set(None),
        is_active: Set(true),
        last_login_at: Set(None),
    };
    let user = user.insert(db).await.expect("创建测试用户失败");
    
    // 创建项目
    let project = project::ActiveModel {
        project_id: Set(Uuid::new_v4()),
        user_id: Set(user.user_id),
        name: Set("测试项目".to_string()),
        description: Set(Some("执行会话测试项目".to_string())),
        repository_url: Set("https://github.com/test/repo".to_string()),
        main_branch: Set("main".to_string()),
        workspace_path: Set("/tmp/test".to_string()),
        technology_stack: Set(Some(json!(["rust"]))),
        coding_standards: Set(None),
        git_settings: Set(None),
        codebase_info: Set(None),
        project_context: Set(None),
        status: Set("active".to_string()),
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
    };
    let project = project.insert(db).await.expect("创建测试项目失败");
    
    // 创建Agent
    let agent = agent::ActiveModel {
        agent_id: Set(Uuid::new_v4()),
        user_id: Set(user.user_id),
        name: Set("测试Agent".to_string()),
        description: Set(None),
        prompt_template: Set("测试提示词".to_string()),
        capabilities: Set(json!(["Development"])),
        config: Set(json!({})),
        git_config: Set(None),
        status: Set(AgentStatus::Idle.to_string()),
        current_task_id: Set(None),
        total_tasks_completed: Set(0),
        success_rate: Set(0.0),
        average_completion_time: Set(0),
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
        last_active_at: Set(chrono::Utc::now().into()),
    };
    let agent = agent.insert(db).await.expect("创建测试Agent失败");
    
    // 创建任务
    let task = task::ActiveModel {
        task_id: Set(Uuid::new_v4()),
        project_id: Set(project.project_id),
        parent_task_id: Set(None),
        llm_session_id: Set(None),
        title: Set("测试任务".to_string()),
        description: Set("执行会话测试任务".to_string()),
        task_type: Set("development".to_string()),
        priority: Set("medium".to_string()),
        required_capabilities: Set(Some(json!(["Development"]))),
        acceptance_criteria: Set(None),
        estimated_hours: Set(Some(2)),
        assigned_agent_id: Set(Some(agent.agent_id)),
        assignment_prompt: Set(None),
        assigned_at: Set(None),
        status: Set("pending".to_string()),
        started_at: Set(None),
        completed_at: Set(None),
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
    };
    let task = task.insert(db).await.expect("创建测试任务失败");
    
    (user, project, agent, task)
}

#[tokio::test]
async fn test_execution_session_creation() {
    let db = create_test_db().await;
    let (_, project, agent, task) = create_test_data(&db).await;
    
    // 创建执行会话
    let session_id = Uuid::new_v4();
    let execution_config = json!({
        "environment": "test",
        "timeout_enabled": true,
        "auto_cleanup": true
    });
    
    let session = execution_session::ActiveModel {
        session_id: Set(session_id),
        task_id: Set(task.task_id),
        agent_id: Set(agent.agent_id),
        project_id: Set(project.project_id),
        git_branch: Set("feature/test-branch".to_string()),
        base_commit: Set(Some("abc123".to_string())),
        final_commit: Set(None),
        execution_config: Set(Some(execution_config.clone())),
        timeout_minutes: Set(60),
        status: Set(ExecutionStatus::Pending.to_string()),
        created_at: Set(chrono::Utc::now().into()),
        started_at: Set(None),
        completed_at: Set(None),
        success: Set(None),
        result_data: Set(None),
        error_message: Set(None),
    };
    
    let created_session = session.insert(&db).await.expect("创建执行会话失败");
    
    // 验证创建成功
    assert_eq!(created_session.session_id, session_id);
    assert_eq!(created_session.task_id, task.task_id);
    assert_eq!(created_session.agent_id, agent.agent_id);
    assert_eq!(created_session.project_id, project.project_id);
    assert_eq!(created_session.git_branch, "feature/test-branch");
    assert_eq!(created_session.execution_config, Some(execution_config));
    assert_eq!(created_session.status, ExecutionStatus::Pending.to_string());
}

#[tokio::test]
async fn test_execution_session_lifecycle() {
    let db = create_test_db().await;
    let (_, project, agent, task) = create_test_data(&db).await;
    
    // 创建执行会话
    let session = execution_session::ActiveModel {
        session_id: Set(Uuid::new_v4()),
        task_id: Set(task.task_id),
        agent_id: Set(agent.agent_id),
        project_id: Set(project.project_id),
        git_branch: Set("feature/lifecycle-test".to_string()),
        base_commit: Set(Some("def456".to_string())),
        final_commit: Set(None),
        execution_config: Set(None),
        timeout_minutes: Set(30),
        status: Set(ExecutionStatus::Pending.to_string()),
        created_at: Set(chrono::Utc::now().into()),
        started_at: Set(None),
        completed_at: Set(None),
        success: Set(None),
        result_data: Set(None),
        error_message: Set(None),
    };
    
    let created_session = session.insert(&db).await.expect("创建执行会话失败");
    
    // 测试状态转换：Pending -> Running
    let mut session_active: execution_session::ActiveModel = created_session.into();
    session_active.status = Set(ExecutionStatus::Running.to_string());
    session_active.started_at = Set(Some(chrono::Utc::now().into()));
    
    let running_session = session_active.update(&db).await.expect("更新为运行状态失败");
    assert_eq!(running_session.status, ExecutionStatus::Running.to_string());
    assert!(running_session.started_at.is_some());
    
    // 测试状态转换：Running -> Completed
    let mut session_active: execution_session::ActiveModel = running_session.into();
    session_active.status = Set(ExecutionStatus::Completed.to_string());
    session_active.completed_at = Set(Some(chrono::Utc::now().into()));
    session_active.success = Set(Some(true));
    session_active.final_commit = Set(Some("ghi789".to_string()));
    session_active.result_data = Set(Some(json!({
        "files_changed": 5,
        "tests_passed": 10,
        "code_coverage": 0.85
    })));
    
    let completed_session = session_active.update(&db).await.expect("更新为完成状态失败");
    assert_eq!(completed_session.status, ExecutionStatus::Completed.to_string());
    assert!(completed_session.completed_at.is_some());
    assert_eq!(completed_session.success, Some(true));
    assert_eq!(completed_session.final_commit, Some("ghi789".to_string()));
}

#[tokio::test]
async fn test_execution_session_failure() {
    let db = create_test_db().await;
    let (_, project, agent, task) = create_test_data(&db).await;
    
    // 创建执行会话
    let session = execution_session::ActiveModel {
        session_id: Set(Uuid::new_v4()),
        task_id: Set(task.task_id),
        agent_id: Set(agent.agent_id),
        project_id: Set(project.project_id),
        git_branch: Set("feature/failure-test".to_string()),
        base_commit: Set(Some("jkl012".to_string())),
        final_commit: Set(None),
        execution_config: Set(None),
        timeout_minutes: Set(15),
        status: Set(ExecutionStatus::Running.to_string()),
        created_at: Set(chrono::Utc::now().into()),
        started_at: Set(Some(chrono::Utc::now().into())),
        completed_at: Set(None),
        success: Set(None),
        result_data: Set(None),
        error_message: Set(None),
    };
    
    let created_session = session.insert(&db).await.expect("创建执行会话失败");
    
    // 模拟执行失败
    let mut session_active: execution_session::ActiveModel = created_session.into();
    session_active.status = Set(ExecutionStatus::Failed.to_string());
    session_active.completed_at = Set(Some(chrono::Utc::now().into()));
    session_active.success = Set(Some(false));
    session_active.error_message = Set(Some("编译错误：缺少依赖".to_string()));
    session_active.result_data = Set(Some(json!({
        "error_type": "compilation_error",
        "error_details": {
            "missing_dependencies": ["tokio", "serde"]
        }
    })));
    
    let failed_session = session_active.update(&db).await.expect("更新为失败状态失败");
    assert_eq!(failed_session.status, ExecutionStatus::Failed.to_string());
    assert_eq!(failed_session.success, Some(false));
    assert!(failed_session.error_message.is_some());
}

#[tokio::test]
async fn test_execution_session_timeout() {
    let db = create_test_db().await;
    let (_, project, agent, task) = create_test_data(&db).await;
    
    // 创建执行会话
    let session = execution_session::ActiveModel {
        session_id: Set(Uuid::new_v4()),
        task_id: Set(task.task_id),
        agent_id: Set(agent.agent_id),
        project_id: Set(project.project_id),
        git_branch: Set("feature/timeout-test".to_string()),
        base_commit: Set(Some("mno345".to_string())),
        final_commit: Set(None),
        execution_config: Set(Some(json!({
            "strict_timeout": true,
            "cleanup_on_timeout": true
        }))),
        timeout_minutes: Set(5), // 5分钟超时
        status: Set(ExecutionStatus::Running.to_string()),
        created_at: Set(chrono::Utc::now().into()),
        started_at: Set(Some(chrono::Utc::now().into())),
        completed_at: Set(None),
        success: Set(None),
        result_data: Set(None),
        error_message: Set(None),
    };
    
    let created_session = session.insert(&db).await.expect("创建执行会话失败");
    
    // 模拟超时
    let mut session_active: execution_session::ActiveModel = created_session.into();
    session_active.status = Set(ExecutionStatus::Timeout.to_string());
    session_active.completed_at = Set(Some(chrono::Utc::now().into()));
    session_active.success = Set(Some(false));
    session_active.error_message = Set(Some("执行超时：超过5分钟限制".to_string()));
    
    let timeout_session = session_active.update(&db).await.expect("更新为超时状态失败");
    assert_eq!(timeout_session.status, ExecutionStatus::Timeout.to_string());
    assert_eq!(timeout_session.success, Some(false));
    assert!(timeout_session.error_message.as_ref().unwrap().contains("超时"));
}

#[tokio::test]
async fn test_execution_status_enum_conversions() {
    // 测试ExecutionStatus枚举转换
    assert_eq!(ExecutionStatus::Pending.to_string(), "pending");
    assert_eq!(ExecutionStatus::Running.to_string(), "running");
    assert_eq!(ExecutionStatus::Completed.to_string(), "completed");
    assert_eq!(ExecutionStatus::Failed.to_string(), "failed");
    assert_eq!(ExecutionStatus::Timeout.to_string(), "timeout");
    
    // 测试字符串到枚举的转换
    assert!(matches!(ExecutionStatus::from("pending".to_string()), ExecutionStatus::Pending));
    assert!(matches!(ExecutionStatus::from("running".to_string()), ExecutionStatus::Running));
    assert!(matches!(ExecutionStatus::from("completed".to_string()), ExecutionStatus::Completed));
    assert!(matches!(ExecutionStatus::from("failed".to_string()), ExecutionStatus::Failed));
    assert!(matches!(ExecutionStatus::from("timeout".to_string()), ExecutionStatus::Timeout));
    assert!(matches!(ExecutionStatus::from("invalid".to_string()), ExecutionStatus::Pending)); // 默认值
}

#[tokio::test]
async fn test_execution_session_complex_config() {
    let db = create_test_db().await;
    let (_, project, agent, task) = create_test_data(&db).await;
    
    // 测试复杂的执行配置
    let complex_config = json!({
        "environment": {
            "type": "docker",
            "image": "rust:latest",
            "volumes": ["/workspace:/workspace"],
            "env_vars": {
                "RUST_LOG": "debug",
                "DATABASE_URL": "sqlite:///tmp/test.db"
            }
        },
        "execution_steps": [
            {
                "name": "setup",
                "command": "cargo check",
                "timeout": 300
            },
            {
                "name": "test",
                "command": "cargo test",
                "timeout": 600
            },
            {
                "name": "build",
                "command": "cargo build --release",
                "timeout": 900
            }
        ],
        "quality_gates": {
            "test_coverage_threshold": 0.8,
            "performance_baseline": {
                "max_response_time": 1000,
                "max_memory_usage": "512MB"
            }
        },
        "notifications": {
            "on_success": ["webhook://success.endpoint"],
            "on_failure": ["email://dev@example.com", "slack://channel"]
        }
    });
    
    let session = execution_session::ActiveModel {
        session_id: Set(Uuid::new_v4()),
        task_id: Set(task.task_id),
        agent_id: Set(agent.agent_id),
        project_id: Set(project.project_id),
        git_branch: Set("feature/complex-config".to_string()),
        base_commit: Set(Some("pqr678".to_string())),
        final_commit: Set(None),
        execution_config: Set(Some(complex_config.clone())),
        timeout_minutes: Set(120), // 2小时总超时
        status: Set(ExecutionStatus::Pending.to_string()),
        created_at: Set(chrono::Utc::now().into()),
        started_at: Set(None),
        completed_at: Set(None),
        success: Set(None),
        result_data: Set(None),
        error_message: Set(None),
    };
    
    let created_session = session.insert(&db).await.expect("创建复杂配置执行会话失败");
    
    // 验证复杂配置保存正确
    assert_eq!(created_session.execution_config, Some(complex_config));
    assert_eq!(created_session.timeout_minutes, 120);
}