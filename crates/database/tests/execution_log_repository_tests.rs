//! 执行日志Repository测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{
        ExecutionLogRepository, ExecutionSessionRepository, UserRepository, 
        ProjectRepository, AgentRepository, TaskRepository,
        user_repository::CreateUserData,
        project_repository::CreateProjectData,
        agent_repository::CreateAgentData,
        task_repository::CreateTaskData,
        execution_session_repository::CreateSessionData,
        execution_log_repository::CreateExecutionLogData,
    },
    entities::execution_log::{LogLevel, EventType},
};
use serde_json::json;
use uuid::Uuid;

mod common;

/// 创建测试用户的辅助函数
async fn create_test_user(db: &codex_database::DatabaseConnection) -> Uuid {
    let repo = UserRepository::new(db.clone());
    let user_data = CreateUserData {
        username: format!("test_user_{}", &&Uuid::new_v4().to_string()[..8]),
        email: format!("test_{}@example.com", &&Uuid::new_v4().to_string()[..8]),
        password_hash: "password_hash".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = repo.create(user_data).await.unwrap();
    user.user_id
}

/// 创建测试项目的辅助函数
async fn create_test_project(db: &codex_database::DatabaseConnection, user_id: Uuid) -> Uuid {
    let project_repo = ProjectRepository::new(db.clone());
    let project_data = CreateProjectData {
        user_id,
        name: format!("test_project_{}", &Uuid::new_v4().to_string()[..8]),
        description: Some("测试项目描述".to_string()),
        repository_url: "https://github.com/test/repo.git".to_string(),
        workspace_path: "/workspace/test".to_string(),
    };
    let project = project_repo.create(project_data).await.unwrap();
    project.project_id
}

/// 创建测试Agent的辅助函数
async fn create_test_agent(db: &codex_database::DatabaseConnection, user_id: Uuid) -> Uuid {
    let agent_repo = AgentRepository::new(db.clone());
    let agent_data = CreateAgentData {
        user_id,
        name: format!("test_agent_{}", &Uuid::new_v4().to_string()[..8]),
        description: Some("测试Agent描述".to_string()),
        prompt_template: "你是一个测试Agent".to_string(),
        capabilities: json!(["Development", "Testing"]),
        config: json!({"max_concurrent_tasks": 1}),
        git_config: None,
    };
    let agent = agent_repo.create(agent_data).await.unwrap();
    agent.agent_id
}

/// 创建测试任务的辅助函数
async fn create_test_task(db: &codex_database::DatabaseConnection, project_id: Uuid) -> Uuid {
    let task_repo = TaskRepository::new(db.clone());
    let task_data = CreateTaskData {
        project_id,
        parent_task_id: None,
        llm_session_id: None,
        title: format!("test_task_{}", &Uuid::new_v4().to_string()[..8]),
        description: "测试任务描述".to_string(),
        task_type: "development".to_string(),
    };
    let task = task_repo.create(task_data).await.unwrap();
    task.task_id
}

/// 创建测试执行会话的辅助函数
async fn create_test_session(
    db: &codex_database::DatabaseConnection,
    task_id: Uuid,
    agent_id: Uuid,
    project_id: Uuid,
) -> Uuid {
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "test-branch".to_string(),
        base_commit: None,
        execution_config: None,
        timeout_minutes: 30,
    };
    let session = session_repo.create(session_data).await.unwrap();
    session.session_id
}

#[tokio::test]
async fn test_create_execution_log() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    let log_data = CreateExecutionLogData {
        session_id,
        log_level: LogLevel::Info.to_string(),
        event_type: EventType::GitOperation.to_string(),
        message: "开始Git操作".to_string(),
        details: Some(json!({
            "command": "git checkout -b feature/test",
            "working_dir": "/workspace/test"
        })),
        timestamp_ms: chrono::Utc::now().timestamp_millis(),
    };
    
    let log = log_repo.create(log_data).await.unwrap();
    
    assert_eq!(log.session_id, session_id);
    assert_eq!(log.log_level, LogLevel::Info.to_string());
    assert_eq!(log.event_type, EventType::GitOperation.to_string());
    assert_eq!(log.message, "开始Git操作");
    assert!(log.details.is_some());
}

