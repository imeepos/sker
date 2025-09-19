//! 代码审查实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 代码审查实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "code_reviews")]
pub struct Model {
    /// 审查ID - 聚合根标识
    #[sea_orm(primary_key, auto_increment = false)]
    pub review_id: Uuid,
    
    /// 任务ID
    pub task_id: Uuid,
    
    /// 执行会话ID
    pub execution_session_id: Uuid,
    
    /// 审查员Agent ID
    pub reviewer_agent_id: Uuid,
    
    /// Pull Request URL
    pub pull_request_url: String,
    
    /// 源分支
    pub source_branch: String,
    
    /// 目标分支
    pub target_branch: String,
    
    /// 审查评论（JSON存储ReviewComment数组）
    #[sea_orm(column_type = "Json")]
    pub review_comments: JsonValue,
    
    /// 代码变更（JSON存储CodeChange数组）
    #[sea_orm(column_type = "Json")]
    pub code_changes: JsonValue,
    
    /// 审查状态
    pub status: String,
    
    /// 审查决策
    pub decision: Option<String>,
    
    /// 整体评论
    pub overall_comment: Option<String>,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 审查完成时间
    pub reviewed_at: Option<DateTimeWithTimeZone>,
}

/// 代码审查关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::TaskId",
        to = "super::task::Column::TaskId"
    )]
    Task,
    
    /// 与执行会话的关联关系
    #[sea_orm(
        belongs_to = "super::execution_session::Entity",
        from = "Column::ExecutionSessionId",
        to = "super::execution_session::Column::SessionId"
    )]
    ExecutionSession,
    
    /// 与审查员Agent的关联关系
    #[sea_orm(
        belongs_to = "super::agent::Entity",
        from = "Column::ReviewerAgentId",
        to = "super::agent::Column::AgentId"
    )]
    ReviewerAgent,
}

/// 任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

/// 执行会话关联实现
impl Related<super::execution_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ExecutionSession.def()
    }
}

/// 审查员Agent关联实现
impl Related<super::agent::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ReviewerAgent.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 审查状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReviewStatus {
    /// 待审查
    Pending,
    /// 审查中
    InProgress,
    /// 已完成
    Completed,
    /// 已取消
    Cancelled,
}

impl std::fmt::Display for ReviewStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReviewStatus::Pending => write!(f, "pending"),
            ReviewStatus::InProgress => write!(f, "in_progress"),
            ReviewStatus::Completed => write!(f, "completed"),
            ReviewStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl From<String> for ReviewStatus {
    fn from(status: String) -> Self {
        match status.as_str() {
            "pending" => ReviewStatus::Pending,
            "in_progress" => ReviewStatus::InProgress,
            "completed" => ReviewStatus::Completed,
            "cancelled" => ReviewStatus::Cancelled,
            _ => ReviewStatus::Pending,
        }
    }
}

/// 审查决策枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReviewDecision {
    /// 批准
    Approved,
    /// 需要修改
    ChangesRequested,
    /// 拒绝
    Rejected,
}

impl std::fmt::Display for ReviewDecision {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReviewDecision::Approved => write!(f, "approved"),
            ReviewDecision::ChangesRequested => write!(f, "changes_requested"),
            ReviewDecision::Rejected => write!(f, "rejected"),
        }
    }
}

impl From<String> for ReviewDecision {
    fn from(decision: String) -> Self {
        match decision.as_str() {
            "approved" => ReviewDecision::Approved,
            "changes_requested" => ReviewDecision::ChangesRequested,
            "rejected" => ReviewDecision::Rejected,
            _ => ReviewDecision::ChangesRequested,
        }
    }
}

