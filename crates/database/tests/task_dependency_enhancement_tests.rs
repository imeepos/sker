//! Task依赖关系增强功能测试

use uuid::Uuid;
use chrono::{DateTime, FixedOffset};
use serde_json::json;

use codex_database::entities::task::{
    Entity as Task, Model as TaskModel, ActiveModel as TaskActiveModel
};
use codex_database::entities::task_dependency::{
    Entity as TaskDependency, Model as TaskDependencyModel, DependencyType
};

/// 测试Task实体的依赖关系功能
#[test]
fn test_task_dependency_management() {
    let project_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let mut task = TaskModel {
        task_id: Uuid::new_v4(),
        project_id,
        parent_task_id: None,
        llm_session_id: None,
        title: "主要开发任务".to_string(),
        description: "这是一个主要的开发任务".to_string(),
        task_type: "development".to_string(),
        priority: "high".to_string(),
        required_capabilities: Some(json!(["rust", "backend"])),
        acceptance_criteria: Some(json!([
            {
                "criterion": "代码质量评分 >= 8.0",
                "type": "quality",
                "weight": 0.4
            },
            {
                "criterion": "测试覆盖率 >= 80%",
                "type": "coverage", 
                "weight": 0.3
            },
            {
                "criterion": "性能要求满足",
                "type": "performance",
                "weight": 0.3
            }
        ])),
        estimated_hours: Some(8),
        assigned_agent_id: None,
        assignment_prompt: None,
        assigned_at: None,
        status: "pending".to_string(),
        started_at: None,
        completed_at: None,
        dependency_count: 0,
        blocking_tasks_count: 0,
        execution_result: None,
        created_at: now,
        updated_at: now,
    };

    // 测试依赖计数功能
    assert_eq!(task.dependency_count, 0);
    assert_eq!(task.blocking_tasks_count, 0);

    // 测试添加依赖
    task.add_dependency_count(3);
    assert_eq!(task.dependency_count, 3);

    // 测试阻塞任务计数
    task.add_blocking_task_count(2);
    assert_eq!(task.blocking_tasks_count, 2);

    // 测试依赖解决
    task.resolve_dependency();
    assert_eq!(task.dependency_count, 2);

    // 测试阻塞任务解决
    task.resolve_blocking_task();
    assert_eq!(task.blocking_tasks_count, 1);
}

/// 测试任务执行结果记录
#[test]
fn test_task_execution_result() {
    let project_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let mut task = TaskModel {
        task_id: Uuid::new_v4(),
        project_id,
        parent_task_id: None,
        llm_session_id: None,
        title: "测试任务".to_string(),
        description: "用于测试执行结果记录".to_string(),
        task_type: "development".to_string(),
        priority: "medium".to_string(),
        required_capabilities: Some(json!(["testing"])),
        acceptance_criteria: None,
        estimated_hours: Some(4),
        assigned_agent_id: None,
        assignment_prompt: None,
        assigned_at: None,
        status: "pending".to_string(),
        started_at: None,
        completed_at: None,
        dependency_count: 0,
        blocking_tasks_count: 0,
        execution_result: None,
        created_at: now,
        updated_at: now,
    };

    // 测试执行结果记录
    let deliverables = vec!["feature.rs".to_string(), "tests.rs".to_string()];
    let git_commits = vec!["abc123".to_string(), "def456".to_string()];
    let issues = vec!["依赖库版本冲突".to_string()];
    let solutions = vec!["更新Cargo.toml版本锁定".to_string()];

    task.record_execution_result(
        true,
        deliverables.clone(),
        git_commits.clone(),
        true,
        85.0,
        8.5,
        3.5,
        issues.clone(),
        solutions.clone(),
    );

    // 验证执行结果记录
    assert!(task.execution_result.is_some());
    let result = task.execution_result.as_ref().unwrap();
    assert_eq!(result["success"], true);
    assert_eq!(result["deliverables"], json!(deliverables));
    assert_eq!(result["git_commits"], json!(git_commits));
    assert_eq!(result["test_results"]["passed"], true);
    assert_eq!(result["test_results"]["coverage_percentage"], 85.0);
    assert_eq!(result["quality_metrics"]["code_quality_score"], 8.5);
    assert_eq!(result["actual_completion_time"], 3.5);
    assert_eq!(result["issues_encountered"], json!(issues));
    assert_eq!(result["solutions_applied"], json!(solutions));
}

/// 测试任务状态流转和准备检查
#[test]
fn test_task_readiness_check() {
    let project_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let mut task = TaskModel {
        task_id: Uuid::new_v4(),
        project_id,
        parent_task_id: None,
        llm_session_id: None,
        title: "依赖任务".to_string(),
        description: "有依赖关系的任务".to_string(),
        task_type: "development".to_string(),
        priority: "medium".to_string(),
        required_capabilities: Some(json!(["backend"])),
        acceptance_criteria: None,
        estimated_hours: Some(6),
        assigned_agent_id: None,
        assignment_prompt: None,
        assigned_at: None,
        status: "pending".to_string(),
        started_at: None,
        completed_at: None,
        dependency_count: 2,
        blocking_tasks_count: 0,
        execution_result: None,
        created_at: now,
        updated_at: now,
    };

    // 有依赖时不能开始
    assert!(!task.is_ready_to_start());

    // 解决所有依赖后可以开始
    task.resolve_dependency();
    task.resolve_dependency();
    assert!(task.is_ready_to_start());

    // 测试任务开始
    task.start_execution(Uuid::new_v4());
    assert_eq!(task.status, "in_progress");
    assert!(task.started_at.is_some());
    assert!(task.assigned_agent_id.is_some());

    // 测试任务完成
    task.complete_execution(true);
    assert_eq!(task.status, "completed");
    assert!(task.completed_at.is_some());
}

