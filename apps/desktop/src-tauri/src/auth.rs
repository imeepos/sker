//! 用户认证模块

use codex_database::{
    DatabaseConnection,
    repository::{
        user_repository::{UserRepository, CreateUserData},
        user_session_repository::{UserSessionRepository, CreateSessionData},
    },
};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use uuid::Uuid;
use chrono::Utc;
use std::sync::Arc;
use tauri::State;

/// 认证服务
#[derive(Clone)]
pub struct AuthService {
    db: DatabaseConnection,
}

/// 登录请求数据
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// 注册请求数据
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

/// 修改密码请求数据
#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// 更新用户信息请求数据
#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
}

/// 认证响应数据
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserInfo,
    pub token: String,
    pub refresh_token: String,
    pub expires_in: i64, // 秒数
}

/// 用户信息
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub created_at: String,
    pub profile_data: Option<serde_json::Value>,
}

/// 当前用户状态
#[derive(Debug, Clone)]
pub struct CurrentUser {
    pub user_id: Uuid,
    pub username: String,
    pub email: String,
    pub session_id: Uuid,
}

impl AuthService {
    /// 创建新的认证服务
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 用户注册
    pub async fn register(&self, request: RegisterRequest) -> Result<AuthResponse, String> {
        let user_repo = UserRepository::new(self.db.clone());
        
        // 检查用户是否已存在
        if let Some(_) = user_repo.find_by_email(&request.email).await
            .map_err(|e| format!("查询用户失败: {}", e))? {
            return Err("邮箱已被注册".to_string());
        }
        
        if let Some(_) = user_repo.find_by_username(&request.username).await
            .map_err(|e| format!("查询用户失败: {}", e))? {
            return Err("用户名已被占用".to_string());
        }
        
        // 密码加密
        let password_hash = self.hash_password(&request.password);
        
        // 创建用户
        let user_data = CreateUserData {
            username: request.username,
            email: request.email,
            password_hash,
            profile_data: None,
            settings: None,
        };
        
        let user = user_repo.create(user_data).await
            .map_err(|e| format!("创建用户失败: {}", e))?;
        
        // 创建会话
        let auth_response = self.create_session_for_user(&user).await?;
        
        Ok(auth_response)
    }

    /// 用户登录
    pub async fn login(&self, request: LoginRequest) -> Result<AuthResponse, String> {
        let user_repo = UserRepository::new(self.db.clone());
        
        // 查找用户
        let user = user_repo.find_by_email(&request.email).await
            .map_err(|e| format!("查询用户失败: {}", e))?
            .ok_or("用户不存在")?;
        
        // 验证密码
        if !self.verify_password(&request.password, &user.password_hash) {
            return Err("密码错误".to_string());
        }
        
        // 检查用户是否活跃
        if !user.is_active {
            return Err("用户账户已被禁用".to_string());
        }
        
        // 更新最后登录时间
        user_repo.update_last_login(user.user_id).await
            .map_err(|e| format!("更新登录时间失败: {}", e))?;
        
        // 创建会话
        let auth_response = self.create_session_for_user(&user).await?;
        
        Ok(auth_response)
    }

    /// 验证令牌
    pub async fn validate_token(&self, token: &str) -> Result<CurrentUser, String> {
        let session_repo = UserSessionRepository::new(self.db.clone());
        
        let session = session_repo.validate_session(token).await
            .map_err(|e| format!("验证会话失败: {}", e))?
            .ok_or("无效的令牌")?;
        
        let user_repo = UserRepository::new(self.db.clone());
        let user = user_repo.find_by_id(session.user_id).await
            .map_err(|e| format!("查询用户失败: {}", e))?
            .ok_or("用户不存在")?;
        
        Ok(CurrentUser {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            session_id: session.session_id,
        })
    }

