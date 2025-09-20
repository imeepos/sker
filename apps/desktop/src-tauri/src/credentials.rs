//! 安全凭据存储模块
//! 使用AES-GCM加密算法安全存储用户凭据

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, AppHandle};
use aes_gcm::{Aes256Gcm, Key, Nonce, aead::{Aead, KeyInit}};
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use uuid::Uuid;

/// 加密的凭据数据结构
#[derive(Debug, Serialize, Deserialize)]
struct EncryptedCredentials {
    /// 加密后的邮箱
    encrypted_email: String,
    /// 加密后的密码
    encrypted_password: String,
    /// 加密随机数
    nonce: String,
    /// 设备唯一标识符
    device_id: String,
    /// 创建时间
    created_at: String,
    /// 最后使用时间
    last_used: String,
}

/// 存储的凭据信息
#[derive(Debug, Serialize, Deserialize)]
pub struct StoredCredentials {
    pub email: String,
    pub password: String,
    pub remember: bool,
}

/// 凭据请求
#[derive(Debug, Deserialize)]
pub struct SaveCredentialsRequest {
    pub email: String,
    pub password: String,
    pub remember: bool,
}

/// 获取凭据响应
#[derive(Debug, Serialize)]
pub struct GetCredentialsResponse {
    pub email: String,
    pub password: String,
    pub has_saved_credentials: bool,
}

/// 安全凭据存储服务
pub struct CredentialsService {
    /// 存储文件路径
    storage_path: PathBuf,
    /// 设备唯一标识
    device_id: String,
}

impl CredentialsService {
    /// 创建新的凭据服务
    pub fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle.path().app_data_dir()
            .map_err(|e| format!("获取应用数据目录失败: {}", e))?;
        
        let storage_dir = app_data_dir.join("sker").join("credentials");
        if !storage_dir.exists() {
            fs::create_dir_all(&storage_dir)
                .map_err(|e| format!("创建存储目录失败: {}", e))?;
        }
        
        let storage_path = storage_dir.join("creds.enc");
        let device_id = Self::get_or_create_device_id(&storage_dir)?;
        
