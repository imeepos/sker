//! 执行会话Repository测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{
        ExecutionSessionRepository, UserRepository, ProjectRepository, 
        AgentRepository, TaskRepository,
        user_repository::CreateUserData,
        project_repository::CreateProjectData,
        agent_repository::CreateAgentData,
        task_repository::CreateTaskData,
        execution_session_repository::{CreateSessionData, SessionFilter},
    },
    entities::execution_session::ExecutionStatus,
};
use serde_json::json;
use uuid::Uuid;

mod common;

/// 创建测试用户的辅助函数
async fn create_test_user(db: &codex_database::DatabaseConnection) -> Uuid {
    let repo = UserRepository::new(db.clone());
    let user_data = CreateUserData {
        username: format!("test_user_{}", &Uuid::new_v4().to_string()[..8]),
        email: format!("test_{}@example.com", &Uuid::new_v4().to_string()[..8]),
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

#[tokio::test]
async fn test_create_execution_session() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "feature/test-branch".to_string(),
        base_commit: Some("abc123".to_string()),
        execution_config: Some(json!({
            "environment": "test",
            "timeout_enabled": true
        })),
        timeout_minutes: 60,
    };
    
    let session = session_repo.create(session_data).await.unwrap();
    
    assert_eq!(session.task_id, task_id);
    assert_eq!(session.agent_id, agent_id);
    assert_eq!(session.project_id, project_id);
    assert_eq!(session.git_branch, "feature/test-branch");
    assert_eq!(session.base_commit, Some("abc123".to_string()));
    assert_eq!(session.status, ExecutionStatus::Pending.to_string());
    assert_eq!(session.timeout_minutes, 60);
    assert!(session.execution_config.is_some());
}

#[tokio::test]
async fn test_find_session_by_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "main".to_string(),
        base_commit: None,
        execution_config: None,
        timeout_minutes: 30,
    };
    
    let created_session = session_repo.create(session_data).await.unwrap();
    
    let found_session = session_repo
        .find_by_id(created_session.session_id)
        .await.unwrap()
        .unwrap();
    
    assert_eq!(found_session.session_id, created_session.session_id);
    assert_eq!(found_session.task_id, task_id);
}

#[tokio::test]
async fn test_find_sessions_by_task_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建多个会话
    for i in 0..3 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 30,
        };
        session_repo.create(session_data).await.unwrap();
    }
    
    let sessions = session_repo.find_by_task_id(task_id).await.unwrap();
    
    assert_eq!(sessions.len(), 3);
    for session in sessions {
        assert_eq!(session.task_id, task_id);
    }
}

#[tokio::test]
async fn test_find_sessions_by_agent_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建多个会话
    for i in 0..2 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("agent-branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 45,
        };
        session_repo.create(session_data).await.unwrap();
    }
    
    let sessions = session_repo.find_by_agent_id(agent_id).await.unwrap();
    
    assert_eq!(sessions.len(), 2);
    for session in sessions {
        assert_eq!(session.agent_id, agent_id);
    }
}

#[tokio::test]
async fn test_find_sessions_by_project_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建多个会话
    for i in 0..4 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("project-branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 30,
        };
        session_repo.create(session_data).await.unwrap();
    }
    
    let sessions = session_repo.find_by_project_id(project_id).await.unwrap();
    
    assert_eq!(sessions.len(), 4);
    for session in sessions {
        assert_eq!(session.project_id, project_id);
    }
}

#[tokio::test]
async fn test_session_status_operations() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "feature/status-test".to_string(),
        base_commit: Some("def456".to_string()),
        execution_config: None,
        timeout_minutes: 60,
    };
    
    let session = session_repo.create(session_data).await.unwrap();
    
    // 测试启动会话
    let running_session = session_repo
        .start_session(session.session_id)
        .await.unwrap();
    
    assert_eq!(running_session.status, ExecutionStatus::Running.to_string());
    assert!(running_session.started_at.is_some());
    
    // 测试完成会话
    let result_data = json!({
        "files_changed": 3,
        "tests_passed": 15,
        "build_success": true
    });
    
    let completed_session = session_repo.complete_session(
        session.session_id,
        true,
        Some("ghi789".to_string()),
        Some(result_data.clone()),
        None,
    ).await.unwrap();
    
    assert_eq!(completed_session.status, ExecutionStatus::Completed.to_string());
    assert_eq!(completed_session.success, Some(true));
    assert_eq!(completed_session.final_commit, Some("ghi789".to_string()));
    assert_eq!(completed_session.result_data, Some(result_data));
    assert!(completed_session.completed_at.is_some());
}

