//! 数据库配置模块

use serde::{Deserialize, Serialize};

/// 数据库配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// 数据库连接URL
    pub database_url: String,
    
    /// 最大连接数
    pub max_connections: u32,
    
    /// 最小连接数  
    pub min_connections: u32,
    
    /// 连接超时时间（秒）
    pub connect_timeout: u64,
    
    /// 空闲超时时间（秒）
    pub idle_timeout: u64,
    
    /// 是否启用SQL日志
    pub enable_logging: bool,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            database_url: "sqlite://sker_database.db?mode=rwc".to_string(),
            max_connections: 10,
            min_connections: 1,
            connect_timeout: 30,
            idle_timeout: 600,
            enable_logging: true,
        }
    }
}

impl DatabaseConfig {
    /// 创建内存数据库配置（用于测试）
    pub fn memory() -> Self {
        Self {
            database_url: "sqlite::memory:".to_string(),
            max_connections: 1,
            min_connections: 1,
            connect_timeout: 10,
            idle_timeout: 60,
            enable_logging: false,
        }
    }
    
    /// 创建文件数据库配置
    pub fn file<P: AsRef<std::path::Path>>(path: P) -> Self {
        let database_url = format!("sqlite://{}?mode=rwc", path.as_ref().display());
        Self {
            database_url,
            ..Default::default()
        }
    }
    
    /// 验证配置的有效性
    pub fn validate(&self) -> crate::Result<()> {
        if self.database_url.is_empty() {
            return Err(crate::error::DatabaseError::Configuration(
                "数据库URL不能为空".to_string(),
            ));
        }
        
        if self.max_connections == 0 {
            return Err(crate::error::DatabaseError::Configuration(
                "最大连接数必须大于0".to_string(),
            ));
        }
        
        if self.min_connections > self.max_connections {
            return Err(crate::error::DatabaseError::Configuration(
                "最小连接数不能大于最大连接数".to_string(),
            ));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = DatabaseConfig::default();
        assert!(config.validate().is_ok());
        assert!(!config.database_url.is_empty());
        assert!(config.max_connections > 0);
    }

    #[test]
    fn test_memory_config() {
        let config = DatabaseConfig::memory();
        assert!(config.validate().is_ok());
        assert_eq!(config.database_url, "sqlite::memory:");
    }

    #[test]
    fn test_file_config() {
        let config = DatabaseConfig::file("test.db");
        assert!(config.validate().is_ok());
        assert!(config.database_url.contains("test.db"));
    }

    #[test]
    fn test_invalid_config() {
        let mut config = DatabaseConfig::default();
        
        // 测试空URL
        config.database_url = String::new();
        assert!(config.validate().is_err());
        
        // 测试无效连接数
        config = DatabaseConfig::default();
        config.max_connections = 0;
        assert!(config.validate().is_err());
        
        // 测试最小连接数大于最大连接数
        config = DatabaseConfig::default();
        config.min_connections = 10;
        config.max_connections = 5;
        assert!(config.validate().is_err());
    }
}