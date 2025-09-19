//! 数据库实体模块

pub mod user;
pub mod project;
pub mod requirement_document;
pub mod llm_session;
pub mod llm_conversation;
pub mod task;
pub mod agent;
pub mod agent_work_history;
pub mod execution_session;
pub mod execution_log;
pub mod conflict;
pub mod human_decision;
pub mod domain_event;
pub mod event_publish_log;
pub mod code_review;
pub mod task_dependency;
pub mod agent_performance_metrics;

// 重新导出所有实体
pub use user::Entity as User;
pub use project::Entity as Project;
pub use requirement_document::Entity as RequirementDocument;
pub use llm_session::Entity as LlmSession;
pub use llm_conversation::Entity as LlmConversation;
pub use task::Entity as Task;
pub use agent::Entity as Agent;
pub use agent_work_history::Entity as AgentWorkHistory;
pub use execution_session::Entity as ExecutionSession;
pub use execution_log::Entity as ExecutionLog;
pub use conflict::Entity as Conflict;
pub use human_decision::Entity as HumanDecision;
pub use domain_event::Entity as DomainEvent;
pub use event_publish_log::Entity as EventPublishLog;
pub use code_review::Entity as CodeReview;
pub use task_dependency::Entity as TaskDependency;
pub use agent_performance_metrics::Entity as AgentPerformanceMetrics;