#[tokio::test]
async fn test_session_failure() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "feature/failure-test".to_string(),
        base_commit: None,
        execution_config: None,
        timeout_minutes: 30,
    };
    
    let session = session_repo.create(session_data).await.unwrap();
    
    // 启动会话
    let running_session = session_repo
        .start_session(session.session_id)
        .await.unwrap();
    
    // 测试失败完成
    let error_message = "编译错误：缺少依赖".to_string();
    let failed_session = session_repo.complete_session(
        session.session_id,
        false,
        None,
        None,
        Some(error_message.clone()),
    ).await.unwrap();
    
    assert_eq!(failed_session.status, ExecutionStatus::Failed.to_string());
    assert_eq!(failed_session.success, Some(false));
    assert_eq!(failed_session.error_message, Some(error_message));
    assert_eq!(failed_session.final_commit, None);
}

#[tokio::test]
async fn test_session_timeout() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "feature/timeout-test".to_string(),
        base_commit: None,
        execution_config: None,
        timeout_minutes: 15,
    };
    
    let session = session_repo.create(session_data).await.unwrap();
    
    // 启动会话
    let _running_session = session_repo
        .start_session(session.session_id)
        .await.unwrap();
    
    // 测试超时
    let timeout_message = "执行超时：超过15分钟限制".to_string();
    let timeout_session = session_repo
        .timeout_session(session.session_id, timeout_message.clone())
        .await.unwrap();
    
    assert_eq!(timeout_session.status, ExecutionStatus::Timeout.to_string());
    assert_eq!(timeout_session.success, Some(false));
    assert_eq!(timeout_session.error_message, Some(timeout_message));
    assert!(timeout_session.completed_at.is_some());
}

#[tokio::test]
async fn test_find_by_status() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建不同状态的会话
    let mut sessions = Vec::new();
    for i in 0..3 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("status-branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 30,
        };
        let session = session_repo.create(session_data).await.unwrap();
        sessions.push(session);
    }
    
    // 启动第一个会话
    session_repo.start_session(sessions[0].session_id).await.unwrap();
    
    // 完成第二个会话（先启动）
    session_repo.start_session(sessions[1].session_id).await.unwrap();
    session_repo.complete_session(
        sessions[1].session_id,
        true,
        None,
        None,
        None,
    ).await.unwrap();
    
    // 测试查找不同状态的会话
    let pending_sessions = session_repo.find_pending_sessions().await.unwrap();
    assert_eq!(pending_sessions.len(), 1);
    assert_eq!(pending_sessions[0].session_id, sessions[2].session_id);
    
    let running_sessions = session_repo.find_running_sessions().await.unwrap();
    assert_eq!(running_sessions.len(), 1);
    assert_eq!(running_sessions[0].session_id, sessions[0].session_id);
    
    let completed_sessions = session_repo
        .find_by_status(ExecutionStatus::Completed)
        .await.unwrap();
    assert_eq!(completed_sessions.len(), 1);
    assert_eq!(completed_sessions[0].session_id, sessions[1].session_id);
}

#[tokio::test]
async fn test_session_pagination() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建多个会话
    for i in 0..10 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("pagination-branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 30,
        };
        session_repo.create(session_data).await.unwrap();
    }
    
    // 测试分页查询
    let (sessions_page1, total_pages) = session_repo
        .find_with_pagination(0, 3, None)
        .await.unwrap();
    
    assert_eq!(sessions_page1.len(), 3);
    assert!(total_pages >= 4); // 至少4页（10个会话，每页3个）
    
    let (sessions_page2, _) = session_repo
        .find_with_pagination(1, 3, None)
        .await.unwrap();
    
    assert_eq!(sessions_page2.len(), 3);
    
    // 验证不同页的会话不重复
    let page1_ids: Vec<_> = sessions_page1.iter().map(|s| s.session_id).collect();
    let page2_ids: Vec<_> = sessions_page2.iter().map(|s| s.session_id).collect();
    
    for id in &page1_ids {
        assert!(!page2_ids.contains(id));
    }
}

