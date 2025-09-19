//! # 项目管理协议模块
//!
//! 本模块定义了项目管理相关的所有协议类型，包括：
//! - 项目信息和配置
//! - 编码规范和质量要求
//! - 需求文档管理
//! - 项目状态跟踪
//!
//! ## 使用示例
//!
//! ```rust
//! use codex_multi_agent::project_management::*;
//! use std::collections::HashMap;
//! use std::path::PathBuf;
//!
//! let project_info = ProjectInfo {
//!     name: "电商系统".to_string(),
//!     description: "现代化的电商平台".to_string(),
//!     repository_url: "https://github.com/company/ecommerce".to_string(),
//!     main_branch: "main".to_string(),
//!     technology_stack: vec!["Rust".to_string(), "React".to_string(), "PostgreSQL".to_string()],
//!     coding_standards: CodingStandards::default(),
//!     workspace_path: PathBuf::from("/workspace/ecommerce"),
//! };
//! ```

// 只导入实际使用的类型，避免星号导入

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[cfg(feature = "typescript")]
use ts_rs::TS;

// ============================================================================
// 项目基础类型
// ============================================================================

/// 项目信息结构
/// 包含项目的基本信息和配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ProjectInfo {
    /// 项目名称
    pub name: String,

    /// 项目描述
    pub description: String,

    /// 版本号
    pub version: String,

    /// 仓库URL
    pub repository_url: String,

    /// 主分支名称
    pub main_branch: String,

    /// 技术栈列表
    pub technology_stack: Vec<String>,

    /// 编码规范配置
    pub coding_standards: CodingStandards,

    /// 工作空间路径
    pub workspace_path: PathBuf,

    /// 项目类型
    pub project_type: ProjectType,

    /// 项目优先级
    pub priority: ProjectPriority,

    /// 预计完成日期
    pub target_completion_date: Option<DateTime<Utc>>,

    /// 项目所有者/负责人
    pub owner: String,

    /// 项目团队成员
    pub team_members: Vec<TeamMember>,

    /// 项目标签
    pub tags: Vec<String>,

    /// 项目依赖的外部服务
    pub external_dependencies: Vec<ExternalDependency>,

    /// 环境配置
    pub environments: HashMap<String, EnvironmentConfig>,
}

/// 项目类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ProjectType {
    /// Web应用
    WebApplication,
    /// 移动应用
    MobileApplication,
    /// 桌面应用
    DesktopApplication,
    /// 后端服务/API
    BackendService,
    /// 库/SDK
    Library,
    /// 工具/CLI
    Tool,
    /// 数据管道
    DataPipeline,
    /// 机器学习项目
    MachineLearning,
    /// 微服务
    Microservice,
    /// 全栈应用
    FullStackApplication,
}

/// 项目优先级枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ProjectPriority {
    /// 低优先级
    Low,
    /// 中等优先级
    Medium,
    /// 高优先级
    High,
    /// 紧急优先级
    Critical,
}

/// 团队成员信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TeamMember {
    /// 成员姓名
    pub name: String,

    /// 邮箱地址
    pub email: String,

    /// 角色
    pub role: String,

    /// 权限级别
    pub permissions: Vec<Permission>,

    /// 是否为项目管理员
    #[serde(default)]
    pub is_admin: bool,
}

/// 权限枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    /// 读取权限
    Read,
    /// 写入权限
    Write,
    /// 管理权限
    Admin,
    /// 部署权限
    Deploy,
    /// 审核权限
    Review,
    /// 删除权限
    Delete,
}

/// 外部依赖信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ExternalDependency {
    /// 依赖名称
    pub name: String,

    /// 依赖类型
    pub dependency_type: DependencyType,

    /// 版本要求
    pub version: String,

    /// 是否为关键依赖
    #[serde(default)]
    pub is_critical: bool,

    /// 文档URL
    pub documentation_url: Option<String>,
}

