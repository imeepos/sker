//! 事件发布日志实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 事件发布日志实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "event_publish_log")]
pub struct Model {
    /// 日志ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub log_id: Uuid,
    
    /// 事件ID
    pub event_id: Uuid,
    
    /// 订阅者类型：local_handler, message_queue, webhook 等
    pub subscriber_type: String,
    
    /// 订阅者ID
    pub subscriber_id: String,
    
    /// 发布状态：pending, sent, delivered, failed
    pub status: String,
    
    /// 尝试次数
    pub attempts: i32,
    
    /// 最大尝试次数
    pub max_attempts: i32,
    
    /// 响应数据
    #[sea_orm(column_type = "Json")]
    pub response_data: Option<JsonValue>,
    
    /// 错误信息
    pub error_message: Option<String>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 发送时间
    pub sent_at: Option<DateTimeWithTimeZone>,
    
    /// 投递时间
    pub delivered_at: Option<DateTimeWithTimeZone>,
    
    /// 失败时间
    pub failed_at: Option<DateTimeWithTimeZone>,
}

/// 事件发布日志关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与领域事件的关联关系
    #[sea_orm(
        belongs_to = "super::domain_event::Entity",
        from = "Column::EventId",
        to = "super::domain_event::Column::EventId"
    )]
    DomainEvent,
}

/// 领域事件关联实现
impl Related<super::domain_event::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::DomainEvent.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 发布状态枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PublishStatus {
    /// 等待中
    Pending,
    /// 已发送
    Sent,
    /// 已投递
    Delivered,
    /// 失败
    Failed,
}

impl std::fmt::Display for PublishStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PublishStatus::Pending => write!(f, "pending"),
            PublishStatus::Sent => write!(f, "sent"),
            PublishStatus::Delivered => write!(f, "delivered"),
            PublishStatus::Failed => write!(f, "failed"),
        }
    }
}

impl From<String> for PublishStatus {
    fn from(status: String) -> Self {
        match status.as_str() {
            "pending" => PublishStatus::Pending,
            "sent" => PublishStatus::Sent,
            "delivered" => PublishStatus::Delivered,
            "failed" => PublishStatus::Failed,
            _ => PublishStatus::Pending,
        }
    }
}

/// 订阅者类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubscriberType {
    /// 本地处理器
    LocalHandler,
    /// 消息队列
    MessageQueue,
    /// Webhook
    Webhook,
    /// 数据库
    Database,
}

impl std::fmt::Display for SubscriberType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SubscriberType::LocalHandler => write!(f, "local_handler"),
            SubscriberType::MessageQueue => write!(f, "message_queue"),
            SubscriberType::Webhook => write!(f, "webhook"),
            SubscriberType::Database => write!(f, "database"),
        }
    }
}

impl From<String> for SubscriberType {
    fn from(subscriber_type: String) -> Self {
        match subscriber_type.as_str() {
            "local_handler" => SubscriberType::LocalHandler,
            "message_queue" => SubscriberType::MessageQueue,
            "webhook" => SubscriberType::Webhook,
            "database" => SubscriberType::Database,
            _ => SubscriberType::LocalHandler,
        }
    }
}