//! # TypeScript类型生成模块
//! 
//! 本模块提供将Rust类型转换为TypeScript类型定义的功能，
//! 使得前端应用可以获得完整的类型安全支持。

#[cfg(feature = "typescript")]
use std::collections::HashMap;
#[cfg(feature = "typescript")]
use ts_rs::TS;

/// TypeScript类型生成器
pub struct TypeScriptGenerator;

#[cfg(feature = "typescript")]
impl TypeScriptGenerator {
    /// 生成所有类型的TypeScript定义
    pub fn generate_all_types() -> Result<String, Box<dyn std::error::Error>> {
        let mut definitions = String::new();
        
        // 添加文件头注释
        definitions.push_str(&Self::generate_header());
        
        // 生成基础类型
        definitions.push_str("\n// ============================================================================\n");
        definitions.push_str("// 基础类型定义\n");
        definitions.push_str("// ============================================================================\n\n");
        definitions.push_str(&Self::generate_basic_types()?);
        
        // 生成Agent管理类型
        definitions.push_str("\n// ============================================================================\n");
        definitions.push_str("// Agent管理类型\n");
        definitions.push_str("// ============================================================================\n\n");
        definitions.push_str(&Self::generate_agent_types()?);
        
        // 生成项目管理类型
        definitions.push_str("\n// ============================================================================\n");
        definitions.push_str("// 项目管理类型\n");
        definitions.push_str("// ============================================================================\n\n");
        definitions.push_str(&Self::generate_project_types()?);
        
        // 生成LLM调度类型
        definitions.push_str("\n// ============================================================================\n");
        definitions.push_str("// LLM调度类型\n");
        definitions.push_str("// ============================================================================\n\n");
        definitions.push_str(&Self::generate_llm_types()?);
        
        // 生成事件类型
        definitions.push_str("\n// ============================================================================\n");
        definitions.push_str("// 事件类型\n");
        definitions.push_str("// ============================================================================\n\n");
        definitions.push_str(&Self::generate_event_types()?);
        
        // 添加工具函数和类型守护
        definitions.push_str("\n// ============================================================================\n");
        definitions.push_str("// 工具函数和类型守护\n");
        definitions.push_str("// ============================================================================\n\n");
        definitions.push_str(&Self::generate_utility_functions());
        
        Ok(definitions)
    }
    
