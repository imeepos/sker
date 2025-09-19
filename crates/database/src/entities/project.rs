//! 项目实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 项目实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "projects")]
pub struct Model {
    /// 项目ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: Uuid,
    
    /// 项目所有者用户ID
    pub user_id: Uuid,
    
    /// 项目名称
    pub name: String,
    
    /// 项目描述
    pub description: Option<String>,
    
    /// Git仓库地址
    pub repository_url: String,
    
    /// 主分支名称
    pub main_branch: String,
    
    /// 工作空间路径
    pub workspace_path: String,
    
    /// 技术栈配置
    #[sea_orm(column_type = "Json")]
    pub technology_stack: Option<JsonValue>,
    
    /// 编码规范配置
    #[sea_orm(column_type = "Json")]
    pub coding_standards: Option<JsonValue>,
    
    /// Git设置
    #[sea_orm(column_type = "Json")]
    pub git_settings: Option<JsonValue>,
    
    /// 代码库信息
    #[sea_orm(column_type = "Json")]
    pub codebase_info: Option<JsonValue>,
    
    /// 项目上下文
    #[sea_orm(column_type = "Json")]
    pub project_context: Option<JsonValue>,
    
    /// 项目状态
    pub status: String,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
}

/// 项目关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
    
    /// 与需求文档的关联关系
    #[sea_orm(has_many = "super::requirement_document::Entity")]
    RequirementDocuments,
    
    /// 与任务的关联关系
    #[sea_orm(has_many = "super::task::Entity")]
    Tasks,
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 需求文档关联实现
impl Related<super::requirement_document::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RequirementDocuments.def()
    }
}

/// 任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tasks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}