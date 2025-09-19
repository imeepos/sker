//! Agent工作历史实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// Agent工作历史实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "agent_work_history")]
pub struct Model {
    /// 历史记录ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub history_id: Uuid,
    
    /// Agent ID
    pub agent_id: Uuid,
    
    /// 任务ID
    pub task_id: Uuid,
    
    /// 任务类型：development, testing, code_review 等
    pub task_type: String,
    
    /// 工作开始时间
    pub started_at: DateTimeWithTimeZone,
    
    /// 工作完成时间
    pub completed_at: Option<DateTimeWithTimeZone>,
    
    /// 是否成功完成
    pub success: Option<bool>,
    
    /// 完成时间（分钟）
    pub completion_time_minutes: Option<i32>,
    
    /// 质量评分 (0.0-1.0)
    pub quality_score: Option<f64>,
    
    /// 工作详情（JSON格式）
    #[sea_orm(column_type = "Json")]
    pub work_details: Option<JsonValue>,
    
    /// 使用的技术栈
    #[sea_orm(column_type = "Json")]
    pub technologies_used: JsonValue,
    
    /// 错误信息（如果失败）
    pub error_message: Option<String>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// Agent工作历史关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与Agent的关联关系
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AgentId",
        to = "super::agent::Column::AgentId"
    )]
    Agent,
    
    /// 与任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::TaskId",
        to = "super::task::Column::TaskId"
    )]
    Task,
}

/// Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agent.def()
    }
}

/// 任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 任务类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkTaskType {
    /// 开发
    Development,
    /// 测试
    Testing,
    /// 代码审查
    CodeReview,
    /// 文档编写
    Documentation,
    /// Bug修复
    BugFix,
    /// 性能优化
    PerformanceOptimization,
    /// 重构
    Refactoring,
    /// 部署
    Deployment,
}

impl std::fmt::Display for WorkTaskType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkTaskType::Development => write!(f, "development"),
            WorkTaskType::Testing => write!(f, "testing"),
            WorkTaskType::CodeReview => write!(f, "code_review"),
            WorkTaskType::Documentation => write!(f, "documentation"),
            WorkTaskType::BugFix => write!(f, "bug_fix"),
            WorkTaskType::PerformanceOptimization => write!(f, "performance_optimization"),
            WorkTaskType::Refactoring => write!(f, "refactoring"),
            WorkTaskType::Deployment => write!(f, "deployment"),
        }
    }
}

impl From<String> for WorkTaskType {
    fn from(task_type: String) -> Self {
        match task_type.as_str() {
            "development" => WorkTaskType::Development,
            "testing" => WorkTaskType::Testing,
            "code_review" => WorkTaskType::CodeReview,
            "documentation" => WorkTaskType::Documentation,
            "bug_fix" => WorkTaskType::BugFix,
            "performance_optimization" => WorkTaskType::PerformanceOptimization,
            "refactoring" => WorkTaskType::Refactoring,
            "deployment" => WorkTaskType::Deployment,
            _ => WorkTaskType::Development,
        }
    }
}