    /// 生成文件头注释
    fn generate_header() -> String {
        format!(r#"/**
 * 自动生成的TypeScript类型定义文件
 * 来源：codex-multi-agent v{}
 * 生成时间：{}
 * 
 * 警告：请勿手动修改此文件，所有更改将在下次生成时被覆盖
 */

"#, env!("CARGO_PKG_VERSION"), chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"))
    }
    
    /// 生成基础类型定义
    fn generate_basic_types() -> Result<String, Box<dyn std::error::Error>> {
        use crate::types::*;
        
        let mut output = String::new();
        
        // 生成ID类型
        #[cfg(feature = "multi-agent")]
        {
            output.push_str(&AgentId::typescript_definition());
            output.push_str(&ProjectId::typescript_definition());
            output.push_str(&TaskId::typescript_definition());
            output.push_str(&ExecutionSessionId::typescript_definition());
            output.push_str(&ReviewId::typescript_definition());
            output.push_str(&ConflictId::typescript_definition());
            output.push_str(&LlmSessionId::typescript_definition());
        }
        
        // 生成枚举类型
        output.push_str(&AgentCapability::typescript_definition());
        output.push_str(&AgentStatus::typescript_definition());
        output.push_str(&TaskType::typescript_definition());
        output.push_str(&TaskPriority::typescript_definition());
        output.push_str(&TaskStatus::typescript_definition());
        output.push_str(&ConflictType::typescript_definition());
        output.push_str(&ConflictSeverity::typescript_definition());
        output.push_str(&EntityReference::typescript_definition());
        output.push_str(&SortOrder::typescript_definition());
        
        // 生成工具类型
        output.push_str(&PaginationParams::typescript_definition());
        output.push_str(&PaginationResponse::<()>::typescript_definition());
        
        Ok(output)
    }
    
    /// 生成Agent管理类型
    fn generate_agent_types() -> Result<String, Box<dyn std::error::Error>> {
        use crate::agent_management::*;
        
        let mut output = String::new();
        
        output.push_str(&AgentConfig::typescript_definition());
        output.push_str(&AgentConfigUpdate::typescript_definition());
        output.push_str(&AgentFilter::typescript_definition());
        output.push_str(&AgentSummary::typescript_definition());
        output.push_str(&AgentDetails::typescript_definition());
        output.push_str(&GitConfig::typescript_definition());
        output.push_str(&ResourceLimits::typescript_definition());
        output.push_str(&PerformanceMetrics::typescript_definition());
        output.push_str(&ResourceUsage::typescript_definition());
        output.push_str(&ErrorStats::typescript_definition());
        output.push_str(&ErrorRecord::typescript_definition());
        output.push_str(&CreateAgentRequest::typescript_definition());
        output.push_str(&UpdateAgentRequest::typescript_definition());
        output.push_str(&ListAgentsRequest::typescript_definition());
        
        Ok(output)
    }
    
    /// 生成项目管理类型
    fn generate_project_types() -> Result<String, Box<dyn std::error::Error>> {
        use crate::project_management::*;
        
        let mut output = String::new();
        
        output.push_str(&ProjectInfo::typescript_definition());
        output.push_str(&ProjectType::typescript_definition());
        output.push_str(&ProjectPriority::typescript_definition());
        output.push_str(&TeamMember::typescript_definition());
        output.push_str(&Permission::typescript_definition());
        output.push_str(&ExternalDependency::typescript_definition());
        output.push_str(&DependencyType::typescript_definition());
        output.push_str(&EnvironmentConfig::typescript_definition());
        output.push_str(&CodingStandards::typescript_definition());
        output.push_str(&LanguageConfig::typescript_definition());
        output.push_str(&IndentationConfig::typescript_definition());
        output.push_str(&IndentType::typescript_definition());
        output.push_str(&NamingConventions::typescript_definition());
        output.push_str(&NamingStyle::typescript_definition());
        output.push_str(&QualityGates::typescript_definition());
        output.push_str(&SeverityLevel::typescript_definition());
        output.push_str(&TestRequirements::typescript_definition());
        output.push_str(&TestDataConfig::typescript_definition());
        output.push_str(&TestDataStrategy::typescript_definition());
        output.push_str(&TestDataCleanup::typescript_definition());
        output.push_str(&ReviewRules::typescript_definition());
        output.push_str(&ReviewCheck::typescript_definition());
        output.push_str(&CommitConventions::typescript_definition());
        output.push_str(&CommitMessageFormat::typescript_definition());
        output.push_str(&CommitType::typescript_definition());
        output.push_str(&BranchingStrategy::typescript_definition());
        output.push_str(&BranchingStrategyType::typescript_definition());
        output.push_str(&RequirementDocument::typescript_definition());
        output.push_str(&DocumentType::typescript_definition());
        output.push_str(&DocumentPriority::typescript_definition());
        output.push_str(&DocumentStatus::typescript_definition());
        output.push_str(&DocumentAttachment::typescript_definition());
        output.push_str(&ProjectUpdate::typescript_definition());
        output.push_str(&CreateProjectRequest::typescript_definition());
        
        Ok(output)
    }
    
    /// 生成LLM调度类型
    fn generate_llm_types() -> Result<String, Box<dyn std::error::Error>> {
        use crate::llm_orchestration::*;
        
        let mut output = String::new();
        
        output.push_str(&ProjectContext::typescript_definition());
        output.push_str(&CodebaseInfo::typescript_definition());
        output.push_str(&LanguageStats::typescript_definition());
        output.push_str(&FrameworkInfo::typescript_definition());
        output.push_str(&ConfigurationStatus::typescript_definition());
        output.push_str(&CodeQualityMetrics::typescript_definition());
        output.push_str(&CommitStats::typescript_definition());
        output.push_str(&TechnicalDebtMetrics::typescript_definition());
        output.push_str(&DebtType::typescript_definition());
        output.push_str(&DebtTrend::typescript_definition());
        output.push_str(&TimelineRequirements::typescript_definition());
        output.push_str(&Milestone::typescript_definition());
        output.push_str(&MilestoneStatus::typescript_definition());
        output.push_str(&WorkCalendar::typescript_definition());
        output.push_str(&LeavePeriod::typescript_definition());
        output.push_str(&LeaveType::typescript_definition());
        output.push_str(&TaskInfo::typescript_definition());
        output.push_str(&TaskTestRequirements::typescript_definition());
        output.push_str(&ComplexityAssessment::typescript_definition());
        output.push_str(&RiskFactor::typescript_definition());
        output.push_str(&RiskType::typescript_definition());
        output.push_str(&RiskLevel::typescript_definition());
        output.push_str(&TaskDependency::typescript_definition());
        output.push_str(&DependencyStrength::typescript_definition());
        output.push_str(&TaskAssignment::typescript_definition());
        output.push_str(&AssignmentStrategy::typescript_definition());
        output.push_str(&SchedulePlan::typescript_definition());
        output.push_str(&ExecutionPhase::typescript_definition());
        
        Ok(output)
    }
    
    /// 生成事件类型
    fn generate_event_types() -> Result<String, Box<dyn std::error::Error>> {
        use crate::events::*;
        
        let mut output = String::new();
        
        output.push_str(&EventMetadata::typescript_definition());
        output.push_str(&EventSource::typescript_definition());
        output.push_str(&EventPriority::typescript_definition());
        output.push_str(&AgentCreatedEvent::typescript_definition());
        output.push_str(&AgentUpdatedEvent::typescript_definition());
        output.push_str(&AgentDeletedEvent::typescript_definition());
        output.push_str(&AgentStatusChangedEvent::typescript_definition());
        output.push_str(&AgentListResponseEvent::typescript_definition());
        output.push_str(&ProjectCreatedEvent::typescript_definition());
        output.push_str(&ProjectUpdatedEvent::typescript_definition());
        output.push_str(&RequirementsUploadedEvent::typescript_definition());
        output.push_str(&RequirementDecompositionStartedEvent::typescript_definition());
        output.push_str(&RequirementDecompositionCompletedEvent::typescript_definition());
        output.push_str(&TaskAllocationCompletedEvent::typescript_definition());
        output.push_str(&TaskExecutionStartedEvent::typescript_definition());
        output.push_str(&TaskProgressUpdatedEvent::typescript_definition());
        output.push_str(&TaskExecutionCompletedEvent::typescript_definition());
        output.push_str(&ErrorEvent::typescript_definition());
        
        Ok(output)
    }
    
    /// 生成工具函数和类型守护
    fn generate_utility_functions() -> String {
        r#"/**
 * 类型守护函数 - 用于在运行时检查对象类型
 */

// Agent相关类型守护
export function isAgentId(value: any): value is AgentId {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isAgentCapability(value: any): value is AgentCapability {
    const validCapabilities = [
        'frontend_development', 'backend_development', 'database_design', 'testing',
        'code_review', 'dev_ops', 'documentation', 'ui_design', 'security_audit',
        'performance_tuning', 'api_design', 'architecture_design', 'data_analysis',
        'machine_learning'
    ];
    return validCapabilities.includes(value);
}

export function isAgentStatus(value: any): value is AgentStatus {
    const validStatuses = ['idle', 'working', 'paused', 'error', 'offline', 'maintenance'];
    return validStatuses.includes(value);
}

// 任务相关类型守护
export function isTaskType(value: any): value is TaskType {
    const validTypes = [
        'development', 'testing', 'code_review', 'documentation', 'deployment',
        'bugfix', 'refactoring', 'research', 'design', 'optimization'
    ];
    return validTypes.includes(value);
}

export function isTaskPriority(value: any): value is TaskPriority {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    return validPriorities.includes(value);
}

export function isTaskStatus(value: any): value is TaskStatus {
    const validStatuses = [
        'pending', 'in_progress', 'completed', 'failed', 'cancelled', 'on_hold',
        'waiting_for_dependency', 'waiting_for_review'
    ];
    return validStatuses.includes(value);
}

// 事件相关类型守护
export function isEventSource(value: any): value is EventSource {
    const validSources = ['system', 'agent', 'user', 'external', 'scheduler', 'webhook'];
    return validSources.includes(value);
}

export function isEventPriority(value: any): value is EventPriority {
    const validPriorities = ['low', 'normal', 'high', 'critical'];
    return validPriorities.includes(value);
}

/**
 * 工具函数 - 用于处理常见操作
 */

// UUID生成（客户端）
export function generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 日期格式化
export function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
}

// 优先级排序
export function sortByPriority<T extends { priority: TaskPriority | EventPriority }>(items: T[]): T[] {
    const priorityOrder = { low: 0, medium: 1, normal: 1, high: 2, critical: 3 };
    return items.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

// Agent能力匹配
export function hasRequiredCapabilities(
    agentCapabilities: AgentCapability[],
    requiredCapabilities: AgentCapability[]
): boolean {
    return requiredCapabilities.every(required => agentCapabilities.includes(required));
}

// 分页信息计算
export function calculatePaginationInfo(
    totalItems: number,
    currentPage: number,
    pageSize: number
): { totalPages: number; hasNextPage: bool; hasPreviousPage: boolean } {
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
    };
}

/**
 * 错误处理工具
 */

export interface MultiAgentError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
}

