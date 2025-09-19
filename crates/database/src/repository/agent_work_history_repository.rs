//! Agent工作历史仓储实现

use crate::{entities::agent_work_history, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// Agent工作历史仓储
pub struct AgentWorkHistoryRepository {
    db: DatabaseConnection,
}

/// 创建Agent工作历史的数据结构
#[derive(Debug, Clone)]
pub struct CreateAgentWorkHistoryData {
    pub agent_id: Uuid,
    pub task_id: Uuid,
    pub task_type: String,
    pub success: Option<bool>,
    pub completion_time_minutes: Option<i32>,
    pub quality_score: Option<f64>,
    pub work_details: Option<serde_json::Value>,
    pub technologies_used: serde_json::Value,
    pub error_message: Option<String>,
}

impl AgentWorkHistoryRepository {
    /// 创建新的Agent工作历史仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的工作历史记录
    pub async fn create(&self, history_data: CreateAgentWorkHistoryData) -> Result<agent_work_history::Model> {
        let now = chrono::Utc::now().into();
        let history_id = Uuid::new_v4();
        
        let history = agent_work_history::ActiveModel {
            history_id: Set(history_id),
            agent_id: Set(history_data.agent_id),
            task_id: Set(history_data.task_id),
            task_type: Set(history_data.task_type),
            success: Set(history_data.success),
            completion_time_minutes: Set(history_data.completion_time_minutes),
            quality_score: Set(history_data.quality_score),
            work_details: Set(history_data.work_details),
            technologies_used: Set(history_data.technologies_used),
            error_message: Set(history_data.error_message),
            started_at: Set(now),
            completed_at: Set(Some(now)),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = agent_work_history::Entity::insert(history).exec(&self.db).await?;
        
        agent_work_history::Entity::find_by_id(history_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("AgentWorkHistory", history_id))
    }
    
    /// 根据ID查找工作历史
    pub async fn find_by_id(&self, history_id: Uuid) -> Result<Option<agent_work_history::Model>> {
        agent_work_history::Entity::find_by_id(history_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据Agent ID查找工作历史
    pub async fn find_by_agent_id(&self, agent_id: Uuid) -> Result<Vec<agent_work_history::Model>> {
        agent_work_history::Entity::find()
            .filter(agent_work_history::Column::AgentId.eq(agent_id))
            .order_by_desc(agent_work_history::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据任务ID查找工作历史
    pub async fn find_by_task_id(&self, task_id: Uuid) -> Result<Vec<agent_work_history::Model>> {
        agent_work_history::Entity::find()
            .filter(agent_work_history::Column::TaskId.eq(task_id))
            .order_by_desc(agent_work_history::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新工作历史状态
    pub async fn update_status(
        &self,
        history_id: Uuid,
        success: Option<bool>,
        error_message: Option<String>,
    ) -> Result<agent_work_history::Model> {
        let history = agent_work_history::Entity::find_by_id(history_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("AgentWorkHistory", history_id))?;
        
        let mut history: agent_work_history::ActiveModel = history.into();
        history.success = Set(success);
        if let Some(message) = error_message {
            history.error_message = Set(Some(message));
        }
        history.completed_at = Set(Some(chrono::Utc::now().into()));
        
        history.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除工作历史
    pub async fn delete(&self, history_id: Uuid) -> Result<()> {
        agent_work_history::Entity::delete_by_id(history_id)
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
    async fn test_create_agent_work_history() {
        let db = setup_test_db().await;
        let repo = AgentWorkHistoryRepository::new(db);
        
        let history_data = CreateAgentWorkHistoryData {
            agent_id: Uuid::new_v4(),
            task_id: Uuid::new_v4(),
            task_type: "development".to_string(),
            success: Some(true),
            completion_time_minutes: Some(120),
            quality_score: Some(8.5),
            work_details: Some(serde_json::json!({"summary": "任务完成成功"})),
            technologies_used: serde_json::json!(["rust", "sql"]),
            error_message: None,
        };
        
        let history = repo.create(history_data).await.unwrap();
        
        assert_eq!(history.task_type, "development");
        assert_eq!(history.success, Some(true));
        assert_eq!(history.completion_time_minutes, Some(120));
    }

    #[tokio::test]
    async fn test_find_by_agent_id() {
        let db = setup_test_db().await;
        let repo = AgentWorkHistoryRepository::new(db.clone());
        
        let agent_id = Uuid::new_v4();
        let history_data = CreateAgentWorkHistoryData {
            agent_id,
            task_id: Uuid::new_v4(),
            task_type: "development".to_string(),
            success: Some(true),
            completion_time_minutes: Some(90),
            quality_score: Some(9.0),
            work_details: Some(serde_json::json!({"summary": "任务完成成功"})),
            technologies_used: serde_json::json!(["rust"]),
            error_message: None,
        };
        
        let _created_history = repo.create(history_data).await.unwrap();
        
        let histories = repo.find_by_agent_id(agent_id).await.unwrap();
        assert_eq!(histories.len(), 1);
        assert_eq!(histories[0].agent_id, agent_id);
    }
}