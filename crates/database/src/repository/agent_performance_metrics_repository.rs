//! Agent性能指标仓储实现

use crate::{entities::agent_performance_metrics, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder};
use uuid::Uuid;

/// Agent性能指标仓储
pub struct AgentPerformanceMetricsRepository {
    db: DatabaseConnection,
}

/// 创建Agent性能指标的数据结构
#[derive(Debug, Clone)]
pub struct CreateAgentPerformanceMetricsData {
    pub agent_id: Uuid,
    pub period_start: chrono::DateTime<chrono::FixedOffset>,
    pub period_end: chrono::DateTime<chrono::FixedOffset>,
    pub tasks_completed: i32,
    pub tasks_successful: i32,
    pub avg_completion_time: f64,
    pub avg_code_quality: f64,
    pub skill_improvements: serde_json::Value,
}

impl AgentPerformanceMetricsRepository {
    /// 创建新的Agent性能指标仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的性能指标
    pub async fn create(&self, metrics_data: CreateAgentPerformanceMetricsData) -> Result<agent_performance_metrics::Model> {
        let now = chrono::Utc::now().into();
        let metrics_id = Uuid::new_v4();
        
        let metrics = agent_performance_metrics::ActiveModel {
            metrics_id: Set(metrics_id),
            agent_id: Set(metrics_data.agent_id),
            period_start: Set(metrics_data.period_start),
            period_end: Set(metrics_data.period_end),
            tasks_completed: Set(metrics_data.tasks_completed),
            tasks_successful: Set(metrics_data.tasks_successful),
            avg_completion_time: Set(metrics_data.avg_completion_time),
            avg_code_quality: Set(metrics_data.avg_code_quality),
            skill_improvements: Set(metrics_data.skill_improvements),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = agent_performance_metrics::Entity::insert(metrics).exec(&self.db).await?;
        
        agent_performance_metrics::Entity::find_by_id(metrics_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("AgentPerformanceMetrics", metrics_id))
    }
    
    /// 根据ID查找性能指标
    pub async fn find_by_id(&self, metrics_id: Uuid) -> Result<Option<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find_by_id(metrics_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据Agent ID查找性能指标
    pub async fn find_by_agent_id(&self, agent_id: Uuid) -> Result<Vec<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find()
            .filter(agent_performance_metrics::Column::AgentId.eq(agent_id))
            .order_by_desc(agent_performance_metrics::Column::PeriodEnd)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据Agent ID和时间范围查找性能指标
    pub async fn find_by_agent_and_period(
        &self,
        agent_id: Uuid,
        start_date: chrono::DateTime<chrono::FixedOffset>,
        end_date: chrono::DateTime<chrono::FixedOffset>,
    ) -> Result<Vec<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find()
            .filter(agent_performance_metrics::Column::AgentId.eq(agent_id))
            .filter(agent_performance_metrics::Column::PeriodStart.gte(start_date))
            .filter(agent_performance_metrics::Column::PeriodEnd.lte(end_date))
            .order_by_asc(agent_performance_metrics::Column::PeriodStart)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取Agent的最新性能指标
    pub async fn find_latest_by_agent_id(&self, agent_id: Uuid) -> Result<Option<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find()
            .filter(agent_performance_metrics::Column::AgentId.eq(agent_id))
            .order_by_desc(agent_performance_metrics::Column::PeriodEnd)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 查找特定时间段的所有Agent性能指标
    pub async fn find_by_period(
        &self,
        start_date: chrono::DateTime<chrono::FixedOffset>,
        end_date: chrono::DateTime<chrono::FixedOffset>,
    ) -> Result<Vec<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find()
            .filter(agent_performance_metrics::Column::PeriodStart.gte(start_date))
            .filter(agent_performance_metrics::Column::PeriodEnd.lte(end_date))
            .order_by_desc(agent_performance_metrics::Column::AvgCodeQuality)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取Agent的性能趋势数据
    pub async fn get_performance_trend(
        &self,
        agent_id: Uuid,
        limit: u64,
    ) -> Result<Vec<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find()
            .filter(agent_performance_metrics::Column::AgentId.eq(agent_id))
            .order_by_desc(agent_performance_metrics::Column::PeriodEnd)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 获取表现最佳的Agent列表
    pub async fn find_top_performers(
        &self,
        period_start: chrono::DateTime<chrono::FixedOffset>,
        period_end: chrono::DateTime<chrono::FixedOffset>,
        limit: u64,
    ) -> Result<Vec<agent_performance_metrics::Model>> {
        agent_performance_metrics::Entity::find()
            .filter(agent_performance_metrics::Column::PeriodStart.gte(period_start))
            .filter(agent_performance_metrics::Column::PeriodEnd.lte(period_end))
            .order_by_desc(agent_performance_metrics::Column::AvgCodeQuality)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新性能指标
    pub async fn update_metrics(
        &self,
        metrics_id: Uuid,
        tasks_completed: i32,
        tasks_successful: i32,
        avg_completion_time: f64,
        avg_code_quality: f64,
    ) -> Result<agent_performance_metrics::Model> {
        let metrics = agent_performance_metrics::Entity::find_by_id(metrics_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("AgentPerformanceMetrics", metrics_id))?;
        
        let mut metrics: agent_performance_metrics::ActiveModel = metrics.into();
        metrics.tasks_completed = Set(tasks_completed);
        metrics.tasks_successful = Set(tasks_successful);
        metrics.avg_completion_time = Set(avg_completion_time);
        metrics.avg_code_quality = Set(avg_code_quality);
        
        metrics.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 更新技能提升数据
    pub async fn update_skill_improvements(
        &self,
        metrics_id: Uuid,
        skill_improvements: serde_json::Value,
    ) -> Result<agent_performance_metrics::Model> {
        let metrics = agent_performance_metrics::Entity::find_by_id(metrics_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("AgentPerformanceMetrics", metrics_id))?;
        
        let mut metrics: agent_performance_metrics::ActiveModel = metrics.into();
        metrics.skill_improvements = Set(skill_improvements);
        
        metrics.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 计算Agent在指定时期的汇总性能
    pub async fn calculate_aggregate_performance(
        &self,
        agent_id: Uuid,
        start_date: chrono::DateTime<chrono::FixedOffset>,
        end_date: chrono::DateTime<chrono::FixedOffset>,
    ) -> Result<Option<(i32, i32, f64, f64)>> {
        let metrics_list = self.find_by_agent_and_period(agent_id, start_date, end_date).await?;
        
        if metrics_list.is_empty() {
            return Ok(None);
        }
        
        let total_completed: i32 = metrics_list.iter().map(|m| m.tasks_completed).sum();
        let total_successful: i32 = metrics_list.iter().map(|m| m.tasks_successful).sum();
        let avg_completion_time: f64 = metrics_list.iter().map(|m| m.avg_completion_time).sum::<f64>() / metrics_list.len() as f64;
        let avg_code_quality: f64 = metrics_list.iter().map(|m| m.avg_code_quality).sum::<f64>() / metrics_list.len() as f64;
        
        Ok(Some((total_completed, total_successful, avg_completion_time, avg_code_quality)))
    }
    
    /// 删除性能指标
    pub async fn delete(&self, metrics_id: Uuid) -> Result<()> {
        agent_performance_metrics::Entity::delete_by_id(metrics_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 删除指定Agent的所有性能指标
    pub async fn delete_by_agent_id(&self, agent_id: Uuid) -> Result<()> {
        agent_performance_metrics::Entity::delete_many()
            .filter(agent_performance_metrics::Column::AgentId.eq(agent_id))
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
    async fn test_create_agent_performance_metrics() {
        let db = setup_test_db().await;
        let repo = AgentPerformanceMetricsRepository::new(db);
        
        let now = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
        let period_start = now - chrono::Duration::days(7);
        
        let metrics_data = CreateAgentPerformanceMetricsData {
            agent_id: Uuid::new_v4(),
            period_start,
            period_end: now,
            tasks_completed: 10,
            tasks_successful: 9,
            avg_completion_time: 4.5,
            avg_code_quality: 8.2,
            skill_improvements: serde_json::json!({"rust": 2, "typescript": 1}),
        };
        
        let metrics = repo.create(metrics_data).await.unwrap();
        
        assert_eq!(metrics.tasks_completed, 10);
        assert_eq!(metrics.tasks_successful, 9);
        assert_eq!(metrics.avg_completion_time, 4.5);
        assert_eq!(metrics.avg_code_quality, 8.2);
    }

    #[tokio::test]
    async fn test_find_by_agent_id() {
        let db = setup_test_db().await;
        let repo = AgentPerformanceMetricsRepository::new(db.clone());
        
        let agent_id = Uuid::new_v4();
        let now = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
        
        let metrics_data = CreateAgentPerformanceMetricsData {
            agent_id,
            period_start: now - chrono::Duration::days(7),
            period_end: now,
            tasks_completed: 5,
            tasks_successful: 4,
            avg_completion_time: 3.0,
            avg_code_quality: 7.5,
            skill_improvements: serde_json::json!({}),
        };
        
        let _created_metrics = repo.create(metrics_data).await.unwrap();
        
        let metrics_list = repo.find_by_agent_id(agent_id).await.unwrap();
        assert_eq!(metrics_list.len(), 1);
        assert_eq!(metrics_list[0].agent_id, agent_id);
    }

    #[tokio::test]
    async fn test_calculate_aggregate_performance() {
        let db = setup_test_db().await;
        let repo = AgentPerformanceMetricsRepository::new(db.clone());
        
        let agent_id = Uuid::new_v4();
        let now = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
        
        // 创建两个时期的性能指标
        let metrics_data1 = CreateAgentPerformanceMetricsData {
            agent_id,
            period_start: now - chrono::Duration::days(14),
            period_end: now - chrono::Duration::days(7),
            tasks_completed: 5,
            tasks_successful: 4,
            avg_completion_time: 3.0,
            avg_code_quality: 7.0,
            skill_improvements: serde_json::json!({}),
        };
        
        let metrics_data2 = CreateAgentPerformanceMetricsData {
            agent_id,
            period_start: now - chrono::Duration::days(7),
            period_end: now,
            tasks_completed: 10,
            tasks_successful: 9,
            avg_completion_time: 4.0,
            avg_code_quality: 8.0,
            skill_improvements: serde_json::json!({}),
        };
        
        let _metrics1 = repo.create(metrics_data1).await.unwrap();
        let _metrics2 = repo.create(metrics_data2).await.unwrap();
        
        let aggregate = repo.calculate_aggregate_performance(
            agent_id,
            now - chrono::Duration::days(14),
            now,
        ).await.unwrap();
        
        assert!(aggregate.is_some());
        let (total_completed, total_successful, avg_time, avg_quality) = aggregate.unwrap();
        assert_eq!(total_completed, 15);
        assert_eq!(total_successful, 13);
        assert_eq!(avg_time, 3.5);
        assert_eq!(avg_quality, 7.5);
    }
}