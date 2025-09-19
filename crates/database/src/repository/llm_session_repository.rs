//! LLM会话仓储实现

use crate::{entities::llm_session, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// LLM会话仓储
pub struct LlmSessionRepository {
    db: DatabaseConnection,
}

impl LlmSessionRepository {
    /// 创建新的LLM会话仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新LLM会话
    pub async fn create(
        &self,
        project_id: Uuid,
        user_id: Uuid,
        session_type: String,
        system_prompt: Option<String>,
        decomposition_prompt: Option<String>,
    ) -> Result<llm_session::Model> {
        let now = chrono::Utc::now().into();
        let session_id = Uuid::new_v4();
        
        let session = llm_session::ActiveModel {
            session_id: Set(session_id),
            project_id: Set(project_id),
            user_id: Set(user_id),
            session_type: Set(session_type),
            status: Set("active".to_string()),
            system_prompt: Set(system_prompt),
            decomposition_prompt: Set(decomposition_prompt),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };
        
        let _result = llm_session::Entity::insert(session).exec(&self.db).await?;
        
        // 获取插入的会话
        llm_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("LlmSession", session_id))
    }
    
    /// 根据ID查找LLM会话
    pub async fn find_by_id(&self, session_id: Uuid) -> Result<Option<llm_session::Model>> {
        llm_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据项目ID查找LLM会话
    pub async fn find_by_project(&self, project_id: Uuid) -> Result<Vec<llm_session::Model>> {
        llm_session::Entity::find()
            .filter(llm_session::Column::ProjectId.eq(project_id))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据会话类型查找LLM会话
    pub async fn find_by_type(&self, project_id: Uuid, session_type: &str) -> Result<Vec<llm_session::Model>> {
        llm_session::Entity::find()
            .filter(llm_session::Column::ProjectId.eq(project_id))
            .filter(llm_session::Column::SessionType.eq(session_type))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 查找活跃的LLM会话
    pub async fn find_active(&self, project_id: Uuid) -> Result<Vec<llm_session::Model>> {
        llm_session::Entity::find()
            .filter(llm_session::Column::ProjectId.eq(project_id))
            .filter(llm_session::Column::Status.eq("active"))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新会话结果
    pub async fn update_result(
        &self,
        session_id: Uuid,
        result_data: JsonValue,
        status: String,
    ) -> Result<llm_session::Model> {
        let session = llm_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("LlmSession", session_id))?;
        
        let now = chrono::Utc::now().into();
        let mut session: llm_session::ActiveModel = session.into();
        
        session.result_data = Set(Some(result_data));
        session.status = Set(status.clone());
        session.updated_at = Set(now);
        
        if status == "completed" || status == "failed" || status == "cancelled" {
            session.completed_at = Set(Some(now));
        }
        
        session.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新提示词
    pub async fn update_prompts(
        &self,
        session_id: Uuid,
        system_prompt: Option<String>,
        decomposition_prompt: Option<String>,
        allocation_prompt: Option<String>,
    ) -> Result<llm_session::Model> {
        let session = llm_session::Entity::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("LlmSession", session_id))?;
        
        let mut session: llm_session::ActiveModel = session.into();
        
        if let Some(prompt) = system_prompt {
            session.system_prompt = Set(Some(prompt));
        }
        
        if let Some(prompt) = decomposition_prompt {
            session.decomposition_prompt = Set(Some(prompt));
        }
        
        if let Some(prompt) = allocation_prompt {
            session.allocation_prompt = Set(Some(prompt));
        }
        
        session.updated_at = Set(chrono::Utc::now().into());
        
        session.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除LLM会话
    pub async fn delete(&self, session_id: Uuid) -> Result<()> {
        llm_session::Entity::delete_by_id(session_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
}