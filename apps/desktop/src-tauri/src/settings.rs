use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

// 主题类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

// 语言类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum Language {
    ZhCn,
    EnUs,
}

// AI 模型设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelSettings {
    pub current_model: String,
    pub temperature: f32,
    pub max_tokens: i32,
    pub top_p: f32,
    pub presence_penalty: f32,
    pub frequency_penalty: f32,
}

// 外观设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub theme: ThemeMode,
    pub font_size: i32,
    pub font_family: String,
    pub language: Language,
    pub compact_mode: bool,
}

// 对话设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationSettings {
    pub max_history_messages: i32,
    pub auto_save: bool,
    pub show_timestamp: bool,
    pub enable_markdown: bool,
    pub enable_code_highlight: bool,
    pub stream_response: bool,
}

// 数据设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSettings {
    pub auto_backup: bool,
    pub backup_interval: i32,
    pub max_backup_files: i32,
    pub export_format: String,
}

// API 配置类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ApiProvider {
    Openai,
    Custom,
    Anthropic,
}

// API 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiConfig {
    pub provider: ApiProvider,
    pub api_key: String,
    pub base_url: Option<String>,
    pub custom_name: Option<String>,
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            provider: ApiProvider::Openai,
            api_key: String::new(),
            base_url: None,
            custom_name: None,
        }
    }
}

// 代理认证
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyAuth {
    pub username: String,
    pub password: String,
}

// API 密钥集合（兼容性）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeys {
    pub openai: Option<String>,
    pub anthropic: Option<String>,
}

impl Default for ApiKeys {
    fn default() -> Self {
        Self {
            openai: None,
            anthropic: None,
        }
    }
}

// 系统设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSettings {
    // API 配置 - 使用default属性处理向后兼容
    #[serde(default)]
    pub api_config: ApiConfig,
    
    // 网络代理设置
    pub proxy_enabled: bool,
    pub proxy_host: Option<String>,
    pub proxy_port: Option<i32>,
    #[serde(default)]
    pub proxy_auth: Option<ProxyAuth>,
    
    // 兼容性：保留原有的apiKeys字段
    #[serde(default)]
    pub api_keys: ApiKeys,
    
    // 系统行为设置
    pub auto_start: bool,
    pub minimize_to_tray: bool,
}

// 完整的应用设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub model: ModelSettings,
    pub appearance: AppearanceSettings,
    pub conversation: ConversationSettings,
    pub data: DataSettings,
    pub system: SystemSettings,
    pub version: String,
    pub last_updated: i64,
}

// 设置更新请求
#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub section: String,
    pub settings: serde_json::Value,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            model: ModelSettings {
                current_model: "gpt-4".to_string(),
                temperature: 0.7,
                max_tokens: 4096,
                top_p: 1.0,
                presence_penalty: 0.0,
                frequency_penalty: 0.0,
            },
            appearance: AppearanceSettings {
                theme: ThemeMode::System,
                font_size: 14,
                font_family: "system-ui".to_string(),
                language: Language::ZhCn,
                compact_mode: false,
            },
            conversation: ConversationSettings {
                max_history_messages: 50,
                auto_save: true,
                show_timestamp: true,
                enable_markdown: true,
                enable_code_highlight: true,
                stream_response: true,
            },
            data: DataSettings {
                auto_backup: true,
                backup_interval: 24,
                max_backup_files: 7,
                export_format: "json".to_string(),
            },
            system: SystemSettings {
                api_config: ApiConfig {
                    provider: ApiProvider::Openai,
                    api_key: String::new(),
                    base_url: None,
                    custom_name: None,
                },
                proxy_enabled: false,
                proxy_host: None,
                proxy_port: None,
                proxy_auth: None,
                api_keys: ApiKeys {
                    openai: None,
                    anthropic: None,
                },
                auto_start: false,
                minimize_to_tray: true,
            },
            version: "1.0.0".to_string(),
            last_updated: chrono::Utc::now().timestamp_millis(),
        }
    }
}

/// 设置管理器
pub struct SettingsManager {
    settings_path: PathBuf,
}

impl SettingsManager {
    /// 创建新的设置管理器
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let app_data_dir = dirs::data_dir()
            .ok_or("无法获取应用数据目录")?
            .join("sker");
        
        let settings_path = app_data_dir.join("settings.json");
        