        Ok(Self {
            storage_path,
            device_id,
        })
    }
    
    /// 获取或创建设备ID
    fn get_or_create_device_id(storage_dir: &PathBuf) -> Result<String, String> {
        let device_id_path = storage_dir.join("device.id");
        
        if device_id_path.exists() {
            let device_id = fs::read_to_string(&device_id_path)
                .map_err(|e| format!("读取设备ID失败: {}", e))?;
            Ok(device_id.trim().to_string())
        } else {
            let device_id = Uuid::new_v4().to_string();
            fs::write(&device_id_path, &device_id)
                .map_err(|e| format!("保存设备ID失败: {}", e))?;
            Ok(device_id)
        }
    }
    
    /// 生成加密密钥
    fn generate_key(&self) -> Key<Aes256Gcm> {
        let mut hasher = Sha256::new();
        hasher.update(self.device_id.as_bytes());
        hasher.update(b"sker_credentials_key");
        
        // 使用硬件信息增强安全性
        if let Ok(hostname) = std::env::var("COMPUTERNAME") {
            hasher.update(hostname.as_bytes());
        } else if let Ok(hostname) = std::env::var("HOSTNAME") {
            hasher.update(hostname.as_bytes());
        }
        
        let key_bytes = hasher.finalize();
        *Key::<Aes256Gcm>::from_slice(&key_bytes)
    }
    
    /// 保存凭据
    pub fn save_credentials(&self, request: SaveCredentialsRequest) -> Result<(), String> {
        if !request.remember {
            // 如果不记住密码，删除已保存的凭据
            self.clear_credentials()?;
            return Ok(());
        }
        
        let cipher = Aes256Gcm::new(&self.generate_key());
        let nonce_bytes: [u8; 12] = rand::random();
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // 加密邮箱和密码
        let encrypted_email = cipher.encrypt(nonce, request.email.as_bytes())
            .map_err(|e| format!("加密邮箱失败: {}", e))?;
        let encrypted_password = cipher.encrypt(nonce, request.password.as_bytes())
            .map_err(|e| format!("加密密码失败: {}", e))?;
        
        let credentials = EncryptedCredentials {
            encrypted_email: BASE64.encode(&encrypted_email),
            encrypted_password: BASE64.encode(&encrypted_password),
            nonce: BASE64.encode(&nonce_bytes),
            device_id: self.device_id.clone(),
            created_at: chrono::Utc::now().to_rfc3339(),
            last_used: chrono::Utc::now().to_rfc3339(),
        };
        
        let json_data = serde_json::to_string_pretty(&credentials)
            .map_err(|e| format!("序列化凭据失败: {}", e))?;
        
        fs::write(&self.storage_path, json_data)
            .map_err(|e| format!("保存凭据文件失败: {}", e))?;
        
        Ok(())
    }
    
    /// 获取保存的凭据
    pub fn get_saved_credentials(&self) -> Result<Option<StoredCredentials>, String> {
        if !self.storage_path.exists() {
            return Ok(None);
        }
        
        let json_data = fs::read_to_string(&self.storage_path)
            .map_err(|e| format!("读取凭据文件失败: {}", e))?;
        
        let encrypted_creds: EncryptedCredentials = serde_json::from_str(&json_data)
            .map_err(|e| format!("解析凭据文件失败: {}", e))?;
        
        // 验证设备ID
        if encrypted_creds.device_id != self.device_id {
            // 设备ID不匹配，可能是在其他设备上，清除凭据
            self.clear_credentials()?;
            return Ok(None);
        }
        
        let cipher = Aes256Gcm::new(&self.generate_key());
        
        // 解密随机数
        let nonce_bytes = BASE64.decode(&encrypted_creds.nonce)
            .map_err(|e| format!("解码随机数失败: {}", e))?;
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // 解密邮箱
        let encrypted_email_bytes = BASE64.decode(&encrypted_creds.encrypted_email)
            .map_err(|e| format!("解码加密邮箱失败: {}", e))?;
        let email_bytes = cipher.decrypt(nonce, encrypted_email_bytes.as_slice())
            .map_err(|e| format!("解密邮箱失败: {}", e))?;
        let email = String::from_utf8(email_bytes)
            .map_err(|e| format!("转换邮箱字符串失败: {}", e))?;
        
        // 解密密码
        let encrypted_password_bytes = BASE64.decode(&encrypted_creds.encrypted_password)
            .map_err(|e| format!("解码加密密码失败: {}", e))?;
        let password_bytes = cipher.decrypt(nonce, encrypted_password_bytes.as_slice())
            .map_err(|e| format!("解密密码失败: {}", e))?;
        let password = String::from_utf8(password_bytes)
            .map_err(|e| format!("转换密码字符串失败: {}", e))?;
        
        // 更新最后使用时间
        let mut updated_creds = encrypted_creds;
        updated_creds.last_used = chrono::Utc::now().to_rfc3339();
        
        let updated_json = serde_json::to_string_pretty(&updated_creds)
            .map_err(|e| format!("序列化更新凭据失败: {}", e))?;
        
        let _ = fs::write(&self.storage_path, updated_json); // 忽略更新时间的错误
        
        Ok(Some(StoredCredentials {
            email,
            password,
            remember: true,
        }))
    }
    
    /// 清除保存的凭据
    pub fn clear_credentials(&self) -> Result<(), String> {
        if self.storage_path.exists() {
            fs::remove_file(&self.storage_path)
                .map_err(|e| format!("删除凭据文件失败: {}", e))?;
        }
        Ok(())
    }
    
    /// 检查是否有保存的凭据
    pub fn has_saved_credentials(&self) -> bool {
        self.storage_path.exists()
    }
}

// Tauri 命令

/// 保存登录凭据
#[tauri::command]
pub async fn save_credentials(
    request: SaveCredentialsRequest,
    app: AppHandle,
) -> Result<(), String> {
    let service = CredentialsService::new(&app)?;
    service.save_credentials(request)
}

/// 获取保存的凭据
#[tauri::command]
pub async fn get_saved_credentials(
    app: AppHandle,
) -> Result<Option<StoredCredentials>, String> {
    let service = CredentialsService::new(&app)?;
    service.get_saved_credentials()
}

/// 清除保存的凭据
#[tauri::command]
pub async fn clear_saved_credentials(
    app: AppHandle,
) -> Result<(), String> {
    let service = CredentialsService::new(&app)?;
    service.clear_credentials()
}

/// 检查是否有保存的凭据
#[tauri::command]
pub async fn has_saved_credentials(
    app: AppHandle,
) -> Result<bool, String> {
    let service = CredentialsService::new(&app)?;
    Ok(service.has_saved_credentials())
}