//! Agent性能指标实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// Agent性能指标实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "agent_performance_metrics")]
pub struct Model {
    /// 指标ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub metrics_id: Uuid,
    
    /// Agent ID
    pub agent_id: Uuid,
    
    /// 计算周期开始时间
    pub period_start: DateTimeWithTimeZone,
    
    /// 计算周期结束时间
    pub period_end: DateTimeWithTimeZone,
    
    /// 完成任务数量
    pub tasks_completed: i32,
    
    /// 成功任务数量
    pub tasks_successful: i32,
    
    /// 平均完成时间（小时）
    pub avg_completion_time: f64,
    
    /// 代码质量平均分
    pub avg_code_quality: f64,
    
    /// 技能提升指标（JSON存储）
    #[sea_orm(column_type = "Json")]
    pub skill_improvements: JsonValue,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// Agent性能指标关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与Agent的关联关系
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AgentId",
        to = "super::agent::Column::AgentId"
    )]
    Agent,
}

/// Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Agent.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// AgentPerformanceMetrics实体的业务方法实现
impl Model {
    /// 计算成功率
    pub fn calculate_success_rate(&self) -> f64 {
        if self.tasks_completed == 0 {
            return 0.0;
        }
        self.tasks_successful as f64 / self.tasks_completed as f64
    }

    /// 计算效率评分（基于完成时间）
    pub fn calculate_efficiency_score(&self) -> f64 {
        if self.tasks_completed == 0 {
            return 0.0;
        }
        
        // 假设标准完成时间为6小时，越快评分越高
        let standard_time = 6.0;
        let efficiency = standard_time / self.avg_completion_time.max(0.1);
        
        // 将效率转换为0-10的评分
        (efficiency * 10.0).min(10.0).max(0.0)
    }

    /// 计算总体绩效评分
    pub fn calculate_overall_performance_score(&self) -> f64 {
        let success_score = self.calculate_success_rate() * 10.0; // 成功率权重40%
        let quality_score = self.avg_code_quality; // 质量权重30%
        let efficiency_score = self.calculate_efficiency_score(); // 效率权重20%
        let skill_score = (self.total_skill_improvements() as f64).min(10.0); // 技能提升权重10%
        
        (success_score * 0.4 + quality_score * 0.3 + efficiency_score * 0.2 + skill_score * 0.1)
            .min(10.0)
            .max(0.0)
    }

    /// 计算技能提升总数
    pub fn total_skill_improvements(&self) -> i32 {
        if let Ok(improvements) = serde_json::from_value::<std::collections::HashMap<String, i32>>(self.skill_improvements.clone()) {
            improvements.values().sum()
        } else {
            0
        }
    }

    /// 获取最大技能提升
    pub fn max_skill_improvement(&self) -> i32 {
        if let Ok(improvements) = serde_json::from_value::<std::collections::HashMap<String, i32>>(self.skill_improvements.clone()) {
            improvements.values().copied().max().unwrap_or(0)
        } else {
            0
        }
    }

    /// 获取提升的技能列表
    pub fn improved_skills(&self) -> Vec<String> {
        if let Ok(improvements) = serde_json::from_value::<std::collections::HashMap<String, i32>>(self.skill_improvements.clone()) {
            improvements
                .into_iter()
                .filter(|(_, level)| *level > 0)
                .map(|(skill, _)| skill)
                .collect()
        } else {
            vec![]
        }
    }

    /// 创建新的性能指标记录
    pub fn new(
        agent_id: Uuid,
        period_start: DateTimeWithTimeZone,
        period_end: DateTimeWithTimeZone,
        tasks_completed: i32,
        tasks_successful: i32,
        avg_completion_time: f64,
        avg_code_quality: f64,
        skill_improvements: JsonValue,
    ) -> Self {
        let now = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
        
        Self {
            metrics_id: Uuid::new_v4(),
            agent_id,
            period_start,
            period_end,
            tasks_completed,
            tasks_successful,
            avg_completion_time,
            avg_code_quality,
            skill_improvements,
            created_at: now,
        }
    }

    /// 检查是否为当前周期
    pub fn is_current_period(&self, reference_time: DateTimeWithTimeZone) -> bool {
        reference_time >= self.period_start && reference_time <= self.period_end
    }

    /// 获取周期长度（天数）
    pub fn period_length_days(&self) -> i64 {
        (self.period_end - self.period_start).num_days()
    }

    /// 计算每日平均任务完成数
    pub fn daily_task_completion_rate(&self) -> f64 {
        let period_days = self.period_length_days().max(1) as f64;
        self.tasks_completed as f64 / period_days
    }

    /// 生成绩效摘要
    pub fn generate_summary(&self) -> String {
        let success_rate = (self.calculate_success_rate() * 100.0) as i32;
        let overall_score = self.calculate_overall_performance_score();
        let skill_count = self.improved_skills().len();
        
        format!(
            "周期：{} 至 {}，完成任务：{}个，成功率：{}%，平均质量：{:.1}分，技能提升：{}项，总体评分：{:.1}分",
            self.period_start.format("%Y-%m-%d"),
            self.period_end.format("%Y-%m-%d"),
            self.tasks_completed,
            success_rate,
            self.avg_code_quality,
            skill_count,
            overall_score
        )
    }
}