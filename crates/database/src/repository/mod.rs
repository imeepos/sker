//! 仓储模式实现模块
//! 
//! 为每个聚合根提供仓储接口

pub mod user_repository;
pub mod project_repository;
pub mod requirement_document_repository;
pub mod llm_session_repository;
pub mod llm_conversation_repository;
pub mod task_repository;
pub mod agent_repository;
pub mod execution_session_repository;
pub mod conflict_repository;

// 重新导出
pub use user_repository::UserRepository;
pub use project_repository::ProjectRepository;
pub use requirement_document_repository::RequirementDocumentRepository;
pub use llm_session_repository::LlmSessionRepository;
pub use llm_conversation_repository::LlmConversationRepository;
pub use task_repository::TaskRepository;
pub use agent_repository::AgentRepository;
pub use execution_session_repository::ExecutionSessionRepository;
pub use conflict_repository::ConflictRepository;