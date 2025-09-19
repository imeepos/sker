//! # 多Agent系统事件定义模块
//!
//! 本模块定义了多Agent协同开发系统中所有事件类型，包括：
//! - Agent管理事件
//! - 项目管理事件
//! - 任务执行事件
//! - LLM调度事件
//! - 冲突处理事件
//! - 系统状态事件
//!
//! 所有事件都包含时间戳和相关的上下文信息，支持事件溯源和审计。

use crate::agent_management::*;
use crate::llm_orchestration::*;
use crate::project_management::*;
use crate::types::*;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "typescript")]
use ts_rs::TS;

// ============================================================================
// 基础事件结构和特征
// ============================================================================

/// 事件基础特征
/// 所有事件都应该实现这个特征
pub trait MultiAgentEvent {
    /// 获取事件类型名称
    fn event_type(&self) -> &'static str;

    /// 获取事件时间戳
    fn timestamp(&self) -> DateTime<Utc>;

    /// 获取事件相关的实体ID
    fn related_entity_ids(&self) -> Vec<String>;

    /// 检查事件是否为关键事件（需要特殊处理）
    fn is_critical(&self) -> bool {
        false
    }
}

/// 事件元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct EventMetadata {
    /// 事件ID
    pub event_id: String,

    /// 事件时间戳
    pub timestamp: DateTime<Utc>,

    /// 事件来源
    pub source: EventSource,

    /// 相关会话ID
    pub session_id: Option<String>,

    /// 用户ID（如果有）
    pub user_id: Option<String>,

    /// 事件优先级
    pub priority: EventPriority,

    /// 事件标签
    pub tags: Vec<String>,

    /// 自定义属性
    pub custom_attributes: HashMap<String, serde_json::Value>,
}

/// 事件来源枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum EventSource {
    /// 系统内部
    System,
    /// Agent
    Agent,
    /// 用户操作
    User,
    /// 外部系统
    External,
    /// 定时任务
    Scheduler,
    /// Webhook
    Webhook,
}

/// 事件优先级枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum EventPriority {
    /// 低优先级
    Low,
    /// 普通优先级
    Normal,
    /// 高优先级
    High,
    /// 关键优先级
    Critical,
}

// ============================================================================
// Agent管理事件
// ============================================================================

/// Agent创建事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentCreatedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 新创建的Agent ID
    pub agent_id: AgentId,

    /// Agent配置信息
    pub agent_config: AgentConfig,

    /// 创建者信息
    pub created_by: String,

    /// 创建原因
    pub creation_reason: Option<String>,
}

/// Agent更新事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentUpdatedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 被更新的Agent ID
    pub agent_id: AgentId,

    /// 更新的字段列表
    pub updated_fields: Vec<String>,

    /// 更新前的值（JSON格式）
    pub previous_values: HashMap<String, serde_json::Value>,

    /// 更新后的值（JSON格式）
    pub new_values: HashMap<String, serde_json::Value>,

    /// 更新者信息
    pub updated_by: String,

    /// 更新原因
    pub update_reason: Option<String>,
}

/// Agent删除事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentDeletedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 被删除的Agent ID
    pub agent_id: AgentId,

    /// Agent名称（用于记录）
    pub agent_name: String,

    /// 删除者信息
    pub deleted_by: String,

    /// 删除原因
    pub deletion_reason: Option<String>,

    /// 是否已备份Agent配置
    pub config_backed_up: bool,
}

/// Agent状态变更事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentStatusChangedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// Agent ID
    pub agent_id: AgentId,

    /// 之前的状态
    pub previous_status: AgentStatus,

    /// 新的状态
    pub new_status: AgentStatus,

    /// 状态变更原因
    pub reason: String,

    /// 状态详细信息
    pub status_details: Option<String>,
}

