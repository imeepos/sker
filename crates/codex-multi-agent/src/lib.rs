//! # Codex 多Agent协同开发系统协议扩展
//! 
//! 这个crate提供了多Agent协同开发系统的协议扩展，支持通过feature flags进行渐进式启用。
//! 
//! ## 主要功能
//! 
//! - **Agent管理**: 创建、更新、删除和查询Agent
//! - **项目管理**: 项目信息管理和需求文档处理
//! - **LLM调度**: 需求分解和任务分配
//! - **任务执行**: 任务执行和进度跟踪
//! - **冲突处理**: 自动冲突检测和处理
//! - **安全管理**: 权限控制和审计日志
//! - **性能监控**: 系统性能和Agent效率监控
//! - **外部集成**: 与外部工具和系统的集成
//! 
//! ## 使用示例
//! 
//! ```toml
//! [dependencies]
//! codex-multi-agent = { version = "0.1", features = ["multi-agent"] }
//! ```
//! 
//! ```rust
//! use codex_multi_agent::types::*;
//! 
//! // 创建Agent ID
//! let agent_id = AgentId::new();
//! 
//! // 创建Agent配置
//! let config = AgentConfig {
//!     name: "前端开发Agent".to_string(),
//!     description: "专门负责前端开发的AI助手".to_string(),
//!     prompt_template: "你是一个专业的前端开发工程师...".to_string(),
//!     capabilities: vec![AgentCapability::FrontendDevelopment],
//!     max_concurrent_tasks: 2,
//!     timeout_minutes: 60,
//!     git_config: None,
//! };
//! ```

#![cfg_attr(docsrs, feature(doc_cfg))]
#![deny(missing_docs)]
#![warn(clippy::all)]

// 核心类型模块
pub mod types;

// 功能模块
pub mod agent_management;
pub mod project_management;
pub mod llm_orchestration;

// TODO: 暂时注释掉，待后续实现
// pub mod task_execution;
// pub mod conflict_resolution;
// pub mod security;
// pub mod performance;
// pub mod integration;

// 事件定义模块
pub mod events;

// TypeScript支持
#[cfg(feature = "typescript")]
#[cfg_attr(docsrs, doc(cfg(feature = "typescript")))]
pub mod typescript;

// 重新导出核心类型，方便使用
pub use types::*;

// 重新导出事件类型
pub use events::*;

// 重新导出各功能模块的主要类型
pub use agent_management::{AgentConfig, AgentConfigUpdate, AgentFilter, AgentSummary, GitConfig};

pub use project_management::{
    ProjectInfo, ProjectUpdate, RequirementDocument, CodingStandards, QualityGates,
    TestRequirements, DocumentType, DocumentPriority,
};

pub use llm_orchestration::{
    ProjectContext, TaskInfo, TaskAssignment, TaskDependency, DependencyType,
    CodebaseInfo, LanguageStats, FrameworkInfo, TimelineRequirements, Milestone,
};

/// 版本信息
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// 获取当前启用的功能列表
pub fn enabled_features() -> Vec<&'static str> {
    vec![
        "agent-management",
        "project-management", 
        "llm-orchestration",
        "events"
    ]
}