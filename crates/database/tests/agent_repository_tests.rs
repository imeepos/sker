//! Agent仓储集成测试

use codex_database::{
    repository::{
        agent_repository::{AgentRepository, CreateAgentData, AgentStatistics},
        user_repository::{UserRepository, CreateUserData}
    },
    entities::agent::{AgentStatus, AgentCapability},
    initialize_database, DatabaseConfig
};
use serde_json::json;
use tempfile::tempdir;
use uuid::Uuid;

/// 创建测试数据库连接
async fn create_test_db() -> codex_database::DatabaseConnection {
    let temp_dir = tempdir().expect("创建临时目录失败");
    let db_path = temp_dir.path().join("test_agent_repo.db");
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

/// 创建测试用户和Agent仓储
async fn setup_test_repositories() -> (AgentRepository, UserRepository, codex_database::DatabaseConnection) {
    let db = create_test_db().await;
    let agent_repo = AgentRepository::new(db.clone());
    let user_repo = UserRepository::new(db.clone());
    (agent_repo, user_repo, db)
}

#[tokio::test]
async fn test_agent_repository_create() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户
    let user_data = CreateUserData {
        username: "testuser".to_string(),
        email: "test@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    // 创建Agent
    let agent_data = CreateAgentData {
        user_id: user.user_id,
        name: "测试Agent".to_string(),
        description: Some("用于集成测试的Agent".to_string()),
        prompt_template: "你是一个专业的开发Agent".to_string(),
        capabilities: json!(["FrontendDevelopment", "BackendDevelopment"]),
        config: json!({
            "max_concurrent_tasks": 2,
            "preferred_languages": ["rust", "typescript"]
        }),
        git_config: Some(json!({
            "username": "test-agent",
            "email": "agent@test.com"
        })),
    };
    
    let created_agent = agent_repo.create(agent_data.clone()).await.expect("创建Agent失败");
    
    // 验证Agent创建成功
    assert_eq!(created_agent.user_id, user.user_id);
    assert_eq!(created_agent.name, agent_data.name);
    assert_eq!(created_agent.status, AgentStatus::Idle.to_string());
    assert_eq!(created_agent.total_tasks_completed, 0);
    assert_eq!(created_agent.success_rate, 0.0);
    assert!(created_agent.git_config.is_some());
}

#[tokio::test]
async fn test_agent_repository_find_operations() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户
    let user_data = CreateUserData {
        username: "testuser2".to_string(),
        email: "test2@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    // 创建多个Agent
    let agents_data = vec![
        CreateAgentData {
            user_id: user.user_id,
            name: "前端Agent".to_string(),
            description: None,
            prompt_template: "前端开发专家".to_string(),
            capabilities: json!(["FrontendDevelopment"]),
            config: json!({}),
            git_config: None,
        },
        CreateAgentData {
            user_id: user.user_id,
            name: "后端Agent".to_string(),
            description: None,
            prompt_template: "后端开发专家".to_string(),
            capabilities: json!(["BackendDevelopment"]),
            config: json!({}),
            git_config: None,
        },
        CreateAgentData {
            user_id: user.user_id,
            name: "全栈Agent".to_string(),
            description: None,
            prompt_template: "全栈开发专家".to_string(),
            capabilities: json!(["FrontendDevelopment", "BackendDevelopment"]),
            config: json!({}),
            git_config: None,
        },
    ];
    
    let mut created_agents = Vec::new();
    for data in agents_data {
        let agent = agent_repo.create(data).await.expect("创建Agent失败");
        created_agents.push(agent);
    }
    
    // 测试根据ID查找
    let found_agent = agent_repo.find_by_id(created_agents[0].agent_id).await
        .expect("查找Agent失败")
        .expect("Agent应该存在");
    assert_eq!(found_agent.agent_id, created_agents[0].agent_id);
    
    // 测试根据用户ID查找
    let user_agents = agent_repo.find_by_user_id(user.user_id).await.expect("查找用户Agent失败");
    assert_eq!(user_agents.len(), 3);
    
    // 测试根据状态查找
    let idle_agents = agent_repo.find_by_status(AgentStatus::Idle).await.expect("查找空闲Agent失败");
    assert_eq!(idle_agents.len(), 3);
    
    // 测试根据能力查找
    let frontend_agents = agent_repo.find_by_capabilities(&["FrontendDevelopment".to_string()])
        .await.expect("根据能力查找Agent失败");
    assert_eq!(frontend_agents.len(), 2); // 前端Agent和全栈Agent
    
    let backend_agents = agent_repo.find_by_capabilities(&["BackendDevelopment".to_string()])
        .await.expect("根据能力查找Agent失败");
    assert_eq!(backend_agents.len(), 2); // 后端Agent和全栈Agent
}

#[tokio::test]
async fn test_agent_repository_status_updates() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户和Agent
    let user_data = CreateUserData {
        username: "testuser3".to_string(),
        email: "test3@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    let agent_data = CreateAgentData {
        user_id: user.user_id,
        name: "状态测试Agent".to_string(),
        description: None,
        prompt_template: "状态测试".to_string(),
        capabilities: json!(["Testing"]),
        config: json!({}),
        git_config: None,
    };
    let agent = agent_repo.create(agent_data).await.expect("创建Agent失败");
    
    // 测试状态更新
    let task_id = Uuid::new_v4();
    let updated_agent = agent_repo.update_status(
        agent.agent_id,
        AgentStatus::Working,
        Some(task_id)
    ).await.expect("更新Agent状态失败");
    
    assert_eq!(updated_agent.status, AgentStatus::Working.to_string());
    assert_eq!(updated_agent.current_task_id, Some(task_id));
    
    // 再次更新状态为空闲
    let idle_agent = agent_repo.update_status(
        agent.agent_id,
        AgentStatus::Idle,
        None
    ).await.expect("更新Agent状态失败");
    
    assert_eq!(idle_agent.status, AgentStatus::Idle.to_string());
    assert_eq!(idle_agent.current_task_id, None);
}

