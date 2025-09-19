//! # Agent管理协议模块
//!
//! 本模块定义了Agent管理相关的所有协议类型，包括：
//! - Agent配置和更新
//! - Agent过滤和查询
//! - Git配置管理
//! - Agent性能指标
//!
//! ## 使用示例
//!
//! ```rust
//! use codex_multi_agent::{AgentConfig, AgentCapability};
//!
//! let config = AgentConfig {
//!     name: "前端开发Agent".to_string(),
//!     description: "专门负责React和TypeScript开发".to_string(),
//!     prompt_template: "你是一个专业的前端开发工程师...".to_string(),
//!     capabilities: vec![AgentCapability::FrontendDevelopment, AgentCapability::Testing],
//!     max_concurrent_tasks: 2,
//!     timeout_minutes: 60,
//!     git_config: None,
//! };
//! ```

use crate::types::*;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "typescript")]
use ts_rs::TS;

// ============================================================================
// Agent配置相关类型
// ============================================================================

/// Agent配置结构
/// 定义Agent的基本信息和行为参数
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentConfig {
    /// Agent名称，应该具有描述性
    pub name: String,

    /// Agent描述，说明其用途和特点
    pub description: String,

    /// 提示模板，用于初始化Agent的行为
    pub prompt_template: String,

    /// Agent具备的能力列表
    pub capabilities: Vec<AgentCapability>,

    /// 最大并发任务数量
    pub max_concurrent_tasks: u32,

    /// 任务执行超时时间（分钟）
    pub timeout_minutes: u32,

    /// Git配置，如果Agent需要进行Git操作
    pub git_config: Option<GitConfig>,

    /// 自定义配置参数
    #[serde(default)]
    pub custom_settings: HashMap<String, serde_json::Value>,

    /// Agent优先级权重（0.0-1.0）
    #[serde(default = "default_priority_weight")]
    pub priority_weight: f32,

    /// 是否启用详细日志
    #[serde(default)]
    pub verbose_logging: bool,

    /// 资源限制配置
    pub resource_limits: Option<ResourceLimits>,
}

/// Agent配置更新结构
/// 用于部分更新Agent配置，所有字段都是可选的
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentConfigUpdate {
    /// 更新Agent名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    /// 更新Agent描述
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// 更新提示模板
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_template: Option<String>,

    /// 更新能力列表
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<AgentCapability>>,

    /// 更新最大并发任务数
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_concurrent_tasks: Option<u32>,

    /// 更新超时时间
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout_minutes: Option<u32>,

    /// 更新Git配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git_config: Option<Option<GitConfig>>, // Option<Option<T>> 表示可以设置为None

    /// 更新自定义设置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_settings: Option<HashMap<String, serde_json::Value>>,

    /// 更新优先级权重
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority_weight: Option<f32>,

    /// 更新日志配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verbose_logging: Option<bool>,

    /// 更新资源限制
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_limits: Option<Option<ResourceLimits>>,
}

/// Agent过滤器
/// 用于查询和筛选Agent
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentFilter {
    /// 按状态过滤
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<AgentStatus>,

    /// 按能力过滤（需要包含所有指定能力）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<AgentCapability>>,

    /// 只返回可用的Agent（状态为Idle）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub available_only: Option<bool>,

    /// 按名称模糊匹配过滤
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_contains: Option<String>,

    /// 按创建时间范围过滤
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_after: Option<DateTime<Utc>>,

    /// 按创建时间过滤（早于此时间）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_before: Option<DateTime<Utc>>,

    /// 按性能指标过滤
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_success_rate: Option<f32>,

    /// 按最大平均完成时间过滤（分钟）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_average_completion_time: Option<u32>,
}

// ============================================================================
// Agent信息和状态类型
// ============================================================================

/// Agent摘要信息
/// 用于列表查询和展示
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentSummary {
    /// Agent唯一标识符
    pub agent_id: AgentId,

    /// Agent名称
    pub name: String,

    /// Agent描述
    pub description: String,

    /// 当前状态
    pub status: AgentStatus,

    /// 当前正在执行的任务ID（如果有）
    pub current_task: Option<TaskId>,

    /// Agent能力列表
    pub capabilities: Vec<AgentCapability>,

    /// 成功率（0.0-1.0）
    pub success_rate: f32,

    /// 平均任务完成时间（分钟）
    pub average_completion_time: u32,

    /// 当前工作负载（0.0-1.0，表示容量使用率）
    pub current_workload: f32,

    /// 总完成任务数量
    pub total_completed_tasks: u32,

    /// 创建时间
    pub created_at: DateTime<Utc>,

    /// 最后活动时间
    pub last_active_at: DateTime<Utc>,
}

