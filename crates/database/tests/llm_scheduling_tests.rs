//! LLM调度域集成测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{LlmSessionRepository, LlmConversationRepository, TaskRepository, UserRepository, ProjectRepository},
    repository::user_repository::CreateUserData,
};
use serde_json::json;
use uuid::Uuid;

mod common;

/// 创建测试用户的辅助函数
async fn create_test_user(db: &codex_database::DatabaseConnection) -> uuid::Uuid {
    let repo = UserRepository::new(db.clone());
    let user_data = CreateUserData {
        username: format!("test_user_{}", Uuid::new_v4().to_string()[..8].to_string()),
        email: format!("test_{}@example.com", Uuid::new_v4().to_string()[..8].to_string()),
        password_hash: "password_hash".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = repo.create(user_data).await.unwrap();
    user.user_id
}

/// 创建测试项目的辅助函数
async fn create_test_project(db: &codex_database::DatabaseConnection, user_id: Uuid) -> uuid::Uuid {
    let project = ProjectRepository::create(
        db,
        user_id,
        format!("test_project_{}", Uuid::new_v4().to_string()[..8].to_string()),
        Some("测试项目描述".to_string()),
        "https://github.com/test/repo.git".to_string(),
        "/workspace/test".to_string(),
    )
    .await
    .unwrap();
    project.project_id
}

#[tokio::test]
async fn test_create_llm_session() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let session = LlmSessionRepository::create(
        &db,
        project_id,
        user_id,
        "requirement_decomposition".to_string(),
        Some("你是一个需求分析专家".to_string()),
        Some("请分解以下需求".to_string()),
    )
    .await
    .expect("创建LLM会话应该成功");

    assert_eq!(session.project_id, project_id);
    assert_eq!(session.user_id, user_id);
    assert_eq!(session.session_type, "requirement_decomposition");
    assert_eq!(session.status, "active");
    assert!(session.system_prompt.is_some());
    assert!(session.decomposition_prompt.is_some());
}

#[tokio::test]
async fn test_find_session_by_project() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let _session1 = LlmSessionRepository::create(
        &db,
        project_id,
        user_id,
        "requirement_decomposition".to_string(),
        None,
        None,
    )
    .await
    .unwrap();

    let _session2 = LlmSessionRepository::create(
        &db,
        project_id,
        user_id,
        "task_allocation".to_string(),
        None,
        None,
    )
    .await
    .unwrap();

    let sessions = LlmSessionRepository::find_by_project(&db, project_id)
        .await
        .unwrap();

    assert_eq!(sessions.len(), 2);
    assert!(sessions.iter().any(|s| s.session_type == "requirement_decomposition"));
    assert!(sessions.iter().any(|s| s.session_type == "task_allocation"));
}

#[tokio::test]
async fn test_update_session_result() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let session = LlmSessionRepository::create(
        &db,
        project_id,
        user_id,
        "requirement_decomposition".to_string(),
        None,
        None,
    )
    .await
    .unwrap();

    let result_data = json!({
        "tasks": [
            {"title": "用户登录", "type": "development"},
            {"title": "数据验证", "type": "testing"}
        ]
    });

    let updated_session = LlmSessionRepository::update_result(
        &db,
        session.session_id,
        result_data.clone(),
        "completed".to_string(),
    )
    .await
    .unwrap();

    assert_eq!(updated_session.status, "completed");
    assert_eq!(updated_session.result_data, Some(result_data));
    assert!(updated_session.completed_at.is_some());
}

#[tokio::test]
async fn test_create_conversation_message() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let session = LlmSessionRepository::create(
        &db,
        project_id,
        user_id,
        "requirement_decomposition".to_string(),
        None,
        None,
    )
    .await
    .unwrap();

    let message = LlmConversationRepository::create_message(
        &db,
        session.session_id,
        "user".to_string(),
        "请帮我分解这个需求".to_string(),
        1,
    )
    .await
    .unwrap();

    assert_eq!(message.session_id, session.session_id);
    assert_eq!(message.role, "user");
    assert_eq!(message.content, "请帮我分解这个需求");
    assert_eq!(message.message_order, 1);
}

