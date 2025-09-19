//! 需求文档实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 需求文档实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "requirement_documents")]
pub struct Model {
    /// 文档ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub document_id: Uuid,
    
    /// 所属项目ID
    pub project_id: Uuid,
    
    /// 文档标题
    pub title: String,
    
    /// 文档内容
    pub content: String,
    
    /// 文档类型
    pub document_type: String,
    
    /// 优先级
    pub priority: String,
    
    /// 版本号
    pub version: String,
    
    /// LLM是否已处理
    pub llm_processed: bool,
    
    /// LLM结构化处理后的内容
    pub structured_content: Option<String>,
    
    /// 处理会话ID
    pub processing_session_id: Option<Uuid>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// LLM处理时间
    pub processed_at: Option<DateTimeWithTimeZone>,
}

/// 需求文档关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与项目的关联关系
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::ProjectId"
    )]
    Project,
}

/// 项目关联实现
impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}