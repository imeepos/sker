//! 执行会话仓储实现

use crate::entities::execution_session::{self, Entity as ExecutionSession, ActiveModel, Model, ExecutionStatus};
use crate::error::{DatabaseError, Result};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait,
    QueryFilter, QueryOrder, PaginatorTrait,
};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 执行会话仓储
pub struct ExecutionSessionRepository {
    db: DatabaseConnection,
}

impl ExecutionSessionRepository {
    /// 创建新的执行会话仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的执行会话
    pub async fn create(&self, session_data: CreateSessionData) -> Result<Model> {
        let session = ActiveModel {
            session_id: Set(Uuid::new_v4()),
            task_id: Set(session_data.task_id),
            agent_id: Set(session_data.agent_id),
            project_id: Set(session_data.project_id),
            git_branch: Set(session_data.git_branch),
            base_commit: Set(session_data.base_commit),
            final_commit: Set(None),
            execution_config: Set(session_data.execution_config),
            timeout_minutes: Set(session_data.timeout_minutes),
            status: Set(ExecutionStatus::Pending.to_string()),
            created_at: Set(chrono::Utc::now().into()),
            started_at: Set(None),
            completed_at: Set(None),
            success: Set(None),
            result_data: Set(None),
            error_message: Set(None),
        };

        session.insert(&self.db).await.map_err(DatabaseError::from)
    }

