//! 需求文档仓储实现

use crate::{entities::requirement_document, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter};
use uuid::Uuid;

/// 需求文档仓储
pub struct RequirementDocumentRepository;

impl RequirementDocumentRepository {
    /// 创建新需求文档
    pub async fn create(
        db: &DatabaseConnection,
        project_id: Uuid,
        title: String,
        content: String,
        document_type: String,
    ) -> Result<requirement_document::Model> {
        let now = chrono::Utc::now().into();
        let document_id = Uuid::new_v4();
        
        let document = requirement_document::ActiveModel {
            document_id: Set(document_id),
            project_id: Set(project_id),
            title: Set(title),
            content: Set(content),
            document_type: Set(document_type),
            priority: Set("medium".to_string()),
            version: Set("1.0".to_string()),
            llm_processed: Set(false),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };
        
        let _result = requirement_document::Entity::insert(document).exec(db).await?;
        
        // 获取插入的文档
        requirement_document::Entity::find_by_id(document_id)
            .one(db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("RequirementDocument", document_id))
    }
    
    /// 根据ID查找需求文档
    pub async fn find_by_id(db: &DatabaseConnection, document_id: Uuid) -> Result<Option<requirement_document::Model>> {
        requirement_document::Entity::find_by_id(document_id)
            .one(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据项目ID查找需求文档
    pub async fn find_by_project(db: &DatabaseConnection, project_id: Uuid) -> Result<Vec<requirement_document::Model>> {
        requirement_document::Entity::find()
            .filter(requirement_document::Column::ProjectId.eq(project_id))
            .all(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据文档类型查找需求文档
    pub async fn find_by_type(db: &DatabaseConnection, project_id: Uuid, document_type: &str) -> Result<Vec<requirement_document::Model>> {
        requirement_document::Entity::find()
            .filter(requirement_document::Column::ProjectId.eq(project_id))
            .filter(requirement_document::Column::DocumentType.eq(document_type))
            .all(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 查找未处理的需求文档
    pub async fn find_unprocessed(db: &DatabaseConnection, project_id: Uuid) -> Result<Vec<requirement_document::Model>> {
        requirement_document::Entity::find()
            .filter(requirement_document::Column::ProjectId.eq(project_id))
            .filter(requirement_document::Column::LlmProcessed.eq(false))
            .all(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新需求文档内容
    pub async fn update_content(
        db: &DatabaseConnection,
        document_id: Uuid,
        title: Option<String>,
        content: Option<String>,
        priority: Option<String>,
    ) -> Result<requirement_document::Model> {
        let document = requirement_document::Entity::find_by_id(document_id)
            .one(db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("RequirementDocument", document_id))?;
        
        let mut document: requirement_document::ActiveModel = document.into();
        
        if let Some(new_title) = title {
            document.title = Set(new_title);
        }
        
        if let Some(new_content) = content {
            document.content = Set(new_content);
        }
        
        if let Some(new_priority) = priority {
            document.priority = Set(new_priority);
        }
        
        document.updated_at = Set(chrono::Utc::now().into());
        
        document.update(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新LLM处理状态
    pub async fn update_llm_processing(
        db: &DatabaseConnection,
        document_id: Uuid,
        structured_content: String,
        processing_session_id: Uuid,
    ) -> Result<requirement_document::Model> {
        let document = requirement_document::Entity::find_by_id(document_id)
            .one(db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("RequirementDocument", document_id))?;
        
        let now = chrono::Utc::now().into();
        let mut document: requirement_document::ActiveModel = document.into();
        
        document.llm_processed = Set(true);
        document.structured_content = Set(Some(structured_content));
        document.processing_session_id = Set(Some(processing_session_id));
        document.processed_at = Set(Some(now));
        document.updated_at = Set(now);
        
        document.update(db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除需求文档
    pub async fn delete(db: &DatabaseConnection, document_id: Uuid) -> Result<()> {
        requirement_document::Entity::delete_by_id(document_id)
            .exec(db)
            .await?;
        
        Ok(())
    }
}