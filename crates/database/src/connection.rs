//! 数据库连接模块

use crate::{DatabaseConfig, DatabaseError, Result};
use sea_orm::{ConnectOptions, Database};
use std::time::Duration;

/// 数据库连接类型别名
pub type DatabaseConnection = sea_orm::DatabaseConnection;

/// 建立数据库连接
/// 
/// # 参数
/// * `database_url` - 数据库连接URL
/// 
/// # 返回值
/// 返回配置好的数据库连接
pub async fn establish_connection(database_url: &str) -> Result<DatabaseConnection> {
    let mut opt = ConnectOptions::new(database_url);
    
    // 基本连接配置
    opt.max_connections(10)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .acquire_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(8))
        .max_lifetime(Duration::from_secs(8))
        .sqlx_logging(false); // 默认关闭日志，避免测试时输出过多
    
    Database::connect(opt)
        .await
        .map_err(DatabaseError::from)
}

/// 使用配置建立数据库连接
pub async fn establish_connection_with_config(config: &DatabaseConfig) -> Result<DatabaseConnection> {
    config.validate()?;
    
    let mut opt = ConnectOptions::new(&config.database_url);
    
    opt.max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .connect_timeout(Duration::from_secs(config.connect_timeout))
        .acquire_timeout(Duration::from_secs(config.connect_timeout))
        .idle_timeout(Duration::from_secs(config.idle_timeout))
        .max_lifetime(Duration::from_secs(config.idle_timeout))
        .sqlx_logging(config.enable_logging);
    
    if config.enable_logging {
        opt.sqlx_logging_level(log::LevelFilter::Info);
    }
    
    Database::connect(opt)
        .await
        .map_err(DatabaseError::from)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_establish_connection() {
        let db = establish_connection("sqlite::memory:").await.unwrap();
        
        // 测试连接是否可用
        db.ping().await.unwrap();
    }

    #[tokio::test]
    async fn test_establish_connection_with_config() {
        let config = DatabaseConfig::memory();
        let db = establish_connection_with_config(&config).await.unwrap();
        
        // 测试连接是否可用
        db.ping().await.unwrap();
    }
}