/// 依赖类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DependencyType {
    /// 数据库
    Database,
    /// 缓存服务
    Cache,
    /// 消息队列
    MessageQueue,
    /// 外部API
    ExternalApi,
    /// 文件存储
    FileStorage,
    /// 认证服务
    Authentication,
    /// 监控服务
    Monitoring,
    /// 其他
    Other,
}

/// 环境配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct EnvironmentConfig {
    /// 环境名称（如：dev, staging, production）
    pub name: String,

    /// 环境描述
    pub description: String,

    /// 配置变量
    pub variables: HashMap<String, String>,

    /// 部署URL
    pub deployment_url: Option<String>,

    /// 是否为生产环境
    #[serde(default)]
    pub is_production: bool,
}

// ============================================================================
// 编码规范和质量配置
// ============================================================================

/// 编码规范配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CodingStandards {
    /// 各语言的配置
    pub language_configs: HashMap<String, LanguageConfig>,

    /// 通用规则
    pub general_rules: Vec<String>,

    /// 质量门禁
    pub quality_gates: QualityGates,

    /// 测试要求
    pub test_requirements: TestRequirements,

    /// 代码审查规则
    pub review_rules: ReviewRules,

    /// 提交规范
    pub commit_conventions: CommitConventions,

    /// 分支策略
    pub branching_strategy: BranchingStrategy,
}

/// 语言配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct LanguageConfig {
    /// 语言名称
    pub language: String,

    /// Linter配置文件路径或内容
    pub linter_config: Option<String>,

    /// 格式化工具配置
    pub formatter_config: Option<String>,

    /// 风格指南URL
    pub style_guide_url: Option<String>,

    /// 最大行长度
    pub max_line_length: Option<u32>,

    /// 缩进配置
    pub indentation: IndentationConfig,

    /// 命名规范
    pub naming_conventions: NamingConventions,

    /// 是否强制执行
    #[serde(default = "default_true")]
    pub enforce_rules: bool,
}

/// 缩进配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct IndentationConfig {
    /// 缩进类型（spaces或tabs）
    pub indent_type: IndentType,

    /// 缩进大小
    pub indent_size: u32,
}

/// 缩进类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum IndentType {
    /// 使用空格
    Spaces,
    /// 使用制表符
    Tabs,
}

/// 命名规范
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct NamingConventions {
    /// 变量命名规范
    pub variables: NamingStyle,

    /// 函数命名规范
    pub functions: NamingStyle,

    /// 类命名规范
    pub classes: NamingStyle,

    /// 常量命名规范
    pub constants: NamingStyle,

    /// 文件命名规范
    pub files: NamingStyle,
}

/// 命名风格枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum NamingStyle {
    /// 驼峰命名（camelCase）
    CamelCase,
    /// 帕斯卡命名（PascalCase）
    PascalCase,
    /// 蛇形命名（snake_case）
    SnakeCase,
    /// 全大写蛇形命名（SCREAMING_SNAKE_CASE）
    ScreamingSnakeCase,
    /// 短横线命名（kebab-case）
    KebabCase,
}

/// 质量门禁配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct QualityGates {
    /// 最小测试覆盖率（0.0-1.0）
    pub min_test_coverage: f32,

    /// 最大圈复杂度
    pub max_complexity: u32,

    /// 最大技术债务时间（小时）
    pub max_tech_debt_hours: u32,

    /// 最大代码重复率（0.0-1.0）
    pub max_duplication_rate: f32,

    /// 必需的审查者数量
    pub required_reviewers: u32,

    /// 是否需要所有检查通过
    #[serde(default = "default_true")]
    pub require_all_checks_pass: bool,

    /// 允许的严重性级别
    pub allowed_severity_levels: Vec<SeverityLevel>,
}

/// 严重性级别枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum SeverityLevel {
    /// 信息级别
    Info,
    /// 警告级别
    Warning,
    /// 错误级别
    Error,
    /// 阻塞级别
    Blocker,
}