#[tokio::test]
async fn test_agent_repository_statistics_updates() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户和Agent
    let user_data = CreateUserData {
        username: "testuser4".to_string(),
        email: "test4@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    let agent_data = CreateAgentData {
        user_id: user.user_id,
        name: "统计测试Agent".to_string(),
        description: None,
        prompt_template: "统计测试".to_string(),
        capabilities: json!(["Development"]),
        config: json!({}),
        git_config: None,
    };
    let agent = agent_repo.create(agent_data).await.expect("创建Agent失败");
    
    // 更新统计信息
    let stats = AgentStatistics {
        total_tasks_completed: Some(10),
        success_rate: Some(0.8),
        average_completion_time: Some(120),
    };
    
    let updated_agent = agent_repo.update_statistics(agent.agent_id, stats)
        .await.expect("更新Agent统计失败");
    
    assert_eq!(updated_agent.total_tasks_completed, 10);
    assert_eq!(updated_agent.success_rate, 0.8);
    assert_eq!(updated_agent.average_completion_time, 120);
}

#[tokio::test]
async fn test_agent_repository_config_updates() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户和Agent
    let user_data = CreateUserData {
        username: "testuser5".to_string(),
        email: "test5@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    let agent_data = CreateAgentData {
        user_id: user.user_id,
        name: "配置测试Agent".to_string(),
        description: None,
        prompt_template: "配置测试".to_string(),
        capabilities: json!(["Development"]),
        config: json!({"initial": true}),
        git_config: None,
    };
    let agent = agent_repo.create(agent_data).await.expect("创建Agent失败");
    
    // 更新配置
    let new_config = json!({
        "max_concurrent_tasks": 3,
        "timeout_minutes": 30,
        "quality_threshold": 0.9
    });
    
    let new_git_config = json!({
        "username": "updated-agent",
        "email": "updated@test.com",
        "auto_commit": true
    });
    
    let updated_agent = agent_repo.update_config(
        agent.agent_id,
        new_config.clone(),
        Some(new_git_config.clone())
    ).await.expect("更新Agent配置失败");
    
    assert_eq!(updated_agent.config, new_config);
    assert_eq!(updated_agent.git_config, Some(new_git_config));
}