/// 测试验收标准评估
#[test]
fn test_acceptance_criteria_evaluation() {
    let project_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let task = TaskModel {
        task_id: Uuid::new_v4(),
        project_id,
        parent_task_id: None,
        llm_session_id: None,
        title: "质量检查任务".to_string(),
        description: "具有验收标准的任务".to_string(),
        task_type: "development".to_string(),
        priority: "high".to_string(),
        required_capabilities: Some(json!(["quality_assurance"])),
        acceptance_criteria: Some(json!([
            {
                "criterion": "代码质量评分 >= 8.0",
                "type": "quality",
                "weight": 0.5,
                "target_value": 8.0
            },
            {
                "criterion": "测试覆盖率 >= 90%",
                "type": "coverage",
                "weight": 0.3,
                "target_value": 90.0
            },
            {
                "criterion": "性能响应时间 < 100ms",
                "type": "performance",
                "weight": 0.2,
                "target_value": 100.0
            }
        ])),
        estimated_hours: Some(5),
        assigned_agent_id: None,
        assignment_prompt: None,
        assigned_at: None,
        status: "pending".to_string(),
        started_at: None,
        completed_at: None,
        dependency_count: 0,
        blocking_tasks_count: 0,
        execution_result: Some(json!({
            "success": true,
            "test_results": {
                "passed": true,
                "coverage_percentage": 95.0
            },
            "quality_metrics": {
                "code_quality_score": 8.8,
                "performance_metrics": {
                    "response_time_ms": 85.0
                }
            }
        })),
        created_at: now,
        updated_at: now,
    };

    // 测试验收标准评估
    let evaluation = task.evaluate_acceptance_criteria();
    assert!(evaluation.overall_passed);
    assert!(evaluation.weighted_score >= 0.9); // 应该有很高的分数
    assert_eq!(evaluation.criteria_results.len(), 3);

    // 检查每个标准的评估结果
    let quality_result = evaluation.criteria_results.iter()
        .find(|r| r.criterion_type == "quality")
        .unwrap();
    assert!(quality_result.passed);
    assert_eq!(quality_result.actual_value, 8.8);

    let coverage_result = evaluation.criteria_results.iter()
        .find(|r| r.criterion_type == "coverage")
        .unwrap();
    assert!(coverage_result.passed);
    assert_eq!(coverage_result.actual_value, 95.0);

    let performance_result = evaluation.criteria_results.iter()
        .find(|r| r.criterion_type == "performance")
        .unwrap();
    assert!(performance_result.passed);
    assert_eq!(performance_result.actual_value, 85.0);
}

/// 测试任务复杂度估算
#[test]
fn test_task_complexity_estimation() {
    let project_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let task = TaskModel {
        task_id: Uuid::new_v4(),
        project_id,
        parent_task_id: None,
        llm_session_id: None,
        title: "复杂开发任务".to_string(),
        description: "一个涉及多个模块和技术栈的复杂任务".to_string(),
        task_type: "development".to_string(),
        priority: "high".to_string(),
        required_capabilities: Some(json!(["rust", "typescript", "database", "api_design", "testing"])),
        acceptance_criteria: Some(json!([
            {"criterion": "模块A完成", "type": "feature", "weight": 0.3},
            {"criterion": "模块B完成", "type": "feature", "weight": 0.3},
            {"criterion": "集成测试通过", "type": "testing", "weight": 0.2},
            {"criterion": "API文档完成", "type": "documentation", "weight": 0.1},
            {"criterion": "性能优化", "type": "performance", "weight": 0.1}
        ])),
        estimated_hours: Some(24),
        assigned_agent_id: None,
        assignment_prompt: None,
        assigned_at: None,
        status: "pending".to_string(),
        started_at: None,
        completed_at: None,
        dependency_count: 3,
        blocking_tasks_count: 1,
        execution_result: None,
        created_at: now,
        updated_at: now,
    };

    // 测试复杂度计算
    let complexity = task.calculate_complexity_score();
    assert!(complexity >= 0.0 && complexity <= 10.0);
    
    // 复杂任务应该有较高的复杂度评分
    assert!(complexity > 6.0, "复杂任务的复杂度评分应该较高，实际得分: {}", complexity);

    // 测试工作量评估
    let effort = task.estimate_effort_multiplier();
    assert!(effort >= 1.0);
    
    // 复杂任务的工作量倍数应该大于1
    assert!(effort > 1.0, "复杂任务的工作量倍数应该大于1，实际倍数: {}", effort);
}