#[tokio::test]
async fn test_find_log_by_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    let log_data = CreateExecutionLogData {
        session_id,
        log_level: LogLevel::Debug.to_string(),
        event_type: EventType::FileChange.to_string(),
        message: "文件已修改".to_string(),
        details: Some(json!({
            "file_path": "src/lib.rs",
            "change_type": "modified"
        })),
        timestamp_ms: chrono::Utc::now().timestamp_millis(),
    };
    
    let created_log = log_repo.create(log_data).await.unwrap();
    
    let found_log = log_repo
        .find_by_id(created_log.log_id)
        .await.unwrap()
        .unwrap();
    
    assert_eq!(found_log.log_id, created_log.log_id);
    assert_eq!(found_log.message, "文件已修改");
}

#[tokio::test]
async fn test_find_logs_by_session_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建多个日志
    let log_messages = vec![
        "开始执行任务",
        "下载依赖",
        "编译代码",
        "运行测试",
        "任务完成"
    ];
    
    for (i, message) in log_messages.iter().enumerate() {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Info.to_string(),
            event_type: match i {
                0 => EventType::GitOperation.to_string(),
                1 => EventType::DependencyInstall.to_string(),
                2 => EventType::Compilation.to_string(),
                3 => EventType::TestRun.to_string(),
                4 => EventType::GitOperation.to_string(),
                _ => EventType::GitOperation.to_string(),
            },
            message: message.to_string(),
            details: Some(json!({
                "step": i + 1,
                "total_steps": log_messages.len()
            })),
            timestamp_ms: chrono::Utc::now().timestamp_millis() + (i as i64 * 1000),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    let logs = log_repo.find_by_session_id(session_id).await.unwrap();
    
    assert_eq!(logs.len(), 5);
    for (i, log) in logs.iter().enumerate() {
        assert_eq!(log.session_id, session_id);
        assert_eq!(log.message, log_messages[i]);
    }
}

#[tokio::test]
async fn test_find_logs_by_log_level() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建不同级别的日志
    let log_levels = vec![
        (LogLevel::Debug, "调试信息"),
        (LogLevel::Info, "普通信息"),
        (LogLevel::Warn, "警告信息"),
        (LogLevel::Error, "错误信息"),
        (LogLevel::Info, "另一个普通信息"),
    ];
    
    for (level, message) in log_levels {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: level.to_string(),
            event_type: EventType::GitOperation.to_string(),
            message: message.to_string(),
            details: None,
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    // 查找Info级别的日志
    let info_logs = log_repo
        .find_by_log_level(&LogLevel::Info.to_string())
        .await.unwrap();
    
    assert_eq!(info_logs.len(), 2);
    for log in info_logs {
        assert_eq!(log.log_level, LogLevel::Info.to_string());
    }
    
    // 查找Error级别的日志
    let error_logs = log_repo
        .find_by_log_level(&LogLevel::Error.to_string())
        .await.unwrap();
    
    assert_eq!(error_logs.len(), 1);
    assert_eq!(error_logs[0].message, "错误信息");
}

#[tokio::test]
async fn test_find_logs_by_event_type() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建不同事件类型的日志
    let event_types = vec![
        (EventType::GitOperation, "Git克隆操作"),
        (EventType::FileChange, "修改配置文件"),
        (EventType::TestRun, "运行单元测试"),
        (EventType::Compilation, "编译源代码"),
        (EventType::GitOperation, "Git提交操作"),
    ];
    
    for (event_type, message) in event_types {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Info.to_string(),
            event_type: event_type.to_string(),
            message: message.to_string(),
            details: None,
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    // 查找Git操作的日志
    let git_logs = log_repo
        .find_by_event_type(&EventType::GitOperation.to_string())
        .await.unwrap();
    
    assert_eq!(git_logs.len(), 2);
    for log in git_logs {
        assert_eq!(log.event_type, EventType::GitOperation.to_string());
    }
    
    // 查找测试运行的日志
    let test_logs = log_repo
        .find_by_event_type(&EventType::TestRun.to_string())
        .await.unwrap();
    
    assert_eq!(test_logs.len(), 1);
    assert_eq!(test_logs[0].message, "运行单元测试");
}

