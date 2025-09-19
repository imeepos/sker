//! Agent实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{Value as JsonValue, json};
use uuid::Uuid;

/// Agent实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "agents")]
pub struct Model {
    /// Agent ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub agent_id: Uuid,
    
    /// 所属用户ID
    pub user_id: Uuid,
    
    /// Agent名称
    pub name: String,
    
    /// Agent描述
    pub description: Option<String>,
    
    /// 提示词模板
    pub prompt_template: String,
    
    /// Agent能力配置（JSON格式存储AgentCapability数组）
    #[sea_orm(column_type = "Json")]
    pub capabilities: JsonValue,
    
    /// 详细配置信息
    #[sea_orm(column_type = "Json")]
    pub config: JsonValue,
    
    /// Git相关配置
    #[sea_orm(column_type = "Json")]
    pub git_config: Option<JsonValue>,
    
    /// Agent状态：idle, working, paused, error, offline
    pub status: String,
    
    /// 当前执行任务ID
    pub current_task_id: Option<Uuid>,
    
    /// 总完成任务数
    pub total_tasks_completed: i32,
    
    /// 成功率 (0.0-1.0)
    pub success_rate: f64,
    
    /// 平均完成时间（分钟）
    pub average_completion_time: i32,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// 最后活跃时间
    pub last_active_at: DateTimeWithTimeZone,
    
    /// 技能档案（JSON格式存储SkillProfile）
    #[sea_orm(column_type = "Json")]
    pub skill_profile: Option<JsonValue>,
    
    /// 技能评估历史（JSON格式存储SkillAssessment数组）
    #[sea_orm(column_type = "Json")]
    pub skill_assessments: Option<JsonValue>,
    
    /// 性能趋势（JSON格式存储PerformanceTrend）
    #[sea_orm(column_type = "Json")]
    pub performance_trend: Option<JsonValue>,
}

/// Agent关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
    
    /// 与当前任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::CurrentTaskId",
        to = "super::task::Column::TaskId"
    )]
    CurrentTask,
    
    /// 与工作历史的关联关系
    #[sea_orm(has_many = "super::agent_work_history::Entity")]
    WorkHistory,
    
    /// 与已分配任务的关联关系
    #[sea_orm(has_many = "super::task::Entity")]
    AssignedTasks,
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 当前任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CurrentTask.def()
    }
}

/// Agent工作历史关联实现  
impl Related<super::agent_work_history::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WorkHistory.def()
    }
}

// 注意：Agent与Task的关联通过CurrentTask关系处理，AssignedTasks通过反向查询获取

impl ActiveModelBehavior for ActiveModel {}

/// Agent能力枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentCapability {
    /// 前端开发
    FrontendDevelopment,
    /// 后端开发
    BackendDevelopment,
    /// 数据库开发
    DatabaseDevelopment,
    /// DevOps
    DevOps,
    /// 测试
    Testing,
    /// 代码审查
    CodeReview,
    /// 文档编写
    Documentation,
    /// API设计
    ApiDesign,
    /// 性能优化
    PerformanceOptimization,
    /// 安全审计
    SecurityAudit,
}

/// Agent状态枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentStatus {
    /// 空闲
    Idle,
    /// 工作中
    Working,
    /// 暂停
    Paused,
    /// 错误
    Error,
    /// 离线
    Offline,
}

impl std::fmt::Display for AgentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentStatus::Idle => write!(f, "idle"),
            AgentStatus::Working => write!(f, "working"),
            AgentStatus::Paused => write!(f, "paused"),
            AgentStatus::Error => write!(f, "error"),
            AgentStatus::Offline => write!(f, "offline"),
        }
    }
}

impl From<String> for AgentStatus {
    fn from(status: String) -> Self {
        match status.as_str() {
            "idle" => AgentStatus::Idle,
            "working" => AgentStatus::Working,
            "paused" => AgentStatus::Paused,
            "error" => AgentStatus::Error,
            "offline" => AgentStatus::Offline,
            _ => AgentStatus::Idle,
        }
    }
}

