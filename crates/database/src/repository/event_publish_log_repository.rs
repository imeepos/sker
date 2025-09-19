//! 事件发布日志仓储实现

use crate::{entities::event_publish_log, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// 事件发布日志仓储
pub struct EventPublishLogRepository {
    db: DatabaseConnection,
}

/// 创建事件发布日志的数据结构
#[derive(Debug, Clone)]
pub struct CreateEventPublishLogData {
    pub event_id: Uuid,
    pub subscriber_type: String,
    pub subscriber_id: String,
    pub status: String,
    pub attempts: i32,
    pub max_attempts: i32,
    pub response_data: Option<serde_json::Value>,
    pub error_message: Option<String>,
}

impl EventPublishLogRepository {
    /// 创建新的事件发布日志仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的事件发布日志
    pub async fn create(&self, log_data: CreateEventPublishLogData) -> Result<event_publish_log::Model> {
        let now = chrono::Utc::now().into();
        let log_id = Uuid::new_v4();
        
        let log = event_publish_log::ActiveModel {
            log_id: Set(log_id),
            event_id: Set(log_data.event_id),
            subscriber_type: Set(log_data.subscriber_type),
            subscriber_id: Set(log_data.subscriber_id),
            status: Set(log_data.status),
            attempts: Set(log_data.attempts),
            max_attempts: Set(log_data.max_attempts),
            response_data: Set(log_data.response_data),
            error_message: Set(log_data.error_message),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = event_publish_log::Entity::insert(log).exec(&self.db).await?;
        
        event_publish_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("EventPublishLog", log_id))
    }
    
    /// 根据ID查找事件发布日志
    pub async fn find_by_id(&self, log_id: Uuid) -> Result<Option<event_publish_log::Model>> {
        event_publish_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据事件ID查找发布日志
    pub async fn find_by_event_id(&self, event_id: Uuid) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::EventId.eq(event_id))
            .order_by_desc(event_publish_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据订阅者类型查找日志
    pub async fn find_by_subscriber_type(&self, subscriber_type: &str) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::SubscriberType.eq(subscriber_type))
            .order_by_desc(event_publish_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据状态查找日志
    pub async fn find_by_status(&self, status: &str) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::Status.eq(status))
            .order_by_desc(event_publish_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 查找失败的发布日志（用于重试）
    pub async fn find_failed_logs(&self) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::Status.eq("failed"))
            .order_by_asc(event_publish_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新发布状态
    pub async fn update_status(
        &self,
        log_id: Uuid,
        status: String,
        error_message: Option<String>,
    ) -> Result<event_publish_log::Model> {
        let log = event_publish_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("EventPublishLog", log_id))?;
        
        let mut log: event_publish_log::ActiveModel = log.into();
        log.status = Set(status);
        if error_message.is_some() {
            log.error_message = Set(error_message);
        }
        
        log.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 增加尝试次数
    pub async fn increment_attempts(&self, log_id: Uuid) -> Result<event_publish_log::Model> {
        let log = event_publish_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("EventPublishLog", log_id))?;
        
        let mut log: event_publish_log::ActiveModel = log.into();
        let current_count = log.attempts.as_ref().clone();
        log.attempts = Set(current_count + 1);
        
        // 根据状态设置相应的时间戳
        match log.status.as_ref().as_str() {
            "sent" => log.sent_at = Set(Some(chrono::Utc::now().into())),
            "delivered" => log.delivered_at = Set(Some(chrono::Utc::now().into())),
            "failed" => log.failed_at = Set(Some(chrono::Utc::now().into())),
            _ => {}
        }
        
        log.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 批量创建发布日志
    pub async fn create_batch(&self, logs_data: Vec<CreateEventPublishLogData>) -> Result<Vec<event_publish_log::Model>> {
        let now = chrono::Utc::now().into();
        let mut active_models = Vec::new();
        let mut log_ids = Vec::new();
        
        for log_data in logs_data {
            let log_id = Uuid::new_v4();
            log_ids.push(log_id);
            
            let log = event_publish_log::ActiveModel {
                log_id: Set(log_id),
                event_id: Set(log_data.event_id),
                subscriber_type: Set(log_data.subscriber_type),
                subscriber_id: Set(log_data.subscriber_id),
                status: Set(log_data.status),
                attempts: Set(log_data.attempts),
                max_attempts: Set(log_data.max_attempts),
                response_data: Set(log_data.response_data),
                error_message: Set(log_data.error_message),
                created_at: Set(now),
                ..Default::default()
            };
            
            active_models.push(log);
        }
        
        event_publish_log::Entity::insert_many(active_models).exec(&self.db).await?;
        
        // 返回插入的记录
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::LogId.is_in(log_ids))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除事件发布日志
    pub async fn delete(&self, log_id: Uuid) -> Result<()> {
        event_publish_log::Entity::delete_by_id(log_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 清理旧的发布日志
    pub async fn cleanup_old_logs(&self, days: i64) -> Result<u64> {
        let cutoff_date = chrono::Utc::now() - chrono::Duration::days(days);
        let cutoff_datetime: chrono::DateTime<chrono::FixedOffset> = cutoff_date.into();
        
        let result = event_publish_log::Entity::delete_many()
            .filter(event_publish_log::Column::CreatedAt.lt(cutoff_datetime))
            .exec(&self.db)
            .await?;
        
        Ok(result.rows_affected)
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
    async fn test_create_event_publish_log() {
        let db = setup_test_db().await;
        let repo = EventPublishLogRepository::new(db);
        
        let log_data = CreateEventPublishLogData {
            event_id: Uuid::new_v4(),
            subscriber_type: "local_handler".to_string(),
            subscriber_id: "test_subscriber".to_string(),
            status: "delivered".to_string(),
            attempts: 1,
            max_attempts: 3,
            response_data: None,
            error_message: None,
        };
        
        let log = repo.create(log_data).await.unwrap();
        
        assert_eq!(log.subscriber_type, "local_handler");
        assert_eq!(log.subscriber_id, "test_subscriber");
        assert_eq!(log.status, "delivered");
        assert_eq!(log.attempts, 1);
    }

    #[tokio::test]
    async fn test_find_by_event_id() {
        let db = setup_test_db().await;
        let repo = EventPublishLogRepository::new(db.clone());
        
        let event_id = Uuid::new_v4();
        let log_data = CreateEventPublishLogData {
            event_id,
            subscriber_type: "webhook".to_string(),
            subscriber_id: "webhook_001".to_string(),
            status: "sent".to_string(),
            attempts: 1,
            max_attempts: 3,
            response_data: None,
            error_message: None,
        };
        
        let _created_log = repo.create(log_data).await.unwrap();
        
        let logs = repo.find_by_event_id(event_id).await.unwrap();
        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].event_id, event_id);
    }

    #[tokio::test]
    async fn test_increment_retry_count() {
        let db = setup_test_db().await;
        let repo = EventPublishLogRepository::new(db.clone());
        
        let log_data = CreateEventPublishLogData {
            event_id: Uuid::new_v4(),
            subscriber_type: "message_queue".to_string(),
            subscriber_id: "queue_001".to_string(),
            status: "failed".to_string(),
            attempts: 1,
            max_attempts: 3,
            response_data: None,
            error_message: Some("连接失败".to_string()),
        };
        
        let created_log = repo.create(log_data).await.unwrap();
        let updated_log = repo.increment_attempts(created_log.log_id).await.unwrap();
        
        assert_eq!(updated_log.attempts, 2);
    }
}