/// Agent详细信息
/// 包含Agent的完整信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentDetails {
    /// Agent唯一标识符
    pub agent_id: AgentId,

    /// Agent配置信息
    pub config: AgentConfig,

    /// 当前状态
    pub status: AgentStatus,

    /// 状态详细信息
    pub status_details: Option<String>,

    /// 当前任务列表
    pub current_tasks: Vec<TaskId>,

    /// 性能指标
    pub performance_metrics: PerformanceMetrics,

    /// 创建时间
    pub created_at: DateTime<Utc>,

    /// 更新时间
    pub updated_at: DateTime<Utc>,

    /// 最后活动时间
    pub last_active_at: DateTime<Utc>,

    /// 版本号，用于乐观锁更新
    pub version: u64,
}

// ============================================================================
// Git和资源配置类型
// ============================================================================

/// Git配置
/// Agent进行Git操作时使用的配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct GitConfig {
    /// Git用户名
    pub user_name: String,

    /// Git邮箱
    pub user_email: String,

    /// SSH私钥路径（可选）
    pub ssh_key_path: Option<String>,

    /// 默认分支名称
    pub default_branch: String,

    /// 是否自动签名提交
    #[serde(default)]
    pub sign_commits: bool,

    /// GPG密钥ID（如果启用了提交签名）
    pub gpg_key_id: Option<String>,

    /// 自定义Git配置
    #[serde(default)]
    pub custom_config: HashMap<String, String>,
}

/// 资源限制配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ResourceLimits {
    /// 最大内存使用量（MB）
    pub max_memory_mb: Option<u64>,

    /// 最大CPU使用率（0.0-1.0）
    pub max_cpu_usage: Option<f32>,

    /// 最大磁盘使用量（MB）
    pub max_disk_usage_mb: Option<u64>,

    /// 最大网络带宽（KB/s）
    pub max_network_bandwidth_kbps: Option<u64>,

    /// 最大执行时间（秒）
    pub max_execution_time_seconds: Option<u64>,
}

/// 性能指标
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct PerformanceMetrics {
    /// 总任务数
    pub total_tasks: u32,

    /// 成功任务数
    pub successful_tasks: u32,

    /// 失败任务数
    pub failed_tasks: u32,

    /// 平均响应时间（毫秒）
    pub average_response_time_ms: u32,

    /// 平均任务完成时间（分钟）
    pub average_completion_time_minutes: u32,

    /// 当前工作负载
    pub current_workload: f32,

    /// 资源使用情况
    pub resource_usage: ResourceUsage,

    /// 错误统计
    pub error_stats: ErrorStats,
}

/// 资源使用情况
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ResourceUsage {
    /// 当前内存使用量（MB）
    pub current_memory_mb: u64,

    /// 当前CPU使用率（0.0-1.0）
    pub current_cpu_usage: f32,

    /// 当前磁盘使用量（MB）
    pub current_disk_usage_mb: u64,

    /// 峰值内存使用量（MB）
    pub peak_memory_mb: u64,

    /// 峰值CPU使用率
    pub peak_cpu_usage: f32,
}

/// 错误统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ErrorStats {
    /// 各类错误的计数
    pub error_counts: HashMap<String, u32>,

    /// 最近错误列表
    pub recent_errors: Vec<ErrorRecord>,
}

/// 错误记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ErrorRecord {
    /// 错误类型
    pub error_type: String,

    /// 错误消息
    pub message: String,

    /// 发生时间
    pub occurred_at: DateTime<Utc>,

    /// 关联的任务ID（如果有）
    pub task_id: Option<TaskId>,
}

// ============================================================================
// 请求和响应类型
// ============================================================================

/// 创建Agent请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CreateAgentRequest {
    /// Agent配置
    pub config: AgentConfig,

    /// 是否立即启动
    #[serde(default = "default_true")]
    pub start_immediately: bool,
}

/// 更新Agent请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct UpdateAgentRequest {
    /// Agent ID
    pub agent_id: AgentId,

    /// 配置更新
    pub config_update: AgentConfigUpdate,

    /// 版本号，用于乐观锁
    pub version: Option<u64>,
}

/// Agent列表查询请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ListAgentsRequest {
    /// 过滤条件
    pub filter: Option<AgentFilter>,

    /// 分页参数
    pub pagination: Option<PaginationParams>,

    /// 是否包含详细信息
    #[serde(default)]
    pub include_details: bool,
}