/// Agent列表查询响应事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct AgentListResponseEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// Agent列表
    pub agents: Vec<AgentSummary>,

    /// 分页信息
    pub pagination_info: Option<PaginationResponse<()>>,

    /// 查询耗时（毫秒）
    pub query_duration_ms: u64,

    /// 应用的过滤条件
    pub applied_filters: Option<AgentFilter>,
}

// ============================================================================
// 项目管理事件
// ============================================================================

/// 项目创建事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ProjectCreatedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 新创建的项目ID
    pub project_id: ProjectId,

    /// 项目信息
    pub project_info: ProjectInfo,

    /// 创建者信息
    pub created_by: String,

    /// 是否初始化了Git仓库
    pub repository_initialized: bool,

    /// 初始文档数量
    pub initial_document_count: u32,
}

/// 项目更新事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ProjectUpdatedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 被更新的项目ID
    pub project_id: ProjectId,

    /// 更新的字段列表
    pub updated_fields: Vec<String>,

    /// 更新者信息
    pub updated_by: String,

    /// 版本号变更
    pub version_change: Option<VersionChange>,
}

/// 版本变更信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct VersionChange {
    /// 之前的版本
    pub from_version: String,

    /// 新的版本
    pub to_version: String,

    /// 版本类型（major, minor, patch）
    pub change_type: VersionChangeType,
}

/// 版本变更类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum VersionChangeType {
    /// 主版本更新
    Major,
    /// 次版本更新
    Minor,
    /// 补丁版本更新
    Patch,
    /// 预发布版本
    PreRelease,
}

/// 需求文档上传事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RequirementsUploadedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 项目ID
    pub project_id: ProjectId,

    /// 上传的文档数量
    pub document_count: usize,

    /// 文档类型分布
    pub document_type_distribution: HashMap<String, u32>,

    /// 总文档大小（字节）
    pub total_size_bytes: u64,

    /// 上传者信息
    pub uploaded_by: String,

    /// 处理状态
    pub processing_status: DocumentProcessingStatus,
}

/// 文档处理状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DocumentProcessingStatus {
    /// 处理中
    Processing,
    /// 已完成
    Completed,
    /// 部分成功
    PartialSuccess,
    /// 失败
    Failed,
}

// ============================================================================
// LLM调度事件
// ============================================================================

/// 需求分解开始事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RequirementDecompositionStartedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// LLM会话ID
    pub session_id: LlmSessionId,

    /// 项目ID
    pub project_id: ProjectId,

    /// 输入的需求文档数量
    pub input_document_count: u32,

    /// 分解提示信息
    pub decomposition_prompt: String,

    /// 项目上下文摘要
    pub context_summary: String,
}

/// 需求分解完成事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RequirementDecompositionCompletedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// LLM会话ID
    pub session_id: LlmSessionId,

    /// 项目ID
    pub project_id: ProjectId,

    /// 分解出的任务列表
    pub decomposed_tasks: Vec<TaskInfo>,

    /// 任务依赖关系
    pub task_dependencies: Vec<TaskDependency>,

    /// 处理耗时（毫秒）
    pub processing_duration_ms: u64,

    /// LLM使用的token数量
    pub tokens_used: u32,

    /// 分解质量评分（0.0-1.0）
    pub quality_score: Option<f32>,
}

/// 任务分配完成事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskAllocationCompletedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// LLM会话ID
    pub session_id: LlmSessionId,

    /// 项目ID
    pub project_id: ProjectId,

    /// 任务分配结果
    pub task_assignments: Vec<TaskAssignment>,

    /// 调度计划
    pub schedule_plan: SchedulePlan,

    /// 分配策略统计
    pub allocation_strategy_stats: HashMap<String, u32>,

    /// 未分配的任务
    pub unallocated_tasks: Vec<TaskId>,

    /// 分配置信度
    pub allocation_confidence: f32,
}

