//! # LLM调度协议模块
//!
//! 本模块定义了LLM调度和任务编排相关的所有协议类型，包括：
//! - 需求分解和任务生成
//! - 任务分配和调度
//! - LLM会话管理
//! - 项目上下文分析
//!
//! ## 使用示例
//!
//! ```rust
//! use codex_multi_agent::llm_orchestration::*;
//!
//! let task_info = TaskInfo {
//!     task_id: TaskId::new(),
//!     title: "实现用户登录功能".to_string(),
//!     description: "创建用户登录页面和后端API".to_string(),
//!     task_type: TaskType::Development,
//!     priority: TaskPriority::High,
//!     estimated_hours: 8,
//!     required_capabilities: vec![AgentCapability::FrontendDevelopment, AgentCapability::BackendDevelopment],
//!     dependencies: vec![],
//!     acceptance_criteria: vec!["用户可以使用邮箱和密码登录".to_string()],
//! };
//! ```

use crate::types::*;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[cfg(feature = "typescript")]
use ts_rs::TS;

// ============================================================================
// 项目上下文和分析
// ============================================================================

/// 项目上下文信息
/// 用于LLM理解项目状态和进行智能决策
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ProjectContext {
    /// 代码库信息
    pub codebase_info: CodebaseInfo,

    /// 现有架构描述
    pub existing_architecture: Option<String>,

    /// 开发约束条件
    pub development_constraints: Vec<String>,

    /// 时间线要求
    pub timeline_requirements: Option<TimelineRequirements>,

    /// 已完成的任务摘要
    pub completed_tasks_summary: Vec<CompletedTaskSummary>,

    /// 当前进行中的任务
    pub active_tasks: Vec<TaskId>,

    /// 项目风险评估
    pub risk_assessment: RiskAssessment,

    /// 资源可用性
    pub resource_availability: ResourceAvailability,

    /// 外部依赖状态
    pub external_dependencies_status: Vec<DependencyStatus>,
}

/// 代码库信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CodebaseInfo {
    /// 总文件数
    pub total_files: u32,

    /// 总代码行数
    pub total_lines: u32,

    /// 主要编程语言统计
    pub main_languages: Vec<LanguageStats>,

    /// 使用的框架信息
    pub framework_info: Vec<FrameworkInfo>,

    /// 代码质量指标
    pub quality_metrics: CodeQualityMetrics,

    /// 最近的提交统计
    pub recent_commit_stats: CommitStats,

    /// 技术债务评估
    pub technical_debt: TechnicalDebtMetrics,
}

/// 编程语言统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct LanguageStats {
    /// 编程语言名称
    pub language: String,

    /// 文件数量
    pub file_count: u32,

    /// 代码行数
    pub line_count: u32,

    /// 占总代码的百分比
    pub percentage: f32,

    /// 语言复杂度评分（1-10）
    pub complexity_score: u8,

    /// 维护难度评分（1-10）
    pub maintenance_score: u8,
}

/// 框架信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct FrameworkInfo {
    /// 框架名称
    pub name: String,

    /// 版本号
    pub version: String,

    /// 使用范围描述
    pub usage_scope: String,

    /// 配置状态
    pub configuration_status: ConfigurationStatus,

    /// 更新建议
    pub update_recommendation: Option<String>,
}

/// 配置状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ConfigurationStatus {
    /// 最新且正确配置
    UpToDate,
    /// 需要更新
    NeedsUpdate,
    /// 配置有问题
    Misconfigured,
    /// 未知状态
    Unknown,
}

/// 代码质量指标
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CodeQualityMetrics {
    /// 测试覆盖率（0.0-1.0）
    pub test_coverage: f32,

    /// 平均圈复杂度
    pub average_complexity: f32,

    /// 代码重复率（0.0-1.0）
    pub duplication_rate: f32,

    /// 代码规范违规数量
    pub style_violations: u32,

    /// 安全漏洞数量
    pub security_issues: u32,

    /// 性能问题数量
    pub performance_issues: u32,

    /// 整体质量评分（1-10）
    pub overall_quality_score: u8,
}

