//! 领域事件实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 领域事件实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "domain_events")]
pub struct Model {
    /// 事件ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub event_id: Uuid,
    
    /// 事件类型：AgentCreated, TaskAssigned, ConflictDetected 等
    pub event_type: String,
    
    /// 聚合类型：Agent, Project, Task 等
    pub aggregate_type: String,
    
    /// 聚合根ID
    pub aggregate_id: Uuid,
    
    /// 事件载荷数据
    #[sea_orm(column_type = "Json")]
    pub event_data: JsonValue,
    
    /// 事件版本
    pub event_version: i32,
    
    /// 触发事件的用户
    pub user_id: Option<Uuid>,
    
    /// 相关会话ID
    pub session_id: Option<Uuid>,
    
    /// 关联ID（用于追踪相关事件）
    pub correlation_id: Option<Uuid>,
    
    /// 事件发生时间
    pub occurred_at: DateTimeWithTimeZone,
    
    /// 事件处理时间
    pub processed_at: Option<DateTimeWithTimeZone>,
    
    /// 是否已处理
    pub is_processed: bool,
    
    /// 处理尝试次数
    pub processing_attempts: i32,
    
    /// 处理失败时的错误信息
    pub error_message: Option<String>,
}

/// 领域事件关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
    
    /// 与事件发布日志的关联关系
    #[sea_orm(has_many = "super::event_publish_log::Entity")]
    PublishLogs,
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 事件发布日志关联实现
impl Related<super::event_publish_log::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PublishLogs.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 事件类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DomainEventType {
    /// Agent已创建
    AgentCreated,
    /// Agent状态已更改
    AgentStatusChanged,
    /// 任务已分配
    TaskAssigned,
    /// 任务已开始
    TaskStarted,
    /// 任务已完成
    TaskCompleted,
    /// 任务失败
    TaskFailed,
    /// 冲突已检测
    ConflictDetected,
    /// 冲突已解决
    ConflictResolved,
    /// 项目已创建
    ProjectCreated,
    /// 执行会话已开始
    ExecutionSessionStarted,
    /// 执行会话已完成
    ExecutionSessionCompleted,
}

impl std::fmt::Display for DomainEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DomainEventType::AgentCreated => write!(f, "AgentCreated"),
            DomainEventType::AgentStatusChanged => write!(f, "AgentStatusChanged"),
            DomainEventType::TaskAssigned => write!(f, "TaskAssigned"),
            DomainEventType::TaskStarted => write!(f, "TaskStarted"),
            DomainEventType::TaskCompleted => write!(f, "TaskCompleted"),
            DomainEventType::TaskFailed => write!(f, "TaskFailed"),
            DomainEventType::ConflictDetected => write!(f, "ConflictDetected"),
            DomainEventType::ConflictResolved => write!(f, "ConflictResolved"),
            DomainEventType::ProjectCreated => write!(f, "ProjectCreated"),
            DomainEventType::ExecutionSessionStarted => write!(f, "ExecutionSessionStarted"),
            DomainEventType::ExecutionSessionCompleted => write!(f, "ExecutionSessionCompleted"),
        }
    }
}

/// 聚合类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregateType {
    /// 用户
    User,
    /// 项目
    Project,
    /// 任务
    Task,
    /// Agent
    Agent,
    /// 冲突
    Conflict,
    /// 执行会话
    ExecutionSession,
}

impl std::fmt::Display for AggregateType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AggregateType::User => write!(f, "User"),
            AggregateType::Project => write!(f, "Project"),
            AggregateType::Task => write!(f, "Task"),
            AggregateType::Agent => write!(f, "Agent"),
            AggregateType::Conflict => write!(f, "Conflict"),
            AggregateType::ExecutionSession => write!(f, "ExecutionSession"),
        }
    }
}