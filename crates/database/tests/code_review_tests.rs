//! CodeReview实体测试

use uuid::Uuid;
use chrono::{DateTime, FixedOffset};
use serde_json::json;

use codex_database::entities::code_review::{
    Model as CodeReviewModel, ReviewStatus, ReviewDecision, ReviewComment, CodeChange
};

/// 测试CodeReview实体的创建
#[tokio::test]
async fn test_code_review_creation() {
    let review_id = Uuid::new_v4();
    let task_id = Uuid::new_v4();
    let execution_session_id = Uuid::new_v4();
    let reviewer_agent_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let code_review = CodeReviewModel {
        review_id,
        task_id,
        execution_session_id,
        reviewer_agent_id,
        pull_request_url: "https://github.com/test/repo/pull/123".to_string(),
        source_branch: "feature/test".to_string(),
        target_branch: "main".to_string(),
        review_comments: json!([]),
        code_changes: json!([]),
        status: ReviewStatus::Pending.to_string(),
        decision: None,
        overall_comment: None,
        created_at: now,
        reviewed_at: None,
    };

    assert_eq!(code_review.review_id, review_id);
    assert_eq!(code_review.task_id, task_id);
    assert_eq!(code_review.execution_session_id, execution_session_id);
    assert_eq!(code_review.reviewer_agent_id, reviewer_agent_id);
    assert_eq!(code_review.pull_request_url, "https://github.com/test/repo/pull/123");
    assert_eq!(code_review.source_branch, "feature/test");
    assert_eq!(code_review.target_branch, "main");
    assert_eq!(code_review.status, "pending");
    assert!(code_review.decision.is_none());
    assert!(code_review.overall_comment.is_none());
    assert!(code_review.reviewed_at.is_none());
}

/// 测试ReviewStatus枚举转换
#[test]
fn test_review_status_conversion() {
    assert_eq!(ReviewStatus::Pending.to_string(), "pending");
    assert_eq!(ReviewStatus::InProgress.to_string(), "in_progress");
    assert_eq!(ReviewStatus::Completed.to_string(), "completed");
    assert_eq!(ReviewStatus::Cancelled.to_string(), "cancelled");

    assert_eq!(ReviewStatus::from("pending".to_string()), ReviewStatus::Pending);
    assert_eq!(ReviewStatus::from("in_progress".to_string()), ReviewStatus::InProgress);
    assert_eq!(ReviewStatus::from("completed".to_string()), ReviewStatus::Completed);
    assert_eq!(ReviewStatus::from("cancelled".to_string()), ReviewStatus::Cancelled);
    assert_eq!(ReviewStatus::from("invalid".to_string()), ReviewStatus::Pending);
}

/// 测试ReviewDecision枚举转换
#[test]
fn test_review_decision_conversion() {
    assert_eq!(ReviewDecision::Approved.to_string(), "approved");
    assert_eq!(ReviewDecision::ChangesRequested.to_string(), "changes_requested");
    assert_eq!(ReviewDecision::Rejected.to_string(), "rejected");

    assert_eq!(ReviewDecision::from("approved".to_string()), ReviewDecision::Approved);
    assert_eq!(ReviewDecision::from("changes_requested".to_string()), ReviewDecision::ChangesRequested);
    assert_eq!(ReviewDecision::from("rejected".to_string()), ReviewDecision::Rejected);
    assert_eq!(ReviewDecision::from("invalid".to_string()), ReviewDecision::ChangesRequested);
}

/// 测试ReviewComment结构
#[test]
fn test_review_comment_creation() {
    let comment_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let comment = ReviewComment {
        comment_id,
        file_path: "src/main.rs".to_string(),
        line_number: Some(42),
        comment_text: "建议使用更具描述性的变量名".to_string(),
        severity: "suggestion".to_string(),
        is_resolved: false,
        created_at: now,
    };

    assert_eq!(comment.comment_id, comment_id);
    assert_eq!(comment.file_path, "src/main.rs");
    assert_eq!(comment.line_number, Some(42));
    assert_eq!(comment.comment_text, "建议使用更具描述性的变量名");
    assert_eq!(comment.severity, "suggestion");
    assert!(!comment.is_resolved);
}

/// 测试CodeChange结构
#[test]
fn test_code_change_creation() {
    let change_id = Uuid::new_v4();

    let change = CodeChange {
        change_id,
        file_path: "src/lib.rs".to_string(),
        change_type: "modified".to_string(),
        lines_added: 10,
        lines_removed: 5,
        diff_url: Some("https://github.com/test/repo/commit/abc123".to_string()),
    };

    assert_eq!(change.change_id, change_id);
    assert_eq!(change.file_path, "src/lib.rs");
    assert_eq!(change.change_type, "modified");
    assert_eq!(change.lines_added, 10);
    assert_eq!(change.lines_removed, 5);
    assert_eq!(change.diff_url, Some("https://github.com/test/repo/commit/abc123".to_string()));
}

/// 测试代码审查的业务方法
#[test]
fn test_code_review_business_methods() {
    let mut review = CodeReviewModel {
        review_id: Uuid::new_v4(),
        task_id: Uuid::new_v4(),
        execution_session_id: Uuid::new_v4(),
        reviewer_agent_id: Uuid::new_v4(),
        pull_request_url: "https://github.com/test/repo/pull/123".to_string(),
        source_branch: "feature/test".to_string(),
        target_branch: "main".to_string(),
        review_comments: json!([]),
        code_changes: json!([]),
        status: ReviewStatus::Pending.to_string(),
        decision: None,
        overall_comment: None,
        created_at: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        reviewed_at: None,
    };

    // 测试开始审查
    review.start_review();
    assert_eq!(review.status, ReviewStatus::InProgress.to_string());

    // 测试提交审查结果
    let comments = vec![ReviewComment {
        comment_id: Uuid::new_v4(),
        file_path: "src/main.rs".to_string(),
        line_number: Some(42),
        comment_text: "建议优化".to_string(),
        severity: "suggestion".to_string(),
        is_resolved: false,
        created_at: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    }];

    review.submit_review(comments, ReviewDecision::Approved, Some("整体质量良好".to_string()));
    assert_eq!(review.status, ReviewStatus::Completed.to_string());
    assert_eq!(review.decision, Some(ReviewDecision::Approved.to_string()));
    assert_eq!(review.overall_comment, Some("整体质量良好".to_string()));
    assert!(review.reviewed_at.is_some());

    // 测试质量评分计算
    let quality_score = review.calculate_quality_score();
    assert!(quality_score >= 0.0 && quality_score <= 10.0);
}