/// 提交统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CommitStats {
    /// 最近30天的提交数
    pub commits_last_30_days: u32,

    /// 活跃贡献者数量
    pub active_contributors: u32,

    /// 平均提交频率（每天）
    pub average_commits_per_day: f32,

    /// 提交类型分布
    pub commit_type_distribution: HashMap<String, u32>,

    /// 最后一次提交时间
    pub last_commit_time: DateTime<Utc>,
}

/// 技术债务指标
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TechnicalDebtMetrics {
    /// 预估技术债务时间（小时）
    pub estimated_hours: u32,

    /// 债务严重程度分布
    pub severity_distribution: HashMap<String, u32>,

    /// 主要债务类型
    pub main_debt_types: Vec<DebtType>,

    /// 债务趋势（增长/减少）
    pub trend: DebtTrend,
}

/// 债务类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DebtType {
    /// 代码重复
    CodeDuplication,
    /// 复杂逻辑
    ComplexLogic,
    /// 缺少测试
    MissingTests,
    /// 过时依赖
    OutdatedDependencies,
    /// 不良设计
    PoorDesign,
    /// 硬编码值
    HardcodedValues,
    /// 性能问题
    PerformanceIssues,
}

/// 债务趋势枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DebtTrend {
    /// 在增加
    Increasing,
    /// 保持稳定
    Stable,
    /// 在减少
    Decreasing,
}

// ============================================================================
// 时间线和里程碑管理
// ============================================================================

/// 时间线要求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TimelineRequirements {
    /// 目标完成时间
    pub target_completion: DateTime<Utc>,

    /// 里程碑截止日期
    pub milestone_deadlines: Vec<Milestone>,

    /// 关键路径任务
    pub critical_path_tasks: Vec<String>,

    /// 缓冲时间（小时）
    pub buffer_time_hours: u32,

    /// 风险系数（用于时间估算调整）
    pub risk_factor: f32,

    /// 工作日历配置
    pub work_calendar: WorkCalendar,
}

/// 里程碑定义
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct Milestone {
    /// 里程碑ID
    pub id: String,

    /// 里程碑名称
    pub name: String,

    /// 截止日期
    pub deadline: DateTime<Utc>,

    /// 交付物列表
    pub deliverables: Vec<String>,

    /// 依赖的任务ID列表
    pub dependent_tasks: Vec<TaskId>,

    /// 里程碑状态
    pub status: MilestoneStatus,

    /// 完成度（0.0-1.0）
    pub completion_rate: f32,

    /// 风险级别
    pub risk_level: RiskLevel,
}

/// 里程碑状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum MilestoneStatus {
    /// 计划中
    Planned,
    /// 进行中
    InProgress,
    /// 已完成
    Completed,
    /// 延期
    Delayed,
    /// 有风险
    AtRisk,
}

/// 工作日历配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct WorkCalendar {
    /// 工作日（0=星期天，1=星期一...）
    pub working_days: Vec<u8>,

    /// 每日工作小时数
    pub hours_per_day: u8,

    /// 节假日列表
    pub holidays: Vec<DateTime<Utc>>,

    /// 团队休假时间
    pub team_leave_periods: Vec<LeavePeriod>,
}

/// 休假期间
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct LeavePeriod {
    /// 休假开始时间
    pub start_date: DateTime<Utc>,

    /// 休假结束时间
    pub end_date: DateTime<Utc>,

    /// 休假类型
    pub leave_type: LeaveType,

    /// 影响的团队成员
    pub affected_members: Vec<String>,
}

/// 休假类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum LeaveType {
    /// 年假
    AnnualLeave,
    /// 病假
    SickLeave,
    /// 会议/培训
    Conference,
    /// 其他
    Other,
}

// ============================================================================
// 任务信息和依赖管理
// ============================================================================