#[tokio::test]
async fn test_find_conversation_by_session() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let session = LlmSessionRepository::create(
        &db,
        project_id,
        user_id,
        "requirement_decomposition".to_string(),
        None,
        None,
    )
    .await
    .unwrap();

    // 创建对话消息
    let _msg1 = LlmConversationRepository::create_message(
        &db,
        session.session_id,
        "user".to_string(),
        "用户消息".to_string(),
        1,
    )
    .await
    .unwrap();

    let _msg2 = LlmConversationRepository::create_message(
        &db,
        session.session_id,
        "assistant".to_string(),
        "助手回复".to_string(),
        2,
    )
    .await
    .unwrap();

    let messages = LlmConversationRepository::find_by_session(&db, session.session_id)
        .await
        .unwrap();

    assert_eq!(messages.len(), 2);
    assert_eq!(messages[0].message_order, 1);
    assert_eq!(messages[1].message_order, 2);
}

#[tokio::test]
async fn test_create_task() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let task = TaskRepository::create(
        &db,
        project_id,
        None,
        None,
        "实现用户登录功能".to_string(),
        "用户应该能够使用邮箱和密码登录".to_string(),
        "development".to_string(),
    )
    .await
    .expect("创建任务应该成功");

    assert_eq!(task.project_id, project_id);
    assert_eq!(task.title, "实现用户登录功能");
    assert_eq!(task.task_type, "development");
    assert_eq!(task.priority, "medium");
    assert_eq!(task.status, "pending");
    assert!(task.parent_task_id.is_none());
}

#[tokio::test]
async fn test_create_subtask() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    // 创建父任务
    let parent_task = TaskRepository::create(
        &db,
        project_id,
        None,
        None,
        "用户管理模块".to_string(),
        "实现完整的用户管理功能".to_string(),
        "development".to_string(),
    )
    .await
    .unwrap();

    // 创建子任务
    let subtask = TaskRepository::create(
        &db,
        project_id,
        Some(parent_task.task_id),
        None,
        "用户登录".to_string(),
        "实现用户登录功能".to_string(),
        "development".to_string(),
    )
    .await
    .unwrap();

    assert_eq!(subtask.parent_task_id, Some(parent_task.task_id));
    assert_eq!(subtask.project_id, project_id);
}

#[tokio::test]
async fn test_find_tasks_by_project() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    // 创建多个任务
    let _task1 = TaskRepository::create(
        &db,
        project_id,
        None,
        None,
        "任务1".to_string(),
        "任务1描述".to_string(),
        "development".to_string(),
    )
    .await
    .unwrap();

    let _task2 = TaskRepository::create(
        &db,
        project_id,
        None,
        None,
        "任务2".to_string(),
        "任务2描述".to_string(),
        "testing".to_string(),
    )
    .await
    .unwrap();

    let tasks = TaskRepository::find_by_project(&db, project_id)
        .await
        .unwrap();

    assert_eq!(tasks.len(), 2);
    assert!(tasks.iter().any(|t| t.title == "任务1"));
    assert!(tasks.iter().any(|t| t.title == "任务2"));
}

#[tokio::test]
async fn test_update_task_status() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let task = TaskRepository::create(
        &db,
        project_id,
        None,
        None,
        "测试任务".to_string(),
        "任务描述".to_string(),
        "development".to_string(),
    )
    .await
    .unwrap();

    let updated_task = TaskRepository::update_status(&db, task.task_id, "in_progress")
        .await
        .unwrap();

    assert_eq!(updated_task.status, "in_progress");
}

#[tokio::test]
async fn test_assign_task() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project_id = create_test_project(&db, user_id).await;

    let task = TaskRepository::create(
        &db,
        project_id,
        None,
        None,
        "分配任务".to_string(),
        "任务描述".to_string(),
        "development".to_string(),
    )
    .await
    .unwrap();

    let agent_id = Uuid::new_v4();
    let assignment_prompt = "请实现这个功能".to_string();

    let updated_task = TaskRepository::assign_to_agent(
        &db,
        task.task_id,
        agent_id,
        assignment_prompt.clone(),
    )
    .await
    .unwrap();

    assert_eq!(updated_task.assigned_agent_id, Some(agent_id));
    assert_eq!(updated_task.assignment_prompt, Some(assignment_prompt));
    assert!(updated_task.assigned_at.is_some());
}