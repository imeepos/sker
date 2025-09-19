//! # 多Agent系统基础类型定义
//! 
//! 本模块定义了多Agent协同开发系统中使用的所有基础类型，包括：
//! - 强类型ID定义
//! - Agent能力和状态枚举
//! - 任务相关类型
//! - 冲突处理类型
//! 
//! 所有类型都支持序列化/反序列化，并可选择性地支持TypeScript类型生成。

use std::fmt::Display;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[cfg(feature = "typescript")]
use ts_rs::TS;

use uuid::Uuid;

// ============================================================================
// 强类型ID定义
// ============================================================================

/// Agent唯一标识符
/// 使用UUID确保全局唯一性
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct AgentId(pub Uuid);

/// 项目唯一标识符
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct ProjectId(pub Uuid);

/// 任务唯一标识符
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct TaskId(pub Uuid);

/// 执行会话唯一标识符
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct ExecutionSessionId(pub Uuid);

/// 代码审查唯一标识符
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct ReviewId(pub Uuid);

/// 冲突唯一标识符
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct ConflictId(pub Uuid);

/// LLM会话唯一标识符
/// 区别于可能存在的其他对话ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[cfg_attr(feature = "typescript", ts(as = "string"))]
pub struct LlmSessionId(pub Uuid);

// 为所有ID类型实现共同的trait和方法
macro_rules! impl_id_traits {
    ($id_type:ident) => {
        impl $id_type {
            /// 创建新的随机ID
            pub fn new() -> Self {
                Self(Uuid::new_v4())
            }

            /// 从字符串解析ID
            pub fn from_str(s: &str) -> Result<Self, uuid::Error> {
                Ok(Self(Uuid::parse_str(s)?))
            }

            /// 获取内部的UUID值
            pub fn into_uuid(self) -> Uuid {
                self.0
            }

            /// 获取UUID的引用
            pub fn as_uuid(&self) -> &Uuid {
                &self.0
            }
        }

        impl Default for $id_type {
            fn default() -> Self {
                Self::new()
            }
        }

        impl Display for $id_type {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.0)
            }
        }

        impl From<Uuid> for $id_type {
            fn from(value: Uuid) -> Self {
                Self(value)
            }
        }

        impl From<$id_type> for Uuid {
            fn from(value: $id_type) -> Self {
                value.0
            }
        }

        impl std::str::FromStr for $id_type {
            type Err = uuid::Error;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                Ok(Self(Uuid::parse_str(s)?))
            }
        }
    };
}

impl_id_traits!(AgentId);
impl_id_traits!(ProjectId);
impl_id_traits!(TaskId);
impl_id_traits!(ExecutionSessionId);
impl_id_traits!(ReviewId);
impl_id_traits!(ConflictId);
impl_id_traits!(LlmSessionId);

// ============================================================================
// Agent相关枚举类型
// ============================================================================

/// Agent能力枚举
/// 定义Agent可以执行的任务类型
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum AgentCapability {
    /// 前端开发能力
    FrontendDevelopment,
    /// 后端开发能力
    BackendDevelopment,
    /// 数据库设计能力
    DatabaseDesign,
    /// 测试编写和执行能力
    Testing,
    /// 代码审查能力
    CodeReview,
    /// DevOps和部署能力
    DevOps,
    /// 文档编写能力
    Documentation,
    /// UI/UX设计能力
    UIDesign,
    /// 安全审计能力
    SecurityAudit,
    /// 性能优化能力
    PerformanceTuning,
    /// API设计能力
    ApiDesign,
    /// 架构设计能力
    ArchitectureDesign,
    /// 数据分析能力
    DataAnalysis,
    /// 机器学习能力
    MachineLearning,
}

/// Agent状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum AgentStatus {
    /// 空闲状态，可以接受新任务
    Idle,
    /// 工作中
    Working,
    /// 已暂停
    Paused,
    /// 错误状态，需要人工干预
    Error,
    /// 离线状态
    Offline,
    /// 维护中
    Maintenance,
}

// ============================================================================
// 任务相关类型
// ============================================================================

/// 任务类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    /// 开发任务
    Development,
    /// 测试任务
    Testing,
    /// 代码审查任务
    CodeReview,
    /// 文档编写任务
    Documentation,
    /// 部署任务
    Deployment,
    /// Bug修复任务
    Bugfix,
    /// 重构任务
    Refactoring,
    /// 研究任务
    Research,
    /// 设计任务
    Design,
    /// 优化任务
    Optimization,
}

/// 任务优先级枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum TaskPriority {
    /// 低优先级
    Low,
    /// 中等优先级
    Medium,
    /// 高优先级
    High,
    /// 紧急/关键优先级
    Critical,
}

/// 任务状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    /// 待处理
    Pending,
    /// 进行中
    InProgress,
    /// 已完成
    Completed,
    /// 失败
    Failed,
    /// 已取消
    Cancelled,
    /// 暂停
    OnHold,
    /// 等待依赖
    WaitingForDependency,
    /// 等待审查
    WaitingForReview,
}

