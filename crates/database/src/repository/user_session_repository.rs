//! 用户会话仓储实现

use crate::{entities::user_session, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use sea_orm::prelude::Expr;
use uuid::Uuid;
use chrono::{Duration, Utc};

/// 用户会话仓储
pub struct UserSessionRepository {
    db: DatabaseConnection,
}

/// 创建会话的数据结构
#[derive(Debug, Clone)]
pub struct CreateSessionData {
    pub user_id: Uuid,
    pub token: String,
    pub refresh_token: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub expires_in_hours: i64, // 会话有效期（小时）
}

impl UserSessionRepository {
    /// 创建新的用户会话仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新会话
    pub async fn create(&self, session_data: CreateSessionData) -> Result<user_session::Model> {
        let now = Utc::now().into();
        let expires_at = (Utc::now() + Duration::hours(session_data.expires_in_hours)).into();
        let session_id = Uuid::new_v4();
        
        let session = user_session::ActiveModel {
            session_id: Set(session_id),
            user_id: Set(session_data.user_id),
            token: Set(session_data.token),
            refresh_token: Set(session_data.refresh_token),
            created_at: Set(now),
            expires_at: Set(expires_at),
            last_active_at: Set(now),
            ip_address: Set(session_data.ip_address),
            user_agent: Set(session_data.user_agent),
            is_active: Set(true),
        };
        
        let _result = user_session::Entity::insert(session).exec(&self.db).await?;
        
        // 获取插入的会话
        user_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("UserSession", session_id))
    }
    
    /// 根据令牌查找会话
    pub async fn find_by_token(&self, token: &str) -> Result<Option<user_session::Model>> {
        user_session::Entity::find()
            .filter(user_session::Column::Token.eq(token))
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据刷新令牌查找会话
    pub async fn find_by_refresh_token(&self, refresh_token: &str) -> Result<Option<user_session::Model>> {
        user_session::Entity::find()
            .filter(user_session::Column::RefreshToken.eq(refresh_token))
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据用户ID查找所有活跃会话
    pub async fn find_active_sessions_by_user(&self, user_id: Uuid) -> Result<Vec<user_session::Model>> {
        user_session::Entity::find()
            .filter(user_session::Column::UserId.eq(user_id))
            .filter(user_session::Column::IsActive.eq(true))
            .order_by_desc(user_session::Column::LastActiveAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新最后活跃时间
    pub async fn update_last_active(&self, session_id: Uuid) -> Result<user_session::Model> {
        let session = user_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("UserSession", session_id))?;
        
        let mut session: user_session::ActiveModel = session.into();
        session.last_active_at = Set(Utc::now().into());
        
        session.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 刷新会话令牌
    pub async fn refresh_token(
        &self,
        session_id: Uuid,
        new_token: String,
        new_refresh_token: String,
        expires_in_hours: i64,
    ) -> Result<user_session::Model> {
        let session = user_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("UserSession", session_id))?;
        
        let now = Utc::now().into();
        let expires_at = (Utc::now() + Duration::hours(expires_in_hours)).into();
        
        let mut session: user_session::ActiveModel = session.into();
        session.token = Set(new_token);
        session.refresh_token = Set(new_refresh_token);
        session.expires_at = Set(expires_at);
        session.last_active_at = Set(now);
        
        session.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 使会话失效
    pub async fn invalidate_session(&self, session_id: Uuid) -> Result<()> {
        let session = user_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("UserSession", session_id))?;
        
        let mut session: user_session::ActiveModel = session.into();
        session.is_active = Set(false);
        
        session.update(&self.db).await?;
        Ok(())
    }
    
    /// 使用户的所有会话失效
    pub async fn invalidate_user_sessions(&self, user_id: Uuid) -> Result<()> {
        user_session::Entity::update_many()
            .col_expr(user_session::Column::IsActive, Expr::value(false))
            .filter(user_session::Column::UserId.eq(user_id))
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 清理过期会话
    pub async fn cleanup_expired_sessions(&self) -> Result<u64> {
        let now: sea_orm::prelude::DateTimeWithTimeZone = Utc::now().into();
        
        let result = user_session::Entity::delete_many()
            .filter(user_session::Column::ExpiresAt.lt(now))
            .exec(&self.db)
            .await?;
        
        Ok(result.rows_affected)
    }
    
    /// 验证会话是否有效
    pub async fn validate_session(&self, token: &str) -> Result<Option<user_session::Model>> {
        let session = self.find_by_token(token).await?;
        
        if let Some(session) = session {
            if session.is_valid() {
                // 更新最后活跃时间
                self.update_last_active(session.session_id).await
                    .map(Some)
            } else {
                // 会话无效，清理它
                if !session.is_active {
                    return Ok(None);
                }
                
                self.invalidate_session(session.session_id).await?;
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::migrations::Migrator;
    use crate::repository::user_repository::{UserRepository, CreateUserData};
    use sea_orm::Database;

    async fn setup_test_db() -> DatabaseConnection {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        Migrator::up(&db, None).await.unwrap();
        db
    }

    async fn create_test_user(db: &DatabaseConnection) -> Uuid {
        let user_repo = UserRepository::new(db.clone());
        let user_data = CreateUserData {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "password_hash".to_string(),
            profile_data: None,
            settings: None,
        };
        
        let user = user_repo.create(user_data).await.unwrap();
        user.user_id
    }

    #[tokio::test]
    async fn test_create_session() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = UserSessionRepository::new(db);
        
        let session_data = CreateSessionData {
            user_id,
            token: "test_token".to_string(),
            refresh_token: "test_refresh_token".to_string(),
            ip_address: Some("127.0.0.1".to_string()),
            user_agent: Some("test_agent".to_string()),
            expires_in_hours: 24,
        };
        
        let session = repo.create(session_data).await.unwrap();
        
        assert_eq!(session.user_id, user_id);
        assert_eq!(session.token, "test_token");
        assert!(session.is_active);
        assert!(!session.is_expired());
    }

    #[tokio::test]
    async fn test_validate_session() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = UserSessionRepository::new(db);
        
        let session_data = CreateSessionData {
            user_id,
            token: "test_token".to_string(),
            refresh_token: "test_refresh_token".to_string(),
            ip_address: None,
            user_agent: None,
            expires_in_hours: 24,
        };
        
        let created_session = repo.create(session_data).await.unwrap();
        
        // 验证有效会话
        let validated_session = repo.validate_session("test_token")
            .await.unwrap()
            .expect("应该找到有效会话");
        
        assert_eq!(validated_session.session_id, created_session.session_id);
        
        // 测试无效令牌
        let invalid_session = repo.validate_session("invalid_token").await.unwrap();
        assert!(invalid_session.is_none());
    }

    #[tokio::test]
    async fn test_invalidate_session() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = UserSessionRepository::new(db);
        
        let session_data = CreateSessionData {
            user_id,
            token: "test_token".to_string(),
            refresh_token: "test_refresh_token".to_string(),
            ip_address: None,
            user_agent: None,
            expires_in_hours: 24,
        };
        
        let session = repo.create(session_data).await.unwrap();
        
        // 使会话失效
        repo.invalidate_session(session.session_id).await.unwrap();
        
        // 验证会话已失效
        let invalid_session = repo.validate_session("test_token").await.unwrap();
        assert!(invalid_session.is_none());
    }
}