/// LLM会话状态变更事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct LlmSessionStatusChangedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// LLM会话ID
    pub session_id: LlmSessionId,

    /// 之前的状态
    pub previous_status: LlmSessionStatus,

    /// 新的状态
    pub new_status: LlmSessionStatus,

    /// 状态变更原因
    pub reason: String,

    /// 会话统计信息
    pub session_stats: LlmSessionStats,
}

/// LLM会话状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum LlmSessionStatus {
    /// 初始化中
    Initializing,
    /// 活跃
    Active,
    /// 暂停
    Paused,
    /// 等待输入
    WaitingForInput,
    /// 处理中
    Processing,
    /// 已完成
    Completed,
    /// 错误
    Error,
    /// 超时
    Timeout,
}

/// LLM会话统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct LlmSessionStats {
    /// 总token使用量
    pub total_tokens_used: u32,

    /// 输入token数量
    pub input_tokens: u32,

    /// 输出token数量
    pub output_tokens: u32,

    /// 会话持续时间（毫秒）
    pub duration_ms: u64,

    /// API调用次数
    pub api_call_count: u32,

    /// 平均响应时间（毫秒）
    pub average_response_time_ms: u32,

    /// 错误次数
    pub error_count: u32,
}

// ============================================================================
// 任务执行事件
// ============================================================================

/// 任务执行开始事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskExecutionStartedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 执行会话ID
    pub session_id: ExecutionSessionId,

    /// 任务ID
    pub task_id: TaskId,

    /// 执行的Agent ID
    pub agent_id: AgentId,

    /// 预计完成时间
    pub estimated_completion_time: DateTime<Utc>,

    /// 执行配置
    pub execution_config: ExecutionConfig,
}

/// 执行配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ExecutionConfig {
    /// 超时时间（秒）
    pub timeout_seconds: u32,

    /// 最大重试次数
    pub max_retries: u32,

    /// 是否启用详细日志
    pub verbose_logging: bool,

    /// 环境变量
    pub environment_variables: HashMap<String, String>,

    /// 资源限制
    pub resource_limits: Option<ResourceLimits>,

    /// 质量检查配置
    pub quality_checks: QualityCheckConfig,
}

/// 质量检查配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct QualityCheckConfig {
    /// 是否启用代码风格检查
    pub enable_style_check: bool,

    /// 是否启用测试覆盖率检查
    pub enable_coverage_check: bool,

    /// 是否启用安全漏洞检查
    pub enable_security_check: bool,

    /// 最小测试覆盖率要求
    pub min_coverage_threshold: Option<f32>,

    /// 自定义检查规则
    pub custom_rules: Vec<String>,
}

/// 任务进度更新事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskProgressUpdatedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 执行会话ID
    pub session_id: ExecutionSessionId,

    /// 进度信息
    pub progress_info: ProgressInfo,

    /// 当前阶段描述
    pub current_phase: String,

    /// 下一步计划
    pub next_steps: Vec<String>,

    /// 遇到的问题
    pub encountered_issues: Vec<IssueReport>,
}

/// 进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ProgressInfo {
    /// 完成百分比（0.0-1.0）
    pub completion_percentage: f32,

    /// 已完成的步骤
    pub completed_steps: Vec<String>,

    /// 正在执行的步骤
    pub current_step: Option<String>,

    /// 剩余步骤
    pub remaining_steps: Vec<String>,

    /// 已花费时间（分钟）
    pub elapsed_minutes: u32,

    /// 预计剩余时间（分钟）
    pub estimated_remaining_minutes: u32,

    /// 质量指标
    pub quality_metrics: HashMap<String, f32>,
}

/// 问题报告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct IssueReport {
    /// 问题类型
    pub issue_type: IssueType,

    /// 问题描述
    pub description: String,

    /// 严重程度
    pub severity: IssueSeverity,

    /// 发现时间
    pub discovered_at: DateTime<Utc>,

    /// 相关文件
    pub related_files: Vec<String>,

    /// 建议的解决方案
    pub suggested_solutions: Vec<String>,

    /// 是否已自动修复
    pub auto_fixed: bool,
}

