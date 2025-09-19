//! 任务实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 任务实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "tasks")]
pub struct Model {
    /// 任务ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub task_id: Uuid,
    
    /// 所属项目ID
    pub project_id: Uuid,
    
    /// 父任务ID（支持任务层级）
    pub parent_task_id: Option<Uuid>,
    
    /// 创建此任务的LLM会话ID
    pub llm_session_id: Option<Uuid>,
    
    /// 任务标题
    pub title: String,
    
    /// 任务描述
    pub description: String,
    
    /// 任务类型
    pub task_type: String,
    
    /// 优先级
    pub priority: String,
    
    /// 需要的Agent能力
    #[sea_orm(column_type = "Json")]
    pub required_capabilities: Option<JsonValue>,
    
    /// 验收标准
    #[sea_orm(column_type = "Json")]
    pub acceptance_criteria: Option<JsonValue>,
    
    /// 预估工作量（小时）
    pub estimated_hours: Option<i32>,
    
    /// 分配的Agent ID
    pub assigned_agent_id: Option<Uuid>,
    
    /// 分配给Agent时的提示词
    pub assignment_prompt: Option<String>,
    
    /// 分配时间
    pub assigned_at: Option<DateTimeWithTimeZone>,
    
    /// 任务状态
    pub status: String,
    
    /// 开始时间
    pub started_at: Option<DateTimeWithTimeZone>,
    
    /// 完成时间
    pub completed_at: Option<DateTimeWithTimeZone>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// 依赖任务数量
    pub dependency_count: i32,
    
    /// 阻塞的任务数量
    pub blocking_tasks_count: i32,
    
    /// 执行结果（JSON格式存储TaskResult）
    #[sea_orm(column_type = "Json")]
    pub execution_result: Option<JsonValue>,
}

/// 任务关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与项目的关联关系
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::ProjectId"
    )]
    Project,
    
    /// 与父任务的关联关系（自引用）
    #[sea_orm(
        belongs_to = "Entity",
        from = "Column::ParentTaskId",
        to = "Column::TaskId"
    )]
    ParentTask,
    
    /// 与LLM会话的关联关系
    #[sea_orm(
        belongs_to = "super::llm_session::Entity",
        from = "Column::LlmSessionId",
        to = "super::llm_session::Column::SessionId"
    )]
    LlmSession,
    
    /// 与分配Agent的关联关系
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::AssignedAgentId",
        to = "super::agent::Column::AgentId"
    )]
    AssignedAgent,
}

/// 项目关联实现
impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

/// LLM会话关联实现
impl Related<super::llm_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LlmSession.def()
    }
}

/// 分配Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AssignedAgent.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 验收标准评估结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcceptanceCriteriaEvaluation {
    /// 整体是否通过
    pub overall_passed: bool,
    /// 加权综合评分
    pub weighted_score: f64,
    /// 各项标准的评估结果
    pub criteria_results: Vec<CriterionResult>,
}

/// 单项标准评估结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CriterionResult {
    /// 标准类型
    pub criterion_type: String,
    /// 是否通过
    pub passed: bool,
    /// 目标值
    pub target_value: f64,
    /// 实际值
    pub actual_value: f64,
    /// 权重
    pub weight: f64,
    /// 得分
    pub score: f64,
}

/// Task实体的依赖关系管理业务方法实现
impl Model {
    /// 添加依赖计数
    pub fn add_dependency_count(&mut self, count: i32) {
        self.dependency_count += count;
    }

    /// 添加阻塞任务计数
    pub fn add_blocking_task_count(&mut self, count: i32) {
        self.blocking_tasks_count += count;
    }

    /// 解决一个依赖
    pub fn resolve_dependency(&mut self) {
        if self.dependency_count > 0 {
            self.dependency_count -= 1;
        }
    }

    /// 解决一个阻塞任务
    pub fn resolve_blocking_task(&mut self) {
        if self.blocking_tasks_count > 0 {
            self.blocking_tasks_count -= 1;
        }
    }

    /// 检查任务是否准备开始
    pub fn is_ready_to_start(&self) -> bool {
        self.dependency_count == 0 && self.status == "pending"
    }

