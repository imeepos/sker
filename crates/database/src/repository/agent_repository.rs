//! Agent仓储实现

use crate::entities::agent::{self, Entity as Agent, ActiveModel, Model, AgentStatus};
use crate::error::{DatabaseError, Result};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, 
    QueryFilter, QueryOrder, PaginatorTrait,
};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// Agent仓储
pub struct AgentRepository {
    db: DatabaseConnection,
}

impl AgentRepository {
    /// 创建新的Agent仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的Agent
    pub async fn create(&self, agent_data: CreateAgentData) -> Result<Model> {
        let agent = ActiveModel {
            agent_id: Set(Uuid::new_v4()),
            user_id: Set(agent_data.user_id),
            name: Set(agent_data.name),
            description: Set(agent_data.description),
            prompt_template: Set(agent_data.prompt_template),
            capabilities: Set(agent_data.capabilities),
            config: Set(agent_data.config),
            git_config: Set(agent_data.git_config),
            status: Set(AgentStatus::Idle.to_string()),
            skill_profile: Set(None),
            skill_assessments: Set(None),
            performance_trend: Set(None),
            current_task_id: Set(None),
            total_tasks_completed: Set(0),
            success_rate: Set(0.0),
            average_completion_time: Set(0),
            created_at: Set(chrono::Utc::now().into()),
            updated_at: Set(chrono::Utc::now().into()),
            last_active_at: Set(chrono::Utc::now().into()),
        };

        agent.insert(&self.db).await.map_err(DatabaseError::from)
    }

