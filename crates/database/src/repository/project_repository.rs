//! 项目仓储实现

use crate::{entities::project, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 项目仓储
pub struct ProjectRepository {
    db: DatabaseConnection,
}

impl ProjectRepository {
    /// 创建新的项目仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新项目
    pub async fn create(
        &self,
        user_id: Uuid,
        name: String,
        description: Option<String>,
        repository_url: String,
        workspace_path: String,
    ) -> Result<project::Model> {
        let now = chrono::Utc::now().into();
        let project_id = Uuid::new_v4();
        
        let project = project::ActiveModel {
            project_id: Set(project_id),
            user_id: Set(user_id),
            name: Set(name),
            description: Set(description),
            repository_url: Set(repository_url),
            main_branch: Set("main".to_string()),
            workspace_path: Set(workspace_path),
            status: Set("active".to_string()),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };
        
        let _result = project::Entity::insert(project).exec(&self.db).await?;
        
        // 获取插入的项目
        project::Entity::find_by_id(project_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Project", project_id))
    }
    
    /// 根据ID查找项目
    pub async fn find_by_id(&self, project_id: Uuid) -> Result<Option<project::Model>> {
        project::Entity::find_by_id(project_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据用户ID查找项目
    pub async fn find_by_user(&self, user_id: Uuid) -> Result<Vec<project::Model>> {
        project::Entity::find()
            .filter(project::Column::UserId.eq(user_id))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新项目配置
    pub async fn update_config(
        &self,
        project_id: Uuid,
        technology_stack: Option<JsonValue>,
        coding_standards: Option<JsonValue>,
        git_settings: Option<JsonValue>,
    ) -> Result<project::Model> {
        let project = project::Entity::find_by_id(project_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Project", project_id))?;
        
        let mut project: project::ActiveModel = project.into();
        
        if let Some(tech_stack) = technology_stack {
            project.technology_stack = Set(Some(tech_stack));
        }
        
        if let Some(standards) = coding_standards {
            project.coding_standards = Set(Some(standards));
        }
        
        if let Some(settings) = git_settings {
            project.git_settings = Set(Some(settings));
        }
        
        project.updated_at = Set(chrono::Utc::now().into());
        
        project.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新项目上下文信息
    pub async fn update_context(
        &self,
        project_id: Uuid,
        codebase_info: Option<JsonValue>,
        project_context: Option<JsonValue>,
    ) -> Result<project::Model> {
        let project = project::Entity::find_by_id(project_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Project", project_id))?;
        
        let mut project: project::ActiveModel = project.into();
        
        if let Some(info) = codebase_info {
            project.codebase_info = Set(Some(info));
        }
        
        if let Some(context) = project_context {
            project.project_context = Set(Some(context));
        }
        
        project.updated_at = Set(chrono::Utc::now().into());
        
        project.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新项目状态
    pub async fn update_status(
        &self,
        project_id: Uuid,
        status: &str,
    ) -> Result<project::Model> {
        let project = project::Entity::find_by_id(project_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Project", project_id))?;
        
        let mut project: project::ActiveModel = project.into();
        project.status = Set(status.to_string());
        project.updated_at = Set(chrono::Utc::now().into());
        
        project.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除项目
    pub async fn delete(&self, project_id: Uuid) -> Result<()> {
        project::Entity::delete_by_id(project_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{migrations::Migrator, repository::user_repository::{UserRepository, CreateUserData}};
    use sea_orm::Database;

    async fn setup_test_db() -> DatabaseConnection {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        Migrator::up(&db, None).await.unwrap();
        db
    }

    async fn create_test_user(db: &DatabaseConnection) -> Uuid {
        let repo = UserRepository::new(db.clone());
        let user_data = CreateUserData {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
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
        let project_repo = ProjectRepository::new(db.clone());
        
        let project = project_repo.create(
            user_id,
            "测试项目".to_string(),
            Some("这是一个测试项目".to_string()),
            "https://github.com/test/project.git".to_string(),
            "/path/to/workspace".to_string(),
        ).await.unwrap();
        
        assert_eq!(project.name, "测试项目");
        assert_eq!(project.user_id, user_id);
        assert_eq!(project.status, "active");
        assert_eq!(project.main_branch, "main");
    }

    #[tokio::test]
    async fn test_find_by_user() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let project_repo = ProjectRepository::new(db.clone());
        
        // 创建两个项目
        let _project1 = project_repo.create(
            user_id,
            "项目1".to_string(),
            None,
            "https://github.com/test/project1.git".to_string(),
            "/path/to/workspace1".to_string(),
        ).await.unwrap();
        
        let _project2 = project_repo.create(
            user_id,
            "项目2".to_string(),
            None,
            "https://github.com/test/project2.git".to_string(),
            "/path/to/workspace2".to_string(),
        ).await.unwrap();
        
        let projects = project_repo.find_by_user(user_id).await.unwrap();
        assert_eq!(projects.len(), 2);
    }

    #[tokio::test]
    async fn test_update_config() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let project_repo = ProjectRepository::new(db.clone());
        
        let project = project_repo.create(
            user_id,
            "测试项目".to_string(),
            None,
            "https://github.com/test/project.git".to_string(),
            "/path/to/workspace".to_string(),
        ).await.unwrap();
        
        let tech_stack = serde_json::json!({
            "languages": ["Rust", "TypeScript"],
            "frameworks": ["Tauri", "React"]
        });
        
        let coding_standards = serde_json::json!({
            "line_length": 100,
            "indentation": 4
        });
        
        let updated_project = project_repo.update_config(
            project.project_id,
            Some(tech_stack.clone()),
            Some(coding_standards.clone()),
            None,
        ).await.unwrap();
        
        assert_eq!(updated_project.technology_stack, Some(tech_stack));
        assert_eq!(updated_project.coding_standards, Some(coding_standards));
    }

    #[tokio::test]
    async fn test_update_status() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let project_repo = ProjectRepository::new(db.clone());
        
        let project = project_repo.create(
            user_id,
            "测试项目".to_string(),
            None,
            "https://github.com/test/project.git".to_string(),
            "/path/to/workspace".to_string(),
        ).await.unwrap();
        
        assert_eq!(project.status, "active");
        
        let updated_project = project_repo.update_status(project.project_id, "paused")
            .await.unwrap();
        
        assert_eq!(updated_project.status, "paused");
    }
}