//! 数据库错误类型定义

use thiserror::Error;

/// 数据库操作结果类型
pub type Result<T> = std::result::Result<T, DatabaseError>;

/// 数据库错误类型枚举
#[derive(Error, Debug)]
pub enum DatabaseError {
    /// SeaORM数据库错误
    #[error("数据库错误: {0}")]
    Database(#[from] sea_orm::DbErr),
    
    /// 配置错误
    #[error("配置错误: {0}")]
    Configuration(String),
    
    /// 连接错误
    #[error("连接错误: {0}")]
    Connection(String),
    
    /// 迁移错误
    #[error("迁移错误: {0}")]
    Migration(String),
    
    /// 实体未找到错误
    #[error("实体未找到: {entity_type} ID: {id}")]
    EntityNotFound {
        entity_type: String,
        id: String,
    },
    
    /// 验证错误
    #[error("验证错误: {message}")]
    Validation { message: String },
    
    /// 并发冲突错误
    #[error("并发冲突: {message}")]
    Conflict { message: String },
    
    /// 业务逻辑错误
    #[error("业务逻辑错误: {message}")]
    BusinessLogic { message: String },
    
    /// IO错误
    #[error("IO错误: {0}")]
    Io(#[from] std::io::Error),
    
    /// JSON序列化/反序列化错误
    #[error("JSON错误: {0}")]
    Json(#[from] serde_json::Error),
    
    /// UUID解析错误
    #[error("UUID错误: {0}")]
    Uuid(#[from] uuid::Error),
    
    /// 其他错误
    #[error("其他错误: {0}")]
    Other(#[from] anyhow::Error),
}

impl DatabaseError {
    /// 创建实体未找到错误
    pub fn entity_not_found<T: ToString, I: ToString>(entity_type: T, id: I) -> Self {
        Self::EntityNotFound {
            entity_type: entity_type.to_string(),
            id: id.to_string(),
        }
    }
    
    /// 创建验证错误
    pub fn validation<T: ToString>(message: T) -> Self {
        Self::Validation {
            message: message.to_string(),
        }
    }
    
    /// 创建并发冲突错误
    pub fn conflict<T: ToString>(message: T) -> Self {
        Self::Conflict {
            message: message.to_string(),
        }
    }
    
    /// 创建业务逻辑错误
    pub fn business_logic<T: ToString>(message: T) -> Self {
        Self::BusinessLogic {
            message: message.to_string(),
        }
    }
    
    /// 判断是否为连接相关错误
    pub fn is_connection_error(&self) -> bool {
        matches!(self, DatabaseError::Connection(_) | DatabaseError::Database(_))
    }
    
    /// 判断是否为验证错误
    pub fn is_validation_error(&self) -> bool {
        matches!(self, DatabaseError::Validation { .. })
    }
    
    /// 判断是否为业务逻辑错误
    pub fn is_business_error(&self) -> bool {
        matches!(self, DatabaseError::BusinessLogic { .. })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entity_not_found_error() {
        let error = DatabaseError::entity_not_found("User", "123");
        match error {
            DatabaseError::EntityNotFound { entity_type, id } => {
                assert_eq!(entity_type, "User");
                assert_eq!(id, "123");
            }
            _ => panic!("期望EntityNotFound错误"),
        }
    }

    #[test]
    fn test_validation_error() {
        let error = DatabaseError::validation("无效的邮箱格式");
        assert!(error.is_validation_error());
        assert!(!error.is_business_error());
    }

    #[test]
    fn test_business_logic_error() {
        let error = DatabaseError::business_logic("余额不足");
        assert!(error.is_business_error());
        assert!(!error.is_validation_error());
    }

    #[test]
    fn test_error_display() {
        let error = DatabaseError::validation("测试错误消息");
        let error_string = format!("{error}");
        assert!(error_string.contains("验证错误"));
        assert!(error_string.contains("测试错误消息"));
    }
}