//! 数据库集成测试
//! 
//! 测试多个Repository之间的协作和完整的数据库功能

use codex_database::{
    initialize_database, DatabaseConfig,
    repository::{
        user_repository::{UserRepository, CreateUserData},
        project_repository::{ProjectRepository, CreateProjectData},
        agent_repository::{AgentRepository, CreateAgentData},
    },
    entities::agent::AgentStatus,
};
use sea_orm::Database;
use uuid::Uuid;

/// 设置集成测试数据库
async fn setup_integration_db() -> codex_database::DatabaseConnection {
    let config = DatabaseConfig::memory();
    initialize_database(&config).await.unwrap()
}

/// 创建测试用户
async fn create_test_user(db: &codex_database::DatabaseConnection) -> Uuid {
    let repo = UserRepository::new(db.clone());
    let user_data = CreateUserData {
        username: "integration_user".to_string(),
        email: "integration@example.com".to_string(),
        password_hash: "password_hash".to_string(),
        profile_data: Some(serde_json::json!({
            "display_name": "Integration Test User",
            "preferences": {
                "theme": "dark",
                "language": "zh-CN"
            }
        })),
        settings: Some(serde_json::json!({
            "notifications": true,
            "auto_save": false
        })),
    };
    
    let user = repo.create(user_data).await.unwrap();
    user.user_id
}

/// 创建测试项目
async fn create_test_project(
    db: &codex_database::DatabaseConnection, 
    user_id: Uuid
) -> Uuid {
    let project_repo = ProjectRepository::new(db.clone());
    let project_data = CreateProjectData {
        user_id,
        name: "多Agent协同开发系统".to_string(),
        description: Some("基于SeaORM的数据库层实现".to_string()),
        repository_url: "https://github.com/test/multi-agent-system.git".to_string(),
        workspace_path: "/workspace/multi-agent-system".to_string(),
    };
    let project = project_repo.create(project_data).await.unwrap();
    
    // 更新项目配置
    let tech_stack = serde_json::json!({
        "languages": ["Rust", "TypeScript"],
        "frameworks": ["SeaORM", "Tauri", "React"],
        "databases": ["SQLite"],
        "tools": ["Git", "pnpm", "cargo"]
    });
    
    let coding_standards = serde_json::json!({
        "line_length": 100,
        "indentation": 4,
        "naming_convention": "snake_case",
        "comment_style": "chinese"
    });
    
    let git_settings = serde_json::json!({
        "main_branch": "main",
        "feature_branch_prefix": "feature/",
        "commit_convention": "conventional",
        "auto_merge": false
    });
    
    project_repo.update_config(
        project.project_id,
        Some(tech_stack),
        Some(coding_standards),
        Some(git_settings),
    ).await.unwrap();
    
    project.project_id
}