// ============================================================================
// 工具函数
// ============================================================================

impl AgentConfig {
    /// 验证配置的有效性
    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("Agent name cannot be empty".to_string());
        }

        if self.capabilities.is_empty() {
            return Err("Agent must have at least one capability".to_string());
        }

        if self.max_concurrent_tasks == 0 {
            return Err("max_concurrent_tasks must be greater than 0".to_string());
        }

        if self.timeout_minutes == 0 {
            return Err("timeout_minutes must be greater than 0".to_string());
        }

        if !(0.0..=1.0).contains(&self.priority_weight) {
            return Err("priority_weight must be between 0.0 and 1.0".to_string());
        }

        Ok(())
    }

    /// 检查Agent是否具有指定能力
    pub fn has_capability(&self, capability: &AgentCapability) -> bool {
        self.capabilities.contains(capability)
    }

    /// 检查Agent是否具有所有指定能力
    pub fn has_all_capabilities(&self, capabilities: &[AgentCapability]) -> bool {
        capabilities.iter().all(|cap| self.has_capability(cap))
    }
}

impl AgentFilter {
    /// 创建只查询可用Agent的过滤器
    pub fn available_only() -> Self {
        Self {
            status: Some(AgentStatus::Idle),
            available_only: Some(true),
            ..Default::default()
        }
    }

    /// 创建按能力过滤的过滤器
    pub fn with_capabilities(capabilities: Vec<AgentCapability>) -> Self {
        Self {
            capabilities: Some(capabilities),
            ..Default::default()
        }
    }
}

impl Default for AgentFilter {
    fn default() -> Self {
        Self {
            status: None,
            capabilities: None,
            available_only: None,
            name_contains: None,
            created_after: None,
            created_before: None,
            min_success_rate: None,
            max_average_completion_time: None,
        }
    }
}

// ============================================================================
// 默认值函数
// ============================================================================

fn default_priority_weight() -> f32 {
    0.5
}

fn default_true() -> bool {
    true
}

// ============================================================================
// 测试模块
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_config_validation() {
        let mut config = AgentConfig {
            name: "Test Agent".to_string(),
            description: "A test agent".to_string(),
            prompt_template: "You are a test assistant".to_string(),
            capabilities: vec![AgentCapability::Testing],
            max_concurrent_tasks: 1,
            timeout_minutes: 30,
            git_config: None,
            custom_settings: HashMap::new(),
            priority_weight: 0.5,
            verbose_logging: false,
            resource_limits: None,
        };

        assert!(config.validate().is_ok());

        // 测试无效配置
        config.name = "".to_string();
        assert!(config.validate().is_err());

        config.name = "Test Agent".to_string();
        config.capabilities = vec![];
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_agent_capabilities() {
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            description: "A test agent".to_string(),
            prompt_template: "You are a test assistant".to_string(),
            capabilities: vec![AgentCapability::Testing, AgentCapability::CodeReview],
            max_concurrent_tasks: 1,
            timeout_minutes: 30,
            git_config: None,
            custom_settings: HashMap::new(),
            priority_weight: 0.5,
            verbose_logging: false,
            resource_limits: None,
        };

        assert!(config.has_capability(&AgentCapability::Testing));
        assert!(config.has_capability(&AgentCapability::CodeReview));
        assert!(!config.has_capability(&AgentCapability::FrontendDevelopment));

        assert!(config.has_all_capabilities(&[AgentCapability::Testing]));
        assert!(
            config.has_all_capabilities(&[AgentCapability::Testing, AgentCapability::CodeReview,])
        );
        assert!(!config.has_all_capabilities(&[
            AgentCapability::Testing,
            AgentCapability::FrontendDevelopment,
        ]));
    }

    #[test]
    fn test_serialization() {
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            description: "A test agent".to_string(),
            prompt_template: "You are a test assistant".to_string(),
            capabilities: vec![AgentCapability::Testing],
            max_concurrent_tasks: 1,
            timeout_minutes: 30,
            git_config: Some(GitConfig {
                user_name: "test".to_string(),
                user_email: "test@example.com".to_string(),
                ssh_key_path: None,
                default_branch: "main".to_string(),
                sign_commits: false,
                gpg_key_id: None,
                custom_config: HashMap::new(),
            }),
            custom_settings: HashMap::new(),
            priority_weight: 0.5,
            verbose_logging: false,
            resource_limits: None,
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: AgentConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(config.name, deserialized.name);
        assert_eq!(config.capabilities, deserialized.capabilities);
    }
}
