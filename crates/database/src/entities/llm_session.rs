//! LLM会话实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// LLM会话实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "llm_sessions")]
pub struct Model {
    /// 会话ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub session_id: Uuid,
    
    /// 所属项目ID
    pub project_id: Uuid,
    
    /// 用户ID
    pub user_id: Uuid,
    
    /// 会话类型
    pub session_type: String,
    
    /// 会话状态
    pub status: String,
    
    /// 系统提示词
    pub system_prompt: Option<String>,
    
    /// 分解提示词
    pub decomposition_prompt: Option<String>,
    
    /// 分配提示词
    pub allocation_prompt: Option<String>,
    
    /// 会话结果数据
    #[sea_orm(column_type = "Json")]
    pub result_data: Option<JsonValue>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// 完成时间
    pub completed_at: Option<DateTimeWithTimeZone>,
}

/// LLM会话关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与项目的关联关系
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::ProjectId"
    )]
    Project,
    
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
    
    /// 与对话历史的关联关系
    #[sea_orm(has_many = "super::llm_conversation::Entity")]
    LlmConversations,
}

/// 项目关联实现
impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 对话历史关联实现
impl Related<super::llm_conversation::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LlmConversations.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}