/// 测试要求配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TestRequirements {
    /// 是否需要单元测试
    pub unit_test_required: bool,

    /// 是否需要集成测试
    pub integration_test_required: bool,

    /// 是否需要端到端测试
    pub e2e_test_required: bool,

    /// 是否需要性能测试
    pub performance_test_required: bool,

    /// 是否需要安全测试
    pub security_test_required: bool,

    /// 最小单元测试覆盖率
    pub min_unit_test_coverage: f32,

    /// 最小集成测试覆盖率
    pub min_integration_test_coverage: f32,

    /// 测试超时时间（秒）
    pub test_timeout_seconds: u32,

    /// 测试数据配置
    pub test_data_config: TestDataConfig,
}

/// 测试数据配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct TestDataConfig {
    /// 测试数据生成策略
    pub generation_strategy: TestDataStrategy,

    /// 测试数据清理策略
    pub cleanup_strategy: TestDataCleanup,

    /// 是否使用模拟数据
    #[serde(default = "default_true")]
    pub use_mock_data: bool,

    /// 测试数据库配置
    pub test_database_config: Option<String>,
}

/// 测试数据生成策略枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum TestDataStrategy {
    /// 静态数据
    Static,
    /// 动态生成
    Generated,
    /// 从生产数据匿名化
    AnonymizedProduction,
    /// 混合策略
    Hybrid,
}

/// 测试数据清理策略枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum TestDataCleanup {
    /// 测试后立即清理
    Immediate,
    /// 批量清理
    Batch,
    /// 保留数据
    Keep,
    /// 条件清理
    Conditional,
}

// ============================================================================
// 代码审查和提交规范
// ============================================================================

/// 代码审查规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ReviewRules {
    /// 是否需要代码审查
    pub review_required: bool,

    /// 最少审查者数量
    pub min_reviewers: u32,

    /// 是否需要团队负责人审查
    pub require_team_lead_approval: bool,

    /// 是否允许自审
    pub allow_self_review: bool,

    /// 审查超时时间（小时）
    pub review_timeout_hours: u32,

    /// 必需的审查检查项
    pub required_checks: Vec<ReviewCheck>,

    /// 审查模板
    pub review_template: Option<String>,
}

/// 审查检查项枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum ReviewCheck {
    /// 代码风格检查
    CodeStyle,
    /// 功能正确性检查
    Functionality,
    /// 性能检查
    Performance,
    /// 安全检查
    Security,
    /// 文档检查
    Documentation,
    /// 测试检查
    Testing,
    /// 架构检查
    Architecture,
}

/// 提交规范配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CommitConventions {
    /// 提交消息格式
    pub message_format: CommitMessageFormat,

    /// 是否强制使用规范格式
    pub enforce_format: bool,

    /// 允许的提交类型
    pub allowed_types: Vec<CommitType>,

    /// 最大提交消息长度
    pub max_message_length: u32,

    /// 是否需要提交签名
    pub require_signed_commits: bool,

    /// 提交消息模板
    pub commit_template: Option<String>,
}

/// 提交消息格式枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum CommitMessageFormat {
    /// 传统格式
    Conventional,
    /// 自由格式
    Free,
    /// 自定义格式
    Custom,
}

/// 提交类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum CommitType {
    /// 新功能
    Feat,
    /// 修复
    Fix,
    /// 文档
    Docs,
    /// 样式
    Style,
    /// 重构
    Refactor,
    /// 性能优化
    Perf,
    /// 测试
    Test,
    /// 构建
    Build,
    /// CI
    Ci,
    /// 杂项
    Chore,
}

/// 分支策略配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct BranchingStrategy {
    /// 分支策略类型
    pub strategy_type: BranchingStrategyType,

    /// 主分支名称
    pub main_branch: String,

    /// 开发分支名称
    pub develop_branch: Option<String>,

    /// 功能分支前缀
    pub feature_branch_prefix: String,

    /// 修复分支前缀
    pub hotfix_branch_prefix: String,

    /// 发布分支前缀
    pub release_branch_prefix: String,

    /// 分支命名规则
    pub branch_naming_pattern: String,

    /// 是否自动删除合并后的分支
    pub auto_delete_merged_branches: bool,

    /// 保护分支列表
    pub protected_branches: Vec<String>,
}