#[tokio::test]
async fn test_create_batch_logs() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 批量创建日志
    let logs_data = vec![
        CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Info.to_string(),
            event_type: EventType::GitOperation.to_string(),
            message: "批量日志1".to_string(),
            details: Some(json!({"batch_id": 1})),
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
        },
        CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Debug.to_string(),
            event_type: EventType::FileChange.to_string(),
            message: "批量日志2".to_string(),
            details: Some(json!({"batch_id": 2})),
            timestamp_ms: chrono::Utc::now().timestamp_millis() + 1000,
        },
        CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Warn.to_string(),
            event_type: EventType::TestRun.to_string(),
            message: "批量日志3".to_string(),
            details: Some(json!({"batch_id": 3})),
            timestamp_ms: chrono::Utc::now().timestamp_millis() + 2000,
        },
    ];
    
    let created_logs = log_repo.create_batch(logs_data).await.unwrap();
    
    assert_eq!(created_logs.len(), 3);
    
    // 验证所有日志都属于同一个会话
    for log in &created_logs {
        assert_eq!(log.session_id, session_id);
    }
    
    // 验证日志内容
    assert_eq!(created_logs[0].message, "批量日志1");
    assert_eq!(created_logs[1].message, "批量日志2");
    assert_eq!(created_logs[2].message, "批量日志3");
}

#[tokio::test]
async fn test_log_pagination() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建20条日志
    for i in 0..20 {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Info.to_string(),
            event_type: EventType::GitOperation.to_string(),
            message: format!("分页日志 {}", i + 1),
            details: Some(json!({"index": i})),
            timestamp_ms: chrono::Utc::now().timestamp_millis() + (i as i64 * 100),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    // 测试分页查询
    let (logs_page1, total_pages) = log_repo
        .find_logs_with_pagination(session_id, 0, 5)
        .await.unwrap();
    
    assert_eq!(logs_page1.len(), 5);
    assert_eq!(total_pages, 4); // 20条记录，每页5条，共4页
    
    // 验证第一页的日志（按时间戳排序）
    for (i, log) in logs_page1.iter().enumerate() {
        assert_eq!(log.message, format!("分页日志 {}", i + 1));
    }
    
    // 测试第二页
    let (logs_page2, _) = log_repo
        .find_logs_with_pagination(session_id, 1, 5)
        .await.unwrap();
    
    assert_eq!(logs_page2.len(), 5);
    for (i, log) in logs_page2.iter().enumerate() {
        assert_eq!(log.message, format!("分页日志 {}", i + 6));
    }
}

#[tokio::test]
async fn test_log_filtering() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建具有不同级别和事件类型的日志
    let test_logs = vec![
        (LogLevel::Info, EventType::GitOperation, "Git操作日志"),
        (LogLevel::Error, EventType::Compilation, "编译错误日志"),
        (LogLevel::Debug, EventType::FileChange, "文件变更日志"),
        (LogLevel::Warn, EventType::TestRun, "测试警告日志"),
        (LogLevel::Info, EventType::TestRun, "测试信息日志"),
    ];
    
    for (level, event_type, message) in test_logs {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: level.to_string(),
            event_type: event_type.to_string(),
            message: message.to_string(),
            details: None,
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    // 测试按时间范围过滤
    let now = chrono::Utc::now();
    let one_hour_ago = now - chrono::Duration::hours(1);
    let one_hour_later = now + chrono::Duration::hours(1);
    
    let logs_in_range = log_repo.find_logs_by_time_range(
        session_id,
        one_hour_ago.timestamp_millis(),
        one_hour_later.timestamp_millis(),
    ).await.unwrap();
    
    assert_eq!(logs_in_range.len(), 5); // 所有日志都在时间范围内
    
    // 测试多条件组合过滤
    let filtered_logs = log_repo.find_logs_with_filters(
        session_id,
        Some(LogLevel::Info.to_string()),
        Some(EventType::TestRun.to_string()),
        None,
        None,
    ).await.unwrap();
    
    assert_eq!(filtered_logs.len(), 1);
    assert_eq!(filtered_logs[0].message, "测试信息日志");
}

