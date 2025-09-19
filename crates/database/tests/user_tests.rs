//! 用户实体的测试用例

use codex_database::{entities::user, Result};
use sea_orm::{Database, EntityTrait, Set, ActiveModelTrait, ConnectionTrait, QueryFilter, ColumnTrait};
use uuid::Uuid;

/// 创建测试数据库连接
async fn setup_test_db() -> Result<sea_orm::DatabaseConnection> {
    let db = Database::connect("sqlite::memory:").await?;
    
    // 手动创建用户表
    let sql = r#"
        CREATE TABLE users (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            profile_data TEXT,
            settings TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_login_at TEXT
        )
    "#;
    
    db.execute_unprepared(sql).await?;
    
    Ok(db)
}

#[tokio::test]
async fn test_create_user() {
    let db = setup_test_db().await.expect("设置测试数据库失败");
    
    // 准备测试数据
    let user_id = Uuid::new_v4();
    let username = "test_user";
    let email = "test@example.com";
    let password_hash = "hashed_password";
    
    // 创建用户
    let now = chrono::Utc::now().into();
    let user = user::ActiveModel {
        user_id: Set(user_id),
        username: Set(username.to_string()),
        email: Set(email.to_string()),
        password_hash: Set(password_hash.to_string()),
        created_at: Set(now),
        updated_at: Set(now),
        is_active: Set(true),
        ..Default::default()
    };
    
    let result = user::Entity::insert(user).exec(&db).await;
    assert!(result.is_ok(), "用户创建应该成功");
    
    // 验证用户已创建
    let found_user = user::Entity::find_by_id(user_id)
        .one(&db)
        .await
        .expect("查询用户失败");
    
    assert!(found_user.is_some(), "应该能找到创建的用户");
    let found_user = found_user.unwrap();
    assert_eq!(found_user.username, username);
    assert_eq!(found_user.email, email);
    assert!(found_user.is_active, "新用户应该默认为活跃状态");
}

