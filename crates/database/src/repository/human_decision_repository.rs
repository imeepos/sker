//! 人工决策仓储实现

use crate::{entities::human_decision, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// 人工决策仓储
pub struct HumanDecisionRepository {
    db: DatabaseConnection,
}

/// 创建人工决策的数据结构
#[derive(Debug, Clone)]
pub struct CreateHumanDecisionData {
    pub conflict_id: Uuid,
    pub decision_maker_id: Uuid,
    pub decision_type: String,
    pub decision_content: String,
    pub reasoning: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

impl HumanDecisionRepository {
    /// 创建新的人工决策仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的人工决策
    pub async fn create(&self, decision_data: CreateHumanDecisionData) -> Result<human_decision::Model> {
        let now = chrono::Utc::now().into();
        let decision_id = Uuid::new_v4();
        
        let decision = human_decision::ActiveModel {
            decision_id: Set(decision_id),
            conflict_id: Set(decision_data.conflict_id),
            decision_maker_id: Set(decision_data.decision_maker_id),
            decision_type: Set(decision_data.decision_type),
            decision_content: Set(decision_data.decision_content),
            reasoning: Set(decision_data.reasoning),
            metadata: Set(decision_data.metadata),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = human_decision::Entity::insert(decision).exec(&self.db).await?;
        
        human_decision::Entity::find_by_id(decision_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("HumanDecision", decision_id))
    }
    
    /// 根据ID查找人工决策
    pub async fn find_by_id(&self, decision_id: Uuid) -> Result<Option<human_decision::Model>> {
        human_decision::Entity::find_by_id(decision_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据冲突ID查找决策
    pub async fn find_by_conflict_id(&self, conflict_id: Uuid) -> Result<Vec<human_decision::Model>> {
        human_decision::Entity::find()
            .filter(human_decision::Column::ConflictId.eq(conflict_id))
            .order_by_desc(human_decision::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据决策制定者ID查找决策
    pub async fn find_by_decision_maker_id(&self, decision_maker_id: Uuid) -> Result<Vec<human_decision::Model>> {
        human_decision::Entity::find()
            .filter(human_decision::Column::DecisionMakerId.eq(decision_maker_id))
            .order_by_desc(human_decision::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据决策类型查找决策
    pub async fn find_by_decision_type(&self, decision_type: &str) -> Result<Vec<human_decision::Model>> {
        human_decision::Entity::find()
            .filter(human_decision::Column::DecisionType.eq(decision_type))
            .order_by_desc(human_decision::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新决策推理
    pub async fn update_reasoning(
        &self,
        decision_id: Uuid,
        reasoning: String,
    ) -> Result<human_decision::Model> {
        let decision = human_decision::Entity::find_by_id(decision_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("HumanDecision", decision_id))?;
        
        let mut decision: human_decision::ActiveModel = decision.into();
        decision.reasoning = Set(Some(reasoning));
        
        decision.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新决策元数据
    pub async fn update_metadata(
        &self,
        decision_id: Uuid,
        metadata: serde_json::Value,
    ) -> Result<human_decision::Model> {
        let decision = human_decision::Entity::find_by_id(decision_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("HumanDecision", decision_id))?;
        
        let mut decision: human_decision::ActiveModel = decision.into();
        decision.metadata = Set(Some(metadata));
        
        decision.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除人工决策
    pub async fn delete(&self, decision_id: Uuid) -> Result<()> {
        human_decision::Entity::delete_by_id(decision_id)
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
    async fn test_create_human_decision() {
        let db = setup_test_db().await;
        let repo = HumanDecisionRepository::new(db);
        
        let decision_data = CreateHumanDecisionData {
            conflict_id: Uuid::new_v4(),
            decision_maker_id: Uuid::new_v4(),
            decision_type: "code_merge".to_string(),
            decision_content: "选择版本A的实现".to_string(),
            reasoning: Some("版本A的性能更好".to_string()),
            metadata: Some(serde_json::json!({"priority": "high"})),
        };
        
        let decision = repo.create(decision_data).await.unwrap();
        
        assert_eq!(decision.decision_type, "code_merge");
        assert_eq!(decision.decision_content, "选择版本A的实现");
    }

    #[tokio::test]
    async fn test_find_by_conflict_id() {
        let db = setup_test_db().await;
        let repo = HumanDecisionRepository::new(db.clone());
        
        let conflict_id = Uuid::new_v4();
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            decision_maker_id: Uuid::new_v4(),
            decision_type: "code_merge".to_string(),
            decision_content: "选择版本A的实现".to_string(),
            reasoning: None,
            metadata: None,
        };
        
        let _created_decision = repo.create(decision_data).await.unwrap();
        
        let decisions = repo.find_by_conflict_id(conflict_id).await.unwrap();
        assert_eq!(decisions.len(), 1);
        assert_eq!(decisions[0].conflict_id, conflict_id);
    }
}