export function createError(code: string, message: string, details?: Record<string, any>): MultiAgentError {
    return {
        code,
        message,
        details,
        timestamp: new Date().toISOString()
    };
}

export function isMultiAgentError(value: any): value is MultiAgentError {
    return value && typeof value.code === 'string' && typeof value.message === 'string';
}

/**
 * 常量定义
 */

export const AGENT_CAPABILITIES = [
    'frontend_development',
    'backend_development',
    'database_design',
    'testing',
    'code_review',
    'dev_ops',
    'documentation',
    'ui_design',
    'security_audit',
    'performance_tuning',
    'api_design',
    'architecture_design',
    'data_analysis',
    'machine_learning'
] as const;

export const TASK_TYPES = [
    'development',
    'testing',
    'code_review',
    'documentation',
    'deployment',
    'bugfix',
    'refactoring',
    'research',
    'design',
    'optimization'
] as const;

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const EVENT_SOURCES = ['system', 'agent', 'user', 'external', 'scheduler', 'webhook'] as const;

/**
 * 配置默认值
 */

export const DEFAULT_PAGINATION_PARAMS: PaginationParams = {
    page: 1,
    page_size: 20,
    sort_by: null,
    sort_order: 'asc'
};

export const DEFAULT_AGENT_CONFIG = {
    max_concurrent_tasks: 1,
    timeout_minutes: 30,
    priority_weight: 0.5,
    verbose_logging: false
};