/// 分支策略类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum BranchingStrategyType {
    /// Git Flow
    GitFlow,
    /// GitHub Flow
    GitHubFlow,
    /// GitLab Flow
    GitLabFlow,
    /// 自定义策略
    Custom,
}

// ============================================================================
// 需求文档管理
// ============================================================================

/// 需求文档
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct RequirementDocument {
    /// 文档ID
    pub document_id: String,

    /// 文档标题
    pub title: String,

    /// 文档内容
    pub content: String,

    /// 文档类型
    pub document_type: DocumentType,

    /// 文档版本
    pub version: String,

    /// 文档优先级
    pub priority: DocumentPriority,

    /// 文档状态
    pub status: DocumentStatus,

    /// 文档作者
    pub author: String,

    /// 创建时间
    pub created_at: DateTime<Utc>,

    /// 更新时间
    pub updated_at: DateTime<Utc>,

    /// 审核者
    pub reviewers: Vec<String>,

    /// 相关文档ID列表
    pub related_documents: Vec<String>,

    /// 文档标签
    pub tags: Vec<String>,

    /// 文档附件
    pub attachments: Vec<DocumentAttachment>,
}

/// 文档类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DocumentType {
    /// 用户故事
    UserStory,
    /// 技术规格
    TechnicalSpec,
    /// API规格
    ApiSpec,
    /// 数据库架构
    DatabaseSchema,
    /// 测试计划
    TestPlan,
    /// 架构文档
    ArchitectureDoc,
    /// 用户手册
    UserManual,
    /// 部署指南
    DeploymentGuide,
    /// 需求规格
    RequirementSpec,
}

/// 文档优先级枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DocumentPriority {
    /// 低优先级
    Low,
    /// 中等优先级
    Medium,
    /// 高优先级
    High,
    /// 关键优先级
    Critical,
}

/// 文档状态枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    /// 草稿
    Draft,
    /// 审查中
    InReview,
    /// 已批准
    Approved,
    /// 已发布
    Published,
    /// 已归档
    Archived,
    /// 需要更新
    NeedsUpdate,
}

/// 文档附件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct DocumentAttachment {
    /// 附件名称
    pub name: String,

    /// 附件类型
    pub file_type: String,

    /// 附件大小（字节）
    pub size_bytes: u64,

    /// 附件URL或路径
    pub url: String,

    /// 上传时间
    pub uploaded_at: DateTime<Utc>,

    /// 上传者
    pub uploaded_by: String,
}

// ============================================================================
// 项目更新和请求类型
// ============================================================================

/// 项目更新请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct ProjectUpdate {
    /// 更新项目名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    /// 更新项目描述
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// 更新版本号
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// 更新技术栈
    #[serde(skip_serializing_if = "Option::is_none")]
    pub technology_stack: Option<Vec<String>>,

    /// 更新编码规范
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coding_standards: Option<CodingStandards>,

    /// 更新项目优先级
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<ProjectPriority>,

    /// 更新目标完成日期
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_completion_date: Option<Option<DateTime<Utc>>>,

    /// 更新团队成员
    #[serde(skip_serializing_if = "Option::is_none")]
    pub team_members: Option<Vec<TeamMember>>,

    /// 更新项目标签
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

/// 创建项目请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "typescript", derive(TS))]
pub struct CreateProjectRequest {
    /// 项目信息
    pub project_info: ProjectInfo,

    /// 是否立即初始化仓库
    #[serde(default = "default_true")]
    pub initialize_repository: bool,

    /// 初始需求文档列表
    #[serde(default)]
    pub initial_documents: Vec<RequirementDocument>,
}

// ============================================================================
// 默认值和实用函数
// ============================================================================

