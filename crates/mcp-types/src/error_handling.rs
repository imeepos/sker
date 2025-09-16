// MCP错误处理策略 - 健壮的错误管理和恢复机制
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// MCP错误分类 - 按严重程度和可恢复性分类
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum McpErrorSeverity {
    /// 低级别错误 - 不影响核心功能
    Low,
    /// 中等错误 - 部分功能受影响
    Medium,
    /// 高级别错误 - 核心功能受影响
    High,
    /// 致命错误 - 系统无法继续运行
    Critical,
}

/// MCP错误类型 - 详细的错误分类
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "details", rename_all = "camelCase")]
pub enum McpError {
    // 协议层错误
    ProtocolError {
        message: String,
        code: String,
        severity: McpErrorSeverity,
        recoverable: bool,
    },
    
    // 序列化/反序列化错误
    SerializationError {
        message: String,
        field: Option<String>,
        expected_type: Option<String>,
        received_type: Option<String>,
    },
    
    // 网络通信错误
    NetworkError {
        message: String,
        error_type: NetworkErrorType,
        retry_after: Option<u64>, // 建议的重试延迟（秒）
    },
    
    // 认证和授权错误
    AuthError {
        message: String,
        auth_type: AuthErrorType,
        expires_at: Option<chrono::DateTime<chrono::Utc>>,
    },
    
    // 资源相关错误
    ResourceError {
        message: String,
        resource_type: String,
        resource_id: Option<String>,
        operation: String,
    },
    
    // 业务逻辑错误
    BusinessLogicError {
        message: String,
        rule: String,
        context: HashMap<String, serde_json::Value>,
    },
    
    // 系统级错误
    SystemError {
        message: String,
        system_code: Option<i32>,
        stack_trace: Option<String>,
    },
    
    // 超时错误
    TimeoutError {
        message: String,
        operation: String,
        timeout_duration: u64,
        elapsed: u64,
    },
    
    // 并发控制错误
    ConcurrencyError {
        message: String,
        resource: String,
        conflict_type: ConcurrencyErrorType,
    },
    
    // 验证错误
    ValidationError {
        message: String,
        field_errors: Vec<FieldError>,
    },
    
