//! 冲突处理实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 冲突实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "conflicts")]
pub struct Model {
    /// 冲突ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub conflict_id: Uuid,
    
    /// 冲突类型：git_merge, resource, task_dependency, capability, timeline
    pub conflict_type: String,
    
    /// 严重性：low, medium, high, critical
    pub severity: String,
    
    /// 冲突标题
    pub title: String,
    
    /// 冲突描述
    pub description: String,
    
    /// 相关实体（JSON格式存储实体ID和类型）
    #[sea_orm(column_type = "Json")]
    pub related_entities: JsonValue,
    
    /// 受影响的任务
    #[sea_orm(column_type = "Json")]
    pub affected_tasks: JsonValue,
    
    /// 受影响的Agent
    #[sea_orm(column_type = "Json")]
    pub affected_agents: JsonValue,
    
    /// 冲突状态：detected, analyzing, escalated, resolving, resolved, ignored
    pub status: String,
    
    /// 是否上报给人工处理
    pub escalated_to_human: bool,
    
    /// 分配的用户ID
    pub assigned_user_id: Option<Uuid>,
    
    /// 解决策略
    pub resolution_strategy: Option<String>,
    
    /// 解决备注
    pub resolution_note: Option<String>,
    
    /// 是否自动解决
    pub auto_resolved: bool,
    
    /// 检测时间
    pub detected_at: DateTimeWithTimeZone,
    
    /// 上报时间
    pub escalated_at: Option<DateTimeWithTimeZone>,
    
    /// 解决时间
    pub resolved_at: Option<DateTimeWithTimeZone>,
}

/// 冲突关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与分配用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::AssignedUserId",
        to = "super::user::Column::UserId"
    )]
    AssignedUser,
    
    /// 与人工决策的关联关系
    #[sea_orm(has_many = "super::human_decision::Entity")]
    HumanDecisions,
}

/// 分配用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AssignedUser.def()
    }
}

/// 人工决策关联实现
impl Related<super::human_decision::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::HumanDecisions.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 冲突类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictType {
    /// Git合并冲突
    GitMerge,
    /// 资源冲突
    Resource,
    /// 任务依赖冲突
    TaskDependency,
    /// 能力冲突
    Capability,
    /// 时间线冲突
    Timeline,
}

impl std::fmt::Display for ConflictType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConflictType::GitMerge => write!(f, "git_merge"),
            ConflictType::Resource => write!(f, "resource"),
            ConflictType::TaskDependency => write!(f, "task_dependency"),
            ConflictType::Capability => write!(f, "capability"),
            ConflictType::Timeline => write!(f, "timeline"),
        }
    }
}

/// 冲突严重性枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictSeverity {
    /// 低级
    Low,
    /// 中级
    Medium,
    /// 高级
    High,
    /// 关键
    Critical,
}

impl std::fmt::Display for ConflictSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConflictSeverity::Low => write!(f, "low"),
            ConflictSeverity::Medium => write!(f, "medium"),
            ConflictSeverity::High => write!(f, "high"),
            ConflictSeverity::Critical => write!(f, "critical"),
        }
    }
}

/// 冲突状态枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictStatus {
    /// 已检测
    Detected,
    /// 分析中
    Analyzing,
    /// 已上报
    Escalated,
    /// 解决中
    Resolving,
    /// 已解决
    Resolved,
    /// 已忽略
    Ignored,
}

impl std::fmt::Display for ConflictStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConflictStatus::Detected => write!(f, "detected"),
            ConflictStatus::Analyzing => write!(f, "analyzing"),
            ConflictStatus::Escalated => write!(f, "escalated"),
            ConflictStatus::Resolving => write!(f, "resolving"),
            ConflictStatus::Resolved => write!(f, "resolved"),
            ConflictStatus::Ignored => write!(f, "ignored"),
        }
    }
}