/// 创建测试Agent
async fn create_test_agents(
    db: &codex_database::DatabaseConnection, 
    user_id: Uuid
) -> Vec<Uuid> {
    let repo = AgentRepository::new(db.clone());
    let mut agent_ids = Vec::new();
    
    // 创建前端开发Agent
    let frontend_agent = CreateAgentData {
        user_id,
        name: "前端开发Agent".to_string(),
        description: Some("专门负责前端开发和UI/UX设计的智能助手".to_string()),
        prompt_template: "你是一个专业的前端开发工程师，擅长React、TypeScript和现代前端技术栈。".to_string(),
        capabilities: serde_json::json!(["FrontendDevelopment", "Testing", "CodeReview"]),
        config: serde_json::json!({
            "max_concurrent_tasks": 2,
            "preferred_frameworks": ["React", "Vue"],
            "testing_tools": ["Jest", "Vitest"],
            "expertise_level": "senior"
        }),
        git_config: Some(serde_json::json!({
            "branch_prefix": "frontend/",
            "commit_template": "feat(ui): "
        })),
    };
    
    let agent = repo.create(frontend_agent).await.unwrap();
    agent_ids.push(agent.agent_id);
    
    // 创建后端开发Agent
    let backend_agent = CreateAgentData {
        user_id,
        name: "后端开发Agent".to_string(),
        description: Some("专门负责后端API和数据库开发的智能助手".to_string()),
        prompt_template: "你是一个专业的后端开发工程师，擅长Rust、数据库设计和API开发。".to_string(),
        capabilities: serde_json::json!(["BackendDevelopment", "DatabaseDevelopment", "ApiDesign"]),
        config: serde_json::json!({
            "max_concurrent_tasks": 3,
            "preferred_languages": ["Rust", "TypeScript"],
            "database_expertise": ["SQLite", "PostgreSQL"],
            "expertise_level": "senior"
        }),
        git_config: Some(serde_json::json!({
            "branch_prefix": "backend/",
            "commit_template": "feat(api): "
        })),
    };
    
    let agent = repo.create(backend_agent).await.unwrap();
    agent_ids.push(agent.agent_id);
    
    // 创建DevOps Agent
    let devops_agent = CreateAgentData {
        user_id,
        name: "DevOps Agent".to_string(),
        description: Some("负责CI/CD、部署和系统维护的智能助手".to_string()),
        prompt_template: "你是一个专业的DevOps工程师，擅长自动化部署、监控和系统优化。".to_string(),
        capabilities: serde_json::json!(["DevOps", "PerformanceOptimization", "SecurityAudit"]),
        config: serde_json::json!({
            "max_concurrent_tasks": 1,
            "tools": ["Docker", "GitHub Actions", "Prometheus"],
            "expertise_level": "expert"
        }),
        git_config: Some(serde_json::json!({
            "branch_prefix": "ops/",
            "commit_template": "ops: "
        })),
    };
    
    let agent = repo.create(devops_agent).await.unwrap();
    agent_ids.push(agent.agent_id);
    
    agent_ids
}

#[tokio::test]
async fn test_complete_multi_agent_workflow() {
    // 设置数据库
    let db = setup_integration_db().await;
    
    // 1. 创建用户
    let user_id = create_test_user(&db).await;
    println!("✓ 创建用户: {}", user_id);
    
    // 2. 创建项目
    let project_id = create_test_project(&db, user_id).await;
    println!("✓ 创建项目: {}", project_id);
    
    // 3. 创建多个Agent
    let agent_ids = create_test_agents(&db, user_id).await;
    println!("✓ 创建{}个Agent: {:?}", agent_ids.len(), agent_ids);
    
    // 4. 验证用户关联数据
    let project_repo = ProjectRepository::new(db.clone());
    let user_projects = project_repo.find_by_user(user_id).await.unwrap();
    assert_eq!(user_projects.len(), 1);
    assert_eq!(user_projects[0].project_id, project_id);
    
    let agent_repo = AgentRepository::new(db.clone());
    let user_agents = agent_repo.find_by_user_id(user_id).await.unwrap();
    assert_eq!(user_agents.len(), 3);
    
    // 5. 测试Agent能力查询
    let frontend_agents = agent_repo
        .find_by_capabilities(&["FrontendDevelopment".to_string()])
        .await.unwrap();
    assert_eq!(frontend_agents.len(), 1);
    assert_eq!(frontend_agents[0].name, "前端开发Agent");
    
    let backend_agents = agent_repo
        .find_by_capabilities(&["BackendDevelopment".to_string()])
        .await.unwrap();
    assert_eq!(backend_agents.len(), 1);
    assert_eq!(backend_agents[0].name, "后端开发Agent");
    
    // 6. 测试Agent状态管理
    let frontend_agent_id = frontend_agents[0].agent_id;
    let task_id = Uuid::new_v4();
    
    // 将前端Agent设置为工作状态
    let updated_agent = agent_repo
        .update_status(frontend_agent_id, AgentStatus::Working, Some(task_id))
        .await.unwrap();
    assert_eq!(updated_agent.status, "working");
    assert_eq!(updated_agent.current_task_id, Some(task_id));
    
    // 7. 查找空闲的Agent
    let idle_agents = agent_repo.find_idle_agents().await.unwrap();
    assert_eq!(idle_agents.len(), 2); // 后端和DevOps Agent应该是空闲的
    
    // 8. 测试最佳匹配Agent查找
    let best_match = agent_repo
        .find_best_match(&["DevOps".to_string()], true)
        .await.unwrap();
    assert!(best_match.is_some());
    assert_eq!(best_match.unwrap().name, "DevOps Agent");
    
    // 9. 模拟任务完成，更新统计信息
    use codex_database::repository::agent_repository::AgentStatistics;
    
    let stats = AgentStatistics {
        total_tasks_completed: Some(1),
        success_rate: Some(1.0),
        average_completion_time: Some(45), // 45分钟
    };
    
    let updated_agent = agent_repo
        .update_statistics(frontend_agent_id, stats)
        .await.unwrap();
    assert_eq!(updated_agent.total_tasks_completed, 1);
    assert_eq!(updated_agent.success_rate, 1.0);
    assert_eq!(updated_agent.average_completion_time, 45);
    
    // 10. 将Agent状态恢复为空闲
    let completed_agent = agent_repo
        .update_status(frontend_agent_id, AgentStatus::Idle, None)
        .await.unwrap();
    assert_eq!(completed_agent.status, "idle");
    assert_eq!(completed_agent.current_task_id, None);
    
    // 11. 验证项目配置更新
    let project_repo_final = ProjectRepository::new(db.clone());
    let project = project_repo_final.find_by_id(project_id)
        .await.unwrap()
        .unwrap();
    
    assert!(project.technology_stack.is_some());
    assert!(project.coding_standards.is_some());
    assert!(project.git_settings.is_some());
    
    // 12. 测试Agent性能统计
    let performance = agent_repo
        .get_performance_stats(frontend_agent_id)
        .await.unwrap();
    assert_eq!(performance.total_tasks_completed, 1);
    assert_eq!(performance.success_rate, 1.0);
    assert_eq!(performance.average_completion_time, 45);
    
    println!("✓ 完整的多Agent协同工作流测试通过");
}

