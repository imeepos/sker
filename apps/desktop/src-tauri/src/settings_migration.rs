use tokio::fs;

/// 清除旧的设置文件以避免兼容性问题
pub async fn clear_incompatible_settings() -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = dirs::data_dir()
        .ok_or("无法获取应用数据目录")?
        .join("sker");
    
    let settings_path = app_data_dir.join("settings.json");
    
    if settings_path.exists() {
        // 读取设置文件内容
        let contents = fs::read_to_string(&settings_path).await?;
        
        // 尝试解析为JSON Value检查是否有api_config字段
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&contents) {
            if let Some(system) = value.get("system") {
                // 如果没有apiConfig字段，说明是旧版本，需要清除
                if system.get("apiConfig").is_none() {
                    println!("检测到旧版本设置文件，正在清除以确保兼容性...");
                    fs::remove_file(&settings_path).await?;
                    println!("旧设置文件已清除，将使用默认设置");
                }
            }
        }
    }
    
    Ok(())
}