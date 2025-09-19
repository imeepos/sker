//! 测试公共模块

use codex_database::{establish_connection, migrations::Migrator, DatabaseConnection};

/// 设置测试数据库
pub async fn setup_test_db() -> DatabaseConnection {
    let db = establish_connection("sqlite::memory:").await.unwrap();
    Migrator::up(&db, None).await.unwrap();
    db
}