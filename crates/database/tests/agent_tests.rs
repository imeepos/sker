//! Agent实体和功能单元测试

use codex_database::entities::agent::{self, Entity as Agent, ActiveModel, Model};
use codex_database::entities::user::{self, Entity as User};
use codex_database::entities::agent::{AgentCapability, AgentStatus};
use codex_database::{initialize_database, DatabaseConfig};
use sea_orm::{ActiveValue::Set, EntityTrait, ActiveModelTrait};
use serde_json::json;
use tempfile::tempdir;
use uuid::Uuid;

/// 创建测试数据库连接
async fn create_test_db() -> codex_database::DatabaseConnection {
    let temp_dir = tempdir().expect("创建临时目录失败");
    let db_path = temp_dir.path().join("test_agent.db");
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

/// 创建测试用户
async fn create_test_user(db: &codex_database::DatabaseConnection) -> user::Model {
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
    
    user.insert(db).await.expect("创建测试用户失败")
}

#[tokio::test]
async fn test_agent_creation() {
    let db = create_test_db().await;
    let user = create_test_user(&db).await;
    
    // 测试Agent创建
    let agent_id = Uuid::new_v4();
    let capabilities = json!([
        "FrontendDevelopment",
        "BackendDevelopment"
    ]);
    let config = json!({
        "max_concurrent_tasks": 2,
        "preferred_languages": ["rust", "typescript"]
    });
    
    let agent = ActiveModel {
        agent_id: Set(agent_id),
        user_id: Set(user.user_id),
        name: Set("测试Agent".to_string()),
        description: Set(Some("用于测试的Agent".to_string())),
        prompt_template: Set("你是一个专业的开发Agent".to_string()),
        capabilities: Set(capabilities.clone()),
        config: Set(config.clone()),
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
    
    let created_agent = agent.insert(&db).await.expect("创建Agent失败");
    
    // 验证Agent创建成功
    assert_eq!(created_agent.agent_id, agent_id);
    assert_eq!(created_agent.user_id, user.user_id);
    assert_eq!(created_agent.name, "测试Agent");
    assert_eq!(created_agent.capabilities, capabilities);
    assert_eq!(created_agent.config, config);
    assert_eq!(created_agent.status, AgentStatus::Idle.to_string());
}

#[tokio::test]
async fn test_agent_status_updates() {
    let db = create_test_db().await;
    let user = create_test_user(&db).await;
    
    // 创建Agent
    let agent = ActiveModel {
        agent_id: Set(Uuid::new_v4()),
        user_id: Set(user.user_id),
        name: Set("状态测试Agent".to_string()),
        description: Set(None),
        prompt_template: Set("测试提示词".to_string()),
        capabilities: Set(json!(["Testing"])),
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
    
    let created_agent = agent.insert(&db).await.expect("创建Agent失败");
    
    // 测试状态更新
    let mut agent_active: ActiveModel = created_agent.into();
    agent_active.status = Set(AgentStatus::Working.to_string());
    agent_active.updated_at = Set(chrono::Utc::now().into());
    
    let updated_agent = agent_active.update(&db).await.expect("更新Agent状态失败");
    assert_eq!(updated_agent.status, AgentStatus::Working.to_string());
}

#[tokio::test]
async fn test_agent_capabilities_validation() {
    let db = create_test_db().await;
    let user = create_test_user(&db).await;
    
    // 测试不同的能力配置
    let capabilities_test_cases = vec![
        json!(["FrontendDevelopment"]),
        json!(["BackendDevelopment", "Testing"]),
        json!(["FrontendDevelopment", "BackendDevelopment", "CodeReview"]),
        json!([]), // 空能力列表也应该有效
    ];
    
    for (i, capabilities) in capabilities_test_cases.iter().enumerate() {
        let agent = ActiveModel {
            agent_id: Set(Uuid::new_v4()),
            user_id: Set(user.user_id),
            name: Set(format!("能力测试Agent{}", i)),
            description: Set(None),
            prompt_template: Set("测试提示词".to_string()),
            capabilities: Set(capabilities.clone()),
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
        
        let created_agent = agent.insert(&db).await.expect(&format!("创建Agent{}失败", i));
        assert_eq!(created_agent.capabilities, *capabilities);
    }
}

#[tokio::test]
async fn test_agent_statistics() {
    let db = create_test_db().await;
    let user = create_test_user(&db).await;
    
    // 创建Agent
    let agent = ActiveModel {
        agent_id: Set(Uuid::new_v4()),
        user_id: Set(user.user_id),
        name: Set("统计测试Agent".to_string()),
        description: Set(None),
        prompt_template: Set("测试提示词".to_string()),
        capabilities: Set(json!(["Development"])),
        config: Set(json!({})),
        git_config: Set(None),
        status: Set(AgentStatus::Idle.to_string()),
        current_task_id: Set(None),
        total_tasks_completed: Set(5),
        success_rate: Set(0.8),
        average_completion_time: Set(120), // 120分钟
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
        last_active_at: Set(chrono::Utc::now().into()),
    };
    
    let created_agent = agent.insert(&db).await.expect("创建Agent失败");
    
    // 验证统计数据
    assert_eq!(created_agent.total_tasks_completed, 5);
    assert_eq!(created_agent.success_rate, 0.8);
    assert_eq!(created_agent.average_completion_time, 120);
}

#[tokio::test]
async fn test_agent_config_validation() {
    let db = create_test_db().await;
    let user = create_test_user(&db).await;
    
    // 测试复杂的配置结构
    let complex_config = json!({
        "max_concurrent_tasks": 3,
        "preferred_languages": ["rust", "python", "javascript"],
        "working_hours": {
            "start": "09:00",
            "end": "17:00",
            "timezone": "UTC"
        },
        "quality_thresholds": {
            "minimum_test_coverage": 0.8,
            "code_complexity_limit": 10
        },
        "integrations": {
            "git": {
                "auto_commit": true,
                "commit_message_template": "[{task_type}] {task_title}"
            },
            "ci_cd": {
                "run_tests_before_commit": true,
                "auto_deploy": false
            }
        }
    });
    
    let agent = ActiveModel {
        agent_id: Set(Uuid::new_v4()),
        user_id: Set(user.user_id),
        name: Set("配置测试Agent".to_string()),
        description: Set(None),
        prompt_template: Set("测试提示词".to_string()),
        capabilities: Set(json!(["Development"])),
        config: Set(complex_config.clone()),
        git_config: Set(Some(json!({
            "username": "test-agent",
            "email": "agent@test.com"
        }))),
        status: Set(AgentStatus::Idle.to_string()),
        current_task_id: Set(None),
        total_tasks_completed: Set(0),
        success_rate: Set(0.0),
        average_completion_time: Set(0),
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
        last_active_at: Set(chrono::Utc::now().into()),
    };
    
    let created_agent = agent.insert(&db).await.expect("创建Agent失败");
    
    // 验证复杂配置保存正确
    assert_eq!(created_agent.config, complex_config);
    assert!(created_agent.git_config.is_some());
}

#[tokio::test]
async fn test_agent_enum_conversions() {
    // 测试AgentStatus枚举转换
    assert_eq!(AgentStatus::Idle.to_string(), "idle");
    assert_eq!(AgentStatus::Working.to_string(), "working");
    assert_eq!(AgentStatus::Paused.to_string(), "paused");
    assert_eq!(AgentStatus::Error.to_string(), "error");
    assert_eq!(AgentStatus::Offline.to_string(), "offline");
    
    // 测试字符串到枚举的转换
    assert!(matches!(AgentStatus::from("idle".to_string()), AgentStatus::Idle));
    assert!(matches!(AgentStatus::from("working".to_string()), AgentStatus::Working));
    assert!(matches!(AgentStatus::from("invalid".to_string()), AgentStatus::Idle)); // 默认值
}