    // 自定义错误
    CustomError {
        error_type: String,
        message: String,
        metadata: HashMap<String, serde_json::Value>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NetworkErrorType {
    ConnectionTimeout,
    ConnectionRefused,
    ConnectionLost,
    DnsResolution,
    SSLHandshake,
    InvalidResponse,
    RateLimited,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuthErrorType {
    InvalidCredentials,
    TokenExpired,
    TokenRevoked,
    InsufficientPermissions,
    AccountLocked,
    TwoFactorRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConcurrencyErrorType {
    OptimisticLock,
    PessimisticLock,
    ResourceBusy,
    DeadlockDetected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldError {
    pub field: String,
    pub message: String,
    pub code: String,
    pub value: Option<serde_json::Value>,
}

/// 错误上下文 - 提供详细的错误发生环境
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub error_id: Uuid,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub conversation_id: Option<Uuid>,
    pub user_id: Option<String>,
    pub request_id: Option<String>,
    pub operation: String,
    pub component: String,
    pub environment: HashMap<String, String>,
    pub user_agent: Option<String>,
    pub session_id: Option<String>,
}

impl ErrorContext {
    pub fn new(operation: String, component: String) -> Self {
        Self {
            error_id: Uuid::new_v4(),
            timestamp: chrono::Utc::now(),
            conversation_id: None,
            user_id: None,
            request_id: None,
            operation,
            component,
            environment: HashMap::new(),
            user_agent: None,
            session_id: None,
        }
    }
    
    pub fn with_conversation_id(mut self, conversation_id: Uuid) -> Self {
        self.conversation_id = Some(conversation_id);
        self
    }
    
    pub fn with_user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }
    
    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = Some(request_id);
        self
    }
}

/// 错误恢复策略 - 定义错误发生时的恢复行为
#[derive(Debug, Clone)]
pub enum RecoveryStrategy {
    /// 立即重试
    Retry { max_attempts: u32, delay_seconds: u64 },
    /// 指数退避重试
    ExponentialBackoff { max_attempts: u32, base_delay: u64, max_delay: u64 },
    /// 降级服务
    Fallback { fallback_operation: String },
    /// 忽略错误继续执行
    Continue,
    /// 停止执行并报告
    Stop,
    /// 用户干预
    UserIntervention { message: String },
}

/// 错误处理器 - 集中管理错误处理逻辑
pub struct ErrorHandler {
    /// 错误策略映射
    strategies: RwLock<HashMap<String, RecoveryStrategy>>,
    /// 错误记录器
    error_log: RwLock<Vec<(ErrorContext, McpError)>>,
    /// 错误统计
    error_stats: RwLock<HashMap<String, u64>>,
}

impl ErrorHandler {
    pub fn new() -> Self {
        let mut strategies = HashMap::new();
        
        // 默认错误策略
        strategies.insert("NetworkError".to_string(), RecoveryStrategy::ExponentialBackoff {
            max_attempts: 3,
            base_delay: 1,
            max_delay: 30,
        });
        
        strategies.insert("TimeoutError".to_string(), RecoveryStrategy::Retry {
            max_attempts: 2,
            delay_seconds: 5,
        });
        
        strategies.insert("ValidationError".to_string(), RecoveryStrategy::UserIntervention {
            message: "请检查输入数据的格式和完整性".to_string(),
        });
        
        strategies.insert("AuthError".to_string(), RecoveryStrategy::UserIntervention {
            message: "请重新进行身份验证".to_string(),
        });
        
        Self {
            strategies: RwLock::new(strategies),
            error_log: RwLock::new(Vec::new()),
            error_stats: RwLock::new(HashMap::new()),
        }
    }
    
    /// 处理错误并返回恢复策略
    pub async fn handle_error(&self, error: McpError, context: ErrorContext) -> RecoveryStrategy {
        // 记录错误
        self.log_error(&error, &context).await;
        
        // 更新统计
        self.update_stats(&error).await;
        
        // 获取恢复策略
        let error_type = self.get_error_type(&error);
        let strategies = self.strategies.read().await;
        
        strategies.get(&error_type)
            .cloned()
            .unwrap_or(RecoveryStrategy::Stop)
    }
    
    /// 注册自定义错误处理策略
    pub async fn register_strategy(&self, error_type: String, strategy: RecoveryStrategy) {
        self.strategies.write().await.insert(error_type, strategy);
    }
    
    /// 获取错误统计信息
    pub async fn get_error_stats(&self) -> HashMap<String, u64> {
        self.error_stats.read().await.clone()
    }
    
    /// 获取最近的错误日志
    pub async fn get_recent_errors(&self, limit: usize) -> Vec<(ErrorContext, McpError)> {
        let log = self.error_log.read().await;
        log.iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }
    
    /// 清理旧的错误日志
    pub async fn cleanup_old_errors(&self, older_than_hours: i64) {
        let cutoff = chrono::Utc::now() - chrono::Duration::hours(older_than_hours);
        let mut log = self.error_log.write().await;
        
        log.retain(|(context, _)| context.timestamp > cutoff);
    }
    
    // 私有方法
    
    async fn log_error(&self, error: &McpError, context: &ErrorContext) {
        let mut log = self.error_log.write().await;
        log.push((context.clone(), error.clone()));
        
        // 限制日志大小
        if log.len() > 10000 {
            log.drain(0..1000);
        }
    }
    
    async fn update_stats(&self, error: &McpError) {
        let error_type = self.get_error_type(error);
        let mut stats = self.error_stats.write().await;
        *stats.entry(error_type).or_insert(0) += 1;
    }
    
    fn get_error_type(&self, error: &McpError) -> String {
        match error {
            McpError::ProtocolError { .. } => "ProtocolError".to_string(),
            McpError::SerializationError { .. } => "SerializationError".to_string(),
            McpError::NetworkError { .. } => "NetworkError".to_string(),
            McpError::AuthError { .. } => "AuthError".to_string(),
            McpError::ResourceError { .. } => "ResourceError".to_string(),
            McpError::BusinessLogicError { .. } => "BusinessLogicError".to_string(),
            McpError::SystemError { .. } => "SystemError".to_string(),
            McpError::TimeoutError { .. } => "TimeoutError".to_string(),
            McpError::ConcurrencyError { .. } => "ConcurrencyError".to_string(),
            McpError::ValidationError { .. } => "ValidationError".to_string(),
            McpError::CustomError { error_type, .. } => error_type.clone(),
        }
    }
}

/// 错误处理宏 - 简化错误处理代码
#[macro_export]
macro_rules! handle_mcp_error {
    ($error_handler:expr, $error:expr, $context:expr) => {
        {
            let strategy = $error_handler.handle_error($error, $context).await;
            match strategy {
                RecoveryStrategy::Stop => {
                    return Err($error);
                }
                RecoveryStrategy::Continue => {
                    // 继续执行，不做任何处理
                }
                _ => {
                    // 其他策略需要具体实现
                    eprintln!("需要实现恢复策略: {:?}", strategy);
                }
            }
        }
    };
}

/// 错误转换工具 - 将标准错误转换为MCP错误
pub struct ErrorConverter;

impl ErrorConverter {
    /// 将serde_json错误转换为MCP错误
    pub fn from_serde_error(error: serde_json::Error) -> McpError {
        McpError::SerializationError {
            message: error.to_string(),
            field: None,
            expected_type: None,
            received_type: None,
        }
    }
    
    /// 将tokio超时错误转换为MCP错误
    pub fn from_timeout_error(operation: String, timeout_duration: u64) -> McpError {
        McpError::TimeoutError {
            message: format!("操作'{}' 超时", operation),
            operation,
            timeout_duration,
            elapsed: timeout_duration,
        }
    }
    
    /// 将网络错误转换为MCP错误
    pub fn from_network_error(error: reqwest::Error) -> McpError {
        let error_type = if error.is_timeout() {
            NetworkErrorType::ConnectionTimeout
        } else if error.is_connect() {
            NetworkErrorType::ConnectionRefused
        } else {
            NetworkErrorType::InvalidResponse
        };
        
        McpError::NetworkError {
            message: error.to_string(),
            error_type,
            retry_after: Some(5), // 建议5秒后重试
        }
    }
    
    /// 将数据库错误转换为MCP错误
    pub fn from_database_error(error: sqlx::Error) -> McpError {
        McpError::SystemError {
            message: format!("数据库错误: {}", error),
            system_code: None,
            stack_trace: None,
        }
    }
}

/// 错误报告器 - 用于向外部系统报告错误
#[async_trait::async_trait]
pub trait ErrorReporter: Send + Sync {
    async fn report_error(&self, error: &McpError, context: &ErrorContext) -> Result<(), String>;
}

/// 简单的日志错误报告器
pub struct LogErrorReporter;

#[async_trait::async_trait]
impl ErrorReporter for LogErrorReporter {
    async fn report_error(&self, error: &McpError, context: &ErrorContext) -> Result<(), String> {
        eprintln!(
            "[ERROR] {} - {} - {} - {:?}",
            context.timestamp.format("%Y-%m-%d %H:%M:%S UTC"),
            context.error_id,
            context.operation,
            error
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_error_handler_basic() {
        let handler = ErrorHandler::new();
        let error = McpError::ValidationError {
            message: "测试验证错误".to_string(),
            field_errors: vec![],
        };
        let context = ErrorContext::new("test_operation".to_string(), "test_component".to_string());
        
        let strategy = handler.handle_error(error, context).await;
        
        match strategy {
            RecoveryStrategy::UserIntervention { .. } => {
                // 验证默认策略正确
            }
            _ => panic!("期望用户干预策略"),
        }
    }
    
    #[tokio::test]
    async fn test_error_stats() {
        let handler = ErrorHandler::new();
        
        for _ in 0..3 {
            let error = McpError::NetworkError {
                message: "网络连接失败".to_string(),
                error_type: NetworkErrorType::ConnectionTimeout,
                retry_after: Some(5),
            };
            let context = ErrorContext::new("network_test".to_string(), "test".to_string());
            handler.handle_error(error, context).await;
        }
        
        let stats = handler.get_error_stats().await;
        assert_eq!(stats.get("NetworkError"), Some(&3));
    }
    
    #[test]
    fn test_error_converter() {
        let serde_error = serde_json::from_str::<i32>("invalid_json").unwrap_err();
        let mcp_error = ErrorConverter::from_serde_error(serde_error);
        
        match mcp_error {
            McpError::SerializationError { .. } => {
                // 转换成功
            }
            _ => panic!("期望序列化错误"),
        }
    }
}