        Ok(Self { settings_path })
    }

    /// 确保设置目录存在
    async fn ensure_settings_dir(&self) -> Result<(), tokio::io::Error> {
        if let Some(parent) = self.settings_path.parent() {
            fs::create_dir_all(parent).await?;
        }
        Ok(())
    }

    /// 加载设置
    pub async fn load_settings(&self) -> Result<AppSettings, Box<dyn std::error::Error>> {
        println!("=== 设置管理器日志 ===");
        println!("设置文件路径: {:?}", self.settings_path);
        println!("设置文件是否存在: {}", self.settings_path.exists());
        
        if !self.settings_path.exists() {
            // 如果设置文件不存在，返回默认设置并保存
            println!("设置文件不存在，使用默认设置");
            let default_settings = AppSettings::default();
            self.save_settings(&default_settings).await?;
            return Ok(default_settings);
        }

        let contents = fs::read_to_string(&self.settings_path).await?;
        println!("设置文件内容长度: {} 字节", contents.len());
        
        // 尝试解析设置，如果失败则尝试迁移旧格式
        match serde_json::from_str::<AppSettings>(&contents) {
            Ok(settings) => {
                println!("✓ 设置解析成功");
                println!("当前API提供商: {:?}", settings.system.api_config.provider);
                println!("当前API密钥长度: {}", settings.system.api_config.api_key.len());
                println!("当前Base URL: {:?}", settings.system.api_config.base_url);
                println!("当前自定义名称: {:?}", settings.system.api_config.custom_name);
                println!("===================");
                Ok(settings)
            },
            Err(e) => {
                // 尝试解析为旧格式并迁移
                println!("尝试迁移旧设置格式: {}", e);
                
                // 先尝试解析为JSON Value，然后手动处理
                if let Ok(mut value) = serde_json::from_str::<serde_json::Value>(&contents) {
                    // 如果system字段存在但没有api_config，添加默认值
                    if let Some(system) = value.get_mut("system") {
                        if system.get("api_config").is_none() {
                            system.as_object_mut().unwrap().insert(
                                "api_config".to_string(),
                                serde_json::to_value(ApiConfig::default())?
                            );
                        }
                        if system.get("api_keys").is_none() {
                            system.as_object_mut().unwrap().insert(
                                "api_keys".to_string(),
                                serde_json::to_value(ApiKeys::default())?
                            );
                        }
                    }
                    
                    // 尝试再次解析
                    if let Ok(settings) = serde_json::from_value::<AppSettings>(value) {
                        // 保存迁移后的设置
                        self.save_settings(&settings).await?;
                        return Ok(settings);
                    }
                }
                
                // 如果迁移失败，返回默认设置
                println!("迁移失败，使用默认设置");
                let default_settings = AppSettings::default();
                self.save_settings(&default_settings).await?;
                Ok(default_settings)
            }
        }
    }

    /// 保存设置
    pub async fn save_settings(&self, settings: &AppSettings) -> Result<(), Box<dyn std::error::Error>> {
        self.ensure_settings_dir().await?;
        
        let contents = serde_json::to_string_pretty(settings)?;
        fs::write(&self.settings_path, contents).await?;
        
        Ok(())
    }

    /// 更新设置的特定部分
    pub async fn update_settings(
        &self, 
        section: &str, 
        new_settings: serde_json::Value
    ) -> Result<AppSettings, Box<dyn std::error::Error>> {
        let mut current_settings = self.load_settings().await?;
        
        // 根据section更新对应的设置部分
        match section {
            "model" => {
                if let Ok(model_settings) = serde_json::from_value::<ModelSettings>(new_settings) {
                    current_settings.model = model_settings;
                }
            }
            "appearance" => {
                if let Ok(appearance_settings) = serde_json::from_value::<AppearanceSettings>(new_settings) {
                    current_settings.appearance = appearance_settings;
                }
            }
            "conversation" => {
                if let Ok(conversation_settings) = serde_json::from_value::<ConversationSettings>(new_settings) {
                    current_settings.conversation = conversation_settings;
                }
            }
            "data" => {
                if let Ok(data_settings) = serde_json::from_value::<DataSettings>(new_settings) {
                    current_settings.data = data_settings;
                }
            }
            "system" => {
                // 部分更新系统设置
                if let Ok(partial_system) = serde_json::from_value::<serde_json::Value>(new_settings.clone()) {
                    if let Ok(mut system_settings_json) = serde_json::to_value(&current_settings.system) {
                        // 合并新的设置到现有设置
                        if let Some(obj) = partial_system.as_object() {
                            if let Some(system_obj) = system_settings_json.as_object_mut() {
                                for (key, value) in obj {
                                    system_obj.insert(key.clone(), value.clone());
                                }
                            }
                        }
                        // 将合并后的JSON转换回SystemSettings
                        if let Ok(updated_system) = serde_json::from_value::<SystemSettings>(system_settings_json) {
                            current_settings.system = updated_system;
                        }
                    }
                }
            }
            _ => return Err("未知的设置部分".into()),
        }

        // 更新时间戳
        current_settings.last_updated = chrono::Utc::now().timestamp_millis();
        
        // 保存更新后的设置
        self.save_settings(&current_settings).await?;
        
        Ok(current_settings)
    }

    /// 重置设置为默认值
    pub async fn reset_settings(&self) -> Result<AppSettings, Box<dyn std::error::Error>> {
        let default_settings = AppSettings::default();
        self.save_settings(&default_settings).await?;
        Ok(default_settings)
    }

    /// 导出设置
    pub async fn export_settings(&self) -> Result<String, Box<dyn std::error::Error>> {
        let settings = self.load_settings().await?;
        let export_data = serde_json::json!({
            "settings": settings,
            "exported_at": chrono::Utc::now().timestamp_millis(),
            "version": "1.0.0"
        });
        
        Ok(serde_json::to_string_pretty(&export_data)?)
    }

    /// 导入设置
    pub async fn import_settings(&self, data: &str) -> Result<AppSettings, Box<dyn std::error::Error>> {
        let import_data: serde_json::Value = serde_json::from_str(data)?;
        
        if let Some(settings_value) = import_data.get("settings") {
            let settings: AppSettings = serde_json::from_value(settings_value.clone())?;
            self.save_settings(&settings).await?;
            Ok(settings)
        } else {
            Err("无效的设置导入格式".into())
        }
    }
}

