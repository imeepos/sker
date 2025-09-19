//! 执行会话实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 执行会话实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "execution_sessions")]
pub struct Model {
    /// 会话ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub session_id: Uuid,
    
    /// 任务ID
    pub task_id: Uuid,
    
    /// Agent ID
    pub agent_id: Uuid,
    
    /// 项目ID
    pub project_id: Uuid,
    
    /// Git分支
    pub git_branch: String,
    
    /// 基础提交
    pub base_commit: Option<String>,
    
    /// 最终提交
    pub final_commit: Option<String>,
    
    /// 执行配置
    #[sea_orm(column_type = "Json")]
    pub execution_config: Option<JsonValue>,
    
    /// 超时时间（分钟）
    pub timeout_minutes: i32,
    
    /// 执行状态：pending, running, completed, failed, timeout
    pub status: String,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 开始时间
    pub started_at: Option<DateTimeWithTimeZone>,
    
    /// 完成时间
    pub completed_at: Option<DateTimeWithTimeZone>,
    
    /// 是否成功
    pub success: Option<bool>,
    
    /// 执行结果数据
    #[sea_orm(column_type = "Json")]
    pub result_data: Option<JsonValue>,
    
    /// 错误信息
    pub error_message: Option<String>,
}

/// 执行会话关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::TaskId",
        to = "super::task::Column::TaskId"
    )]
    Task,
    
    /// 与Agent的关联关系
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AgentId",
        to = "super::agent::Column::AgentId"
    )]
    Agent,
    
    /// 与项目的关联关系
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::ProjectId"
    )]
    Project,
    
    /// 与执行日志的关联关系
    #[sea_orm(has_many = "super::execution_log::Entity")]
    ExecutionLogs,
}

/// 任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

/// Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agent.def()
    }
}

/// 项目关联实现
impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

/// 执行日志关联实现
impl Related<super::execution_log::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ExecutionLogs.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 执行状态枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExecutionStatus {
    /// 等待中
    Pending,
    /// 运行中
    Running,
    /// 已完成
    Completed,
    /// 失败
    Failed,
    /// 超时
    Timeout,
}

impl std::fmt::Display for ExecutionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExecutionStatus::Pending => write!(f, "pending"),
            ExecutionStatus::Running => write!(f, "running"),
            ExecutionStatus::Completed => write!(f, "completed"),
            ExecutionStatus::Failed => write!(f, "failed"),
            ExecutionStatus::Timeout => write!(f, "timeout"),
        }
    }
}

impl From<String> for ExecutionStatus {
    fn from(status: String) -> Self {
        match status.as_str() {
            "pending" => ExecutionStatus::Pending,
            "running" => ExecutionStatus::Running,
            "completed" => ExecutionStatus::Completed,
            "failed" => ExecutionStatus::Failed,
            "timeout" => ExecutionStatus::Timeout,
            _ => ExecutionStatus::Pending,
        }
    }
}