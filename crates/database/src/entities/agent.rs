//! Agent实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// Agent实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "agents")]
pub struct Model {
    /// Agent ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub agent_id: Uuid,
    
    /// 所属用户ID
    pub user_id: Uuid,
    
    /// Agent名称
    pub name: String,
    
    /// Agent描述
    pub description: Option<String>,
    
    /// 提示词模板
    pub prompt_template: String,
    
    /// Agent能力配置（JSON格式存储AgentCapability数组）
    #[sea_orm(column_type = "Json")]
    pub capabilities: JsonValue,
    
    /// 详细配置信息
    #[sea_orm(column_type = "Json")]
    pub config: JsonValue,
    
    /// Git相关配置
    #[sea_orm(column_type = "Json")]
    pub git_config: Option<JsonValue>,
    
    /// Agent状态：idle, working, paused, error, offline
    pub status: String,
    
    /// 当前执行任务ID
    pub current_task_id: Option<Uuid>,
    
    /// 总完成任务数
    pub total_tasks_completed: i32,
    
    /// 成功率 (0.0-1.0)
    pub success_rate: f64,
    
    /// 平均完成时间（分钟）
    pub average_completion_time: i32,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// 最后活跃时间
    pub last_active_at: DateTimeWithTimeZone,
}

/// Agent关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
    
    /// 与当前任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::CurrentTaskId",
        to = "super::task::Column::TaskId"
    )]
    CurrentTask,
    
    /// 与工作历史的关联关系
    #[sea_orm(has_many = "super::agent_work_history::Entity")]
    WorkHistory,
    
    /// 与已分配任务的关联关系
    #[sea_orm(has_many = "super::task::Entity")]
    AssignedTasks,
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 当前任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CurrentTask.def()
    }
}

/// Agent工作历史关联实现  
impl Related<super::agent_work_history::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WorkHistory.def()
    }
}

// 注意：Agent与Task的关联通过CurrentTask关系处理，AssignedTasks通过反向查询获取

impl ActiveModelBehavior for ActiveModel {}

/// Agent能力枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentCapability {
    /// 前端开发
    FrontendDevelopment,
    /// 后端开发
    BackendDevelopment,
    /// 数据库开发
    DatabaseDevelopment,
    /// DevOps
    DevOps,
    /// 测试
    Testing,
    /// 代码审查
    CodeReview,
    /// 文档编写
    Documentation,
    /// API设计
    ApiDesign,
    /// 性能优化
    PerformanceOptimization,
    /// 安全审计
    SecurityAudit,
}

/// Agent状态枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentStatus {
    /// 空闲
    Idle,
    /// 工作中
    Working,
    /// 暂停
    Paused,
    /// 错误
    Error,
    /// 离线
    Offline,
}

impl std::fmt::Display for AgentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentStatus::Idle => write!(f, "idle"),
            AgentStatus::Working => write!(f, "working"),
            AgentStatus::Paused => write!(f, "paused"),
            AgentStatus::Error => write!(f, "error"),
            AgentStatus::Offline => write!(f, "offline"),
        }
    }
}

impl From<String> for AgentStatus {
    fn from(status: String) -> Self {
        match status.as_str() {
            "idle" => AgentStatus::Idle,
            "working" => AgentStatus::Working,
            "paused" => AgentStatus::Paused,
            "error" => AgentStatus::Error,
            "offline" => AgentStatus::Offline,
            _ => AgentStatus::Idle,
        }
    }
}