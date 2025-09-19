//! AgentPerformanceMetrics实体测试

use uuid::Uuid;
use chrono::{DateTime, FixedOffset};
use serde_json::json;

use codex_database::entities::agent_performance_metrics::{
    Model as AgentPerformanceMetricsModel,
};

/// 测试AgentPerformanceMetrics实体的创建
#[tokio::test]
async fn test_agent_performance_metrics_creation() {
    let metrics_id = Uuid::new_v4();
    let agent_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());
    let period_start = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());
    let period_end = DateTime::parse_from_rfc3339("2024-01-31T23:59:59Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let metrics = AgentPerformanceMetricsModel {
        metrics_id,
        agent_id,
        period_start,
        period_end,
        tasks_completed: 10,
        tasks_successful: 8,
        avg_completion_time: 4.5,
        avg_code_quality: 8.2,
        skill_improvements: json!({"rust": 1, "typescript": 2}),
        created_at: now,
    };

    assert_eq!(metrics.metrics_id, metrics_id);
    assert_eq!(metrics.agent_id, agent_id);
    assert_eq!(metrics.tasks_completed, 10);
    assert_eq!(metrics.tasks_successful, 8);
    assert_eq!(metrics.avg_completion_time, 4.5);
    assert_eq!(metrics.avg_code_quality, 8.2);
}

/// 测试性能指标计算方法
#[test]
fn test_performance_calculations() {
    let metrics = AgentPerformanceMetricsModel {
        metrics_id: Uuid::new_v4(),
        agent_id: Uuid::new_v4(),
        period_start: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        period_end: DateTime::parse_from_rfc3339("2024-01-31T23:59:59Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        tasks_completed: 10,
        tasks_successful: 8,
        avg_completion_time: 4.5,
        avg_code_quality: 8.2,
        skill_improvements: json!({"rust": 1, "typescript": 2}),
        created_at: DateTime::parse_from_rfc3339("2024-02-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    };

    // 测试成功率计算
    assert_eq!(metrics.calculate_success_rate(), 0.8);

    // 测试效率评分计算
    let efficiency_score = metrics.calculate_efficiency_score();
    assert!(efficiency_score >= 0.0 && efficiency_score <= 10.0);

    // 测试总体绩效评分
    let overall_score = metrics.calculate_overall_performance_score();
    assert!(overall_score >= 0.0 && overall_score <= 10.0);
}

/// 测试零任务情况
#[test]
fn test_zero_tasks_scenario() {
    let metrics = AgentPerformanceMetricsModel {
        metrics_id: Uuid::new_v4(),
        agent_id: Uuid::new_v4(),
        period_start: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        period_end: DateTime::parse_from_rfc3339("2024-01-31T23:59:59Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        tasks_completed: 0,
        tasks_successful: 0,
        avg_completion_time: 0.0,
        avg_code_quality: 0.0,
        skill_improvements: json!({}),
        created_at: DateTime::parse_from_rfc3339("2024-02-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    };

    // 零任务时成功率应该为0.0
    assert_eq!(metrics.calculate_success_rate(), 0.0);
    
    // 零任务时效率评分应该为0.0
    assert_eq!(metrics.calculate_efficiency_score(), 0.0);
}

/// 测试技能提升统计
#[test]
fn test_skill_improvement_stats() {
    let metrics = AgentPerformanceMetricsModel {
        metrics_id: Uuid::new_v4(),
        agent_id: Uuid::new_v4(),
        period_start: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        period_end: DateTime::parse_from_rfc3339("2024-01-31T23:59:59Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
        tasks_completed: 10,
        tasks_successful: 8,
        avg_completion_time: 4.5,
        avg_code_quality: 8.2,
        skill_improvements: json!({"rust": 2, "typescript": 1, "python": 3}),
        created_at: DateTime::parse_from_rfc3339("2024-02-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    };

    // 测试技能提升总数计算
    assert_eq!(metrics.total_skill_improvements(), 6);

    // 测试最大技能提升
    assert_eq!(metrics.max_skill_improvement(), 3);
}