    /// 根据ID查找执行会话
    pub async fn find_by_id(&self, session_id: Uuid) -> Result<Option<Model>> {
        ExecutionSession::find_by_id(session_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据任务ID查找执行会话
    pub async fn find_by_task_id(&self, task_id: Uuid) -> Result<Vec<Model>> {
        ExecutionSession::find()
            .filter(execution_session::Column::TaskId.eq(task_id))
            .order_by_desc(execution_session::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据Agent ID查找执行会话
    pub async fn find_by_agent_id(&self, agent_id: Uuid) -> Result<Vec<Model>> {
        ExecutionSession::find()
            .filter(execution_session::Column::AgentId.eq(agent_id))
            .order_by_desc(execution_session::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据项目ID查找执行会话
    pub async fn find_by_project_id(&self, project_id: Uuid) -> Result<Vec<Model>> {
        ExecutionSession::find()
            .filter(execution_session::Column::ProjectId.eq(project_id))
            .order_by_desc(execution_session::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据状态查找执行会话
    pub async fn find_by_status(&self, status: ExecutionStatus) -> Result<Vec<Model>> {
        ExecutionSession::find()
            .filter(execution_session::Column::Status.eq(status.to_string()))
            .order_by_asc(execution_session::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找运行中的会话
    pub async fn find_running_sessions(&self) -> Result<Vec<Model>> {
        self.find_by_status(ExecutionStatus::Running).await
    }

    /// 查找等待中的会话
    pub async fn find_pending_sessions(&self) -> Result<Vec<Model>> {
        self.find_by_status(ExecutionStatus::Pending).await
    }

    /// 启动执行会话
    pub async fn start_session(&self, session_id: Uuid) -> Result<Model> {
        let session = self.find_by_id(session_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("ExecutionSession", session_id.to_string()))?;

        if session.status != ExecutionStatus::Pending.to_string() {
            return Err(DatabaseError::validation(
                "Session is not in pending status"
            ));
        }

        let mut session_active: ActiveModel = session.into();
        session_active.status = Set(ExecutionStatus::Running.to_string());
        session_active.started_at = Set(Some(chrono::Utc::now().into()));

        session_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 完成执行会话
    pub async fn complete_session(
        &self,
        session_id: Uuid,
        success: bool,
        final_commit: Option<String>,
        result_data: Option<JsonValue>,
        error_message: Option<String>
    ) -> Result<Model> {
        let session = self.find_by_id(session_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("ExecutionSession", session_id.to_string()))?;

        if session.status != ExecutionStatus::Running.to_string() {
            return Err(DatabaseError::validation(
                "Session is not in running status"
            ));
        }

        let mut session_active: ActiveModel = session.into();
        session_active.status = Set(if success {
            ExecutionStatus::Completed.to_string()
        } else {
            ExecutionStatus::Failed.to_string()
        });
        session_active.completed_at = Set(Some(chrono::Utc::now().into()));
        session_active.success = Set(Some(success));
        session_active.final_commit = Set(final_commit);
        session_active.result_data = Set(result_data);
        session_active.error_message = Set(error_message);

        session_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 标记会话超时
    pub async fn timeout_session(&self, session_id: Uuid, error_message: String) -> Result<Model> {
        let session = self.find_by_id(session_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("ExecutionSession", session_id.to_string()))?;

        let mut session_active: ActiveModel = session.into();
        session_active.status = Set(ExecutionStatus::Timeout.to_string());
        session_active.completed_at = Set(Some(chrono::Utc::now().into()));
        session_active.success = Set(Some(false));
        session_active.error_message = Set(Some(error_message));

        session_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 检查超时的会话
    pub async fn find_timeout_sessions(&self, timeout_minutes: i32) -> Result<Vec<Model>> {
        let timeout_threshold = chrono::Utc::now() - chrono::Duration::minutes(timeout_minutes as i64);
        
        ExecutionSession::find()
            .filter(execution_session::Column::Status.eq(ExecutionStatus::Running.to_string()))
            .filter(execution_session::Column::StartedAt.lt(timeout_threshold))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 获取会话执行时长
    pub async fn get_execution_duration(&self, session_id: Uuid) -> Result<Option<chrono::Duration>> {
        let session = self.find_by_id(session_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("ExecutionSession", session_id.to_string()))?;

        if let Some(started_at) = session.started_at {
            let end_time = session.completed_at.unwrap_or_else(|| chrono::Utc::now().into());
            Ok(Some(end_time - started_at))
        } else {
            Ok(None)
        }
    }

    /// 分页查询执行会话
    pub async fn find_with_pagination(
        &self,
        page: u64,
        page_size: u64,
        filter: Option<SessionFilter>
    ) -> Result<(Vec<Model>, u64)> {
        let mut query = ExecutionSession::find();

        if let Some(filter) = filter {
            if let Some(project_id) = filter.project_id {
                query = query.filter(execution_session::Column::ProjectId.eq(project_id));
            }
            
            if let Some(agent_id) = filter.agent_id {
                query = query.filter(execution_session::Column::AgentId.eq(agent_id));
            }
            
            if let Some(status) = filter.status {
                query = query.filter(execution_session::Column::Status.eq(status.to_string()));
            }
        }

        let paginator = query
            .order_by_desc(execution_session::Column::CreatedAt)
            .paginate(&self.db, page_size);

        let total_pages = paginator.num_pages().await.map_err(DatabaseError::from)?;
        let sessions = paginator.fetch_page(page).await.map_err(DatabaseError::from)?;

        Ok((sessions, total_pages))
    }

    /// 获取会话统计信息
    pub async fn get_session_statistics(&self, project_id: Option<Uuid>) -> Result<SessionStatistics> {
        let mut query = ExecutionSession::find();
        
        if let Some(project_id) = project_id {
            query = query.filter(execution_session::Column::ProjectId.eq(project_id));
        }

        let all_sessions = query.all(&self.db).await.map_err(DatabaseError::from)?;

        let total_sessions = all_sessions.len() as i64;
        let completed_sessions = all_sessions.iter()
            .filter(|s| s.status == ExecutionStatus::Completed.to_string())
            .count() as i64;
        let failed_sessions = all_sessions.iter()
            .filter(|s| s.status == ExecutionStatus::Failed.to_string())
            .count() as i64;
        let timeout_sessions = all_sessions.iter()
            .filter(|s| s.status == ExecutionStatus::Timeout.to_string())
            .count() as i64;

        let success_rate = if total_sessions > 0 {
            completed_sessions as f64 / total_sessions as f64
        } else {
            0.0
        };

        // 计算平均执行时间
        let avg_duration = {
            let completed: Vec<_> = all_sessions.iter()
                .filter(|s| s.status == ExecutionStatus::Completed.to_string() && 
                         s.started_at.is_some() && s.completed_at.is_some())
                .collect();
            
            if !completed.is_empty() {
                let total_duration: i64 = completed.iter()
                    .map(|s| (s.completed_at.unwrap() - s.started_at.unwrap()).num_minutes())
                    .sum();
                Some(total_duration / completed.len() as i64)
            } else {
                None
            }
        };

        Ok(SessionStatistics {
            total_sessions,
            completed_sessions,
            failed_sessions,
            timeout_sessions,
            success_rate,
            average_duration_minutes: avg_duration,
        })
    }

    /// 删除执行会话
    pub async fn delete(&self, session_id: Uuid) -> Result<()> {
        ExecutionSession::delete_by_id(session_id)
            .exec(&self.db)
            .await
            .map_err(DatabaseError::from)?;
        
        Ok(())
    }
}

/// 创建执行会话的数据结构
#[derive(Debug, Clone)]
pub struct CreateSessionData {
    pub task_id: Uuid,
    pub agent_id: Uuid,
    pub project_id: Uuid,
    pub git_branch: String,
    pub base_commit: Option<String>,
    pub execution_config: Option<JsonValue>,
    pub timeout_minutes: i32,
}

/// 会话查询过滤器
#[derive(Debug, Clone)]
pub struct SessionFilter {
    pub project_id: Option<Uuid>,
    pub agent_id: Option<Uuid>,
    pub status: Option<ExecutionStatus>,
}

/// 会话统计信息
#[derive(Debug, Clone)]
pub struct SessionStatistics {
    pub total_sessions: i64,
    pub completed_sessions: i64,
    pub failed_sessions: i64,
    pub timeout_sessions: i64,
    pub success_rate: f64,
    pub average_duration_minutes: Option<i64>,
}