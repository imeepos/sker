//! 冲突处理仓储实现

use crate::entities::{
    conflict::{self, Entity as Conflict, ActiveModel, Model, ConflictType, ConflictSeverity, ConflictStatus},
    human_decision::{self, Entity as HumanDecision},
};
use crate::error::{DatabaseError, Result};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait,
    QueryFilter, QueryOrder, PaginatorTrait,
};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 冲突处理仓储
pub struct ConflictRepository {
    db: DatabaseConnection,
}

impl ConflictRepository {
    /// 创建新的冲突仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的冲突
    pub async fn create(&self, conflict_data: CreateConflictData) -> Result<Model> {
        let conflict = ActiveModel {
            conflict_id: Set(Uuid::new_v4()),
            conflict_type: Set(conflict_data.conflict_type.to_string()),
            severity: Set(conflict_data.severity.to_string()),
            title: Set(conflict_data.title),
            description: Set(conflict_data.description),
            related_entities: Set(conflict_data.related_entities),
            affected_tasks: Set(conflict_data.affected_tasks),
            affected_agents: Set(conflict_data.affected_agents),
            status: Set(ConflictStatus::Detected.to_string()),
            escalated_to_human: Set(false),
            assigned_user_id: Set(None),
            resolution_strategy: Set(None),
            resolution_note: Set(None),
            auto_resolved: Set(false),
            detected_at: Set(chrono::Utc::now().into()),
            escalated_at: Set(None),
            resolved_at: Set(None),
        };

        conflict.insert(&self.db).await.map_err(DatabaseError::from)
    }

