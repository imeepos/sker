//! 仓储模式实现模块
//! 
//! 为每个聚合根提供仓储接口

pub mod user_repository;
pub mod user_session_repository;
pub mod project_repository;
pub mod requirement_document_repository;
pub mod llm_session_repository;
pub mod llm_conversation_repository;
pub mod task_repository;
pub mod agent_repository;
pub mod agent_work_history_repository;
pub mod execution_session_repository;
pub mod execution_log_repository;
pub mod conflict_repository;
pub mod human_decision_repository;
pub mod domain_event_repository;
pub mod event_publish_log_repository;
pub mod code_review_repository;
pub mod task_dependency_repository;
pub mod agent_performance_metrics_repository;

// 重新导出
pub use user_repository::UserRepository;
pub use user_session_repository::UserSessionRepository;
pub use project_repository::ProjectRepository;
pub use requirement_document_repository::RequirementDocumentRepository;
pub use llm_session_repository::LlmSessionRepository;
pub use llm_conversation_repository::LlmConversationRepository;
pub use task_repository::TaskRepository;
pub use agent_repository::AgentRepository;
pub use agent_work_history_repository::AgentWorkHistoryRepository;
pub use execution_session_repository::ExecutionSessionRepository;
pub use execution_log_repository::ExecutionLogRepository;
pub use conflict_repository::ConflictRepository;
pub use human_decision_repository::HumanDecisionRepository;
pub use domain_event_repository::DomainEventRepository;
pub use event_publish_log_repository::EventPublishLogRepository;
pub use code_review_repository::CodeReviewRepository;
pub use task_dependency_repository::TaskDependencyRepository;
pub use agent_performance_metrics_repository::AgentPerformanceMetricsRepository;