/// 技能评估记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillAssessment {
    /// 评估ID
    pub assessment_id: Uuid,
    /// 任务ID
    pub task_id: Uuid,
    /// 任务类型
    pub task_type: String,
    /// 使用的技术
    pub technologies_used: Vec<String>,
    /// 是否成功
    pub success: bool,
    /// 质量评分
    pub quality_score: f64,
    /// 完成时间（小时）
    pub completion_time: f64,
    /// 评估时间
    pub assessed_at: DateTimeWithTimeZone,
}

/// 性能趋势分析
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceTrend {
    /// 当前评分
    pub current_score: f64,
    /// 趋势方向：improving, stable, declining
    pub trend_direction: String,
    /// 改进建议
    pub improvement_suggestions: Vec<String>,
    /// 上次分析时间
    pub last_analyzed: DateTimeWithTimeZone,
}

/// Agent实体的技能档案业务方法实现
impl Model {
    /// 获取技能等级
    pub fn get_skill_level(&self, skill_name: &str) -> Option<i32> {
        if let Some(profile) = &self.skill_profile {
            // 先查编程语言
            if let Some(level) = profile["programming_languages"][skill_name].as_i64() {
                return Some(level as i32);
            }
            // 再查框架技能
            if let Some(level) = profile["frameworks"][skill_name].as_i64() {
                return Some(level as i32);
            }
        }
        None
    }

    /// 更新技能等级
    pub fn update_skill_level(&mut self, skill_name: &str, new_level: i32) {
        if let Some(profile) = &mut self.skill_profile {
            let mut profile_obj = profile.clone();
            
            // 尝试更新编程语言技能
            if profile_obj["programming_languages"][skill_name].is_number() {
                profile_obj["programming_languages"][skill_name] = json!(new_level);
            }
            // 尝试更新框架技能
            else if profile_obj["frameworks"][skill_name].is_number() {
                profile_obj["frameworks"][skill_name] = json!(new_level);
            }
            
            self.skill_profile = Some(profile_obj);
        }
    }

    /// 添加新技能
    pub fn add_new_skill(&mut self, skill_name: &str, level: i32) {
        if let Some(profile) = &mut self.skill_profile {
            let mut profile_obj = profile.clone();
            
            // 默认添加到编程语言类别
            if profile_obj["programming_languages"].is_object() {
                profile_obj["programming_languages"][skill_name] = json!(level);
                self.skill_profile = Some(profile_obj);
            }
        }
    }

    /// 获取专长领域
    pub fn get_specialties(&self) -> Vec<String> {
        if let Some(profile) = &self.skill_profile {
            if let Some(specialties) = profile["specialties"].as_array() {
                return specialties
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();
            }
        }
        vec![]
    }

    /// 添加专长领域
    pub fn add_specialty(&mut self, specialty: &str) {
        if let Some(profile) = &mut self.skill_profile {
            let mut profile_obj = profile.clone();
            
            if let Some(specialties) = profile_obj["specialties"].as_array_mut() {
                specialties.push(json!(specialty));
                self.skill_profile = Some(profile_obj);
            }
        }
    }

    /// 计算当前成功率
    pub fn calculate_current_success_rate(&self) -> f64 {
        self.success_rate
    }

    /// 记录任务完成情况
    pub fn record_task_completion(
        &mut self,
        task_id: Uuid,
        task_type: &str,
        technologies_used: Vec<String>,
        success: bool,
        quality_score: f64,
    ) {
        let assessment = SkillAssessment {
            assessment_id: Uuid::new_v4(),
            task_id,
            task_type: task_type.to_string(),
            technologies_used,
            success,
            quality_score,
            completion_time: 0.0, // 实际实现中应该从任务数据获取
            assessed_at: chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()),
        };