#[tokio::test]
async fn test_find_user_by_email() {
    let db = setup_test_db().await.expect("设置测试数据库失败");
    
    let user_id = Uuid::new_v4();
    let email = "unique@example.com";
    
    // 创建用户
    let now = chrono::Utc::now().into();
    let user = user::ActiveModel {
        user_id: Set(user_id),
        username: Set("test_user".to_string()),
        email: Set(email.to_string()),
        password_hash: Set("password".to_string()),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    
    user::Entity::insert(user).exec(&db).await.expect("创建用户失败");
    
    // 通过邮箱查找用户
    let found_user = user::Entity::find()
        .filter(user::Column::Email.eq(email))
        .one(&db)
        .await
        .expect("查询用户失败");
    
    assert!(found_user.is_some(), "应该能通过邮箱找到用户");
    assert_eq!(found_user.unwrap().email, email);
}

#[tokio::test]
async fn test_update_user_profile() {
    let db = setup_test_db().await.expect("设置测试数据库失败");
    
    let user_id = Uuid::new_v4();
    
    // 创建用户
    let now = chrono::Utc::now().into();
    let user = user::ActiveModel {
        user_id: Set(user_id),
        username: Set("test_user".to_string()),
        email: Set("test@example.com".to_string()),
        password_hash: Set("password".to_string()),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    
    user::Entity::insert(user).exec(&db).await.expect("创建用户失败");
    
    // 更新用户资料
    let profile_data = serde_json::json!({
        "display_name": "测试用户",
        "bio": "这是一个测试用户"
    });
    
    let mut updated_user: user::ActiveModel = user::Entity::find_by_id(user_id)
        .one(&db)
        .await
        .expect("查询用户失败")
        .expect("用户应该存在")
        .into();
    
    updated_user.profile_data = Set(Some(profile_data.clone()));
    
    let result = updated_user.update(&db).await;
    assert!(result.is_ok(), "更新用户资料应该成功");
    
    // 验证更新
    let found_user = user::Entity::find_by_id(user_id)
        .one(&db)
        .await
        .expect("查询用户失败")
        .expect("用户应该存在");
    
    assert_eq!(found_user.profile_data, Some(profile_data));
}

#[tokio::test]
async fn test_user_unique_constraints() {
    let db = setup_test_db().await.expect("设置测试数据库失败");
    
    let email = "duplicate@example.com";
    let username = "duplicate_user";
    
    // 创建第一个用户
    let now = chrono::Utc::now().into();
    let user1 = user::ActiveModel {
        user_id: Set(Uuid::new_v4()),
        username: Set(username.to_string()),
        email: Set(email.to_string()),
        password_hash: Set("password1".to_string()),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    
    user::Entity::insert(user1).exec(&db).await.expect("创建第一个用户失败");
    
    // 尝试创建相同邮箱的用户
    let now2 = chrono::Utc::now().into();
    let user2 = user::ActiveModel {
        user_id: Set(Uuid::new_v4()),
        username: Set("different_user".to_string()),
        email: Set(email.to_string()),
        password_hash: Set("password2".to_string()),
        created_at: Set(now2),
        updated_at: Set(now2),
        ..Default::default()
    };
    
    let result = user::Entity::insert(user2).exec(&db).await;
    assert!(result.is_err(), "重复邮箱应该导致错误");
    
    // 尝试创建相同用户名的用户
    let now3 = chrono::Utc::now().into();
    let user3 = user::ActiveModel {
        user_id: Set(Uuid::new_v4()),
        username: Set(username.to_string()),
        email: Set("different@example.com".to_string()),
        password_hash: Set("password3".to_string()),
        created_at: Set(now3),
        updated_at: Set(now3),
        ..Default::default()
    };
    
    let result = user::Entity::insert(user3).exec(&db).await;
    assert!(result.is_err(), "重复用户名应该导致错误");
}

#[tokio::test]
async fn test_user_settings_json() {
    let db = setup_test_db().await.expect("设置测试数据库失败");
    
    let user_id = Uuid::new_v4();
    let settings = serde_json::json!({
        "theme": "dark",
        "language": "zh-CN",
        "notifications": {
            "email": true,
            "push": false
        }
    });
    
    // 创建带设置的用户
    let now = chrono::Utc::now().into();
    let user = user::ActiveModel {
        user_id: Set(user_id),
        username: Set("settings_user".to_string()),
        email: Set("settings@example.com".to_string()),
        password_hash: Set("password".to_string()),
        settings: Set(Some(settings.clone())),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    
    user::Entity::insert(user).exec(&db).await.expect("创建用户失败");
    
    // 验证设置被正确保存
    let found_user = user::Entity::find_by_id(user_id)
        .one(&db)
        .await
        .expect("查询用户失败")
        .expect("用户应该存在");
    
    assert_eq!(found_user.settings, Some(settings));
}

#[tokio::test]
async fn test_user_last_login_update() {
    let db = setup_test_db().await.expect("设置测试数据库失败");
    
    let user_id = Uuid::new_v4();
    
    // 创建用户
    let now = chrono::Utc::now().into();
    let user = user::ActiveModel {
        user_id: Set(user_id),
        username: Set("login_user".to_string()),
        email: Set("login@example.com".to_string()),
        password_hash: Set("password".to_string()),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    
    user::Entity::insert(user).exec(&db).await.expect("创建用户失败");
    
    // 验证初始登录时间为空
    let user_before = user::Entity::find_by_id(user_id)
        .one(&db)
        .await
        .expect("查询用户失败")
        .expect("用户应该存在");
    
    assert!(user_before.last_login_at.is_none(), "初始登录时间应该为空");
    
    // 更新登录时间
    let login_time = chrono::Utc::now().into();
    let mut updated_user: user::ActiveModel = user_before.into();
    updated_user.last_login_at = Set(Some(login_time));
    
    updated_user.update(&db).await.expect("更新登录时间失败");
    
    // 验证登录时间已更新
    let user_after = user::Entity::find_by_id(user_id)
        .one(&db)
        .await
        .expect("查询用户失败")
        .expect("用户应该存在");
    
    assert!(user_after.last_login_at.is_some(), "登录时间应该被设置");
    assert_eq!(user_after.last_login_at.unwrap(), login_time);
}