#[tokio::test]
async fn test_delete_log() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    let log_data = CreateExecutionLogData {
        session_id,
        log_level: LogLevel::Info.to_string(),
        event_type: EventType::GitOperation.to_string(),
        message: "待删除的日志".to_string(),
        details: None,
        timestamp_ms: chrono::Utc::now().timestamp_millis(),
    };
    
    let log = log_repo.create(log_data).await.unwrap();
    
    // 验证日志存在
    let found_log = log_repo.find_by_id(log.log_id).await.unwrap();
    assert!(found_log.is_some());
    
    // 删除日志
    log_repo.delete(log.log_id).await.unwrap();
    
    // 验证日志已删除
    let found_log = log_repo.find_by_id(log.log_id).await.unwrap();
    assert!(found_log.is_none());
}

#[tokio::test]
async fn test_delete_logs_by_session_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建多个日志
    for i in 0..5 {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: LogLevel::Info.to_string(),
            event_type: EventType::GitOperation.to_string(),
            message: format!("日志 {}", i + 1),
            details: None,
            timestamp_ms: chrono::Utc::now().timestamp_millis() + (i as i64 * 100),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    // 验证日志存在
    let logs_before = log_repo.find_by_session_id(session_id).await.unwrap();
    assert_eq!(logs_before.len(), 5);
    
    // 按会话ID删除所有日志
    log_repo.delete_by_session_id(session_id).await.unwrap();
    
    // 验证所有日志已删除
    let logs_after = log_repo.find_by_session_id(session_id).await.unwrap();
    assert_eq!(logs_after.len(), 0);
}

#[tokio::test]
async fn test_log_statistics() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建不同级别的日志
    let log_levels = vec![
        LogLevel::Debug,
        LogLevel::Info,
        LogLevel::Info,
        LogLevel::Warn,
        LogLevel::Error,
        LogLevel::Error,
        LogLevel::Error,
    ];
    
    for level in log_levels {
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: level.to_string(),
            event_type: EventType::GitOperation.to_string(),
            message: format!("{}级别日志", level),
            details: None,
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
        };
        log_repo.create(log_data).await.unwrap();
    }
    
    // 获取日志统计
    let stats = log_repo.get_log_statistics(session_id).await.unwrap();
    
    assert_eq!(stats.total_logs, 7);
    assert_eq!(stats.debug_count, 1);
    assert_eq!(stats.info_count, 2);
    assert_eq!(stats.warn_count, 1);
    assert_eq!(stats.error_count, 3);
    
    // 验证错误率
    let expected_error_rate = 3.0 / 7.0;
    assert!((stats.error_rate - expected_error_rate).abs() < 0.001);
}

#[tokio::test]
async fn test_complex_log_details() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    let session_id = create_test_session(&db, task_id, agent_id, project_id).await;
    
    let log_repo = ExecutionLogRepository::new(db.clone());
    
    // 创建包含复杂详情的日志
    let complex_details = json!({
        "git_operation": {
            "command": "git commit -m 'feat: add new feature'",
            "working_directory": "/workspace/project",
            "files_changed": [
                {"path": "src/main.rs", "lines_added": 25, "lines_removed": 3},
                {"path": "tests/integration_test.rs", "lines_added": 15, "lines_removed": 0}
            ],
            "commit_hash": "a1b2c3d4e5f6",
            "author": {
                "name": "Test Agent",
                "email": "agent@example.com"
            }
        },
        "performance": {
            "duration_ms": 1250,
            "memory_usage_mb": 45.6,
            "cpu_usage_percent": 15.2
        },
        "environment": {
            "rust_version": "1.70.0",
            "os": "Linux",
            "architecture": "x86_64"
        }
    });
    
    let log_data = CreateExecutionLogData {
        session_id,
        log_level: LogLevel::Info.to_string(),
        event_type: EventType::GitOperation.to_string(),
        message: "复杂Git提交操作完成".to_string(),
        details: Some(complex_details.clone()),
        timestamp_ms: chrono::Utc::now().timestamp_millis(),
    };
    
    let log = log_repo.create(log_data).await.unwrap();
    
    assert_eq!(log.details, Some(complex_details));
    assert_eq!(log.message, "复杂Git提交操作完成");
    
    // 验证可以通过详情内容查找日志
    let logs_with_git_operation = log_repo.find_logs_by_details_content(
        session_id,
        "commit_hash",
        "a1b2c3d4e5f6",
    ).await.unwrap();
    
    assert_eq!(logs_with_git_operation.len(), 1);
    assert_eq!(logs_with_git_operation[0].log_id, log.log_id);
}