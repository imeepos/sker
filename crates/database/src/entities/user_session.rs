//! 用户会话实体定义

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 用户会话模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "user_sessions")]
pub struct Model {
    /// 会话ID（主键）
    #[sea_orm(primary_key, auto_increment = false)]
    pub session_id: Uuid,
    
    /// 用户ID（外键）
    pub user_id: Uuid,
    
    /// 会话令牌（唯一）
    #[sea_orm(unique)]
    pub token: String,
    
    /// 刷新令牌（唯一）
    #[sea_orm(unique)]
    pub refresh_token: String,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 过期时间
    pub expires_at: DateTimeWithTimeZone,
    
    /// 最后活跃时间
    pub last_active_at: DateTimeWithTimeZone,
    
    /// IP地址
    #[sea_orm(nullable)]
    pub ip_address: Option<String>,
    
    /// 用户代理信息
    #[sea_orm(nullable)]
    pub user_agent: Option<String>,
    
    /// 是否活跃
    pub is_active: bool,
}

/// 关系定义
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 活动模型行为
impl ActiveModelBehavior for ActiveModel {}

impl Model {
    /// 检查会话是否已过期
    pub fn is_expired(&self) -> bool {
        chrono::Utc::now() > self.expires_at.naive_utc().and_utc()
    }
    
    /// 检查会话是否有效（活跃且未过期）
    pub fn is_valid(&self) -> bool {
        self.is_active && !self.is_expired()
    }
}