    /// 根据ID查找Agent
    pub async fn find_by_id(&self, agent_id: Uuid) -> Result<Option<Model>> {
        Agent::find_by_id(agent_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据用户ID查找所有Agent
    pub async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<Model>> {
        Agent::find()
            .filter(agent::Column::UserId.eq(user_id))
            .order_by_asc(agent::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据状态查找Agent
    pub async fn find_by_status(&self, status: AgentStatus) -> Result<Vec<Model>> {
        Agent::find()
            .filter(agent::Column::Status.eq(status.to_string()))
            .order_by_asc(agent::Column::LastActiveAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找空闲的Agent
    pub async fn find_idle_agents(&self) -> Result<Vec<Model>> {
        self.find_by_status(AgentStatus::Idle).await
    }

    /// 根据能力查找Agent
    pub async fn find_by_capabilities(&self, required_capabilities: &[String]) -> Result<Vec<Model>> {
        let mut query = Agent::find();
        
        for capability in required_capabilities {
            // 使用JSON查询查找包含指定能力的Agent
            query = query.filter(
                agent::Column::Capabilities.contains(&format!("\"{}\"", capability))
            );
        }
        
        query
            .order_by_desc(agent::Column::SuccessRate)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 分页查询Agent
    pub async fn find_with_pagination(
        &self, 
        page: u64, 
        page_size: u64
    ) -> Result<(Vec<Model>, u64)> {
        let paginator = Agent::find()
            .order_by_desc(agent::Column::CreatedAt)
            .paginate(&self.db, page_size);

        let total_pages = paginator.num_pages().await.map_err(DatabaseError::from)?;
        let agents = paginator.fetch_page(page).await.map_err(DatabaseError::from)?;

        Ok((agents, total_pages))
    }

    /// 更新Agent状态
    pub async fn update_status(
        &self, 
        agent_id: Uuid, 
        status: AgentStatus,
        current_task_id: Option<Uuid>
    ) -> Result<Model> {
        let agent = self.find_by_id(agent_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Agent", agent_id.to_string()))?;

        let mut agent_active: ActiveModel = agent.into();
        agent_active.status = Set(status.to_string());
        agent_active.current_task_id = Set(current_task_id);
        agent_active.last_active_at = Set(chrono::Utc::now().into());
        agent_active.updated_at = Set(chrono::Utc::now().into());

        agent_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 更新Agent统计信息
    pub async fn update_statistics(
        &self,
        agent_id: Uuid,
        stats: AgentStatistics
    ) -> Result<Model> {
        let agent = self.find_by_id(agent_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Agent", agent_id.to_string()))?;

        let mut agent_active: ActiveModel = agent.into();
        
        if let Some(completed_tasks) = stats.total_tasks_completed {
            agent_active.total_tasks_completed = Set(completed_tasks);
        }
        
        if let Some(success_rate) = stats.success_rate {
            agent_active.success_rate = Set(success_rate);
        }
        
        if let Some(avg_time) = stats.average_completion_time {
            agent_active.average_completion_time = Set(avg_time);
        }
        
        agent_active.updated_at = Set(chrono::Utc::now().into());

        agent_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 更新Agent配置
    pub async fn update_config(
        &self,
        agent_id: Uuid,
        config: JsonValue,
        git_config: Option<JsonValue>
    ) -> Result<Model> {
        let agent = self.find_by_id(agent_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Agent", agent_id.to_string()))?;

        let mut agent_active: ActiveModel = agent.into();
        agent_active.config = Set(config);
        if let Some(git_config) = git_config {
            agent_active.git_config = Set(Some(git_config));
        }
        agent_active.updated_at = Set(chrono::Utc::now().into());

        agent_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 删除Agent
    pub async fn delete(&self, agent_id: Uuid) -> Result<()> {
        Agent::delete_by_id(agent_id)
            .exec(&self.db)
            .await
            .map_err(DatabaseError::from)?;
        
        Ok(())
    }

    /// 获取Agent性能统计
    pub async fn get_performance_stats(&self, agent_id: Uuid) -> Result<AgentPerformance> {
        let agent = self.find_by_id(agent_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Agent", agent_id.to_string()))?;

        // 这里可以扩展为从工作历史表中计算更详细的统计信息
        Ok(AgentPerformance {
            agent_id,
            total_tasks_completed: agent.total_tasks_completed,
            success_rate: agent.success_rate,
            average_completion_time: agent.average_completion_time,
            current_status: AgentStatus::from(agent.status),
            last_active_at: agent.last_active_at,
        })
    }

    /// 查找最佳匹配的Agent
    pub async fn find_best_match(
        &self,
        required_capabilities: &[String],
        exclude_busy: bool
    ) -> Result<Option<Model>> {
        let mut query = Agent::find();

        // 如果需要排除忙碌的Agent
        if exclude_busy {
            query = query.filter(agent::Column::Status.eq(AgentStatus::Idle.to_string()));
        }

        // 根据能力筛选
        for capability in required_capabilities {
            query = query.filter(
                agent::Column::Capabilities.contains(&format!("\"{}\"", capability))
            );
        }

        // 按成功率和平均完成时间排序
        query
            .order_by_desc(agent::Column::SuccessRate)
            .order_by_asc(agent::Column::AverageCompletionTime)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
}

/// 创建Agent的数据结构
#[derive(Debug, Clone)]
pub struct CreateAgentData {
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub prompt_template: String,
    pub capabilities: JsonValue,
    pub config: JsonValue,
    pub git_config: Option<JsonValue>,
}

/// Agent统计信息更新数据
#[derive(Debug, Clone, Default)]
pub struct AgentStatistics {
    pub total_tasks_completed: Option<i32>,
    pub success_rate: Option<f64>,
    pub average_completion_time: Option<i32>,
}

/// Agent性能统计
#[derive(Debug, Clone)]
pub struct AgentPerformance {
    pub agent_id: Uuid,
    pub total_tasks_completed: i32,
    pub success_rate: f64,
    pub average_completion_time: i32,
    pub current_status: AgentStatus,
    pub last_active_at: sea_orm::prelude::DateTimeWithTimeZone,
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
    async fn test_create_agent() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = AgentRepository::new(db);
        
        let agent_data = CreateAgentData {
            user_id,
            name: "测试Agent".to_string(),
            description: Some("这是一个测试Agent".to_string()),
            prompt_template: "你是一个有用的助手".to_string(),
            capabilities: serde_json::json!(["FrontendDevelopment", "BackendDevelopment"]),
            config: serde_json::json!({"max_concurrent_tasks": 3}),
            git_config: None,
        };
        
        let agent = repo.create(agent_data).await.unwrap();
        
        assert_eq!(agent.name, "测试Agent");
        assert_eq!(agent.user_id, user_id);
        assert_eq!(agent.status, "idle");
        assert_eq!(agent.total_tasks_completed, 0);
        assert_eq!(agent.success_rate, 0.0);
    }

    #[tokio::test]
    async fn test_find_by_user_id() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = AgentRepository::new(db);
        
        // 创建两个Agent
        let agent_data1 = CreateAgentData {
            user_id,
            name: "Agent1".to_string(),
            description: None,
            prompt_template: "Prompt1".to_string(),
            capabilities: serde_json::json!(["FrontendDevelopment"]),
            config: serde_json::json!({}),
            git_config: None,
        };
        
        let agent_data2 = CreateAgentData {
            user_id,
            name: "Agent2".to_string(),
            description: None,
            prompt_template: "Prompt2".to_string(),
            capabilities: serde_json::json!(["BackendDevelopment"]),
            config: serde_json::json!({}),
            git_config: None,
        };
        
        repo.create(agent_data1).await.unwrap();
        repo.create(agent_data2).await.unwrap();
        
        let agents = repo.find_by_user_id(user_id).await.unwrap();
        assert_eq!(agents.len(), 2);
    }

    #[tokio::test]
    async fn test_update_status() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = AgentRepository::new(db);
        
        let agent_data = CreateAgentData {
            user_id,
            name: "测试Agent".to_string(),
            description: None,
            prompt_template: "测试提示词".to_string(),
            capabilities: serde_json::json!(["Testing"]),
            config: serde_json::json!({}),
            git_config: None,
        };
        
        let agent = repo.create(agent_data).await.unwrap();
        assert_eq!(agent.status, "idle");
        
        let task_id = Uuid::new_v4();
        let updated_agent = repo.update_status(agent.agent_id, AgentStatus::Working, Some(task_id))
            .await.unwrap();
        
        assert_eq!(updated_agent.status, "working");
        assert_eq!(updated_agent.current_task_id, Some(task_id));
    }

    #[tokio::test]
    async fn test_find_idle_agents() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = AgentRepository::new(db);
        
        // 创建一个空闲Agent
        let agent_data1 = CreateAgentData {
            user_id,
            name: "IdleAgent".to_string(),
            description: None,
            prompt_template: "Prompt".to_string(),
            capabilities: serde_json::json!(["Testing"]),
            config: serde_json::json!({}),
            git_config: None,
        };
        
        let idle_agent = repo.create(agent_data1).await.unwrap();
        
        // 创建一个工作中的Agent
        let agent_data2 = CreateAgentData {
            user_id,
            name: "WorkingAgent".to_string(),
            description: None,
            prompt_template: "Prompt".to_string(),
            capabilities: serde_json::json!(["Testing"]),
            config: serde_json::json!({}),
            git_config: None,
        };
        
        let working_agent = repo.create(agent_data2).await.unwrap();
        repo.update_status(working_agent.agent_id, AgentStatus::Working, None).await.unwrap();
        
        let idle_agents = repo.find_idle_agents().await.unwrap();
        assert_eq!(idle_agents.len(), 1);
        assert_eq!(idle_agents[0].agent_id, idle_agent.agent_id);
    }

    #[tokio::test]
    async fn test_update_statistics() {
        let db = setup_test_db().await;
        let user_id = create_test_user(&db).await;
        let repo = AgentRepository::new(db);
        
        let agent_data = CreateAgentData {
            user_id,
            name: "测试Agent".to_string(),
            description: None,
            prompt_template: "测试提示词".to_string(),
            capabilities: serde_json::json!(["Testing"]),
            config: serde_json::json!({}),
            git_config: None,
        };
        
        let agent = repo.create(agent_data).await.unwrap();
        
        let stats = AgentStatistics {
            total_tasks_completed: Some(5),
            success_rate: Some(0.8),
            average_completion_time: Some(30),
        };
        
        let updated_agent = repo.update_statistics(agent.agent_id, stats).await.unwrap();
        
        assert_eq!(updated_agent.total_tasks_completed, 5);
        assert_eq!(updated_agent.success_rate, 0.8);
        assert_eq!(updated_agent.average_completion_time, 30);
    }
}