export const DEFAULT_QUALITY_GATES = {
    min_test_coverage: 0.8,
    max_complexity: 10,
    required_reviewers: 1,
    require_all_checks_pass: true
};

/**
 * API响应包装类型
 */

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: MultiAgentError;
    metadata?: {
        timestamp: string;
        request_id?: string;
        version?: string;
    };
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
    pagination?: PaginationResponse<T>;
}

// 成功响应创建器
export function createSuccessResponse<T>(data: T, metadata?: any): ApiResponse<T> {
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
        }
    };
}

// 错误响应创建器
export function createErrorResponse(error: MultiAgentError): ApiResponse<never> {
    return {
        success: false,
        error,
        metadata: {
            timestamp: new Date().toISOString()
        }
    };
}
"#.to_string()
    }
    
    /// 生成特定模块的类型定义
    pub fn generate_module_types(module_name: &str) -> Result<String, Box<dyn std::error::Error>> {
        match module_name {
            "types" => Self::generate_basic_types(),
            "agent_management" => Self::generate_agent_types(),
            "project_management" => Self::generate_project_types(),
            "llm_orchestration" => Self::generate_llm_types(),
            "events" => Self::generate_event_types(),
            _ => Err(format!("Unknown module: {}", module_name).into()),
        }
    }
    
    /// 生成类型映射表
    pub fn generate_type_mapping() -> HashMap<String, String> {
        let mut mapping = HashMap::new();
        
        // Rust类型到TypeScript类型的映射
        mapping.insert("String".to_string(), "string".to_string());
        mapping.insert("u32".to_string(), "number".to_string());
        mapping.insert("u64".to_string(), "number".to_string());
        mapping.insert("f32".to_string(), "number".to_string());
        mapping.insert("f64".to_string(), "number".to_string());
        mapping.insert("bool".to_string(), "boolean".to_string());
        mapping.insert("Vec<T>".to_string(), "T[]".to_string());
        mapping.insert("Option<T>".to_string(), "T | null".to_string());
        mapping.insert("HashMap<K, V>".to_string(), "Record<K, V>".to_string());
        mapping.insert("DateTime<Utc>".to_string(), "string".to_string());
        mapping.insert("PathBuf".to_string(), "string".to_string());
        mapping.insert("Uuid".to_string(), "string".to_string());
        
        mapping
    }
}