/// 详细任务信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskInfo {
    /// 任务唯一标识符
    pub task_id: TaskId,

    /// 任务标题
    pub title: String,

    /// 详细描述
    pub description: String,

    /// 任务类型
    pub task_type: TaskType,

    /// 优先级
    pub priority: TaskPriority,

    /// 预估工作时间（小时）
    pub estimated_hours: u32,

    /// 所需Agent能力
    pub required_capabilities: Vec<AgentCapability>,

    /// 任务依赖
    pub dependencies: Vec<TaskId>,

    /// 验收标准
    pub acceptance_criteria: Vec<String>,

    /// 任务标签
    pub tags: Vec<String>,

    /// 相关文件路径
    pub related_files: Vec<String>,

    /// 测试要求
    pub test_requirements: TaskTestRequirements,

    /// 复杂度评估
    pub complexity_assessment: ComplexityAssessment,

    /// 风险评估
    pub risk_factors: Vec<RiskFactor>,

    /// 子任务列表
    pub subtasks: Vec<TaskId>,

    /// 相关问题/Bug ID
    pub related_issues: Vec<String>,
}

/// 任务测试要求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskTestRequirements {
    /// 需要单元测试
    pub needs_unit_tests: bool,

    /// 需要集成测试
    pub needs_integration_tests: bool,

    /// 需要端到端测试
    pub needs_e2e_tests: bool,

    /// 测试覆盖率要求
    pub required_coverage: f32,

    /// 特殊测试场景
    pub special_test_scenarios: Vec<String>,
}

/// 复杂度评估
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ComplexityAssessment {
    /// 技术复杂度（1-10）
    pub technical_complexity: u8,

    /// 业务逻辑复杂度（1-10）
    pub business_complexity: u8,

    /// 集成复杂度（1-10）
    pub integration_complexity: u8,

    /// 整体复杂度评分（1-10）
    pub overall_complexity: u8,

    /// 复杂度说明
    pub complexity_notes: Vec<String>,
}

/// 风险因子
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RiskFactor {
    /// 风险类型
    pub risk_type: RiskType,

    /// 风险级别
    pub risk_level: RiskLevel,

    /// 风险描述
    pub description: String,

    /// 影响评估
    pub impact_assessment: String,

    /// 缓解措施
    pub mitigation_strategies: Vec<String>,
}

/// 风险类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum RiskType {
    /// 技术风险
    Technical,
    /// 时间风险
    Timeline,
    /// 资源风险
    Resource,
    /// 依赖风险
    Dependency,
    /// 质量风险
    Quality,
    /// 安全风险
    Security,
    /// 业务风险
    Business,
}

/// 风险级别枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    /// 低风险
    Low,
    /// 中等风险
    Medium,
    /// 高风险
    High,
    /// 极高风险
    Critical,
}

/// 任务依赖关系
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskDependency {
    /// 依赖源任务ID
    pub from_task: TaskId,

    /// 目标任务ID
    pub to_task: TaskId,

    /// 依赖类型
    pub dependency_type: DependencyType,

    /// 依赖强度
    pub dependency_strength: DependencyStrength,

    /// 依赖描述
    pub description: Option<String>,
}

/// 依赖类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DependencyType {
    /// 完成-开始（前任务完成后才能开始）
    FinishToStart,
    /// 开始-开始（前任务开始后才能开始）
    StartToStart,
    /// 完成-完成（前任务完成后才能完成）
    FinishToFinish,
    /// 开始-完成（前任务开始后才能完成）
    StartToFinish,
}

/// 依赖强度枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DependencyStrength {
    /// 强依赖，必须等待
    Hard,
    /// 软依赖，建议等待
    Soft,
    /// 可选依赖，可以并行进行
    Optional,
}

// ============================================================================
// 任务分配和调度
// ============================================================================

/// 任务分配结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TaskAssignment {
    /// 任务ID
    pub task_id: TaskId,

    /// 分配的Agent ID
    pub agent_id: AgentId,

    /// 分配时间
    pub assigned_at: DateTime<Utc>,

    /// 预计开始时间
    pub estimated_start_time: DateTime<Utc>,

    /// 预计完成时间
    pub estimated_completion: DateTime<Utc>,

    /// 分配理由
    pub assignment_reasoning: String,

    /// 信心评分（0.0-1.0）
    pub confidence_score: f32,

    /// 分配策略
    pub assignment_strategy: AssignmentStrategy,

    /// 备选Agent列表
    pub alternative_agents: Vec<AgentId>,
}

/// 分配策略枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum AssignmentStrategy {
    /// 基于能力匹配
    CapabilityBased,
    /// 基于工作负载均衡
    LoadBalancing,
    /// 基于历史表现
    PerformanceBased,
    /// 基于可用性
    AvailabilityBased,
    /// 混合策略
    Hybrid,
}