#[tokio::test]
async fn test_agent_repository_best_match() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户
    let user_data = CreateUserData {
        username: "testuser6".to_string(),
        email: "test6@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    // 创建多个Agent，设置不同的成功率和完成时间
    let agents_data = vec![
        (CreateAgentData {
            user_id: user.user_id,
            name: "高效Agent".to_string(),
            description: None,
            prompt_template: "高效开发".to_string(),
            capabilities: json!(["FrontendDevelopment"]),
            config: json!({}),
            git_config: None,
        }, AgentStatistics {
            total_tasks_completed: Some(50),
            success_rate: Some(0.95),
            average_completion_time: Some(60),
        }),
        (CreateAgentData {
            user_id: user.user_id,
            name: "普通Agent".to_string(),
            description: None,
            prompt_template: "普通开发".to_string(),
            capabilities: json!(["FrontendDevelopment"]),
            config: json!({}),
            git_config: None,
        }, AgentStatistics {
            total_tasks_completed: Some(20),
            success_rate: Some(0.7),
            average_completion_time: Some(120),
        }),
    ];
    
    for (agent_data, stats) in agents_data {
        let agent = agent_repo.create(agent_data).await.expect("创建Agent失败");
        agent_repo.update_statistics(agent.agent_id, stats).await.expect("更新统计失败");
    }
    
    // 查找最佳匹配Agent
    let best_agent = agent_repo.find_best_match(
        &["FrontendDevelopment".to_string()],
        true
    ).await.expect("查找最佳匹配Agent失败");
    
    assert!(best_agent.is_some());
    let best_agent = best_agent.unwrap();
    assert_eq!(best_agent.name, "高效Agent"); // 应该选择成功率最高的
    assert_eq!(best_agent.success_rate, 0.95);
}

#[tokio::test]
async fn test_agent_repository_pagination() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户
    let user_data = CreateUserData {
        username: "testuser7".to_string(),
        email: "test7@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    // 创建多个Agent（超过分页大小）
    for i in 0..15 {
        let agent_data = CreateAgentData {
            user_id: user.user_id,
            name: format!("分页测试Agent{}", i),
            description: None,
            prompt_template: "分页测试".to_string(),
            capabilities: json!(["Testing"]),
            config: json!({}),
            git_config: None,
        };
        agent_repo.create(agent_data).await.expect("创建Agent失败");
    }
    
    // 测试分页查询
    let page_size = 10;
    let (first_page, total_pages) = agent_repo.find_with_pagination(0, page_size)
        .await.expect("分页查询失败");
    
    assert_eq!(first_page.len(), 10);
    assert_eq!(total_pages, 2); // 15个Agent，每页10个，共2页
    
    let (second_page, _) = agent_repo.find_with_pagination(1, page_size)
        .await.expect("分页查询失败");
    
    assert_eq!(second_page.len(), 5); // 第二页应该有5个
}

#[tokio::test]
async fn test_agent_repository_performance_stats() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户和Agent
    let user_data = CreateUserData {
        username: "testuser8".to_string(),
        email: "test8@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    let agent_data = CreateAgentData {
        user_id: user.user_id,
        name: "性能测试Agent".to_string(),
        description: None,
        prompt_template: "性能测试".to_string(),
        capabilities: json!(["Development"]),
        config: json!({}),
        git_config: None,
    };
    let agent = agent_repo.create(agent_data).await.expect("创建Agent失败");
    
    // 更新统计信息
    let stats = AgentStatistics {
        total_tasks_completed: Some(25),
        success_rate: Some(0.88),
        average_completion_time: Some(95),
    };
    agent_repo.update_statistics(agent.agent_id, stats).await.expect("更新统计失败");
    
    // 获取性能统计
    let performance = agent_repo.get_performance_stats(agent.agent_id)
        .await.expect("获取性能统计失败");
    
    assert_eq!(performance.agent_id, agent.agent_id);
    assert_eq!(performance.total_tasks_completed, 25);
    assert_eq!(performance.success_rate, 0.88);
    assert_eq!(performance.average_completion_time, 95);
    assert!(matches!(performance.current_status, AgentStatus::Idle));
}

#[tokio::test]
async fn test_agent_repository_delete() {
    let (agent_repo, user_repo, _db) = setup_test_repositories().await;
    
    // 创建测试用户和Agent
    let user_data = CreateUserData {
        username: "testuser9".to_string(),
        email: "test9@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = user_repo.create(user_data).await.expect("创建用户失败");
    
    let agent_data = CreateAgentData {
        user_id: user.user_id,
        name: "删除测试Agent".to_string(),
        description: None,
        prompt_template: "删除测试".to_string(),
        capabilities: json!(["Testing"]),
        config: json!({}),
        git_config: None,
    };
    let agent = agent_repo.create(agent_data).await.expect("创建Agent失败");
    
    // 确认Agent存在
    let found_agent = agent_repo.find_by_id(agent.agent_id).await.expect("查找Agent失败");
    assert!(found_agent.is_some());
    
    // 删除Agent
    agent_repo.delete(agent.agent_id).await.expect("删除Agent失败");
    
    // 确认Agent已删除
    let not_found = agent_repo.find_by_id(agent.agent_id).await.expect("查找Agent失败");
    assert!(not_found.is_none());
}