// 当没有启用typescript feature时的空实现
#[cfg(not(feature = "typescript"))]
impl TypeScriptGenerator {
    /// 生成所有类型的TypeScript定义（空实现）
    pub fn generate_all_types() -> Result<String, Box<dyn std::error::Error>> {
        Err("TypeScript generation is not available. Enable the 'typescript' feature.".into())
    }
    
    /// 生成特定模块的类型定义（空实现）
    pub fn generate_module_types(_module_name: &str) -> Result<String, Box<dyn std::error::Error>> {
        Err("TypeScript generation is not available. Enable the 'typescript' feature.".into())
    }
    
    /// 生成类型映射表（空实现）
    pub fn generate_type_mapping() -> std::collections::HashMap<String, String> {
        std::collections::HashMap::new()
    }
}

/// CLI工具函数
pub fn save_typescript_definitions(output_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let definitions = TypeScriptGenerator::generate_all_types()?;
    std::fs::write(output_path, definitions)?;
    println!("TypeScript definitions saved to: {}", output_path);
    Ok(())
}

/// 验证生成的TypeScript代码
#[cfg(feature = "typescript")]
pub fn validate_typescript_output(content: &str) -> Result<(), String> {
    // 基本语法检查
    if !content.contains("export") {
        return Err("Generated TypeScript should contain exports".to_string());
    }
    
    if content.contains("undefined") && !content.contains("| undefined") {
        return Err("Undefined types should be properly typed".to_string());
    }
    
    // 检查是否包含必要的类型
    let required_types = [
        "AgentId", "ProjectId", "TaskId", "AgentCapability", "TaskType",
        "AgentConfig", "ProjectInfo", "TaskInfo"
    ];
    
    for required_type in &required_types {
        if !content.contains(required_type) {
            return Err(format!("Missing required type: {}", required_type));
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    #[cfg(feature = "typescript")]
    fn test_typescript_generation() {
        let result = TypeScriptGenerator::generate_all_types();
        assert!(result.is_ok(), "TypeScript generation should succeed");
        
        let content = result.unwrap();
        assert!(!content.is_empty(), "Generated content should not be empty");
        assert!(content.contains("export"), "Should contain exports");
        assert!(content.contains("AgentId"), "Should contain AgentId type");
    }
    
    #[test]
    #[cfg(feature = "typescript")]
    fn test_module_generation() {
        let types_result = TypeScriptGenerator::generate_module_types("types");
        assert!(types_result.is_ok());
        
        let agent_result = TypeScriptGenerator::generate_module_types("agent_management");
        assert!(agent_result.is_ok());
        
        let invalid_result = TypeScriptGenerator::generate_module_types("invalid_module");
        assert!(invalid_result.is_err());
    }
    
    #[test]
    fn test_type_mapping() {
        let mapping = TypeScriptGenerator::generate_type_mapping();
        
        #[cfg(feature = "typescript")]
        {
            assert!(!mapping.is_empty());
            assert_eq!(mapping.get("String"), Some(&"string".to_string()));
            assert_eq!(mapping.get("bool"), Some(&"boolean".to_string()));
        }
        
        #[cfg(not(feature = "typescript"))]
        {
            assert!(mapping.is_empty());
        }
    }
    
    #[test]
    #[cfg(feature = "typescript")]
    fn test_validation() {
        let valid_content = r#"
            export interface AgentId {
                value: string;
            }
            export interface AgentConfig {
                name: string;
            }
        "#;
        
        assert!(validate_typescript_output(valid_content).is_ok());
        
        let invalid_content = "const x = 1;"; // 没有export
        assert!(validate_typescript_output(invalid_content).is_err());
    }
    
    #[test]
    #[cfg(not(feature = "typescript"))]
    fn test_disabled_feature() {
        let result = TypeScriptGenerator::generate_all_types();
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not available"));
    }
}