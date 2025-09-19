//! 代码审查仓储实现

use crate::{entities::code_review, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// 代码审查仓储
pub struct CodeReviewRepository {
    db: DatabaseConnection,
}

/// 创建代码审查的数据结构
#[derive(Debug, Clone)]
pub struct CreateCodeReviewData {
    pub task_id: Uuid,
    pub execution_session_id: Uuid,
    pub reviewer_agent_id: Uuid,
    pub pull_request_url: String,
    pub source_branch: String,
    pub target_branch: String,
    pub review_comments: serde_json::Value,
    pub code_changes: serde_json::Value,
    pub status: String,
    pub decision: Option<String>,
    pub overall_comment: Option<String>,
}

impl CodeReviewRepository {
    /// 创建新的代码审查仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的代码审查
    pub async fn create(&self, review_data: CreateCodeReviewData) -> Result<code_review::Model> {
        let now = chrono::Utc::now().into();
        let review_id = Uuid::new_v4();
        
        let review = code_review::ActiveModel {
            review_id: Set(review_id),
            task_id: Set(review_data.task_id),
            execution_session_id: Set(review_data.execution_session_id),
            reviewer_agent_id: Set(review_data.reviewer_agent_id),
            pull_request_url: Set(review_data.pull_request_url),
            source_branch: Set(review_data.source_branch),
            target_branch: Set(review_data.target_branch),
            review_comments: Set(review_data.review_comments),
            code_changes: Set(review_data.code_changes),
            status: Set(review_data.status),
            decision: Set(review_data.decision),
            overall_comment: Set(review_data.overall_comment),
            created_at: Set(now),
            reviewed_at: Set(None),
            ..Default::default()
        };
        
        let _result = code_review::Entity::insert(review).exec(&self.db).await?;
        
        code_review::Entity::find_by_id(review_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("CodeReview", review_id))
    }
    
    /// 根据ID查找代码审查
    pub async fn find_by_id(&self, review_id: Uuid) -> Result<Option<code_review::Model>> {
        code_review::Entity::find_by_id(review_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据任务ID查找代码审查
    pub async fn find_by_task_id(&self, task_id: Uuid) -> Result<Vec<code_review::Model>> {
        code_review::Entity::find()
            .filter(code_review::Column::TaskId.eq(task_id))
            .order_by_desc(code_review::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据执行会话ID查找代码审查
    pub async fn find_by_execution_session_id(&self, session_id: Uuid) -> Result<Vec<code_review::Model>> {
        code_review::Entity::find()
            .filter(code_review::Column::ExecutionSessionId.eq(session_id))
            .order_by_desc(code_review::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据审查者Agent ID查找代码审查
    pub async fn find_by_reviewer_agent_id(&self, agent_id: Uuid) -> Result<Vec<code_review::Model>> {
        code_review::Entity::find()
            .filter(code_review::Column::ReviewerAgentId.eq(agent_id))
            .order_by_desc(code_review::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据状态查找代码审查
    pub async fn find_by_status(&self, status: &str) -> Result<Vec<code_review::Model>> {
        code_review::Entity::find()
            .filter(code_review::Column::Status.eq(status))
            .order_by_desc(code_review::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新代码审查状态
    pub async fn update_status(
        &self,
        review_id: Uuid,
        status: String,
    ) -> Result<code_review::Model> {
        let review = code_review::Entity::find_by_id(review_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("CodeReview", review_id))?;
        
        let mut review: code_review::ActiveModel = review.into();
        review.status = Set(status.clone());
        review.created_at = Set(chrono::Utc::now().into());
        
        // 如果状态为完成，设置完成时间
        if status == "completed" || status == "approved" || status == "rejected" {
            review.reviewed_at = Set(Some(chrono::Utc::now().into()));
        }
        
        review.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新审查评论
    pub async fn update_review_comments(
        &self,
        review_id: Uuid,
        review_comments: serde_json::Value,
    ) -> Result<code_review::Model> {
        let review = code_review::Entity::find_by_id(review_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("CodeReview", review_id))?;
        
        let mut review: code_review::ActiveModel = review.into();
        review.review_comments = Set(review_comments);
        review.created_at = Set(chrono::Utc::now().into());
        
        review.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新质量评分
    pub async fn update_quality_score(
        &self,
        review_id: Uuid,
        quality_score: f64,
    ) -> Result<code_review::Model> {
        let review = code_review::Entity::find_by_id(review_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("CodeReview", review_id))?;
        
        let mut review: code_review::ActiveModel = review.into();
        // quality_score 字段在新模型中已移除，可以在 overall_comment 中记录
        review.overall_comment = Set(Some(format!("质量评分：{}", quality_score)));
        review.created_at = Set(chrono::Utc::now().into());
        
        review.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 完成代码审查
    pub async fn complete_review(
        &self,
        review_id: Uuid,
        status: String,
        review_comments: serde_json::Value,
        quality_score: f64,
    ) -> Result<code_review::Model> {
        let review = code_review::Entity::find_by_id(review_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("CodeReview", review_id))?;
        
        let mut review: code_review::ActiveModel = review.into();
        review.status = Set(status);
        review.review_comments = Set(review_comments);
        // quality_score 字段在新模型中已移除，可以在 overall_comment 中记录
        review.overall_comment = Set(Some(format!("质量评分：{}", quality_score)));
        review.reviewed_at = Set(Some(chrono::Utc::now().into()));
        review.created_at = Set(chrono::Utc::now().into());
        
        review.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除代码审查
    pub async fn delete(&self, review_id: Uuid) -> Result<()> {
        code_review::Entity::delete_by_id(review_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::migrations::Migrator;
    use sea_orm::Database;

    async fn setup_test_db() -> DatabaseConnection {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        Migrator::up(&db, None).await.unwrap();
        db
    }

    #[tokio::test]
    async fn test_create_code_review() {
        let db = setup_test_db().await;
        let repo = CodeReviewRepository::new(db);
        
        let review_data = CreateCodeReviewData {
            task_id: Uuid::new_v4(),
            execution_session_id: Uuid::new_v4(),
            reviewer_agent_id: Uuid::new_v4(),
            pull_request_url: "https://github.com/owner/repo/pull/123".to_string(),
            source_branch: "feature/new-feature".to_string(),
            target_branch: "main".to_string(),
            review_comments: serde_json::json!({"issues": []}),
            code_changes: serde_json::json!({"files": []}),
            status: "in_progress".to_string(),
            decision: None,
            overall_comment: None,
        };
        
        let review = repo.create(review_data).await.unwrap();
        
        assert_eq!(review.pull_request_url, "https://github.com/owner/repo/pull/123");
        assert_eq!(review.status, "in_progress");
        assert_eq!(review.source_branch, "feature/new-feature");
    }

    #[tokio::test]
    async fn test_find_by_task_id() {
        let db = setup_test_db().await;
        let repo = CodeReviewRepository::new(db.clone());
        
        let task_id = Uuid::new_v4();
        let review_data = CreateCodeReviewData {
            task_id,
            execution_session_id: Uuid::new_v4(),
            reviewer_agent_id: None,
            review_type: "manual".to_string(),
            status: "pending".to_string(),
            review_comments: None,
            code_changes: None,
            quality_score: None,
        };
        
        let _created_review = repo.create(review_data).await.unwrap();
        
        let reviews = repo.find_by_task_id(task_id).await.unwrap();
        assert_eq!(reviews.len(), 1);
        assert_eq!(reviews[0].task_id, task_id);
    }

    #[tokio::test]
    async fn test_complete_review() {
        let db = setup_test_db().await;
        let repo = CodeReviewRepository::new(db.clone());
        
        let review_data = CreateCodeReviewData {
            task_id: Uuid::new_v4(),
            execution_session_id: Uuid::new_v4(),
            reviewer_agent_id: Some(Uuid::new_v4()),
            review_type: "automated".to_string(),
            status: "in_progress".to_string(),
            review_comments: None,
            code_changes: None,
            quality_score: None,
        };
        
        let created_review = repo.create(review_data).await.unwrap();
        
        let comments = serde_json::json!({
            "summary": "代码质量良好",
            "issues": []
        });
        
        let completed_review = repo.complete_review(
            created_review.review_id,
            "approved".to_string(),
            comments,
            9.0,
        ).await.unwrap();
        
        assert_eq!(completed_review.status, "approved");
        assert_eq!(completed_review.quality_score, Some(9.0));
        assert!(completed_review.completed_at.is_some());
    }
}