#[tokio::test]
async fn test_database_connection_and_migration() {
    // 测试数据库连接
    let db = Database::connect("sqlite::memory:").await.unwrap();
    
    // 测试迁移
    use codex_database::migrations::Migrator;
    Migrator::up(&db, None).await.unwrap();
    
    // 验证所有表都已创建
    let tables = Migrator::status(&db).await.unwrap();
    let expected_tables = vec![
        "users", "projects", "requirement_documents", "llm_sessions", 
        "llm_conversations", "tasks", "agents", "agent_work_history",
        "execution_sessions", "execution_logs", "conflicts", 
        "human_decisions", "domain_events", "event_publish_log"
    ];
    
    for table in expected_tables {
        assert!(
            tables.contains(&table.to_string()),
            "表 {} 未创建", table
        );
    }
    
    println!("✓ 数据库连接和迁移测试通过");
}

#[tokio::test]
async fn test_error_handling() {
    let db = setup_integration_db().await;
    let agent_repo = AgentRepository::new(db.clone());
    
    // 测试查找不存在的Agent
    let non_existent_id = Uuid::new_v4();
    let result = agent_repo.find_by_id(non_existent_id).await.unwrap();
    assert!(result.is_none());
    
    // 测试更新不存在的Agent
    let update_result = agent_repo
        .update_status(non_existent_id, AgentStatus::Working, None)
        .await;
    assert!(update_result.is_err());
    
    println!("✓ 错误处理测试通过");
}

#[tokio::test]
async fn test_concurrent_operations() {
    let db = setup_integration_db().await;
    let user_id = create_test_user(&db).await;
    
    // 并发创建多个Agent
    let mut handles = Vec::new();
    
    for i in 0..5 {
        let db_clone = db.clone();
        let handle = tokio::spawn(async move {
            let repo = AgentRepository::new(db_clone);
            let agent_data = CreateAgentData {
                user_id,
                name: format!("并发Agent_{}", i),
                description: Some(format!("并发创建的Agent {}", i)),
                prompt_template: "测试提示词".to_string(),
                capabilities: serde_json::json!(["Testing"]),
                config: serde_json::json!({"concurrent_test": true}),
                git_config: None,
            };
            
            repo.create(agent_data).await
        });
        handles.push(handle);
    }
    
    // 等待所有任务完成
    let mut results = Vec::new();
    for handle in handles {
        let result = handle.await.unwrap().unwrap();
        results.push(result);
    }
    
    // 验证所有Agent都成功创建
    assert_eq!(results.len(), 5);
    
    let agent_repo = AgentRepository::new(db);
    let all_agents = agent_repo.find_by_user_id(user_id).await.unwrap();
    assert_eq!(all_agents.len(), 5);
    
    println!("✓ 并发操作测试通过");
}