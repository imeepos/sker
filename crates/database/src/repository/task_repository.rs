//! 任务仓储实现

use crate::{entities::task, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 任务仓储
pub struct TaskRepository {
    db: DatabaseConnection,
}

impl TaskRepository {
    /// 创建新的任务仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新任务
    pub async fn create(&self, task_data: CreateTaskData) -> Result<task::Model> {
        let now = chrono::Utc::now().into();
        let task_id = Uuid::new_v4();
        
        let task = task::ActiveModel {
            task_id: Set(task_id),
            project_id: Set(task_data.project_id),
            parent_task_id: Set(task_data.parent_task_id),
            llm_session_id: Set(task_data.llm_session_id),
            title: Set(task_data.title),
            description: Set(task_data.description),
            task_type: Set(task_data.task_type),
            priority: Set("medium".to_string()),
            status: Set("pending".to_string()),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };
        
        let _result = task::Entity::insert(task).exec(&self.db).await?;
        
        // 获取插入的任务
        task::Entity::find_by_id(task_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Task", task_id))
    }
    
    /// 根据ID查找任务
    pub async fn find_by_id(&self, task_id: Uuid) -> Result<Option<task::Model>> {
        task::Entity::find_by_id(task_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据项目ID查找任务
    pub async fn find_by_project(&self, project_id: Uuid) -> Result<Vec<task::Model>> {
        task::Entity::find()
            .filter(task::Column::ProjectId.eq(project_id))
            .order_by_asc(task::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据父任务ID查找子任务
    pub async fn find_subtasks(&self, parent_task_id: Uuid) -> Result<Vec<task::Model>> {
        task::Entity::find()
            .filter(task::Column::ParentTaskId.eq(parent_task_id))
            .order_by_asc(task::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据状态查找任务
    pub async fn find_by_status(&self, project_id: Uuid, status: &str) -> Result<Vec<task::Model>> {
        task::Entity::find()
            .filter(task::Column::ProjectId.eq(project_id))
            .filter(task::Column::Status.eq(status))
            .order_by_asc(task::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据分配的Agent查找任务
    pub async fn find_by_agent(&self, agent_id: Uuid) -> Result<Vec<task::Model>> {
        task::Entity::find()
            .filter(task::Column::AssignedAgentId.eq(agent_id))
            .order_by_desc(task::Column::UpdatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 查找顶级任务（没有父任务的任务）
    pub async fn find_top_level_tasks(&self, project_id: Uuid) -> Result<Vec<task::Model>> {
        task::Entity::find()
            .filter(task::Column::ProjectId.eq(project_id))
            .filter(task::Column::ParentTaskId.is_null())
            .order_by_asc(task::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新任务状态
    pub async fn update_status(
        &self,
        task_id: Uuid,
        status: &str,
    ) -> Result<task::Model> {
        let task = task::Entity::find_by_id(task_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Task", task_id))?;
        
        let now = chrono::Utc::now().into();
        let mut task: task::ActiveModel = task.into();
        
        task.status = Set(status.to_string());
        task.updated_at = Set(now);
        
        // 设置状态相关的时间戳
        match status {
            "in_progress" => {
                if task.started_at.is_not_set() {
                    task.started_at = Set(Some(now));
                }
            }
            "completed" | "failed" => {
                if task.completed_at.is_not_set() {
                    task.completed_at = Set(Some(now));
                }
            }
            _ => {}
        }
        
        task.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 分配任务给Agent
    pub async fn assign_to_agent(
        &self,
        task_id: Uuid,
        agent_id: Uuid,
        assignment_prompt: String,
    ) -> Result<task::Model> {
        let task = task::Entity::find_by_id(task_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Task", task_id))?;
        
        let now = chrono::Utc::now().into();
        let mut task: task::ActiveModel = task.into();
        
        task.assigned_agent_id = Set(Some(agent_id));
        task.assignment_prompt = Set(Some(assignment_prompt));
        task.assigned_at = Set(Some(now));
        task.updated_at = Set(now);
        
        task.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新任务详情
    pub async fn update_details(
        &self,
        task_id: Uuid,
        title: Option<String>,
        description: Option<String>,
        priority: Option<String>,
        estimated_hours: Option<i32>,
    ) -> Result<task::Model> {
        let task = task::Entity::find_by_id(task_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Task", task_id))?;
        
        let mut task: task::ActiveModel = task.into();
        
        if let Some(new_title) = title {
            task.title = Set(new_title);
        }
        
        if let Some(new_description) = description {
            task.description = Set(new_description);
        }
        
        if let Some(new_priority) = priority {
            task.priority = Set(new_priority);
        }
        
        if let Some(hours) = estimated_hours {
            task.estimated_hours = Set(Some(hours));
        }
        
        task.updated_at = Set(chrono::Utc::now().into());
        
        task.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新任务需求配置
    pub async fn update_requirements(
        &self,
        task_id: Uuid,
        required_capabilities: Option<JsonValue>,
        acceptance_criteria: Option<JsonValue>,
    ) -> Result<task::Model> {
        let task = task::Entity::find_by_id(task_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("Task", task_id))?;
        
        let mut task: task::ActiveModel = task.into();
        
        if let Some(capabilities) = required_capabilities {
            task.required_capabilities = Set(Some(capabilities));
        }
        
        if let Some(criteria) = acceptance_criteria {
            task.acceptance_criteria = Set(Some(criteria));
        }
        
        task.updated_at = Set(chrono::Utc::now().into());
        
        task.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除任务
    pub async fn delete(&self, task_id: Uuid) -> Result<()> {
        task::Entity::delete_by_id(task_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
}

/// 创建任务的数据结构
#[derive(Debug, Clone)]
pub struct CreateTaskData {
    pub project_id: Uuid,
    pub parent_task_id: Option<Uuid>,
    pub llm_session_id: Option<Uuid>,
    pub title: String,
    pub description: String,
    pub task_type: String,
}