impl Default for CodingStandards {
    fn default() -> Self {
        Self {
            language_configs: HashMap::new(),
            general_rules: vec![
                "使用有意义的变量和函数名".to_string(),
                "保持函数简洁，单一职责".to_string(),
                "编写清晰的注释和文档".to_string(),
                "遵循DRY原则，避免代码重复".to_string(),
            ],
            quality_gates: QualityGates {
                min_test_coverage: 0.8,
                max_complexity: 10,
                max_tech_debt_hours: 8,
                max_duplication_rate: 0.05,
                required_reviewers: 1,
                require_all_checks_pass: true,
                allowed_severity_levels: vec![SeverityLevel::Info, SeverityLevel::Warning],
            },
            test_requirements: TestRequirements {
                unit_test_required: true,
                integration_test_required: true,
                e2e_test_required: false,
                performance_test_required: false,
                security_test_required: true,
                min_unit_test_coverage: 0.8,
                min_integration_test_coverage: 0.6,
                test_timeout_seconds: 300,
                test_data_config: TestDataConfig {
                    generation_strategy: TestDataStrategy::Generated,
                    cleanup_strategy: TestDataCleanup::Immediate,
                    use_mock_data: true,
                    test_database_config: None,
                },
            },
            review_rules: ReviewRules {
                review_required: true,
                min_reviewers: 1,
                require_team_lead_approval: false,
                allow_self_review: false,
                review_timeout_hours: 48,
                required_checks: vec![
                    ReviewCheck::CodeStyle,
                    ReviewCheck::Functionality,
                    ReviewCheck::Testing,
                ],
                review_template: None,
            },
            commit_conventions: CommitConventions {
                message_format: CommitMessageFormat::Conventional,
                enforce_format: true,
                allowed_types: vec![
                    CommitType::Feat,
                    CommitType::Fix,
                    CommitType::Docs,
                    CommitType::Refactor,
                    CommitType::Test,
                ],
                max_message_length: 100,
                require_signed_commits: false,
                commit_template: None,
            },
            branching_strategy: BranchingStrategy {
                strategy_type: BranchingStrategyType::GitHubFlow,
                main_branch: "main".to_string(),
                develop_branch: None,
                feature_branch_prefix: "feature/".to_string(),
                hotfix_branch_prefix: "hotfix/".to_string(),
                release_branch_prefix: "release/".to_string(),
                branch_naming_pattern: "^(feature|hotfix|release)/[a-z0-9-]+$".to_string(),
                auto_delete_merged_branches: true,
                protected_branches: vec!["main".to_string()],
            },
        }
    }
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
    fn test_project_info_serialization() {
        let project = ProjectInfo {
            name: "测试项目".to_string(),
            description: "这是一个测试项目".to_string(),
            version: "1.0.0".to_string(),
            repository_url: "https://github.com/test/project".to_string(),
            main_branch: "main".to_string(),
            technology_stack: vec!["Rust".to_string(), "React".to_string()],
            coding_standards: CodingStandards::default(),
            workspace_path: PathBuf::from("/workspace/test"),
            project_type: ProjectType::WebApplication,
            priority: ProjectPriority::Medium,
            target_completion_date: None,
            owner: "test-user".to_string(),
            team_members: vec![],
            tags: vec!["test".to_string()],
            external_dependencies: vec![],
            environments: HashMap::new(),
        };

        let json = serde_json::to_string(&project).unwrap();
        let deserialized: ProjectInfo = serde_json::from_str(&json).unwrap();

        assert_eq!(project.name, deserialized.name);
        assert_eq!(project.project_type, deserialized.project_type);
    }

    #[test]
    fn test_coding_standards_default() {
        let standards = CodingStandards::default();

        assert!(standards.test_requirements.unit_test_required);
        assert_eq!(standards.quality_gates.min_test_coverage, 0.8);
        assert_eq!(standards.review_rules.min_reviewers, 1);
    }

    #[test]
    fn test_priority_ordering() {
        assert!(ProjectPriority::Critical > ProjectPriority::High);
        assert!(ProjectPriority::High > ProjectPriority::Medium);
        assert!(DocumentPriority::Critical > DocumentPriority::Low);
    }
}
