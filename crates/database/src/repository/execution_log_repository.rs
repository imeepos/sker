//! 执行日志仓储实现

use crate::{entities::execution_log, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// 执行日志仓储
pub struct ExecutionLogRepository {
    db: DatabaseConnection,
}

/// 创建执行日志的数据结构
#[derive(Debug, Clone)]
pub struct CreateExecutionLogData {
    pub session_id: Uuid,
    pub log_level: String,
    pub message: String,
    pub context_data: Option<serde_json::Value>,
}

impl ExecutionLogRepository {
    /// 创建新的执行日志仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的执行日志
    pub async fn create(&self, log_data: CreateExecutionLogData) -> Result<execution_log::Model> {
        let now = chrono::Utc::now().into();
        let log_id = Uuid::new_v4();
        
        let log = execution_log::ActiveModel {
            log_id: Set(log_id),
            session_id: Set(log_data.session_id),
            log_level: Set(log_data.log_level),
            message: Set(log_data.message),
            context_data: Set(log_data.context_data),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = execution_log::Entity::insert(log).exec(&self.db).await?;
        
        execution_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("ExecutionLog", log_id))
    }
    
    /// 根据ID查找执行日志
    pub async fn find_by_id(&self, log_id: Uuid) -> Result<Option<execution_log::Model>> {
        execution_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据执行会话ID查找日志
    pub async fn find_by_session_id(&self, session_id: Uuid) -> Result<Vec<execution_log::Model>> {
        execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id))
            .order_by_asc(execution_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据日志级别查找日志
    pub async fn find_by_log_level(&self, log_level: &str) -> Result<Vec<execution_log::Model>> {
        execution_log::Entity::find()
            .filter(execution_log::Column::LogLevel.eq(log_level))
            .order_by_desc(execution_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 批量创建日志
    pub async fn create_batch(&self, logs_data: Vec<CreateExecutionLogData>) -> Result<Vec<execution_log::Model>> {
        let now = chrono::Utc::now().into();
        let mut active_models = Vec::new();
        let mut log_ids = Vec::new();
        
        for log_data in logs_data {
            let log_id = Uuid::new_v4();
            log_ids.push(log_id);
            
            let log = execution_log::ActiveModel {
                log_id: Set(log_id),
                session_id: Set(log_data.session_id),
                log_level: Set(log_data.log_level),
                message: Set(log_data.message),
                context_data: Set(log_data.context_data),
                created_at: Set(now),
                ..Default::default()
            };
            
            active_models.push(log);
        }
        
        execution_log::Entity::insert_many(active_models).exec(&self.db).await?;
        
        // 返回插入的记录
        execution_log::Entity::find()
            .filter(execution_log::Column::LogId.is_in(log_ids))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除执行日志
    pub async fn delete(&self, log_id: Uuid) -> Result<()> {
        execution_log::Entity::delete_by_id(log_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 根据会话ID删除所有日志
    pub async fn delete_by_session_id(&self, session_id: Uuid) -> Result<()> {
        execution_log::Entity::delete_many()
            .filter(execution_log::Column::SessionId.eq(session_id))
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
    async fn test_create_execution_log() {
        let db = setup_test_db().await;
        let repo = ExecutionLogRepository::new(db);
        
        let log_data = CreateExecutionLogData {
            session_id: Uuid::new_v4(),
            log_level: "info".to_string(),
            message: "执行开始".to_string(),
            context_data: Some(serde_json::json!({"step": 1})),
        };
        
        let log = repo.create(log_data).await.unwrap();
        
        assert_eq!(log.log_level, "info");
        assert_eq!(log.message, "执行开始");
    }

    #[tokio::test]
    async fn test_find_by_session_id() {
        let db = setup_test_db().await;
        let repo = ExecutionLogRepository::new(db.clone());
        
        let session_id = Uuid::new_v4();
        let log_data = CreateExecutionLogData {
            session_id,
            log_level: "info".to_string(),
            message: "测试日志".to_string(),
            context_data: None,
        };
        
        let _created_log = repo.create(log_data).await.unwrap();
        
        let logs = repo.find_by_session_id(session_id).await.unwrap();
        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].session_id, session_id);
    }

    #[tokio::test]
    async fn test_create_batch() {
        let db = setup_test_db().await;
        let repo = ExecutionLogRepository::new(db.clone());
        
        let session_id = Uuid::new_v4();
        let logs_data = vec![
            CreateExecutionLogData {
                session_id,
                log_level: "info".to_string(),
                message: "日志1".to_string(),
                context_data: None,
            },
            CreateExecutionLogData {
                session_id,
                log_level: "warn".to_string(),
                message: "日志2".to_string(),
                context_data: None,
            },
        ];
        
        let logs = repo.create_batch(logs_data).await.unwrap();
        assert_eq!(logs.len(), 2);
    }
}