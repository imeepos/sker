//! 人工决策实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 人工决策实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "human_decisions")]
pub struct Model {
    /// 决策ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub decision_id: Uuid,
    
    /// 冲突ID
    pub conflict_id: Uuid,
    
    /// 用户ID
    pub user_id: Uuid,
    
    /// 决策类型：approve, reject, modify, escalate
    pub decision_type: String,
    
    /// 决策详细数据
    #[sea_orm(column_type = "Json")]
    pub decision_data: Option<JsonValue>,
    
    /// 决策理由
    pub reasoning: Option<String>,
    
    /// 决策影响的实体
    #[sea_orm(column_type = "Json")]
    pub affected_entities: JsonValue,
    
    /// 后续行动计划
    #[sea_orm(column_type = "Json")]
    pub follow_up_actions: JsonValue,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// 人工决策关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与冲突的关联关系
    #[sea_orm(
        belongs_to = "super::conflict::Entity",
        from = "Column::ConflictId",
        to = "super::conflict::Column::ConflictId"
    )]
    Conflict,
    
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
}

/// 冲突关联实现
impl Related<super::conflict::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Conflict.def()
    }
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 决策类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DecisionType {
    /// 批准
    Approve,
    /// 拒绝
    Reject,
    /// 修改
    Modify,
    /// 升级
    Escalate,
}

impl std::fmt::Display for DecisionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DecisionType::Approve => write!(f, "approve"),
            DecisionType::Reject => write!(f, "reject"),
            DecisionType::Modify => write!(f, "modify"),
            DecisionType::Escalate => write!(f, "escalate"),
        }
    }
}

impl From<String> for DecisionType {
    fn from(decision_type: String) -> Self {
        match decision_type.as_str() {
            "approve" => DecisionType::Approve,
            "reject" => DecisionType::Reject,
            "modify" => DecisionType::Modify,
            "escalate" => DecisionType::Escalate,
            _ => DecisionType::Approve,
        }
    }
}