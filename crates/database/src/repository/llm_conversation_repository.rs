//! LLM对话仓储实现

use crate::{entities::llm_conversation, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ColumnTrait, QueryFilter, QueryOrder, QuerySelect};
use uuid::Uuid;

/// LLM对话仓储
pub struct LlmConversationRepository;

impl LlmConversationRepository {
    /// 创建新对话消息
    pub async fn create_message(
        db: &DatabaseConnection,
        session_id: Uuid,
        role: String,
        content: String,
        message_order: i32,
    ) -> Result<llm_conversation::Model> {
        let now = chrono::Utc::now().into();
        let message_id = Uuid::new_v4();
        
        let message = llm_conversation::ActiveModel {
            message_id: Set(message_id),
            session_id: Set(session_id),
            role: Set(role),
            content: Set(content),
            message_order: Set(message_order),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = llm_conversation::Entity::insert(message).exec(db).await?;
        
        // 获取插入的消息
        llm_conversation::Entity::find_by_id(message_id)
            .one(db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("LlmConversation", message_id))
    }
    
    /// 创建带元数据的对话消息
    pub async fn create_message_with_metadata(
        db: &DatabaseConnection,
        session_id: Uuid,
        role: String,
        content: String,
        message_order: i32,
        token_count: Option<i32>,
        model_used: Option<String>,
        processing_time_ms: Option<i32>,
    ) -> Result<llm_conversation::Model> {
        let now = chrono::Utc::now().into();
        let message_id = Uuid::new_v4();
        
        let message = llm_conversation::ActiveModel {
            message_id: Set(message_id),
            session_id: Set(session_id),
            role: Set(role),
            content: Set(content),
            message_order: Set(message_order),
            token_count: Set(token_count),
            model_used: Set(model_used),
            processing_time_ms: Set(processing_time_ms),
            created_at: Set(now),
        };
        
        let _result = llm_conversation::Entity::insert(message).exec(db).await?;
        
        // 获取插入的消息
        llm_conversation::Entity::find_by_id(message_id)
            .one(db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("LlmConversation", message_id))
    }
    
    /// 根据ID查找对话消息
    pub async fn find_by_id(db: &DatabaseConnection, message_id: Uuid) -> Result<Option<llm_conversation::Model>> {
        llm_conversation::Entity::find_by_id(message_id)
            .one(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据会话ID查找对话消息（按顺序排列）
    pub async fn find_by_session(db: &DatabaseConnection, session_id: Uuid) -> Result<Vec<llm_conversation::Model>> {
        llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .order_by_asc(llm_conversation::Column::MessageOrder)
            .all(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取会话的最新消息
    pub async fn find_latest_by_session(db: &DatabaseConnection, session_id: Uuid, limit: u64) -> Result<Vec<llm_conversation::Model>> {
        llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .order_by_desc(llm_conversation::Column::MessageOrder)
            .limit(limit)
            .all(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据角色查找对话消息
    pub async fn find_by_role(db: &DatabaseConnection, session_id: Uuid, role: &str) -> Result<Vec<llm_conversation::Model>> {
        llm_conversation::Entity::find()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .filter(llm_conversation::Column::Role.eq(role))
            .order_by_asc(llm_conversation::Column::MessageOrder)
            .all(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取会话的Token统计
    pub async fn get_token_stats(db: &DatabaseConnection, session_id: Uuid) -> Result<(i32, i32)> {
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
            .one(db)
            .await
            .map_err(DatabaseError::from)?;
        
        if let Some(stats) = stats {
            Ok((stats.total_tokens.unwrap_or(0), stats.message_count as i32))
        } else {
            Ok((0, 0))
        }
    }
    
    /// 删除对话消息
    pub async fn delete(db: &DatabaseConnection, message_id: Uuid) -> Result<()> {
        llm_conversation::Entity::delete_by_id(message_id)
            .exec(db)
            .await?;
        
        Ok(())
    }
    
    /// 删除会话的所有对话消息
    pub async fn delete_by_session(db: &DatabaseConnection, session_id: Uuid) -> Result<()> {
        llm_conversation::Entity::delete_many()
            .filter(llm_conversation::Column::SessionId.eq(session_id))
            .exec(db)
            .await?;
        
        Ok(())
    }
}