/// 问题类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum IssueType {
    /// 编译错误
    CompilationError,
    /// 测试失败
    TestFailure,
    /// 代码风格违规
    StyleViolation,
    /// 性能问题
    PerformanceIssue,
    /// 安全漏洞
    SecurityVulnerability,
    /// 依赖问题
    DependencyIssue,
    /// 配置错误
    ConfigurationError,
    /// 资源不足
    ResourceShortage,
    /// 其他
    Other,
}

/// 问题严重程度枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum IssueSeverity {
    /// 信息
    Info,
    /// 轻微
    Minor,
    /// 中等
    Moderate,
    /// 严重
    Major,
    /// 关键
    Critical,
    /// 阻塞
    Blocker,
}

/// 任务执行完成事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskExecutionCompletedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 执行会话ID
    pub session_id: ExecutionSessionId,

    /// 任务执行结果
    pub result: TaskResult,

    /// 总执行时间（分钟）
    pub total_execution_minutes: u32,

    /// 质量评分（0.0-1.0）
    pub quality_score: f32,

    /// 生成的工件
    pub generated_artifacts: Vec<ArtifactInfo>,

    /// 执行摘要
    pub execution_summary: ExecutionSummary,
}

/// 任务执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskResult {
    /// 执行状态
    pub status: TaskExecutionStatus,

    /// 结果描述
    pub description: String,

    /// 输出日志
    pub output_logs: Vec<String>,

    /// 错误日志
    pub error_logs: Vec<String>,

    /// 创建的文件列表
    pub created_files: Vec<String>,

    /// 修改的文件列表
    pub modified_files: Vec<String>,

    /// 删除的文件列表
    pub deleted_files: Vec<String>,

    /// 验收标准完成情况
    pub acceptance_criteria_status: HashMap<String, bool>,
}

/// 任务执行状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum TaskExecutionStatus {
    /// 成功完成
    Success,
    /// 部分成功
    PartialSuccess,
    /// 失败
    Failed,
    /// 取消
    Cancelled,
    /// 超时
    Timeout,
    /// 需要人工干预
    RequiresIntervention,
}

/// 工件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ArtifactInfo {
    /// 工件名称
    pub name: String,

    /// 工件类型
    pub artifact_type: ArtifactType,

    /// 文件路径
    pub file_path: String,

    /// 文件大小（字节）
    pub size_bytes: u64,

    /// 校验和
    pub checksum: String,

    /// 创建时间
    pub created_at: DateTime<Utc>,

    /// 描述
    pub description: Option<String>,
}

/// 工件类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ArtifactType {
    /// 源代码
    SourceCode,
    /// 测试文件
    TestFile,
    /// 配置文件
    ConfigFile,
    /// 文档
    Documentation,
    /// 数据库脚本
    DatabaseScript,
    /// 构建脚本
    BuildScript,
    /// 二进制文件
    Binary,
    /// 其他
    Other,
}

/// 执行摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ExecutionSummary {
    /// 主要完成的工作
    pub main_accomplishments: Vec<String>,

    /// 遇到的主要挑战
    pub major_challenges: Vec<String>,

    /// 采用的解决方案
    pub solutions_applied: Vec<String>,

    /// 学到的经验
    pub lessons_learned: Vec<String>,

    /// 建议改进点
    pub improvement_suggestions: Vec<String>,

    /// 对其他任务的影响
    pub impact_on_other_tasks: Vec<String>,
}

// ============================================================================
// Git和代码审查事件
// ============================================================================

/// Git分支创建事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct GitBranchCreatedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 分支名称
    pub branch_name: String,

    /// 基础分支
    pub base_branch: String,

    /// 创建者Agent ID
    pub created_by_agent: AgentId,

    /// 相关任务ID
    pub related_task_id: TaskId,

    /// 分支类型
    pub branch_type: BranchType,

    /// 分支描述
    pub description: Option<String>,
}

