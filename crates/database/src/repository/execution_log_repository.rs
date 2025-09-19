//! 执行日志仓储实现

use crate::{entities::execution_log, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ColumnTrait, QueryFilter, QueryOrder, PaginatorTrait};
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
    pub event_type: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
    pub timestamp_ms: i64,
}

/// 日志统计信息
#[derive(Debug, Clone, Default)]
pub struct LogStatistics {
    pub total_logs: u32,
    pub debug_count: u32,
    pub info_count: u32,
    pub warn_count: u32,
    pub error_count: u32,
    pub error_rate: f64,
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
            event_type: Set(log_data.event_type),
            message: Set(log_data.message),
            details: Set(log_data.details),
            timestamp_ms: Set(log_data.timestamp_ms),
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
                event_type: Set(log_data.event_type),
                message: Set(log_data.message),
                details: Set(log_data.details),
                timestamp_ms: Set(log_data.timestamp_ms),
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

    /// 获取日志统计信息
    pub async fn get_log_statistics(&self, session_id: Uuid) -> Result<LogStatistics> {
        let logs = execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)?;

        let mut stats = LogStatistics::default();
        stats.total_logs = logs.len() as u32;

        for log in logs {
            match log.log_level.as_str() {
                "debug" => stats.debug_count += 1,
                "info" => stats.info_count += 1,
                "warn" => stats.warn_count += 1,
                "error" => stats.error_count += 1,
                _ => {}
            }
        }

        // 计算错误率
        stats.error_rate = if stats.total_logs > 0 {
            stats.error_count as f64 / stats.total_logs as f64
        } else {
            0.0
        };

        Ok(stats)
    }

    /// 根据详情内容查找日志
    pub async fn find_logs_by_details_content(
        &self,
        session_id: Uuid,
        key: &str,
        value: &str,
    ) -> Result<Vec<execution_log::Model>> {
        let logs = execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)?;

        // 过滤包含指定键值对的日志
        let filtered_logs = logs
            .into_iter()
            .filter(|log| {
                if let Some(details) = &log.details {
                    if let Some(obj) = details.as_object() {
                        return obj.get(key)
                            .and_then(|v| v.as_str())
                            .map(|s| s == value)
                            .unwrap_or(false);
                    }
                }
                false
            })
            .collect();

        Ok(filtered_logs)
    }

    /// 根据多个过滤条件查找日志
    pub async fn find_logs_with_filters(
        &self,
        session_id: Uuid,
        log_level: Option<String>,
        event_type: Option<String>,
        start_time: Option<chrono::DateTime<chrono::Utc>>,
        end_time: Option<chrono::DateTime<chrono::Utc>>,
    ) -> Result<Vec<execution_log::Model>> {
        let mut query = execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id));

        if let Some(level) = log_level {
            query = query.filter(execution_log::Column::LogLevel.eq(level));
        }

        if let Some(event) = event_type {
            query = query.filter(execution_log::Column::EventType.eq(event));
        }

        if let Some(start) = start_time {
            query = query.filter(execution_log::Column::CreatedAt.gte(start));
        }

        if let Some(end) = end_time {
            query = query.filter(execution_log::Column::CreatedAt.lte(end));
        }

        query
            .order_by_asc(execution_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据时间范围查找日志
    pub async fn find_logs_by_time_range(
        &self,
        session_id: Uuid,
        start_timestamp_ms: i64,
        end_timestamp_ms: i64,
    ) -> Result<Vec<execution_log::Model>> {
        execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id))
            .filter(execution_log::Column::TimestampMs.gte(start_timestamp_ms))
            .filter(execution_log::Column::TimestampMs.lte(end_timestamp_ms))
            .order_by_asc(execution_log::Column::TimestampMs)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 分页查找日志
    pub async fn find_logs_with_pagination(
        &self,
        session_id: Uuid,
        page: u64,
        page_size: u64,
    ) -> Result<(Vec<execution_log::Model>, u64)> {
        // 获取总数
        let total_count = execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id))
            .count(&self.db)
            .await
            .map_err(DatabaseError::from)?;

        let total_pages = (total_count + page_size - 1) / page_size;

        // 获取分页数据
        let logs = execution_log::Entity::find()
            .filter(execution_log::Column::SessionId.eq(session_id))
            .order_by_desc(execution_log::Column::CreatedAt)
            .paginate(&self.db, page_size)
            .fetch_page(page)
            .await
            .map_err(DatabaseError::from)?;

        Ok((logs, total_pages))
    }

    /// 根据事件类型查找日志
    pub async fn find_by_event_type(&self, event_type: &str) -> Result<Vec<execution_log::Model>> {
        execution_log::Entity::find()
            .filter(execution_log::Column::EventType.eq(event_type))
            .order_by_desc(execution_log::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
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
            event_type: "execution_start".to_string(),
            message: "执行开始".to_string(),
            details: Some(serde_json::json!({"step": 1})),
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
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
            event_type: "test_event".to_string(),
            message: "测试日志".to_string(),
            details: None,
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
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
                event_type: "batch_test_1".to_string(),
                message: "日志1".to_string(),
                details: None,
                timestamp_ms: chrono::Utc::now().timestamp_millis(),
            },
            CreateExecutionLogData {
                session_id,
                log_level: "warn".to_string(),
                event_type: "batch_test_2".to_string(),
                message: "日志2".to_string(),
                details: None,
                timestamp_ms: chrono::Utc::now().timestamp_millis(),
            },
        ];
        
        let logs = repo.create_batch(logs_data).await.unwrap();
        assert_eq!(logs.len(), 2);
    }
}