    /// 根据ID查找冲突
    pub async fn find_by_id(&self, conflict_id: Uuid) -> Result<Option<Model>> {
        Conflict::find_by_id(conflict_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据类型查找冲突
    pub async fn find_by_type(&self, conflict_type: ConflictType) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::ConflictType.eq(conflict_type.to_string()))
            .order_by_desc(conflict::Column::DetectedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据严重性查找冲突
    pub async fn find_by_severity(&self, severity: ConflictSeverity) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::Severity.eq(severity.to_string()))
            .order_by_desc(conflict::Column::DetectedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 根据状态查找冲突
    pub async fn find_by_status(&self, status: ConflictStatus) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::Status.eq(status.to_string()))
            .order_by_desc(conflict::Column::DetectedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找未解决的冲突
    pub async fn find_unresolved(&self) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::Status.ne(ConflictStatus::Resolved.to_string()))
            .filter(conflict::Column::Status.ne(ConflictStatus::Ignored.to_string()))
            .order_by_desc(conflict::Column::Severity)
            .order_by_desc(conflict::Column::DetectedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找需要人工干预的冲突
    pub async fn find_requiring_human_intervention(&self) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::EscalatedToHuman.eq(true))
            .filter(conflict::Column::Status.eq(ConflictStatus::Escalated.to_string()))
            .order_by_desc(conflict::Column::Severity)
            .order_by_desc(conflict::Column::EscalatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找分配给用户的冲突
    pub async fn find_assigned_to_user(&self, user_id: Uuid) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::AssignedUserId.eq(user_id))
            .filter(conflict::Column::Status.ne(ConflictStatus::Resolved.to_string()))
            .order_by_desc(conflict::Column::Severity)
            .order_by_desc(conflict::Column::EscalatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 上报冲突给人工处理
    pub async fn escalate_to_human(
        &self,
        conflict_id: Uuid,
        assigned_user_id: Option<Uuid>
    ) -> Result<Model> {
        let conflict = self.find_by_id(conflict_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Conflict", conflict_id.to_string()))?;

        let mut conflict_active: ActiveModel = conflict.into();
        conflict_active.status = Set(ConflictStatus::Escalated.to_string());
        conflict_active.escalated_to_human = Set(true);
        conflict_active.assigned_user_id = Set(assigned_user_id);
        conflict_active.escalated_at = Set(Some(chrono::Utc::now().into()));

        conflict_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 解决冲突
    pub async fn resolve_conflict(
        &self,
        conflict_id: Uuid,
        resolution_strategy: String,
        resolution_note: Option<String>,
        auto_resolved: bool
    ) -> Result<Model> {
        let conflict = self.find_by_id(conflict_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Conflict", conflict_id.to_string()))?;

        let mut conflict_active: ActiveModel = conflict.into();
        conflict_active.status = Set(ConflictStatus::Resolved.to_string());
        conflict_active.resolution_strategy = Set(Some(resolution_strategy));
        conflict_active.resolution_note = Set(resolution_note);
        conflict_active.auto_resolved = Set(auto_resolved);
        conflict_active.resolved_at = Set(Some(chrono::Utc::now().into()));

        conflict_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 忽略冲突
    pub async fn ignore_conflict(&self, conflict_id: Uuid, reason: String) -> Result<Model> {
        let conflict = self.find_by_id(conflict_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Conflict", conflict_id.to_string()))?;

        let mut conflict_active: ActiveModel = conflict.into();
        conflict_active.status = Set(ConflictStatus::Ignored.to_string());
        conflict_active.resolution_note = Set(Some(format!("忽略原因: {}", reason)));
        conflict_active.resolved_at = Set(Some(chrono::Utc::now().into()));

        conflict_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 更新冲突状态
    pub async fn update_status(&self, conflict_id: Uuid, status: ConflictStatus) -> Result<Model> {
        let conflict = self.find_by_id(conflict_id).await?
            .ok_or_else(|| DatabaseError::entity_not_found("Conflict", conflict_id.to_string()))?;

        let mut conflict_active: ActiveModel = conflict.into();
        conflict_active.status = Set(status.to_string());

        conflict_active.update(&self.db).await.map_err(DatabaseError::from)
    }

    /// 分页查询冲突
    pub async fn find_with_pagination(
        &self,
        page: u64,
        page_size: u64,
        filter: Option<ConflictFilter>
    ) -> Result<(Vec<Model>, u64)> {
        let mut query = Conflict::find();

        if let Some(filter) = filter {
            if let Some(conflict_type) = filter.conflict_type {
                query = query.filter(conflict::Column::ConflictType.eq(conflict_type.to_string()));
            }
            
            if let Some(severity) = filter.severity {
                query = query.filter(conflict::Column::Severity.eq(severity.to_string()));
            }
            
            if let Some(status) = filter.status {
                query = query.filter(conflict::Column::Status.eq(status.to_string()));
            }
            
            if let Some(escalated_to_human) = filter.escalated_to_human {
                query = query.filter(conflict::Column::EscalatedToHuman.eq(escalated_to_human));
            }
        }

        let paginator = query
            .order_by_desc(conflict::Column::Severity)
            .order_by_desc(conflict::Column::DetectedAt)
            .paginate(&self.db, page_size);

        let total_pages = paginator.num_pages().await.map_err(DatabaseError::from)?;
        let conflicts = paginator.fetch_page(page).await.map_err(DatabaseError::from)?;

        Ok((conflicts, total_pages))
    }

    /// 获取冲突统计信息
    pub async fn get_conflict_statistics(&self) -> Result<ConflictStatistics> {
        let all_conflicts = Conflict::find().all(&self.db).await.map_err(DatabaseError::from)?;

        let total_conflicts = all_conflicts.len() as i64;
        let resolved_conflicts = all_conflicts.iter()
            .filter(|c| c.status == ConflictStatus::Resolved.to_string())
            .count() as i64;
        let auto_resolved = all_conflicts.iter()
            .filter(|c| c.auto_resolved)
            .count() as i64;
        let escalated_conflicts = all_conflicts.iter()
            .filter(|c| c.escalated_to_human)
            .count() as i64;

        // 按类型统计
        let by_type = {
            let mut type_stats = std::collections::HashMap::new();
            for conflict in &all_conflicts {
                *type_stats.entry(conflict.conflict_type.clone()).or_insert(0) += 1;
            }
            type_stats
        };

        // 按严重性统计
        let by_severity = {
            let mut severity_stats = std::collections::HashMap::new();
            for conflict in &all_conflicts {
                *severity_stats.entry(conflict.severity.clone()).or_insert(0) += 1;
            }
            severity_stats
        };

        let resolution_rate = if total_conflicts > 0 {
            resolved_conflicts as f64 / total_conflicts as f64
        } else {
            0.0
        };

        let auto_resolution_rate = if total_conflicts > 0 {
            auto_resolved as f64 / total_conflicts as f64
        } else {
            0.0
        };

        Ok(ConflictStatistics {
            total_conflicts,
            resolved_conflicts,
            auto_resolved,
            escalated_conflicts,
            resolution_rate,
            auto_resolution_rate,
            by_type,
            by_severity,
        })
    }

    /// 查找影响特定任务的冲突
    pub async fn find_affecting_task(&self, task_id: &str) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::AffectedTasks.contains(&format!("\"{}\"", task_id)))
            .filter(conflict::Column::Status.ne(ConflictStatus::Resolved.to_string()))
            .order_by_desc(conflict::Column::Severity)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找影响特定Agent的冲突
    pub async fn find_affecting_agent(&self, agent_id: &str) -> Result<Vec<Model>> {
        Conflict::find()
            .filter(conflict::Column::AffectedAgents.contains(&format!("\"{}\"", agent_id)))
            .filter(conflict::Column::Status.ne(ConflictStatus::Resolved.to_string()))
            .order_by_desc(conflict::Column::Severity)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }

    /// 查找冲突及其相关决策
    pub async fn find_with_decisions(&self, conflict_id: Uuid) -> Result<Option<ConflictWithDecisions>> {
        let conflict = self.find_by_id(conflict_id).await?;
        
        if let Some(conflict) = conflict {
            let decisions = HumanDecision::find()
                .filter(human_decision::Column::ConflictId.eq(conflict_id))
                .order_by_desc(human_decision::Column::CreatedAt)
                .all(&self.db)
                .await
                .map_err(DatabaseError::from)?;

            Ok(Some(ConflictWithDecisions {
                conflict,
                decisions,
            }))
        } else {
            Ok(None)
        }
    }

    /// 删除冲突
    pub async fn delete(&self, conflict_id: Uuid) -> Result<()> {
        Conflict::delete_by_id(conflict_id)
            .exec(&self.db)
            .await
            .map_err(DatabaseError::from)?;
        
        Ok(())
    }
}

/// 创建冲突的数据结构
#[derive(Debug, Clone)]
pub struct CreateConflictData {
    pub conflict_type: ConflictType,
    pub severity: ConflictSeverity,
    pub title: String,
    pub description: String,
    pub related_entities: JsonValue,
    pub affected_tasks: JsonValue,
    pub affected_agents: JsonValue,
}

/// 冲突查询过滤器
#[derive(Debug, Clone)]
pub struct ConflictFilter {
    pub conflict_type: Option<ConflictType>,
    pub severity: Option<ConflictSeverity>,
    pub status: Option<ConflictStatus>,
    pub escalated_to_human: Option<bool>,
}

/// 冲突统计信息
#[derive(Debug, Clone)]
pub struct ConflictStatistics {
    pub total_conflicts: i64,
    pub resolved_conflicts: i64,
    pub auto_resolved: i64,
    pub escalated_conflicts: i64,
    pub resolution_rate: f64,
    pub auto_resolution_rate: f64,
    pub by_type: std::collections::HashMap<String, i64>,
    pub by_severity: std::collections::HashMap<String, i64>,
}

/// 冲突及其相关决策
#[derive(Debug, Clone)]
pub struct ConflictWithDecisions {
    pub conflict: Model,
    pub decisions: Vec<human_decision::Model>,
}