/// 分支类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum BranchType {
    /// 功能分支
    Feature,
    /// 修复分支
    Bugfix,
    /// 热修复分支
    Hotfix,
    /// 发布分支
    Release,
    /// 实验分支
    Experimental,
}

/// 代码审查请求事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CodeReviewRequestedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 审查ID
    pub review_id: ReviewId,

    /// 拉取请求信息
    pub pull_request: PullRequestInfo,

    /// 请求审查的Agent ID
    pub requested_by_agent: AgentId,

    /// 指定的审查者
    pub requested_reviewers: Vec<String>,

    /// 审查优先级
    pub review_priority: ReviewPriority,

    /// 审查截止日期
    pub review_deadline: Option<DateTime<Utc>>,
}

/// 拉取请求信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct PullRequestInfo {
    /// PR标题
    pub title: String,

    /// PR描述
    pub description: String,

    /// 源分支
    pub source_branch: String,

    /// 目标分支
    pub target_branch: String,

    /// 变更的文件数
    pub changed_files_count: u32,

    /// 添加的行数
    pub lines_added: u32,

    /// 删除的行数
    pub lines_removed: u32,

    /// 提交数量
    pub commits_count: u32,
}

/// 审查优先级枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ReviewPriority {
    /// 低优先级
    Low,
    /// 正常优先级
    Normal,
    /// 高优先级
    High,
    /// 紧急
    Urgent,
}

/// 代码审查完成事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CodeReviewCompletedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 审查ID
    pub review_id: ReviewId,

    /// 审查结果
    pub review_result: ReviewResult,

    /// 审查者信息
    pub reviewer: String,

    /// 审查耗时（分钟）
    pub review_duration_minutes: u32,

    /// 发现的问题数量
    pub issues_found_count: u32,

    /// 审查评分（0.0-1.0）
    pub review_score: f32,

    /// 审查建议
    pub suggestions: Vec<ReviewSuggestion>,
}

/// 审查结果枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ReviewResult {
    /// 批准
    Approved,
    /// 需要修改
    ChangesRequested,
    /// 拒绝
    Rejected,
    /// 需要进一步审查
    NeedsMoreReview,
}

/// 审查建议
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ReviewSuggestion {
    /// 文件路径
    pub file_path: String,

    /// 行号
    pub line_number: Option<u32>,

    /// 建议类型
    pub suggestion_type: SuggestionType,

    /// 建议内容
    pub content: String,

    /// 严重程度
    pub severity: IssueSeverity,

    /// 是否为阻塞问题
    pub is_blocking: bool,
}

/// 建议类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum SuggestionType {
    /// 代码风格
    Style,
    /// 逻辑问题
    Logic,
    /// 性能优化
    Performance,
    /// 安全问题
    Security,
    /// 可维护性
    Maintainability,
    /// 测试相关
    Testing,
    /// 文档
    Documentation,
}

// ============================================================================
// 系统状态和错误事件
// ============================================================================

/// 系统状态变更事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct SystemStatusChangedEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 之前的系统状态
    pub previous_status: SystemStatus,

    /// 新的系统状态
    pub new_status: SystemStatus,

    /// 状态变更原因
    pub reason: String,

    /// 影响的组件
    pub affected_components: Vec<String>,

    /// 预计修复时间
    pub estimated_recovery_time: Option<DateTime<Utc>>,
}

/// 系统状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum SystemStatus {
    /// 正常运行
    Healthy,
    /// 降级运行
    Degraded,
    /// 部分不可用
    PartialOutage,
    /// 完全不可用
    MajorOutage,
    /// 维护中
    Maintenance,
}

