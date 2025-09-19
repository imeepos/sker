//! 任务实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 任务实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "tasks")]
pub struct Model {
    /// 任务ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub task_id: Uuid,
    
    /// 所属项目ID
    pub project_id: Uuid,
    
    /// 父任务ID（支持任务层级）
    pub parent_task_id: Option<Uuid>,
    
    /// 创建此任务的LLM会话ID
    pub llm_session_id: Option<Uuid>,
    
    /// 任务标题
    pub title: String,
    
    /// 任务描述
    pub description: String,
    
    /// 任务类型
    pub task_type: String,
    
    /// 优先级
    pub priority: String,
    
    /// 需要的Agent能力
    #[sea_orm(column_type = "Json")]
    pub required_capabilities: Option<JsonValue>,
    
    /// 验收标准
    #[sea_orm(column_type = "Json")]
    pub acceptance_criteria: Option<JsonValue>,
    
    /// 预估工作量（小时）
    pub estimated_hours: Option<i32>,
    
    /// 分配的Agent ID
    pub assigned_agent_id: Option<Uuid>,
    
    /// 分配给Agent时的提示词
    pub assignment_prompt: Option<String>,
    
    /// 分配时间
    pub assigned_at: Option<DateTimeWithTimeZone>,
    
    /// 任务状态
    pub status: String,
    
    /// 开始时间
    pub started_at: Option<DateTimeWithTimeZone>,
    
    /// 完成时间
    pub completed_at: Option<DateTimeWithTimeZone>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
}

/// 任务关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与项目的关联关系
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::ProjectId"
    )]
    Project,
    
    /// 与父任务的关联关系（自引用）
    #[sea_orm(
        belongs_to = "Entity",
        from = "Column::ParentTaskId",
        to = "Column::TaskId"
    )]
    ParentTask,
    
    /// 与LLM会话的关联关系
    #[sea_orm(
        belongs_to = "super::llm_session::Entity",
        from = "Column::LlmSessionId",
        to = "super::llm_session::Column::SessionId"
    )]
    LlmSession,
    
    /// 与分配Agent的关联关系
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AssignedAgentId",
        to = "super::agent::Column::AgentId"
    )]
    AssignedAgent,
}

/// 项目关联实现
impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

/// LLM会话关联实现
impl Related<super::llm_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LlmSession.def()
    }
}

/// 分配Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AssignedAgent.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}