    /// 刷新令牌
    pub async fn refresh_token(&self, refresh_token: &str) -> Result<AuthResponse, String> {
        let session_repo = UserSessionRepository::new(self.db.clone());
        
        let session = session_repo.find_by_refresh_token(refresh_token).await
            .map_err(|e| format!("查询会话失败: {}", e))?
            .ok_or("无效的刷新令牌")?;
        
        if !session.is_valid() {
            return Err("刷新令牌已过期".to_string());
        }
        
        let user_repo = UserRepository::new(self.db.clone());
        let user = user_repo.find_by_id(session.user_id).await
            .map_err(|e| format!("查询用户失败: {}", e))?
            .ok_or("用户不存在")?;
        
        // 生成新的令牌
        let new_token = self.generate_token();
        let new_refresh_token = self.generate_token();
        let expires_in_hours = 24;
        
        // 更新会话
        let _updated_session = session_repo.refresh_token(
            session.session_id,
            new_token.clone(),
            new_refresh_token.clone(),
            expires_in_hours,
        ).await.map_err(|e| format!("更新会话失败: {}", e))?;
        
        let user_info = UserInfo {
            user_id: user.user_id.to_string(),
            username: user.username,
            email: user.email,
            created_at: user.created_at.to_rfc3339(),
            profile_data: user.profile_data,
        };
        
        Ok(AuthResponse {
            user: user_info,
            token: new_token,
            refresh_token: new_refresh_token,
            expires_in: expires_in_hours * 3600,
        })
    }

    /// 注销
    pub async fn logout(&self, token: &str) -> Result<(), String> {
        let session_repo = UserSessionRepository::new(self.db.clone());
        
        if let Some(session) = session_repo.find_by_token(token).await
            .map_err(|e| format!("查询会话失败: {}", e))? {
            session_repo.invalidate_session(session.session_id).await
                .map_err(|e| format!("注销会话失败: {}", e))?;
        }
        
        Ok(())
    }

    /// 为用户创建会话
    async fn create_session_for_user(
        &self, 
        user: &codex_database::entities::user::Model
    ) -> Result<AuthResponse, String> {
        let session_repo = UserSessionRepository::new(self.db.clone());
        
        // 生成令牌
        let token = self.generate_token();
        let refresh_token = self.generate_token();
        let expires_in_hours = 24;
        
        // 创建会话数据
        let session_data = CreateSessionData {
            user_id: user.user_id,
            token: token.clone(),
            refresh_token: refresh_token.clone(),
            ip_address: None, // 桌面应用暂时不需要IP
            user_agent: Some("Sker Desktop App".to_string()),
            expires_in_hours,
        };
        
        // 创建会话
        let _session = session_repo.create(session_data).await
            .map_err(|e| format!("创建会话失败: {}", e))?;
        
        let user_info = UserInfo {
            user_id: user.user_id.to_string(),
            username: user.username.clone(),
            email: user.email.clone(),
            created_at: user.created_at.to_rfc3339(),
            profile_data: user.profile_data.clone(),
        };
        
        Ok(AuthResponse {
            user: user_info,
            token,
            refresh_token,
            expires_in: expires_in_hours * 3600,
        })
    }

    /// 生成令牌
    fn generate_token(&self) -> String {
        format!("{}_{}", Uuid::new_v4(), chrono::Utc::now().timestamp())
    }

    /// 密码加密
    fn hash_password(&self, password: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(password.as_bytes());
        hasher.update(b"sker_salt"); // 添加盐值
        format!("{:x}", hasher.finalize())
    }

    /// 验证密码
    fn verify_password(&self, password: &str, hash: &str) -> bool {
        let computed_hash = self.hash_password(password);
        computed_hash == hash
    }

    /// 修改密码
    pub async fn change_password(&self, user_id: Uuid, request: ChangePasswordRequest) -> Result<(), String> {
        let user_repo = UserRepository::new(self.db.clone());
        
        // 获取用户信息
        let user = user_repo.find_by_id(user_id).await
            .map_err(|e| format!("查询用户失败: {}", e))?
            .ok_or("用户不存在")?;
        
        // 验证当前密码
        if !self.verify_password(&request.current_password, &user.password_hash) {
            return Err("当前密码错误".to_string());
        }
        
        // 加密新密码
        let new_password_hash = self.hash_password(&request.new_password);
        
        // 更新密码
        user_repo.update_password(user_id, new_password_hash).await
            .map_err(|e| format!("更新密码失败: {}", e))?;
        
        Ok(())
    }