/// 调度计划
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct SchedulePlan {
    /// 计划ID
    pub plan_id: String,

    /// 项目ID
    pub project_id: ProjectId,

    /// 任务分配列表
    pub task_assignments: Vec<TaskAssignment>,

    /// 执行阶段
    pub execution_phases: Vec<ExecutionPhase>,

    /// 关键路径
    pub critical_path: Vec<TaskId>,

    /// 计划创建时间
    pub created_at: DateTime<Utc>,

    /// 计划有效期
    pub valid_until: DateTime<Utc>,

    /// 整体预估完成时间
    pub estimated_total_completion: DateTime<Utc>,

    /// 计划置信度
    pub plan_confidence: f32,
}

/// 执行阶段
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ExecutionPhase {
    /// 阶段名称
    pub name: String,

    /// 阶段描述
    pub description: String,

    /// 阶段中的任务
    pub tasks: Vec<TaskId>,

    /// 阶段开始时间
    pub start_time: DateTime<Utc>,

    /// 阶段结束时间
    pub end_time: DateTime<Utc>,

    /// 阶段依赖
    pub dependencies: Vec<String>,

    /// 阶段门禁条件
    pub gate_conditions: Vec<String>,
}

// ============================================================================
// 风险评估和资源管理
// ============================================================================

/// 项目风险评估
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RiskAssessment {
    /// 总体风险级别
    pub overall_risk_level: RiskLevel,

    /// 具体风险项目
    pub risk_items: Vec<RiskItem>,

    /// 风险矩阵
    pub risk_matrix: RiskMatrix,

    /// 缓解计划
    pub mitigation_plan: Vec<MitigationAction>,
}

/// 风险项目
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RiskItem {
    /// 风险ID
    pub risk_id: String,

    /// 风险描述
    pub description: String,

    /// 风险类型
    pub risk_type: RiskType,

    /// 发生概率（0.0-1.0）
    pub probability: f32,

    /// 影响程度（0.0-1.0）
    pub impact: f32,

    /// 风险值（概率 × 影响）
    pub risk_score: f32,

    /// 风险状态
    pub status: RiskStatus,

    /// 负责人
    pub owner: Option<String>,
}

/// 风险状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum RiskStatus {
    /// 已识别
    Identified,
    /// 监控中
    Monitoring,
    /// 正在缓解
    Mitigating,
    /// 已缓解
    Mitigated,
    /// 已实现（风险变成了问题）
    Realized,
}

/// 风险矩阵
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RiskMatrix {
    /// 高风险项目数量
    pub high_risk_count: u32,

    /// 中等风险项目数量
    pub medium_risk_count: u32,

    /// 低风险项目数量
    pub low_risk_count: u32,

    /// 风险分布图
    pub risk_distribution: HashMap<String, u32>,
}

/// 缓解行动
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct MitigationAction {
    /// 行动ID
    pub action_id: String,

    /// 目标风险ID
    pub target_risk_id: String,

    /// 行动描述
    pub description: String,

    /// 行动类型
    pub action_type: MitigationActionType,

    /// 负责人
    pub responsible_person: String,

    /// 截止日期
    pub due_date: DateTime<Utc>,

    /// 行动状态
    pub status: ActionStatus,
}

/// 缓解行动类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum MitigationActionType {
    /// 避免风险
    Avoid,
    /// 减少风险
    Reduce,
    /// 转移风险
    Transfer,
    /// 接受风险
    Accept,
    /// 监控风险
    Monitor,
}

/// 行动状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ActionStatus {
    /// 计划中
    Planned,
    /// 进行中
    InProgress,
    /// 已完成
    Completed,
    /// 已取消
    Cancelled,
    /// 延期
    Delayed,
}

/// 资源可用性
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ResourceAvailability {
    /// 可用Agent列表
    pub available_agents: Vec<AgentId>,

    /// Agent工作负载情况
    pub agent_workloads: HashMap<String, f32>, // Agent ID -> 负载率

    /// 预计资源需求
    pub estimated_resource_demand: ResourceDemand,

    /// 资源缺口分析
    pub resource_gaps: Vec<ResourceGap>,
}