/// 错误事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ErrorEvent {
    /// 事件元数据
    pub metadata: EventMetadata,

    /// 错误类型
    pub error_type: String,

    /// 错误消息
    pub error_message: String,

    /// 错误堆栈跟踪
    pub stack_trace: Option<String>,

    /// 相关的实体ID
    pub related_entity_id: Option<String>,

    /// 错误代码
    pub error_code: Option<String>,

    /// 是否可自动恢复
    pub can_auto_recover: bool,

    /// 建议的修复操作
    pub suggested_actions: Vec<String>,
}

// ============================================================================
// 事件工厂和工具函数
// ============================================================================

/// 事件工厂
/// 用于创建各种事件的便捷方法
pub struct EventFactory;

impl EventFactory {
    /// 创建基础事件元数据
    pub fn create_metadata(
        _event_type: &str,
        source: EventSource,
        priority: EventPriority,
    ) -> EventMetadata {
        EventMetadata {
            event_id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            source,
            session_id: None,
            user_id: None,
            priority,
            tags: vec![],
            custom_attributes: HashMap::new(),
        }
    }

    /// 创建Agent创建事件
    pub fn agent_created(
        agent_id: AgentId,
        agent_config: AgentConfig,
        created_by: String,
    ) -> AgentCreatedEvent {
        AgentCreatedEvent {
            metadata: Self::create_metadata(
                "agent_created",
                EventSource::System,
                EventPriority::Normal,
            ),
            agent_id,
            agent_config,
            created_by,
            creation_reason: None,
        }
    }

    /// 创建任务执行开始事件
    pub fn task_execution_started(
        session_id: ExecutionSessionId,
        task_id: TaskId,
        agent_id: AgentId,
        estimated_completion_time: DateTime<Utc>,
        execution_config: ExecutionConfig,
    ) -> TaskExecutionStartedEvent {
        TaskExecutionStartedEvent {
            metadata: Self::create_metadata(
                "task_execution_started",
                EventSource::Agent,
                EventPriority::High,
            ),
            session_id,
            task_id,
            agent_id,
            estimated_completion_time,
            execution_config,
        }
    }

    /// 创建错误事件
    pub fn error(
        error_type: String,
        error_message: String,
        related_entity_id: Option<String>,
    ) -> ErrorEvent {
        ErrorEvent {
            metadata: Self::create_metadata("error", EventSource::System, EventPriority::Critical),
            error_type,
            error_message,
            stack_trace: None,
            related_entity_id,
            error_code: None,
            can_auto_recover: false,
            suggested_actions: vec![],
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
    fn test_event_factory() {
        let agent_id = AgentId::new();
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            description: "Test".to_string(),
            prompt_template: "Test prompt".to_string(),
            capabilities: vec![AgentCapability::Testing],
            max_concurrent_tasks: 1,
            timeout_minutes: 30,
            git_config: None,
            custom_settings: HashMap::new(),
            priority_weight: 0.5,
            verbose_logging: false,
            resource_limits: None,
        };

        let event = EventFactory::agent_created(agent_id.clone(), config, "test-user".to_string());

        assert_eq!(event.agent_id, agent_id);
        assert_eq!(event.created_by, "test-user");
    }

    #[test]
    fn test_serialization() {
        let issue = IssueReport {
            issue_type: IssueType::CompilationError,
            description: "Missing semicolon".to_string(),
            severity: IssueSeverity::Minor,
            discovered_at: Utc::now(),
            related_files: vec!["main.rs".to_string()],
            suggested_solutions: vec!["Add semicolon at line 42".to_string()],
            auto_fixed: false,
        };

        let json = serde_json::to_string(&issue).unwrap();
        let deserialized: IssueReport = serde_json::from_str(&json).unwrap();

        assert_eq!(issue.issue_type, deserialized.issue_type);
        assert_eq!(issue.severity, deserialized.severity);
    }

    #[test]
    fn test_priority_ordering() {
        assert!(EventPriority::Critical > EventPriority::High);
        assert!(ReviewPriority::Urgent > ReviewPriority::Normal);
        assert!(IssueSeverity::Blocker > IssueSeverity::Critical);
    }
}