#[tokio::test]
async fn test_session_pagination_with_filter() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建多个会话
    let mut sessions = Vec::new();
    for i in 0..5 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("filter-branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 30,
        };
        let session = session_repo.create(session_data).await.unwrap();
        sessions.push(session);
    }
    
    // 启动前3个会话
    for i in 0..3 {
        session_repo.start_session(sessions[i].session_id).await.unwrap();
    }
    
    // 测试状态过滤
    let filter = SessionFilter {
        project_id: Some(project_id),
        agent_id: None,
        status: Some(ExecutionStatus::Running),
    };
    
    let (filtered_sessions, _) = session_repo
        .find_with_pagination(0, 10, Some(filter))
        .await.unwrap();
    
    assert_eq!(filtered_sessions.len(), 3);
    for session in filtered_sessions {
        assert_eq!(session.status, ExecutionStatus::Running.to_string());
        assert_eq!(session.project_id, project_id);
    }
}

#[tokio::test]
async fn test_session_statistics() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    
    // 创建多个会话并模拟不同的结果
    let mut sessions = Vec::new();
    for i in 0..5 {
        let session_data = CreateSessionData {
            task_id,
            agent_id,
            project_id,
            git_branch: format!("stats-branch-{}", i),
            base_commit: None,
            execution_config: None,
            timeout_minutes: 30,
        };
        let session = session_repo.create(session_data).await.unwrap();
        sessions.push(session);
    }
    
    // 完成前3个会话：2个成功，1个失败
    for i in 0..3 {
        session_repo.start_session(sessions[i].session_id).await.unwrap();
        session_repo.complete_session(
            sessions[i].session_id,
            i < 2, // 前2个成功，第3个失败
            None,
            None,
            if i < 2 { None } else { Some("测试失败".to_string()) },
        ).await.unwrap();
    }
    
    // 第4个会话超时
    session_repo.start_session(sessions[3].session_id).await.unwrap();
    session_repo.timeout_session(
        sessions[3].session_id,
        "超时".to_string(),
    ).await.unwrap();
    
    // 第5个保持pending状态
    
    // 获取统计信息
    let stats = session_repo
        .get_session_statistics(Some(project_id))
        .await.unwrap();
    
    assert_eq!(stats.total_sessions, 5);
    assert_eq!(stats.completed_sessions, 2);
    assert_eq!(stats.failed_sessions, 1);
    assert_eq!(stats.timeout_sessions, 1);
    assert_eq!(stats.success_rate, 0.4); // 2/5 = 0.4
}

#[tokio::test]
async fn test_delete_session() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "feature/delete-test".to_string(),
        base_commit: None,
        execution_config: None,
        timeout_minutes: 30,
    };
    
    let session = session_repo.create(session_data).await.unwrap();
    
    // 验证会话存在
    let found_session = session_repo
        .find_by_id(session.session_id)
        .await.unwrap();
    assert!(found_session.is_some());
    
    // 删除会话
    session_repo.delete(session.session_id).await.unwrap();
    
    // 验证会话已删除
    let found_session = session_repo
        .find_by_id(session.session_id)
        .await.unwrap();
    assert!(found_session.is_none());
}

#[tokio::test]
async fn test_execution_duration() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;
    let agent_id = create_test_agent(&db, user_id).await;
    let task_id = create_test_task(&db, project_id).await;
    
    let session_repo = ExecutionSessionRepository::new(db.clone());
    let session_data = CreateSessionData {
        task_id,
        agent_id,
        project_id,
        git_branch: "feature/duration-test".to_string(),
        base_commit: None,
        execution_config: None,
        timeout_minutes: 30,
    };
    
    let session = session_repo.create(session_data).await.unwrap();
    
    // 未启动的会话应该没有执行时长
    let duration = session_repo
        .get_execution_duration(session.session_id)
        .await.unwrap();
    assert!(duration.is_none());
    
    // 启动会话
    session_repo.start_session(session.session_id).await.unwrap();
    
    // 模拟一些执行时间
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // 完成会话
    session_repo.complete_session(
        session.session_id,
        true,
        None,
        None,
        None,
    ).await.unwrap();
    
    // 现在应该有执行时长
    let duration = session_repo
        .get_execution_duration(session.session_id)
        .await.unwrap();
    assert!(duration.is_some());
    assert!(duration.unwrap().num_milliseconds() >= 100);
}