// ============================================================================
// 冲突处理相关类型
// ============================================================================

/// 冲突类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ConflictType {
    /// Git合并冲突
    GitMergeConflict,
    /// 资源争用冲突
    ResourceConflict,
    /// 任务依赖冲突
    TaskDependencyConflict,
    /// Agent能力冲突
    AgentCapabilityConflict,
    /// 时间线冲突
    TimelineConflict,
    /// 代码风格冲突
    CodeStyleConflict,
    /// 架构决策冲突
    ArchitectureDecisionConflict,
}

/// 冲突严重程度枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ConflictSeverity {
    /// 低严重程度，可以自动处理
    Low,
    /// 中等严重程度，需要通知但可以自动处理
    Medium,
    /// 高严重程度，需要人工干预
    High,
    /// 关键严重程度，立即停止相关操作
    Critical,
}

// ============================================================================
// 实体引用类型
// ============================================================================

/// 实体引用枚举
/// 用于表示冲突涉及的实体
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EntityReference {
    /// Agent实体引用
        Agent { 
        /// Agent唯一标识符
        id: AgentId, 
        /// Agent名称
        name: String 
    },
    /// 项目实体引用
        Project { 
        /// 项目唯一标识符
        id: ProjectId, 
        /// 项目名称
        name: String 
    },
    /// 任务实体引用
        Task { 
        /// 任务唯一标识符
        id: TaskId, 
        /// 任务标题
        title: String 
    },
    /// 文件实体引用
    File { 
        /// 文件路径
        path: PathBuf 
    },
    /// Git分支引用
    GitBranch { 
        /// 分支名称
        branch_name: String 
    },
    /// Git提交引用
    GitCommit { 
        /// 提交哈希值
        commit_hash: String 
    },
}

// ============================================================================
// 通用工具类型
// ============================================================================

/// 分页请求参数
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct PaginationParams {
    /// 页码，从1开始
    pub page: Option<u32>,
    /// 每页大小，默认为20
    pub page_size: Option<u32>,
    /// 排序字段
    pub sort_by: Option<String>,
    /// 排序方向
    pub sort_order: Option<SortOrder>,
}

/// 排序方向枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum SortOrder {
    /// 升序
    Asc,
    /// 降序
    Desc,
}

/// 分页响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct PaginationResponse<T> {
    /// 数据列表
    pub items: Vec<T>,
    /// 总数量
    pub total_count: usize,
    /// 当前页码
    pub current_page: u32,
    /// 每页大小
    pub page_size: u32,
    /// 总页数
    pub total_pages: u32,
    /// 是否有下一页
    pub has_next_page: bool,
    /// 是否有上一页
    pub has_previous_page: bool,
}

impl<T> PaginationResponse<T> {
    /// 创建新的分页响应
    pub fn new(
        items: Vec<T>,
        total_count: usize,
        current_page: u32,
        page_size: u32,
    ) -> Self {
        let total_pages = ((total_count as f64) / (page_size as f64)).ceil() as u32;
        let has_next_page = current_page < total_pages;
        let has_previous_page = current_page > 1;

        Self {
            items,
            total_count,
            current_page,
            page_size,
            total_pages,
            has_next_page,
            has_previous_page,
        }
    }
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: Some(1),
            page_size: Some(20),
            sort_by: None,
            sort_order: Some(SortOrder::Asc),
        }
    }
}

// ============================================================================
// 测试模块
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
        fn test_id_generation() {
        let agent_id = AgentId::new();
        let project_id = ProjectId::new();
        
        assert_ne!(agent_id.to_string(), project_id.to_string());
        assert_eq!(agent_id.to_string().len(), 36); // UUID字符串长度
    }
    
    #[test]
        fn test_id_from_string() {
        let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
        let agent_id = AgentId::from_str(uuid_str).unwrap();
        assert_eq!(agent_id.to_string(), uuid_str);
    }
    
    #[test]
    fn test_serialization() {
        let capability = AgentCapability::FrontendDevelopment;
        let json = serde_json::to_string(&capability).unwrap();
        let deserialized: AgentCapability = serde_json::from_str(&json).unwrap();
        assert_eq!(capability, deserialized);
    }
    
    #[test]
    fn test_task_priority_ordering() {
        assert!(TaskPriority::Critical > TaskPriority::High);
        assert!(TaskPriority::High > TaskPriority::Medium);
        assert!(TaskPriority::Medium > TaskPriority::Low);
    }
    
    #[test]
    fn test_pagination_response() {
        let items = vec!["item1", "item2", "item3"];
        let response = PaginationResponse::new(items, 10, 1, 3);
        
        assert_eq!(response.total_count, 10);
        assert_eq!(response.total_pages, 4);
        assert!(response.has_next_page);
        assert!(!response.has_previous_page);
    }
}