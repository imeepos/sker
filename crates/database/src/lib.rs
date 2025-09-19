//! Codex数据库模块
//! 
//! 基于SeaORM的多Agent协同开发系统数据库访问层

pub mod config;
pub mod connection;
pub mod entities;
pub mod error;
pub mod migrations;
pub mod repository;

// 重新导出主要类型
pub use config::DatabaseConfig;
pub use connection::{DatabaseConnection, establish_connection};
pub use error::{DatabaseError, Result};

// 导出实体模块
pub use entities::*;

// 导出迁移器
pub use migrations::Migrator;

/// 数据库初始化函数
/// 
/// 创建数据库连接并运行迁移
pub async fn initialize_database(config: &DatabaseConfig) -> Result<DatabaseConnection> {
    let db = establish_connection(&config.database_url).await?;
    
    // 运行数据库迁移
    Migrator::up(&db, None).await?;
    
    Ok(db)
}

/// 数据库健康检查
pub async fn health_check(db: &DatabaseConnection) -> Result<()> {
    // 执行简单查询验证连接
    db.ping().await.map_err(DatabaseError::from)?;
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    /// 创建测试数据库连接
    pub async fn create_test_db() -> Result<DatabaseConnection> {
        let temp_dir = tempdir().expect("创建临时目录失败");
        let db_path = temp_dir.path().join("test.db");
        let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
        
        let config = DatabaseConfig {
            database_url,
            max_connections: 1,
            min_connections: 1,
            connect_timeout: 10,
            idle_timeout: 60,
            enable_logging: false,
        };
        
        initialize_database(&config).await
    }

    #[tokio::test]
    async fn test_database_initialization() {
        let db = create_test_db().await.expect("创建测试数据库失败");
        health_check(&db).await.expect("数据库健康检查失败");
    }
}