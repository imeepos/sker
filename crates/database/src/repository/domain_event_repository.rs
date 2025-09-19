//! 领域事件仓储实现

use crate::{entities::domain_event, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// 领域事件仓储
pub struct DomainEventRepository {
    db: DatabaseConnection,
}

/// 创建领域事件的数据结构
#[derive(Debug, Clone)]
pub struct CreateDomainEventData {
    pub aggregate_type: String,
    pub aggregate_id: Uuid,
    pub event_type: String,
    pub event_data: serde_json::Value,
    pub event_version: i32,
}

impl DomainEventRepository {
    /// 创建新的领域事件仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的领域事件
    pub async fn create(&self, event_data: CreateDomainEventData) -> Result<domain_event::Model> {
        let now = chrono::Utc::now().into();
        let event_id = Uuid::new_v4();
        
        let event = domain_event::ActiveModel {
            event_id: Set(event_id),
            aggregate_type: Set(event_data.aggregate_type),
            aggregate_id: Set(event_data.aggregate_id),
            event_type: Set(event_data.event_type),
            event_data: Set(event_data.event_data),
            event_version: Set(event_data.event_version),
            occurred_at: Set(now),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = domain_event::Entity::insert(event).exec(&self.db).await?;
        
        domain_event::Entity::find_by_id(event_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("DomainEvent", event_id))
    }
    
    /// 根据ID查找领域事件
    pub async fn find_by_id(&self, event_id: Uuid) -> Result<Option<domain_event::Model>> {
        domain_event::Entity::find_by_id(event_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据聚合ID查找事件
    pub async fn find_by_aggregate_id(&self, aggregate_id: Uuid) -> Result<Vec<domain_event::Model>> {
        domain_event::Entity::find()
            .filter(domain_event::Column::AggregateId.eq(aggregate_id))
            .order_by_asc(domain_event::Column::EventVersion)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据聚合类型查找事件
    pub async fn find_by_aggregate_type(&self, aggregate_type: &str) -> Result<Vec<domain_event::Model>> {
        domain_event::Entity::find()
            .filter(domain_event::Column::AggregateType.eq(aggregate_type))
            .order_by_desc(domain_event::Column::OccurredAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据事件类型查找事件
    pub async fn find_by_event_type(&self, event_type: &str) -> Result<Vec<domain_event::Model>> {
        domain_event::Entity::find()
            .filter(domain_event::Column::EventType.eq(event_type))
            .order_by_desc(domain_event::Column::OccurredAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据聚合ID和版本范围查找事件
    pub async fn find_by_aggregate_id_and_version_range(
        &self,
        aggregate_id: Uuid,
        from_version: i32,
        to_version: Option<i32>,
    ) -> Result<Vec<domain_event::Model>> {
        let mut query = domain_event::Entity::find()
            .filter(domain_event::Column::AggregateId.eq(aggregate_id))
            .filter(domain_event::Column::EventVersion.gte(from_version));
        
        if let Some(to_ver) = to_version {
            query = query.filter(domain_event::Column::EventVersion.lte(to_ver));
        }
        
        query
            .order_by_asc(domain_event::Column::EventVersion)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 批量创建事件
    pub async fn create_batch(&self, events_data: Vec<CreateDomainEventData>) -> Result<Vec<domain_event::Model>> {
        let now = chrono::Utc::now().into();
        let mut active_models = Vec::new();
        let mut event_ids = Vec::new();
        
        for event_data in events_data {
            let event_id = Uuid::new_v4();
            event_ids.push(event_id);
            
            let event = domain_event::ActiveModel {
                event_id: Set(event_id),
                aggregate_type: Set(event_data.aggregate_type),
                aggregate_id: Set(event_data.aggregate_id),
                event_type: Set(event_data.event_type),
                event_data: Set(event_data.event_data),
                event_version: Set(event_data.event_version),
                occurred_at: Set(now),
                created_at: Set(now),
                ..Default::default()
            };
            
            active_models.push(event);
        }
        
        domain_event::Entity::insert_many(active_models).exec(&self.db).await?;
        
        // 返回插入的记录
        domain_event::Entity::find()
            .filter(domain_event::Column::EventId.is_in(event_ids))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取聚合的最新版本号
    pub async fn get_latest_version(&self, aggregate_id: Uuid) -> Result<i32> {
        let latest_event = domain_event::Entity::find()
            .filter(domain_event::Column::AggregateId.eq(aggregate_id))
            .order_by_desc(domain_event::Column::EventVersion)
            .one(&self.db)
            .await?;
        
        Ok(latest_event.map(|e| e.event_version).unwrap_or(0))
    }
    
    /// 删除领域事件（谨慎使用）
    pub async fn delete(&self, event_id: Uuid) -> Result<()> {
        domain_event::Entity::delete_by_id(event_id)
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
    async fn test_create_domain_event() {
        let db = setup_test_db().await;
        let repo = DomainEventRepository::new(db);
        
        let aggregate_id = Uuid::new_v4();
        let event_data = CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskCreated".to_string(),
            event_data: serde_json::json!({"title": "新任务"}),
            event_version: 1,
        };
        
        let event = repo.create(event_data).await.unwrap();
        
        assert_eq!(event.aggregate_type, "Task");
        assert_eq!(event.event_type, "TaskCreated");
        assert_eq!(event.event_version, 1);
    }

    #[tokio::test]
    async fn test_find_by_aggregate_id() {
        let db = setup_test_db().await;
        let repo = DomainEventRepository::new(db.clone());
        
        let aggregate_id = Uuid::new_v4();
        let event_data = CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskCreated".to_string(),
            event_data: serde_json::json!({"title": "新任务"}),
            event_version: 1,
        };
        
        let _created_event = repo.create(event_data).await.unwrap();
        
        let events = repo.find_by_aggregate_id(aggregate_id).await.unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].aggregate_id, aggregate_id);
    }

    #[tokio::test]
    async fn test_get_latest_version() {
        let db = setup_test_db().await;
        let repo = DomainEventRepository::new(db.clone());
        
        let aggregate_id = Uuid::new_v4();
        
        // 创建多个版本的事件
        for version in 1..=3 {
            let event_data = CreateDomainEventData {
                aggregate_type: "Task".to_string(),
                aggregate_id,
                event_type: "TaskUpdated".to_string(),
                event_data: serde_json::json!({"version": version}),
                event_version: version,
            };
            repo.create(event_data).await.unwrap();
        }
        
        let latest_version = repo.get_latest_version(aggregate_id).await.unwrap();
        assert_eq!(latest_version, 3);
    }
}