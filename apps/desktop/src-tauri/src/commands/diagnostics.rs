use crate::{
    commands::config::create_config,
    settings::{SettingsManager},
};

/// 诊断系统配置状态
#[tauri::command]
pub async fn diagnose_system() -> Result<String, String> {
    let mut report = Vec::new();
    
    // 检查配置创建
    report.push("=== 系统诊断报告 ===".to_string());
    
    match create_config().await {
        Ok(_) => {
            report.push("✅ 配置创建成功".to_string());
        }
        Err(e) => {
            report.push(format!("❌ 配置创建失败: {}", e));
        }
    }
    
    // 检查环境变量
    report.push("\n=== 环境变量检查 ===".to_string());
    if std::env::var("OPENAI_API_KEY").is_ok() {
        report.push("✅ OPENAI_API_KEY 已设置".to_string());
    } else {
        report.push("❌ OPENAI_API_KEY 未设置".to_string());
    }
    
    if std::env::var("ANTHROPIC_API_KEY").is_ok() {
        report.push("✅ ANTHROPIC_API_KEY 已设置".to_string());
    } else {
        report.push("❌ ANTHROPIC_API_KEY 未设置".to_string());
    }
    
    // 检查设置
    report.push("\n=== 应用设置检查 ===".to_string());
    
    // 使用嵌套块来避免跨await边界的Send问题
    let settings_section = async {
        let settings_manager = SettingsManager::new()
            .map_err(|e| format!("❌ 设置管理器创建失败: {}", e))?;
            
        let app_settings = settings_manager.load_settings().await
            .map_err(|e| format!("❌ 应用设置加载失败: {}", e))?;
            
        let mut section_report = Vec::new();
        section_report.push("✅ 应用设置加载成功".to_string());
        section_report.push(format!("API提供商: {:?}", app_settings.system.api_config.provider));
        
        if app_settings.system.api_config.api_key.is_empty() {
            section_report.push("❌ API密钥未配置".to_string());
        } else {
            section_report.push("✅ API密钥已配置".to_string());
        }
        
        let enabled_mcp_count = app_settings.system.mcp_servers.iter().filter(|s| s.enabled).count();
        section_report.push(format!("MCP服务器: {} 个已启用", enabled_mcp_count));
        
        Ok::<Vec<String>, String>(section_report)
    }.await;
    
    match settings_section {
        Ok(mut section_lines) => {
            report.append(&mut section_lines);
        }
        Err(error_msg) => {
            report.push(error_msg);
        }
    }
    
    Ok(report.join("\n"))
}