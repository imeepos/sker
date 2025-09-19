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
    pub work_type: String,
    pub status: String,
    pub result_summary: Option<String>,
    pub time_spent_minutes: i32,
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
            work_type: Set(history_data.work_type),
            status: Set(history_data.status),
            result_summary: Set(history_data.result_summary),
            time_spent_minutes: Set(history_data.time_spent_minutes),
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
        status: String,
        result_summary: Option<String>,
    ) -> Result<agent_work_history::Model> {
        let history = agent_work_history::Entity::find_by_id(history_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("AgentWorkHistory", history_id))?;
        
        let mut history: agent_work_history::ActiveModel = history.into();
        history.status = Set(status);
        if let Some(summary) = result_summary {
            history.result_summary = Set(Some(summary));
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
            work_type: "development".to_string(),
            status: "completed".to_string(),
            result_summary: Some("任务完成成功".to_string()),
            time_spent_minutes: 120,
        };
        
        let history = repo.create(history_data).await.unwrap();
        
        assert_eq!(history.work_type, "development");
        assert_eq!(history.status, "completed");
        assert_eq!(history.time_spent_minutes, 120);
    }

    #[tokio::test]
    async fn test_find_by_agent_id() {
        let db = setup_test_db().await;
        let repo = AgentWorkHistoryRepository::new(db.clone());
        
        let agent_id = Uuid::new_v4();
        let history_data = CreateAgentWorkHistoryData {
            agent_id,
            task_id: Uuid::new_v4(),
            work_type: "development".to_string(),
            status: "completed".to_string(),
            result_summary: Some("任务完成成功".to_string()),
            time_spent_minutes: 120,
        };
        
        let _created_history = repo.create(history_data).await.unwrap();
        
        let histories = repo.find_by_agent_id(agent_id).await.unwrap();
        assert_eq!(histories.len(), 1);
        assert_eq!(histories[0].agent_id, agent_id);
    }
}