/// 资源需求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ResourceDemand {
    /// 各能力所需的工作时间
    pub capability_demands: HashMap<String, u32>, // 能力 -> 小时数

    /// 峰值需求时期
    pub peak_demand_periods: Vec<DemandPeriod>,

    /// 总预估工作时间
    pub total_estimated_hours: u32,
}

/// 需求期间
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct DemandPeriod {
    /// 开始时间
    pub start_time: DateTime<Utc>,

    /// 结束时间
    pub end_time: DateTime<Utc>,

    /// 所需资源量
    pub required_resources: u32,

    /// 需求描述
    pub description: String,
}

/// 资源缺口
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ResourceGap {
    /// 缺口的能力类型
    pub capability: AgentCapability,

    /// 缺口大小（小时）
    pub gap_hours: u32,

    /// 影响的任务
    pub affected_tasks: Vec<TaskId>,

    /// 建议的解决方案
    pub suggested_solutions: Vec<String>,
}

/// 依赖状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct DependencyStatus {
    /// 依赖名称
    pub name: String,

    /// 当前状态
    pub status: ExternalDependencyStatus,

    /// 状态描述
    pub status_description: String,

    /// 最后检查时间
    pub last_checked: DateTime<Utc>,

    /// 影响评估
    pub impact_if_unavailable: String,
}

/// 外部依赖状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ExternalDependencyStatus {
    /// 可用
    Available,
    /// 不可用
    Unavailable,
    /// 有限可用
    LimitedAvailability,
    /// 未知
    Unknown,
    /// 计划维护
    ScheduledMaintenance,
}

/// 已完成任务摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CompletedTaskSummary {
    /// 任务ID
    pub task_id: TaskId,

    /// 任务标题
    pub title: String,

    /// 完成时间
    pub completed_at: DateTime<Utc>,

    /// 实际花费时间（小时）
    pub actual_hours: u32,

    /// 执行的Agent
    pub executed_by: AgentId,

    /// 质量评分
    pub quality_score: f32,

    /// 经验教训
    pub lessons_learned: Vec<String>,
}

// ============================================================================
// 测试模块
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_info_creation() {
        let task = TaskInfo {
            task_id: TaskId::new(),
            title: "测试任务".to_string(),
            description: "这是一个测试任务".to_string(),
            task_type: TaskType::Testing,
            priority: TaskPriority::Medium,
            estimated_hours: 4,
            required_capabilities: vec![AgentCapability::Testing],
            dependencies: vec![],
            acceptance_criteria: vec!["测试通过".to_string()],
            tags: vec!["test".to_string()],
            related_files: vec![],
            test_requirements: TaskTestRequirements {
                needs_unit_tests: true,
                needs_integration_tests: false,
                needs_e2e_tests: false,
                required_coverage: 0.8,
                special_test_scenarios: vec![],
            },
            complexity_assessment: ComplexityAssessment {
                technical_complexity: 3,
                business_complexity: 2,
                integration_complexity: 1,
                overall_complexity: 2,
                complexity_notes: vec![],
            },
            risk_factors: vec![],
            subtasks: vec![],
            related_issues: vec![],
        };

        assert_eq!(task.title, "测试任务");
        assert_eq!(task.priority, TaskPriority::Medium);
    }

    #[test]
    fn test_risk_level_ordering() {
        assert!(RiskLevel::Critical > RiskLevel::High);
        assert!(RiskLevel::High > RiskLevel::Medium);
        assert!(RiskLevel::Medium > RiskLevel::Low);
    }

    #[test]
    fn test_serialization() {
        let complexity = ComplexityAssessment {
            technical_complexity: 5,
            business_complexity: 3,
            integration_complexity: 7,
            overall_complexity: 5,
            complexity_notes: vec!["需要集成多个外部API".to_string()],
        };

        let json = serde_json::to_string(&complexity).unwrap();
        let deserialized: ComplexityAssessment = serde_json::from_str(&json).unwrap();

        assert_eq!(
            complexity.technical_complexity,
            deserialized.technical_complexity
        );
        assert_eq!(
            complexity.overall_complexity,
            deserialized.overall_complexity
        );
    }
}
