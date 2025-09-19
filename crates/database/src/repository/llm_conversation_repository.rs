//! LLM对话仓储实现

use crate::{entities::llm_conversation, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ColumnTrait, QueryFilter, QueryOrder, QuerySelect};
use uuid::Uuid;

/// LLM对话仓储
pub struct LlmConversationRepository {
    db: DatabaseConnection,
}

impl LlmConversationRepository {
    /// 创建新的LLM对话仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新对话消息
    pub async fn create(&self, message_data: CreateConversationMessageData) -> Result<llm_conversation::Model> {
        let now = chrono::Utc::now().into();
        let message_id = Uuid::new_v4();
        
        let message = llm_conversation::ActiveModel {
            message_id: Set(message_id),
            session_id: Set(message_data.session_id),
            role: Set(message_data.role),
            content: Set(message_data.content),
            message_order: Set(message_data.message_order),
            token_count: Set(message_data.token_count),
            model_used: Set(message_data.model_used),
            processing_time_ms: Set(message_data.processing_time_ms),
            created_at: Set(now),
        };
        
        let _result = llm_conversation::Entity::insert(message).exec(&self.db).await?;
        
        // 获取插入的消息
        llm_conversation::Entity::find_by_id(message_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("LlmConversation", message_id))
    }
    
    /// 根据ID查找对话消息
    pub async fn find_by_id(&self, message_id: Uuid) -> Result<Option<llm_conversation::Model>> {
        llm_conversation::Entity::find_by_id(message_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据会话ID查找对话消息（按顺序排列）
    pub async fn find_by_session(&self, session_id: Uuid) -> Result<Vec<llm_conversation::Model>> {
        llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .order_by_asc(llm_conversation::Column::MessageOrder)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取会话的最新消息
    pub async fn find_latest_by_session(&self, session_id: Uuid, limit: u64) -> Result<Vec<llm_conversation::Model>> {
        llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .order_by_desc(llm_conversation::Column::MessageOrder)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据角色查找对话消息
    pub async fn find_by_role(&self, session_id: Uuid, role: &str) -> Result<Vec<llm_conversation::Model>> {
        llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .filter(llm_conversation::Column::Role.eq(role))
            .order_by_asc(llm_conversation::Column::MessageOrder)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取会话的Token统计
    pub async fn get_token_stats(&self, session_id: Uuid) -> Result<(i32, i32)> {
        use sea_orm::{QuerySelect, FromQueryResult};
        
        #[derive(FromQueryResult)]
        struct TokenStats {
            total_tokens: Option<i32>,
            message_count: i64,
        }
        
        let stats = llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .select_only()
            .column_as(llm_conversation::Column::TokenCount.sum(), "total_tokens")
            .column_as(llm_conversation::Column::MessageId.count(), "message_count")
            .into_model::<TokenStats>()
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)?;
        
        if let Some(stats) = stats {
            Ok((stats.total_tokens.unwrap_or(0), stats.message_count as i32))
        } else {
            Ok((0, 0))
        }
    }
    
    /// 删除对话消息
    pub async fn delete(&self, message_id: Uuid) -> Result<()> {
        llm_conversation::Entity::delete_by_id(message_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 删除会话的所有对话消息
    pub async fn delete_by_session(&self, session_id: Uuid) -> Result<()> {
        llm_conversation::Entity::delete_many()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
}

/// 创建对话消息的数据结构
#[derive(Debug, Clone)]
pub struct CreateConversationMessageData {
    pub session_id: Uuid,
    pub role: String,
    pub content: String,
    pub message_order: i32,
    pub token_count: Option<i32>,
    pub model_used: Option<String>,
    pub processing_time_ms: Option<i32>,
}