    /// 更新用户信息
    pub async fn update_user(&self, user_id: Uuid, request: UpdateUserRequest) -> Result<UserInfo, String> {
        let user_repo = UserRepository::new(self.db.clone());
        
        // 检查用户名是否已被占用（如果要更新用户名）
        if let Some(ref username) = request.username {
            if let Some(existing_user) = user_repo.find_by_username(username).await
                .map_err(|e| format!("查询用户失败: {}", e))? {
                if existing_user.user_id != user_id {
                    return Err("用户名已被占用".to_string());
                }
            }
        }
        
        // 检查邮箱是否已被占用（如果要更新邮箱）
        if let Some(ref email) = request.email {
            if let Some(existing_user) = user_repo.find_by_email(email).await
                .map_err(|e| format!("查询用户失败: {}", e))? {
                if existing_user.user_id != user_id {
                    return Err("邮箱已被注册".to_string());
                }
            }
        }
        
        // 更新用户信息
        let updated_user = user_repo.update_user_info(user_id, request.username, request.email).await
            .map_err(|e| format!("更新用户信息失败: {}", e))?;
        
        Ok(UserInfo {
            user_id: updated_user.user_id.to_string(),
            username: updated_user.username,
            email: updated_user.email,
            created_at: updated_user.created_at.to_rfc3339(),
            profile_data: updated_user.profile_data,
        })
    }
}

// Tauri命令

/// 用户注册命令
#[tauri::command]
pub async fn register(
    request: RegisterRequest,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<AuthResponse, String> {
    let auth_service = AuthService::new((**db).clone());
    let response = auth_service.register(request).await?;
    
    Ok(response)
}

/// 用户登录命令
#[tauri::command]
pub async fn login(
    request: LoginRequest,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<AuthResponse, String> {
    let auth_service = AuthService::new((**db).clone());
    let response = auth_service.login(request).await?;
    
    Ok(response)
}

/// 验证令牌命令
#[tauri::command]
pub async fn validate_token(
    token: String,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<UserInfo, String> {
    let auth_service = AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await?;
    
    Ok(UserInfo {
        user_id: current_user.user_id.to_string(),
        username: current_user.username,
        email: current_user.email,
        created_at: Utc::now().to_rfc3339(), // 这里应该从数据库获取
        profile_data: None,
    })
}

/// 刷新令牌命令
#[tauri::command]
pub async fn refresh_token(
    refresh_token: String,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<AuthResponse, String> {
    let auth_service = AuthService::new((**db).clone());
    auth_service.refresh_token(&refresh_token).await
}

/// 注销命令
#[tauri::command]
pub async fn logout(
    token: String,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<(), String> {
    let auth_service = AuthService::new((**db).clone());
    auth_service.logout(&token).await?;
    
    Ok(())
}

/// 获取当前用户信息命令
#[tauri::command]
pub async fn get_current_user(
    token: String,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<UserInfo, String> {
    let auth_service = AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await?;
    
    let user_repo = UserRepository::new((**db).clone());
    let user = user_repo.find_by_id(current_user.user_id).await
        .map_err(|e| format!("查询用户失败: {}", e))?
        .ok_or("用户不存在")?;
    
    Ok(UserInfo {
        user_id: current_user.user_id.to_string(),
        username: current_user.username,
        email: current_user.email,
        created_at: user.created_at.to_rfc3339(),
        profile_data: user.profile_data,
    })
}

/// 修改密码命令
#[tauri::command]
pub async fn change_password(
    request: ChangePasswordRequest,
    token: String,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<(), String> {
    let auth_service = AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await?;
    auth_service.change_password(current_user.user_id, request).await
}

/// 更新用户信息命令
#[tauri::command]
pub async fn update_user_info(
    request: UpdateUserRequest,
    token: String,
    db: State<'_, Arc<DatabaseConnection>>,
) -> Result<UserInfo, String> {
    let auth_service = AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await?;
    let updated_user = auth_service.update_user(current_user.user_id, request).await?;
    
    Ok(updated_user)
}