        let mut assessments = self.get_skill_assessments();
        assessments.push(assessment);
        
        // 只保留最近50个评估记录
        if assessments.len() > 50 {
            let skip_count = assessments.len() - 50;
            assessments = assessments.into_iter().skip(skip_count).collect();
        }
        
        self.skill_assessments = Some(serde_json::to_value(assessments).unwrap_or_default());
        
        // 更新统计信息
        self.total_tasks_completed += 1;
        if success {
            // 重新计算成功率
            let total_successful = (self.success_rate * (self.total_tasks_completed - 1) as f64) + 1.0;
            self.success_rate = total_successful / self.total_tasks_completed as f64;
        } else {
            // 重新计算成功率
            let total_successful = self.success_rate * (self.total_tasks_completed - 1) as f64;
            self.success_rate = total_successful / self.total_tasks_completed as f64;
        }
    }

    /// 获取技能评估记录
    pub fn get_skill_assessments(&self) -> Vec<SkillAssessment> {
        if let Some(assessments) = &self.skill_assessments {
            serde_json::from_value(assessments.clone()).unwrap_or_default()
        } else {
            vec![]
        }
    }

    /// 计算任务匹配评分
    pub fn calculate_task_match_score(&self, required_skills: &[String]) -> f64 {
        if required_skills.is_empty() {
            return 0.0;
        }

        let mut total_score = 0.0;
        let mut matched_skills = 0;

        for skill in required_skills {
            if let Some(level) = self.get_skill_level(skill) {
                total_score += level as f64 / 10.0; // 归一化到0-1范围
                matched_skills += 1;
            }
        }

        if matched_skills == 0 {
            return 0.0;
        }

        // 考虑匹配技能的比例和平均水平
        let average_level = total_score / matched_skills as f64;
        let match_ratio = matched_skills as f64 / required_skills.len() as f64;

        average_level * match_ratio
    }

    /// 计算性能趋势
    pub fn calculate_performance_trend(&self) -> PerformanceTrend {
        let assessments = self.get_skill_assessments();
        
        if assessments.is_empty() {
            return PerformanceTrend {
                current_score: 0.0,
                trend_direction: "unknown".to_string(),
                improvement_suggestions: vec!["需要更多任务数据进行分析".to_string()],
                last_analyzed: chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()),
            };
        }

        // 计算最近的平均质量评分
        let recent_count = assessments.len().min(10);
        let recent_assessments = &assessments[assessments.len() - recent_count..];
        
        let current_score: f64 = recent_assessments
            .iter()
            .map(|a| a.quality_score)
            .sum::<f64>() / recent_count as f64;

        // 简单的趋势分析
        let trend_direction = if assessments.len() >= 5 {
            let earlier_count = (assessments.len() - recent_count).min(5);
            let earlier_start = assessments.len() - recent_count - earlier_count;
            let earlier_assessments = &assessments[earlier_start..earlier_start + earlier_count];
            
            let earlier_score: f64 = earlier_assessments
                .iter()
                .map(|a| a.quality_score)
                .sum::<f64>() / earlier_count as f64;

            if current_score > earlier_score + 0.5 {
                "improving".to_string()
            } else if current_score < earlier_score - 0.5 {
                "declining".to_string()
            } else {
                "stable".to_string()
            }
        } else {
            "insufficient_data".to_string()
        };

        // 生成改进建议
        let mut suggestions = vec![];
        if current_score < 7.0 {
            suggestions.push("建议加强代码质量控制".to_string());
        }
        if recent_assessments.iter().filter(|a| !a.success).count() > recent_count / 3 {
            suggestions.push("建议改进任务执行策略".to_string());
        }
        if suggestions.is_empty() {
            suggestions.push("继续保持当前良好表现".to_string());
        }

        PerformanceTrend {
            current_score,
            trend_direction,
            improvement_suggestions: suggestions,
            last_analyzed: chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()),
        }
    }
}