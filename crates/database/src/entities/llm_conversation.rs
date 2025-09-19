//! LLM对话历史实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// LLM对话历史实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "llm_conversations")]
pub struct Model {
    /// 消息ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub message_id: Uuid,
    
    /// 所属会话ID
    pub session_id: Uuid,
    
    /// 消息角色
    pub role: String,
    
    /// 消息内容
    pub content: String,
    
    /// 消息顺序
    pub message_order: i32,
    
    /// Token数量
    pub token_count: Option<i32>,
    
    /// 使用的模型
    pub model_used: Option<String>,
    
    /// 处理时间（毫秒）
    pub processing_time_ms: Option<i32>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// LLM对话关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与LLM会话的关联关系
    #[sea_orm(
        belongs_to = "super::llm_session::Entity",
        from = "Column::SessionId",
        to = "super::llm_session::Column::SessionId"
    )]
    LlmSession,
}

/// LLM会话关联实现
impl Related<super::llm_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LlmSession.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}