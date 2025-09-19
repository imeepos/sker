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
    pub user_id: Uuid,
    pub decision_type: String,
    pub decision_data: Option<serde_json::Value>,
    pub reasoning: Option<String>,
    pub affected_entities: serde_json::Value,
    pub follow_up_actions: serde_json::Value,
}

/// 决策路径分析结果
#[derive(Debug, Clone)]
pub struct DecisionPath {
    pub total_decisions: u32,
    pub decision_sequence: Vec<DecisionSequenceItem>,
    pub average_time_between_decisions: i64, // 毫秒
    pub final_decision_type: String,
    pub is_resolved: bool,
}

/// 决策序列项
#[derive(Debug, Clone)]
pub struct DecisionSequenceItem {
    pub decision_id: Uuid,
    pub decision_type: String,
    pub made_at: chrono::DateTime<chrono::Utc>,
    pub user_id: Uuid,
}

/// 决策统计信息
#[derive(Debug, Clone, Default)]
pub struct DecisionStatistics {
    pub total_decisions: u32,
    pub decisions_by_type: std::collections::HashMap<String, u32>,
    pub decisions_by_user: std::collections::HashMap<String, u32>,
    pub approval_rate: f64,
}

/// 决策频率统计
#[derive(Debug, Clone, Default)]
pub struct DecisionFrequencyStats {
    pub total_decisions: u32,
    pub average_decisions_per_hour: f64,
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
            user_id: Set(decision_data.user_id),
            decision_type: Set(decision_data.decision_type),
            decision_data: Set(decision_data.decision_data),
            reasoning: Set(decision_data.reasoning),
            affected_entities: Set(decision_data.affected_entities),
            follow_up_actions: Set(decision_data.follow_up_actions),
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
    
