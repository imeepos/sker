// 简化架构 - 直接使用ConversationManager，借鉴CLI实现
use std::sync::Arc;
use tauri::Manager;

use codex_core::{ConversationManager, AuthManager};

// 启用核心模块
pub mod commands;
pub mod models;
pub mod settings;
pub mod settings_migration;
pub mod auth;

/// 简化的应用程序入口
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // 使用Tauri的运行时在启动时清理不兼容的设置
            tauri::async_runtime::spawn(async move {
                if let Err(e) = crate::settings_migration::clear_incompatible_settings().await {
                    eprintln!("清理设置时出错: {}", e);
                }
            });
            

            // 初始化认证管理器
            let codex_home = app.path().app_data_dir()
                .expect("无法获取应用数据目录")
                .join("sker");
            let auth_manager = Arc::new(AuthManager::new(codex_home));
            app.manage(auth_manager.clone());

            // 初始化对话管理器
            let conversation_manager = Arc::new(ConversationManager::new(auth_manager));
            app.manage(conversation_manager);
            
            // 初始化数据库连接
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match commands::create_database_connection().await {
                    Ok(db) => {
                        let db_handle = Arc::new(db);
                        app_handle.manage(db_handle);
                        println!("数据库连接初始化成功");
                    }
                    Err(e) => {
                        eprintln!("数据库连接初始化失败: {}", e);
                        // 可以选择是否要退出应用程序
                    }
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 用户认证命令
            auth::register,
            auth::login,
            auth::validate_token,
            auth::refresh_token,
            auth::logout,
            auth::get_current_user,
            // 简化的对话命令
            commands::create_conversation,
            commands::send_message,
            commands::load_conversations,
            commands::delete_conversation,
            commands::interrupt_conversation,
            commands::add_conversation_listener,
            commands::remove_conversation_listener,
            // 审批命令
            commands::approve_exec_command,
            commands::approve_patch_command,
            commands::diagnose_system,
            // 设置管理命令
            settings::get_app_settings,
            settings::save_app_settings,
            settings::update_app_settings,
            settings::reset_app_settings,
            settings::export_app_settings,
            settings::import_app_settings,
            settings::test_api_connection,
            // MCP 服务器管理命令
            settings::get_mcp_servers,
            settings::add_mcp_server,
            settings::update_mcp_server,
            settings::delete_mcp_server,
            settings::toggle_mcp_server,
            // 项目管理命令
            commands::create_project,
            commands::get_projects,
            commands::get_project,
            commands::update_project,
            commands::delete_project,
        ])
        .run(tauri::generate_context!())
        .expect("运行Tauri应用程序时出错");
}