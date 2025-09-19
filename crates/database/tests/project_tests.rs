//! 项目管理域集成测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{ProjectRepository, RequirementDocumentRepository, UserRepository},
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

#[tokio::test]
async fn test_create_project() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "测试项目".to_string(),
        Some("这是一个测试项目".to_string()),
        "https://github.com/test/repo.git".to_string(),
        "/workspace/test".to_string(),
    )
    .await
    .expect("创建项目应该成功");

    assert_eq!(project.name, "测试项目");
    assert_eq!(project.description, Some("这是一个测试项目".to_string()));
    assert_eq!(project.repository_url, "https://github.com/test/repo.git");
    assert_eq!(project.status, "active");
    assert_eq!(project.main_branch, "main");
}

#[tokio::test]
async fn test_find_project_by_id() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let created_project = ProjectRepository::create(
        &db,
        user_id,
        "查找测试项目".to_string(),
        None,
        "https://github.com/test/find.git".to_string(),
        "/workspace/find".to_string(),
    )
    .await
    .unwrap();

    let found_project = ProjectRepository::find_by_id(&db, created_project.project_id)
        .await
        .unwrap()
        .expect("应该找到项目");

    assert_eq!(found_project.project_id, created_project.project_id);
    assert_eq!(found_project.name, "查找测试项目");
}

#[tokio::test]
async fn test_find_projects_by_user() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    
    // 创建两个项目
    let _project1 = ProjectRepository::create(
        &db,
        user_id,
        "用户项目1".to_string(),
        None,
        "https://github.com/test/proj1.git".to_string(),
        "/workspace/proj1".to_string(),
    )
    .await
    .unwrap();

    let _project2 = ProjectRepository::create(
        &db,
        user_id,
        "用户项目2".to_string(),
        None,
        "https://github.com/test/proj2.git".to_string(),
        "/workspace/proj2".to_string(),
    )
    .await
    .unwrap();

    let projects = ProjectRepository::find_by_user(&db, user_id)
        .await
        .unwrap();

    assert_eq!(projects.len(), 2);
    assert!(projects.iter().any(|p| p.name == "用户项目1"));
    assert!(projects.iter().any(|p| p.name == "用户项目2"));
}

#[tokio::test]
async fn test_update_project_config() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "配置测试项目".to_string(),
        None,
        "https://github.com/test/config.git".to_string(),
        "/workspace/config".to_string(),
    )
    .await
    .unwrap();

    let tech_stack = json!(["rust", "typescript", "sqlite"]);
    let coding_standards = json!({
        "indent": "spaces",
        "max_line_length": 100
    });

    let updated_project = ProjectRepository::update_config(
        &db,
        project.project_id,
        Some(tech_stack.clone()),
        Some(coding_standards.clone()),
        None,
    )
    .await
    .unwrap();

    assert_eq!(updated_project.technology_stack, Some(tech_stack));
    assert_eq!(updated_project.coding_standards, Some(coding_standards));
}

#[tokio::test]
async fn test_update_project_status() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "状态测试项目".to_string(),
        None,
        "https://github.com/test/status.git".to_string(),
        "/workspace/status".to_string(),
    )
    .await
    .unwrap();

    let updated_project = ProjectRepository::update_status(&db, project.project_id, "paused")
        .await
        .unwrap();

    assert_eq!(updated_project.status, "paused");
}

#[tokio::test]
async fn test_delete_project() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "删除测试项目".to_string(),
        None,
        "https://github.com/test/delete.git".to_string(),
        "/workspace/delete".to_string(),
    )
    .await
    .unwrap();

    ProjectRepository::delete(&db, project.project_id)
        .await
        .unwrap();

    let found_project = ProjectRepository::find_by_id(&db, project.project_id)
        .await
        .unwrap();

    assert!(found_project.is_none());
}

#[tokio::test]
async fn test_create_requirement_document() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "需求文档测试项目".to_string(),
        None,
        "https://github.com/test/docs.git".to_string(),
        "/workspace/docs".to_string(),
    )
    .await
    .unwrap();

    let document = RequirementDocumentRepository::create(
        &db,
        project.project_id,
        "用户登录需求".to_string(),
        "用户应该能够通过邮箱和密码登录系统".to_string(),
        "user_story".to_string(),
    )
    .await
    .unwrap();

    assert_eq!(document.title, "用户登录需求");
    assert_eq!(document.document_type, "user_story");
    assert_eq!(document.priority, "medium");
    assert!(!document.llm_processed);
}

#[tokio::test]
async fn test_find_documents_by_project() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "文档查找测试".to_string(),
        None,
        "https://github.com/test/find-docs.git".to_string(),
        "/workspace/find-docs".to_string(),
    )
    .await
    .unwrap();

    // 创建多个文档
    let _doc1 = RequirementDocumentRepository::create(
        &db,
        project.project_id,
        "需求1".to_string(),
        "需求1内容".to_string(),
        "user_story".to_string(),
    )
    .await
    .unwrap();

    let _doc2 = RequirementDocumentRepository::create(
        &db,
        project.project_id,
        "需求2".to_string(),
        "需求2内容".to_string(),
        "technical_spec".to_string(),
    )
    .await
    .unwrap();

    let documents = RequirementDocumentRepository::find_by_project(&db, project.project_id)
        .await
        .unwrap();

    assert_eq!(documents.len(), 2);
    assert!(documents.iter().any(|d| d.title == "需求1"));
    assert!(documents.iter().any(|d| d.title == "需求2"));
}

#[tokio::test]
async fn test_update_document_llm_processing() {
    let db = setup_test_db().await;

    let user_id = create_test_user(&db).await;
    let project = ProjectRepository::create(
        &db,
        user_id,
        "LLM处理测试".to_string(),
        None,
        "https://github.com/test/llm.git".to_string(),
        "/workspace/llm".to_string(),
    )
    .await
    .unwrap();

    let document = RequirementDocumentRepository::create(
        &db,
        project.project_id,
        "待处理需求".to_string(),
        "这个需求需要LLM处理".to_string(),
        "user_story".to_string(),
    )
    .await
    .unwrap();

    let structured_content = json!({
        "actors": ["用户", "系统"],
        "actions": ["登录", "验证"],
        "acceptance_criteria": ["用户能成功登录", "错误提示清晰"]
    });

    let session_id = Uuid::new_v4();
    let updated_document = RequirementDocumentRepository::update_llm_processing(
        &db,
        document.document_id,
        structured_content.to_string(),
        session_id,
    )
    .await
    .unwrap();

    assert!(updated_document.llm_processed);
    assert!(updated_document.structured_content.is_some());
    assert_eq!(updated_document.processing_session_id, Some(session_id));
    assert!(updated_document.processed_at.is_some());
}