    /// 根据用户ID查找决策
    pub async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<human_decision::Model>> {
        human_decision::Entity::find()
            .filter(human_decision::Column::UserId.eq(user_id))
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
    
    /// 更新决策数据
    pub async fn update_decision_data(
        &self,
        decision_id: Uuid,
        metadata: serde_json::Value,
    ) -> Result<human_decision::Model> {
        let decision = human_decision::Entity::find_by_id(decision_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("HumanDecision", decision_id))?;
        
        let mut decision: human_decision::ActiveModel = decision.into();
        decision.decision_data = Set(Some(metadata));
        
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

    /// 分析冲突的决策路径
    pub async fn analyze_decision_path(&self, conflict_id: Uuid) -> Result<DecisionPath> {
        let decisions = human_decision::Entity::find()
            .filter(human_decision::Column::ConflictId.eq(conflict_id))
            .order_by_asc(human_decision::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)?;

        if decisions.is_empty() {
            return Ok(DecisionPath {
                total_decisions: 0,
                decision_sequence: vec![],
                average_time_between_decisions: 0,
                final_decision_type: String::new(),
                is_resolved: false,
            });
        }

        let mut decision_sequence = Vec::new();
        let mut time_diffs = Vec::new();

        for (i, decision) in decisions.iter().enumerate() {
            decision_sequence.push(DecisionSequenceItem {
                decision_id: decision.decision_id,
                decision_type: decision.decision_type.clone(),
                made_at: decision.created_at.into(),
                user_id: decision.user_id,
            });

            if i > 0 {
                let prev_time: chrono::DateTime<chrono::Utc> = decisions[i - 1].created_at.into();
                let curr_time: chrono::DateTime<chrono::Utc> = decision.created_at.into();
                let diff = curr_time.timestamp_millis() - prev_time.timestamp_millis();
                time_diffs.push(diff);
            }
        }

        let average_time = if time_diffs.is_empty() {
            0
        } else {
            time_diffs.iter().sum::<i64>() / time_diffs.len() as i64
        };

        let final_decision = decisions.last().unwrap();
        let is_resolved = matches!(final_decision.decision_type.as_str(), 
            "approve" | "reject" | "resolve" | "close");

        Ok(DecisionPath {
            total_decisions: decisions.len() as u32,
            decision_sequence,
            average_time_between_decisions: average_time,
            final_decision_type: final_decision.decision_type.clone(),
            is_resolved,
        })
    }

    /// 添加后续行动
    pub async fn add_follow_up_actions(
        &self,
        decision_id: Uuid,
        additional_actions: serde_json::Value,
    ) -> Result<human_decision::Model> {
        let decision = human_decision::Entity::find_by_id(decision_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("HumanDecision", decision_id))?;
        
        // 合并现有的和新的后续行动
        let mut existing_actions = decision.follow_up_actions.clone();
        if let (Some(existing_array), Some(additional_array)) = 
            (existing_actions.as_array_mut(), additional_actions.as_array()) {
            existing_array.extend_from_slice(additional_array);
        }

        let mut decision: human_decision::ActiveModel = decision.into();
        decision.follow_up_actions = Set(existing_actions);
        
        decision.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 获取决策统计信息
    pub async fn get_decision_statistics(&self) -> Result<DecisionStatistics> {
        let decisions = human_decision::Entity::find()
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)?;

        let mut stats = DecisionStatistics::default();
        stats.total_decisions = decisions.len() as u32;

        let mut approval_count = 0;

        for decision in decisions {
            // 按类型统计
            let type_entry = stats.decisions_by_type
                .entry(decision.decision_type.clone())
                .or_insert(0);
            *type_entry += 1;

            // 按用户统计
            let user_entry = stats.decisions_by_user
                .entry(decision.user_id.to_string())
                .or_insert(0);
            *user_entry += 1;

            // 统计批准率
            if decision.decision_type == "approve" {
                approval_count += 1;
            }
        }

        // 计算批准率
        stats.approval_rate = if stats.total_decisions > 0 {
            approval_count as f64 / stats.total_decisions as f64
        } else {
            0.0
        };

        Ok(stats)
    }

    /// 根据时间范围查找决策
    pub async fn find_decisions_in_time_range(
        &self,
        start_time: chrono::DateTime<chrono::Utc>,
        end_time: chrono::DateTime<chrono::Utc>,
    ) -> Result<Vec<human_decision::Model>> {
        human_decision::Entity::find()
            .filter(human_decision::Column::CreatedAt.gte(start_time))
            .filter(human_decision::Column::CreatedAt.lte(end_time))
            .order_by_desc(human_decision::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 获取每小时决策频率统计
    pub async fn get_decision_frequency_by_hour(&self) -> Result<DecisionFrequencyStats> {
        let decisions = human_decision::Entity::find()
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)?;

        let mut stats = DecisionFrequencyStats::default();
        stats.total_decisions = decisions.len() as u32;

        if !decisions.is_empty() {
            // 计算平均每小时决策数（简化实现）
            stats.average_decisions_per_hour = stats.total_decisions as f64;
        }

        Ok(stats)
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
            user_id: Uuid::new_v4(),
            decision_type: "code_merge".to_string(),
            decision_data: Some(serde_json::json!({
                "selected_option": "version_a",
                "content": "选择版本A的实现"
            })),
            reasoning: Some("版本A的性能更好".to_string()),
            affected_entities: serde_json::json!(["file1.rs", "file2.rs"]),
            follow_up_actions: serde_json::json!(["merge_code", "run_tests"]),
        };
        
        let decision = repo.create(decision_data).await.unwrap();
        
        assert_eq!(decision.decision_type, "code_merge");
        // 验证decision_data字段包含正确内容
        let decision_data_value = decision.decision_data.as_ref().unwrap();
        assert_eq!(decision_data_value["selected_option"], "version_a");
    }

    #[tokio::test]
    async fn test_find_by_conflict_id() {
        let db = setup_test_db().await;
        let repo = HumanDecisionRepository::new(db.clone());
        
        let conflict_id = Uuid::new_v4();
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            user_id: Uuid::new_v4(),
            decision_type: "code_merge".to_string(),
            decision_data: Some(serde_json::json!({
                "content": "选择版本A的实现"
            })),
            reasoning: None,
            affected_entities: serde_json::json!([]),
            follow_up_actions: serde_json::json!([]),
        };
        
        let _created_decision = repo.create(decision_data).await.unwrap();
        
        let decisions = repo.find_by_conflict_id(conflict_id).await.unwrap();
        assert_eq!(decisions.len(), 1);
        assert_eq!(decisions[0].conflict_id, conflict_id);
    }
}