/// 审查评论结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewComment {
    /// 评论ID
    pub comment_id: Uuid,
    /// 文件路径
    pub file_path: String,
    /// 行号（可选）
    pub line_number: Option<i32>,
    /// 评论内容
    pub comment_text: String,
    /// 严重程度：error, warning, suggestion
    pub severity: String,
    /// 是否已解决
    pub is_resolved: bool,
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// 代码变更结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeChange {
    /// 变更ID
    pub change_id: Uuid,
    /// 文件路径
    pub file_path: String,
    /// 变更类型：added, modified, deleted
    pub change_type: String,
    /// 新增行数
    pub lines_added: i32,
    /// 删除行数
    pub lines_removed: i32,
    /// 差异URL
    pub diff_url: Option<String>,
}

/// 依赖类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DependencyType {
    /// 阻塞依赖：必须等待父任务完成
    Blocking,
    /// 软依赖：建议等待但不强制
    Soft,
    /// 资源依赖：需要相同资源
    Resource,
}

impl std::fmt::Display for DependencyType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DependencyType::Blocking => write!(f, "blocking"),
            DependencyType::Soft => write!(f, "soft"),
            DependencyType::Resource => write!(f, "resource"),
        }
    }
}

impl From<String> for DependencyType {
    fn from(dep_type: String) -> Self {
        match dep_type.as_str() {
            "blocking" => DependencyType::Blocking,
            "soft" => DependencyType::Soft,
            "resource" => DependencyType::Resource,
            _ => DependencyType::Blocking,
        }
    }
}

/// CodeReview实体的业务方法实现
impl Model {
    /// 分配审查员
    pub fn assign_reviewer(&mut self, agent_id: Uuid) {
        self.reviewer_agent_id = agent_id;
    }

    /// 开始审查
    pub fn start_review(&mut self) {
        self.status = ReviewStatus::InProgress.to_string();
    }

    /// 提交审查结果
    pub fn submit_review(
        &mut self,
        comments: Vec<ReviewComment>,
        decision: ReviewDecision,
        overall_comment: Option<String>,
    ) {
        self.review_comments = serde_json::to_value(comments).unwrap_or_default();
        self.decision = Some(decision.to_string());
        self.overall_comment = overall_comment;
        self.status = ReviewStatus::Completed.to_string();
        self.reviewed_at = Some(chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
    }

    /// 请求代码修改
    pub fn request_changes(&mut self, required_changes: Vec<String>) {
        self.decision = Some(ReviewDecision::ChangesRequested.to_string());
        self.overall_comment = Some(format!("需要修改：{}", required_changes.join("; ")));
        self.status = ReviewStatus::Completed.to_string();
        self.reviewed_at = Some(chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
    }

    /// 批准PR
    pub fn approve(&mut self) {
        self.decision = Some(ReviewDecision::Approved.to_string());
        self.status = ReviewStatus::Completed.to_string();
        self.reviewed_at = Some(chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
    }

    /// 计算代码质量评分
    pub fn calculate_quality_score(&self) -> f64 {
        // 基础分数
        let mut score = 8.0;
        
        // 根据评论数量调整分数
        if let Ok(comments) = serde_json::from_value::<Vec<ReviewComment>>(self.review_comments.clone()) {
            let error_count = comments.iter().filter(|c| c.severity == "error").count();
            let warning_count = comments.iter().filter(|c| c.severity == "warning").count();
            let suggestion_count = comments.iter().filter(|c| c.severity == "suggestion").count();
            
            // 每个错误扣2分，警告扣1分，建议扣0.5分
            score -= error_count as f64 * 2.0;
            score -= warning_count as f64 * 1.0;
            score -= suggestion_count as f64 * 0.5;
        }
        
        // 根据决策结果调整分数
        if let Some(decision_str) = &self.decision {
            match ReviewDecision::from(decision_str.clone()) {
                ReviewDecision::Approved => score += 1.0,
                ReviewDecision::ChangesRequested => score -= 1.0,
                ReviewDecision::Rejected => score = 0.0,
            }
        }
        
        // 确保分数在0-10范围内
        score.max(0.0).min(10.0)
    }
}