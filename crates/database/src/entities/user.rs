//! 用户实体定义

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 用户模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    /// 用户ID（主键）
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: Uuid,
    
    /// 用户名（唯一）
    #[sea_orm(unique)]
    pub username: String,
    
    /// 邮箱（唯一）
    #[sea_orm(unique)]
    pub email: String,
    
    /// 密码哈希
    pub password_hash: String,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// 用户资料数据（JSON格式）
    #[sea_orm(column_type = "Json", nullable)]
    pub profile_data: Option<Json>,
    
    /// 用户设置（JSON格式）
    #[sea_orm(column_type = "Json", nullable)]
    pub settings: Option<Json>,
    
    /// 是否活跃
    pub is_active: bool,
    
    /// 最后登录时间
    #[sea_orm(nullable)]
    pub last_login_at: Option<DateTimeWithTimeZone>,
}

/// 关系定义
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与项目的关联关系
    #[sea_orm(has_many = "super::project::Entity")]
    Projects,
    
    /// 与Agent的关联关系
    #[sea_orm(has_many = "super::agent::Entity")]
    Agents,
}

/// 项目关联实现
impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Projects.def()
    }
}

/// Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agents.def()
    }
}

/// 活动模型行为
impl ActiveModelBehavior for ActiveModel {}