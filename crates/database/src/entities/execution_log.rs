//! 执行日志实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 执行日志实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "execution_logs")]
pub struct Model {
    /// 日志ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub log_id: Uuid,
    
    /// 会话ID
    pub session_id: Uuid,
    
    /// 日志级别：debug, info, warn, error
    pub log_level: String,
    
    /// 事件类型：git_operation, file_change, test_run 等
    pub event_type: String,
    
    /// 日志消息
    pub message: String,
    
    /// 详细信息（JSON格式）
    #[sea_orm(column_type = "Json")]
    pub details: Option<JsonValue>,
    
    /// 毫秒时间戳
    pub timestamp_ms: i64,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// 执行日志关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与执行会话的关联关系
    #[sea_orm(
        belongs_to = "super::execution_session::Entity",
        from = "Column::SessionId",
        to = "super::execution_session::Column::SessionId"
    )]
    ExecutionSession,
}

/// 执行会话关联实现
impl Related<super::execution_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ExecutionSession.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 日志级别枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    /// 调试
    Debug,
    /// 信息
    Info,
    /// 警告
    Warn,
    /// 错误
    Error,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Debug => write!(f, "debug"),
            LogLevel::Info => write!(f, "info"),
            LogLevel::Warn => write!(f, "warn"),
            LogLevel::Error => write!(f, "error"),
        }
    }
}

impl From<String> for LogLevel {
    fn from(level: String) -> Self {
        match level.as_str() {
            "debug" => LogLevel::Debug,
            "info" => LogLevel::Info,
            "warn" => LogLevel::Warn,
            "error" => LogLevel::Error,
            _ => LogLevel::Info,
        }
    }
}

/// 事件类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    /// Git操作
    GitOperation,
    /// 文件变更
    FileChange,
    /// 测试运行
    TestRun,
    /// 编译
    Compilation,
    /// 部署
    Deployment,
    /// 代码分析
    CodeAnalysis,
    /// 依赖安装
    DependencyInstall,
    /// 环境配置
    EnvironmentSetup,
}

impl std::fmt::Display for EventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventType::GitOperation => write!(f, "git_operation"),
            EventType::FileChange => write!(f, "file_change"),
            EventType::TestRun => write!(f, "test_run"),
            EventType::Compilation => write!(f, "compilation"),
            EventType::Deployment => write!(f, "deployment"),
            EventType::CodeAnalysis => write!(f, "code_analysis"),
            EventType::DependencyInstall => write!(f, "dependency_install"),
            EventType::EnvironmentSetup => write!(f, "environment_setup"),
        }
    }
}

impl From<String> for EventType {
    fn from(event_type: String) -> Self {
        match event_type.as_str() {
            "git_operation" => EventType::GitOperation,
            "file_change" => EventType::FileChange,
            "test_run" => EventType::TestRun,
            "compilation" => EventType::Compilation,
            "deployment" => EventType::Deployment,
            "code_analysis" => EventType::CodeAnalysis,
            "dependency_install" => EventType::DependencyInstall,
            "environment_setup" => EventType::EnvironmentSetup,
            _ => EventType::GitOperation,
        }
    }
}