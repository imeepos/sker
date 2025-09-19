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
    pub publisher_name: String,
    pub status: String,
    pub retry_count: i32,
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
            publisher_name: Set(log_data.publisher_name),
            status: Set(log_data.status),
            retry_count: Set(log_data.retry_count),
            error_message: Set(log_data.error_message),
            published_at: Set(now),
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
            .order_by_desc(event_publish_log::Column::PublishedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据发布者名称查找日志
    pub async fn find_by_publisher_name(&self, publisher_name: &str) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::PublisherName.eq(publisher_name))
            .order_by_desc(event_publish_log::Column::PublishedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据状态查找日志
    pub async fn find_by_status(&self, status: &str) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::Status.eq(status))
            .order_by_desc(event_publish_log::Column::PublishedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 查找失败的发布日志（用于重试）
    pub async fn find_failed_logs(&self) -> Result<Vec<event_publish_log::Model>> {
        event_publish_log::Entity::find()
            .filter(event_publish_log::Column::Status.eq("failed"))
            .order_by_asc(event_publish_log::Column::PublishedAt)
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
    
    /// 增加重试次数
    pub async fn increment_retry_count(&self, log_id: Uuid) -> Result<event_publish_log::Model> {
        let log = event_publish_log::Entity::find_by_id(log_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("EventPublishLog", log_id))?;
        
        let mut log: event_publish_log::ActiveModel = log.into();
        let current_count = log.retry_count.as_ref().clone();
        log.retry_count = Set(current_count + 1);
        log.published_at = Set(chrono::Utc::now().into());
        
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
                publisher_name: Set(log_data.publisher_name),
                status: Set(log_data.status),
                retry_count: Set(log_data.retry_count),
                error_message: Set(log_data.error_message),
                published_at: Set(now),
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
        let cutoff_datetime = cutoff_date.into();
        
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
            publisher_name: "test_publisher".to_string(),
            status: "success".to_string(),
            retry_count: 0,
            error_message: None,
        };
        
        let log = repo.create(log_data).await.unwrap();
        
        assert_eq!(log.publisher_name, "test_publisher");
        assert_eq!(log.status, "success");
        assert_eq!(log.retry_count, 0);
    }

    #[tokio::test]
    async fn test_find_by_event_id() {
        let db = setup_test_db().await;
        let repo = EventPublishLogRepository::new(db.clone());
        
        let event_id = Uuid::new_v4();
        let log_data = CreateEventPublishLogData {
            event_id,
            publisher_name: "test_publisher".to_string(),
            status: "success".to_string(),
            retry_count: 0,
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
            publisher_name: "test_publisher".to_string(),
            status: "failed".to_string(),
            retry_count: 0,
            error_message: Some("连接失败".to_string()),
        };
        
        let created_log = repo.create(log_data).await.unwrap();
        let updated_log = repo.increment_retry_count(created_log.log_id).await.unwrap();
        
        assert_eq!(updated_log.retry_count, 1);
    }
}