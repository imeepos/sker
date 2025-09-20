use codex_core::config::{Config, ConfigOverrides, ConfigToml};
use codex_database::{DatabaseConnection, DatabaseConfig, initialize_database};
use crate::settings::{SettingsManager, ApiProvider};

/// 创建数据库连接的辅助函数
pub async fn create_database_connection() -> Result<DatabaseConnection, String> {
    // 创建数据库配置目录
    let data_dir = std::env::var("SKER_DATA_HOME")
        .map(|h| std::path::PathBuf::from(h))
        .unwrap_or_else(|_| {
            let home = std::env::var("HOME")
                .or_else(|_| std::env::var("USERPROFILE"))
                .unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().to_string());
            std::path::PathBuf::from(home).join(".sker")
        });
    
    // 确保目录存在
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("创建数据目录失败: {}", e))?;
    
    // 数据库文件路径
    let db_path = data_dir.join("sker.db");
    let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
    
    // 创建数据库配置
    let config = DatabaseConfig {
        database_url,
        max_connections: 10,
        min_connections: 1,
        connect_timeout: 30,
        idle_timeout: 300,
        enable_logging: false,
    };
    
    // 初始化数据库
    initialize_database(&config).await
        .map_err(|e| format!("数据库初始化失败: {}", e))
}

/// 创建配置的辅助函数
pub async fn create_config() -> Result<Config, String> {
    // 创建配置目录
    let codex_home = std::env::var("SKER_HOME")
        .map(|h| std::path::PathBuf::from(h))
        .unwrap_or_else(|_| std::env::temp_dir().join("sker_temp"));
    
    // 确保目录存在
    std::fs::create_dir_all(&codex_home)
        .map_err(|e| format!("创建配置目录失败: {}", e))?;
    
    // 加载应用设置
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    let app_settings = settings_manager.load_settings().await
        .map_err(|e| format!("加载设置失败: {}", e))?;
    
    let api_config = &app_settings.system.api_config;
    
    // 检查API配置
    if api_config.api_key.is_empty() {
        return Err("未配置API密钥！请在设置中配置API密钥".to_string());
    }
    
    // 设置环境变量
    match api_config.provider {
        ApiProvider::Openai => {
            std::env::set_var("OPENAI_API_KEY", &api_config.api_key);
        }
        ApiProvider::Custom => {
            std::env::set_var("OPENAI_API_KEY", &api_config.api_key);
            if let Some(base_url) = &api_config.base_url {
                std::env::set_var("OPENAI_BASE_URL", base_url);
            } else {
                return Err("自定义代理配置缺少base_url".to_string());
            }
        }
        ApiProvider::Anthropic => {
            std::env::set_var("ANTHROPIC_API_KEY", &api_config.api_key);
            if let Some(base_url) = &api_config.base_url {
                std::env::set_var("ANTHROPIC_BASE_URL", base_url);
            }
        }
    }
    
    let show_raw_reasoning = app_settings.conversation.stream_response;
    
    // 从应用设置中获取 MCP 服务器配置
    let mcp_servers = get_mcp_servers_from_settings(&app_settings);
    println!("MCP服务器配置加载完成，数量: {}", mcp_servers.len());
    
    // 创建配置，包含从设置中获取的 MCP 服务器
    let mut config_toml = ConfigToml::default();
    config_toml.mcp_servers = mcp_servers;
    
    println!("开始创建Codex配置...");
    Config::load_from_base_config_with_overrides(
        config_toml,
        ConfigOverrides {
            show_raw_agent_reasoning: Some(show_raw_reasoning),
            ..Default::default()
        },
        codex_home,
    ).map_err(|e| {
        eprintln!("创建配置失败详情: {:#}", e);
        format!("创建配置失败: {}", e)
    })
}

/// 从应用设置中获取 MCP 服务器配置
fn get_mcp_servers_from_settings(
    app_settings: &crate::settings::AppSettings,
) -> std::collections::HashMap<String, codex_core::config_types::McpServerConfig> {
    let mut servers = std::collections::HashMap::new();
    
    // 从设置中读取启用的 MCP 服务器
    for server in &app_settings.system.mcp_servers {
        if server.enabled {
            // 转换设置中的 McpServerConfig 到 core 中的 McpServerConfig
            let core_server = codex_core::config_types::McpServerConfig {
                command: server.command.clone(),
                args: server.args.clone(),
                env: server.env.clone(),
                startup_timeout_ms: server.startup_timeout_ms.map(|v| v as u64),
            };
            
            servers.insert(server.name.clone(), core_server);
        }
    }
    
    if servers.is_empty() {
        println!("当前没有启用的 MCP 服务器。请在设置页面中添加并启用 MCP 服务器配置。");
    } else {
        println!("已从设置中加载 {} 个启用的 MCP 服务器配置", servers.len());
        for name in servers.keys() {
            println!("  - {}", name);
        }
    }
    
    servers
}