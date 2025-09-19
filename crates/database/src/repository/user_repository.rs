//! 用户仓储实现

use crate::{entities::user, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 用户仓储
pub struct UserRepository {
    db: DatabaseConnection,
}

/// 创建用户的数据结构
#[derive(Debug, Clone)]
pub struct CreateUserData {
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub profile_data: Option<JsonValue>,
    pub settings: Option<JsonValue>,
}

impl UserRepository {
    /// 创建新的用户仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新用户
    pub async fn create(&self, user_data: CreateUserData) -> Result<user::Model> {
        let now = chrono::Utc::now().into();
        let user_id = Uuid::new_v4();
        
        let user = user::ActiveModel {
            user_id: Set(user_id),
            username: Set(user_data.username),
            email: Set(user_data.email),
            password_hash: Set(user_data.password_hash),
            profile_data: Set(user_data.profile_data),
            settings: Set(user_data.settings),
            created_at: Set(now),
            updated_at: Set(now),
            is_active: Set(true),
            ..Default::default()
        };
        
        let _result = user::Entity::insert(user).exec(&self.db).await?;
        
        // 获取插入的用户
        user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("User", user_id))
    }
    
    /// 根据ID查找用户
    pub async fn find_by_id(&self, user_id: Uuid) -> Result<Option<user::Model>> {
        user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据邮箱查找用户
    pub async fn find_by_email(&self, email: &str) -> Result<Option<user::Model>> {
        user::Entity::find()
            .filter(user::Column::Email.eq(email))
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据用户名查找用户
    pub async fn find_by_username(&self, username: &str) -> Result<Option<user::Model>> {
        user::Entity::find()
            .filter(user::Column::Username.eq(username))
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新用户资料
    pub async fn update_profile(
        &self,
        user_id: Uuid,
        profile_data: JsonValue,
    ) -> Result<user::Model> {
        let user = user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("User", user_id))?;
        
        let mut user: user::ActiveModel = user.into();
        user.profile_data = Set(Some(profile_data));
        user.updated_at = Set(chrono::Utc::now().into());
        
        user.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新用户设置
    pub async fn update_settings(
        &self,
        user_id: Uuid,
        settings: JsonValue,
    ) -> Result<user::Model> {
        let user = user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("User", user_id))?;
        
        let mut user: user::ActiveModel = user.into();
        user.settings = Set(Some(settings));
        user.updated_at = Set(chrono::Utc::now().into());
        
        user.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新最后登录时间
    pub async fn update_last_login(
        &self,
        user_id: Uuid,
    ) -> Result<user::Model> {
        let user = user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("User", user_id))?;
        
        let mut user: user::ActiveModel = user.into();
        user.last_login_at = Set(Some(chrono::Utc::now().into()));
        user.updated_at = Set(chrono::Utc::now().into());
        
        user.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 激活/停用用户
    pub async fn set_active(
        &self,
        user_id: Uuid,
        is_active: bool,
    ) -> Result<user::Model> {
        let user = user::Entity::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("User", user_id))?;
        
        let mut user: user::ActiveModel = user.into();
        user.is_active = Set(is_active);
        user.updated_at = Set(chrono::Utc::now().into());
        
        user.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除用户
    pub async fn delete(&self, user_id: Uuid) -> Result<()> {
        user::Entity::delete_by_id(user_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::migrations::Migrator;
    use sea_orm::Database;

    async fn setup_test_db() -> DatabaseConnection {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        Migrator::up(&db, None).await.unwrap();
        db
    }

    #[tokio::test]
    async fn test_create_user() {
        let db = setup_test_db().await;
        let repo = UserRepository::new(db);
        
        let user_data = CreateUserData {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "password_hash".to_string(),
            profile_data: None,
            settings: None,
        };
        
        let user = repo.create(user_data).await.unwrap();
        
        assert_eq!(user.username, "test_user");
        assert_eq!(user.email, "test@example.com");
        assert!(user.is_active);
    }

    #[tokio::test]
    async fn test_find_by_email() {
        let db = setup_test_db().await;
        let repo = UserRepository::new(db.clone());
        
        let user_data = CreateUserData {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "password_hash".to_string(),
            profile_data: None,
            settings: None,
        };
        
        let created_user = repo.create(user_data).await.unwrap();
        
        let found_user = repo.find_by_email("test@example.com")
            .await.unwrap()
            .expect("应该找到用户");
        
        assert_eq!(found_user.user_id, created_user.user_id);
    }

    #[tokio::test]
    async fn test_update_profile() {
        let db = setup_test_db().await;
        let repo = UserRepository::new(db.clone());
        
        let user_data = CreateUserData {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "password_hash".to_string(),
            profile_data: None,
            settings: None,
        };
        
        let user = repo.create(user_data).await.unwrap();
        
        let profile_data = serde_json::json!({
            "display_name": "测试用户",
            "bio": "这是一个测试用户"
        });
        
        let updated_user = repo.update_profile(user.user_id, profile_data.clone())
            .await.unwrap();
        
        assert_eq!(updated_user.profile_data, Some(profile_data));
    }

    #[tokio::test]
    async fn test_update_last_login() {
        let db = setup_test_db().await;
        let repo = UserRepository::new(db.clone());
        
        let user_data = CreateUserData {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "password_hash".to_string(),
            profile_data: None,
            settings: None,
        };
        
        let user = repo.create(user_data).await.unwrap();
        
        assert!(user.last_login_at.is_none());
        
        let updated_user = repo.update_last_login(user.user_id)
            .await.unwrap();
        
        assert!(updated_user.last_login_at.is_some());
    }
}