    /// 开始执行任务
    pub fn start_execution(&mut self, agent_id: Uuid) {
        self.status = "in_progress".to_string();
        self.assigned_agent_id = Some(agent_id);
        self.started_at = Some(chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 完成任务执行
    pub fn complete_execution(&mut self, success: bool) {
        self.status = if success { "completed" } else { "failed" }.to_string();
        self.completed_at = Some(chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 记录执行结果
    pub fn record_execution_result(
        &mut self,
        success: bool,
        deliverables: Vec<String>,
        git_commits: Vec<String>,
        tests_passed: bool,
        test_coverage: f64,
        code_quality: f64,
        completion_time: f64,
        issues_encountered: Vec<String>,
        solutions_applied: Vec<String>,
    ) {
        let result = serde_json::json!({
            "success": success,
            "deliverables": deliverables,
            "git_commits": git_commits,
            "test_results": {
                "passed": tests_passed,
                "coverage_percentage": test_coverage
            },
            "quality_metrics": {
                "code_quality_score": code_quality,
                "performance_metrics": {}
            },
            "actual_completion_time": completion_time,
            "issues_encountered": issues_encountered,
            "solutions_applied": solutions_applied,
            "recorded_at": chrono::Utc::now().to_rfc3339()
        });

        self.execution_result = Some(result);
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 评估验收标准
    pub fn evaluate_acceptance_criteria(&self) -> AcceptanceCriteriaEvaluation {
        let mut criteria_results = Vec::new();
        let mut total_weighted_score = 0.0;
        let mut total_weight = 0.0;
        let mut all_passed = true;

        if let Some(criteria) = &self.acceptance_criteria {
            if let Some(criteria_array) = criteria.as_array() {
                for criterion in criteria_array {
                    let criterion_type = criterion["type"].as_str().unwrap_or("unknown").to_string();
                    let weight = criterion["weight"].as_f64().unwrap_or(1.0);
                    let target_value = criterion["target_value"].as_f64().unwrap_or(0.0);

                    let (passed, actual_value, score) = self.evaluate_single_criterion(&criterion_type, target_value);
                    
                    if !passed {
                        all_passed = false;
                    }

                    total_weighted_score += score * weight;
                    total_weight += weight;

                    criteria_results.push(CriterionResult {
                        criterion_type,
                        passed,
                        target_value,
                        actual_value,
                        weight,
                        score,
                    });
                }
            }
        }

        let weighted_score = if total_weight > 0.0 {
            total_weighted_score / total_weight
        } else {
            0.0
        };

        AcceptanceCriteriaEvaluation {
            overall_passed: all_passed,
            weighted_score,
            criteria_results,
        }
    }

    /// 评估单个验收标准
    fn evaluate_single_criterion(&self, criterion_type: &str, target_value: f64) -> (bool, f64, f64) {
        if let Some(result) = &self.execution_result {
            match criterion_type {
                "quality" => {
                    let actual = result["quality_metrics"]["code_quality_score"].as_f64().unwrap_or(0.0);
                    let passed = actual >= target_value;
                    let score = (actual / 10.0).min(1.0);
                    (passed, actual, score)
                }
                "coverage" => {
                    let actual = result["test_results"]["coverage_percentage"].as_f64().unwrap_or(0.0);
                    let passed = actual >= target_value;
                    let score = (actual / 100.0).min(1.0);
                    (passed, actual, score)
                }
                "performance" => {
                    let actual = result["quality_metrics"]["performance_metrics"]["response_time_ms"].as_f64().unwrap_or(f64::MAX);
                    let passed = actual <= target_value;
                    let score = if actual <= target_value { 1.0 } else { target_value / actual };
                    (passed, actual, score)
                }
                "testing" => {
                    let actual = if result["test_results"]["passed"].as_bool().unwrap_or(false) { 1.0 } else { 0.0 };
                    let passed = actual >= target_value;
                    (passed, actual, actual)
                }
                _ => {
                    // 默认情况，假设通过
                    (true, 1.0, 1.0)
                }
            }
        } else {
            // 没有执行结果，无法评估
            (false, 0.0, 0.0)
        }
    }

    /// 计算任务复杂度评分
    pub fn calculate_complexity_score(&self) -> f64 {
        let mut complexity = 0.0;

        // 基于需要的能力数量
        if let Some(capabilities) = &self.required_capabilities {
            if let Some(caps_array) = capabilities.as_array() {
                complexity += caps_array.len() as f64 * 0.5; // 每个能力增加0.5分
            }
        }

        // 基于验收标准数量
        if let Some(criteria) = &self.acceptance_criteria {
            if let Some(criteria_array) = criteria.as_array() {
                complexity += criteria_array.len() as f64 * 0.3; // 每个标准增加0.3分
            }
        }

        // 基于预估工作量
        if let Some(hours) = self.estimated_hours {
            complexity += (hours as f64 / 8.0).min(3.0); // 每8小时增加1分，最多3分
        }

        // 基于依赖关系
        complexity += self.dependency_count as f64 * 0.2; // 每个依赖增加0.2分
        complexity += self.blocking_tasks_count as f64 * 0.1; // 每个阻塞任务增加0.1分

        // 确保分数在0-10范围内
        complexity.min(10.0).max(0.0)
    }

    /// 估算工作量倍数
    pub fn estimate_effort_multiplier(&self) -> f64 {
        let complexity = self.calculate_complexity_score();
        
        // 基础倍数为1.0，复杂度每增加1分，倍数增加0.1
        let base_multiplier = 1.0 + (complexity * 0.1);
        
        // 优先级影响
        let priority_multiplier = match self.priority.as_str() {
            "urgent" => 1.2,
            "high" => 1.1,
            "medium" => 1.0,
            "low" => 0.9,
            _ => 1.0,
        };

        base_multiplier * priority_multiplier
    }

    /// 获取任务状态摘要
    pub fn get_status_summary(&self) -> String {
        let complexity = self.calculate_complexity_score();
        let effort_multiplier = self.estimate_effort_multiplier();
        
        format!(
            "任务：{}，状态：{}，复杂度：{:.1}，依赖：{}个，阻塞：{}个，工作量倍数：{:.2}",
            self.title,
            self.status,
            complexity,
            self.dependency_count,
            self.blocking_tasks_count,
            effort_multiplier
        )
    }
}