// ==================== Tauri 命令 ====================

/// 获取应用设置
#[tauri::command]
pub async fn get_app_settings() -> Result<AppSettings, String> {
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    
    settings_manager.load_settings().await
        .map_err(|e| format!("加载设置失败: {}", e))
}

/// 保存应用设置
#[tauri::command]
pub async fn save_app_settings(settings: AppSettings) -> Result<(), String> {
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    
    settings_manager.save_settings(&settings).await
        .map_err(|e| format!("保存设置失败: {}", e))
}

/// 更新应用设置的特定部分
#[tauri::command]
pub async fn update_app_settings(request: UpdateSettingsRequest) -> Result<AppSettings, String> {
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    
    settings_manager.update_settings(&request.section, request.settings).await
        .map_err(|e| format!("更新设置失败: {}", e))
}

/// 重置应用设置为默认值
#[tauri::command]
pub async fn reset_app_settings() -> Result<AppSettings, String> {
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    
    settings_manager.reset_settings().await
        .map_err(|e| format!("重置设置失败: {}", e))
}

/// 导出应用设置
#[tauri::command]
pub async fn export_app_settings() -> Result<String, String> {
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    
    settings_manager.export_settings().await
        .map_err(|e| format!("导出设置失败: {}", e))
}

/// 导入应用设置
#[tauri::command]
pub async fn import_app_settings(data: String) -> Result<AppSettings, String> {
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    
    settings_manager.import_settings(&data).await
        .map_err(|e| format!("导入设置失败: {}", e))
}

/// 测试API连接
#[tauri::command]
pub async fn test_api_connection(config: ApiConfig) -> Result<String, String> {
    // 创建HTTP客户端
    let client = reqwest::Client::new();
    
    // 根据提供商类型构建测试请求
    let test_url = match config.provider {
        ApiProvider::Openai => {
            config.base_url.as_deref().unwrap_or("https://api.openai.com/v1").to_string() + "/models"
        }
        ApiProvider::Custom => {
            if let Some(base_url) = &config.base_url {
                format!("{}/models", base_url.trim_end_matches('/'))
            } else {
                return Err("自定义代理缺少base_url".to_string());
            }
        }
        ApiProvider::Anthropic => {
            "https://api.anthropic.com/v1/messages".to_string()
        }
    };
    
    // 构建请求头
    let mut headers = reqwest::header::HeaderMap::new();
    
    match config.provider {
        ApiProvider::Openai | ApiProvider::Custom => {
            headers.insert(
                "Authorization", 
                format!("Bearer {}", config.api_key).parse()
                    .map_err(|_| "无效的API密钥格式".to_string())?
            );
        }
        ApiProvider::Anthropic => {
            headers.insert(
                "x-api-key", 
                config.api_key.parse()
                    .map_err(|_| "无效的API密钥格式".to_string())?
            );
            headers.insert(
                "anthropic-version", 
                "2023-06-01".parse()
                    .map_err(|_| "无效的版本头".to_string())?
            );
        }
    }
    
    // 发送测试请求
    let response = client
        .get(&test_url)
        .headers(headers)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;
    
    if response.status().is_success() {
        Ok("连接成功".to_string())
    } else if response.status() == 401 {
        Err("API密钥无效或已过期".to_string())
    } else if response.status() == 403 {
        Err("API密钥权限不足".to_string())
    } else if response.status() == 404 {
        Err("API端点不存在，请检查base_url".to_string())
    } else {
        Err(format!("连接失败: HTTP {}", response.status()))
    }
}