//! Agent技能档案增强功能测试

use uuid::Uuid;
use chrono::{DateTime, FixedOffset};
use serde_json::json;
use std::collections::HashMap;

use codex_database::entities::agent::{
    Entity as Agent, Model as AgentModel, ActiveModel as AgentActiveModel
};

/// 测试Agent技能档案的数据结构
#[test]
fn test_agent_skill_profile_structure() {
    let agent_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    // 创建技能档案JSON数据
    let skill_profile = json!({
        "programming_languages": {
            "rust": 8,
            "typescript": 7,
            "python": 6
        },
        "frameworks": {
            "tauri": 7,
            "react": 6,
            "fastapi": 5
        },
        "task_success_rate": 0.85,
        "average_completion_time": 4.2,
        "specialties": ["系统编程", "Web开发", "API设计"],
        "work_style_tags": ["快速迭代", "注重质量", "团队协作"],
        "last_updated": "2024-01-01T00:00:00Z"
    });

    let agent = AgentModel {
        agent_id,
        user_id,
        name: "高级开发Agent".to_string(),
        description: Some("专精Rust和Web开发的智能Agent".to_string()),
        prompt_template: "你是一个资深的Rust和Web开发专家...".to_string(),
        capabilities: json!(["BackendDevelopment", "FrontendDevelopment", "CodeReview"]),
        config: json!({}),
        git_config: None,
        status: "idle".to_string(),
        current_task_id: None,
        total_tasks_completed: 15,
        success_rate: 0.85,
        average_completion_time: 252, // 4.2小时 * 60分钟
        skill_profile: Some(skill_profile.clone()),
        skill_assessments: Some(json!([])),
        performance_trend: Some(json!({"trend": "improving", "score": 8.5})),
        created_at: now,
        updated_at: now,
        last_active_at: now,
    };

    assert_eq!(agent.agent_id, agent_id);
    assert!(agent.skill_profile.is_some());
    assert!(agent.skill_assessments.is_some());
    assert!(agent.performance_trend.is_some());
    
    // 验证技能档案数据结构
    let skill_data = agent.skill_profile.unwrap();
    assert!(skill_data["programming_languages"]["rust"] == 8);
    assert!(skill_data["frameworks"]["tauri"] == 7);
    assert!(skill_data["task_success_rate"] == 0.85);
    assert_eq!(skill_data["specialties"].as_array().unwrap().len(), 3);
}

/// 测试Agent技能档案的业务方法
#[test]
fn test_agent_skill_business_methods() {
    let mut agent = create_test_agent_with_skills();

    // 测试技能等级获取
    let rust_level = agent.get_skill_level("rust");
    assert_eq!(rust_level, Some(8));

    let unknown_skill = agent.get_skill_level("golang");
    assert_eq!(unknown_skill, None);

    // 测试技能更新
    agent.update_skill_level("rust", 9);
    let updated_rust_level = agent.get_skill_level("rust");
    assert_eq!(updated_rust_level, Some(9));

    // 测试新技能添加
    agent.add_new_skill("golang", 5);
    let golang_level = agent.get_skill_level("golang");
    assert_eq!(golang_level, Some(5));

    // 测试专长领域管理
    agent.add_specialty("微服务架构");
    let specialties = agent.get_specialties();
    assert!(specialties.contains(&"微服务架构".to_string()));

    // 测试成功率计算
    let success_rate = agent.calculate_current_success_rate();
    assert!(success_rate >= 0.0 && success_rate <= 1.0);
}

/// 测试Agent技能评估功能
#[test]
fn test_agent_skill_assessment() {
    let mut agent = create_test_agent_with_skills();

    // 模拟任务完成后的技能评估
    let task_id = Uuid::new_v4();
    let task_type = "backend_development";
    let technologies_used = vec!["rust".to_string(), "sea-orm".to_string()];
    let success = true;
    let quality_score = 8.5;

    agent.record_task_completion(task_id, task_type, technologies_used, success, quality_score);

    // 验证技能评估记录
    let assessments = agent.get_skill_assessments();
    assert!(!assessments.is_empty());

    // 检查最新评估记录
    let latest_assessment = &assessments[assessments.len() - 1];
    assert_eq!(latest_assessment.task_id, task_id);
    assert_eq!(latest_assessment.success, success);
    assert_eq!(latest_assessment.quality_score, quality_score);
}

/// 测试Agent匹配评分计算
#[test]
fn test_agent_task_matching_score() {
    let agent = create_test_agent_with_skills();

    // 测试完全匹配的任务
    let required_skills = vec!["rust".to_string(), "tauri".to_string()];
    let match_score = agent.calculate_task_match_score(&required_skills);
    assert!(match_score > 0.8);

    // 测试部分匹配的任务
    let partial_skills = vec!["rust".to_string(), "golang".to_string()];
    let partial_score = agent.calculate_task_match_score(&partial_skills);
    assert!(partial_score > 0.0 && partial_score < match_score);

    // 测试无匹配技能的任务
    let no_match_skills = vec!["java".to_string(), "spring".to_string()];
    let no_match_score = agent.calculate_task_match_score(&no_match_skills);
    assert_eq!(no_match_score, 0.0);
}

/// 测试Agent性能趋势分析
#[test]
fn test_agent_performance_trend() {
    let mut agent = create_test_agent_with_skills();

    // 记录多个任务完成情况
    let tasks = vec![
        (true, 8.0),   // 成功，高质量
        (true, 7.5),   // 成功，良好质量
        (false, 5.0),  // 失败，低质量
        (true, 9.0),   // 成功，优秀质量
        (true, 8.5),   // 成功，高质量
    ];

    for (_i, (success, quality)) in tasks.iter().enumerate() {
        let task_id = Uuid::new_v4();
        agent.record_task_completion(
            task_id,
            "development",
            vec!["rust".to_string()],
            *success,
            *quality,
        );
    }

    // 计算性能趋势
    let trend = agent.calculate_performance_trend();
    assert!(trend.current_score > 0.0);
    assert!(!trend.trend_direction.is_empty());
    assert!(trend.improvement_suggestions.len() > 0);
}

/// 辅助函数：创建带有技能档案的测试Agent
fn create_test_agent_with_skills() -> AgentModel {
    let agent_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let skill_profile = json!({
        "programming_languages": {
            "rust": 8,
            "typescript": 7,
            "python": 6
        },
        "frameworks": {
            "tauri": 7,
            "react": 6,
            "fastapi": 5
        },
        "task_success_rate": 0.85,
        "average_completion_time": 4.2,
        "specialties": ["系统编程", "Web开发", "API设计"],
        "work_style_tags": ["快速迭代", "注重质量", "团队协作"],
        "last_updated": "2024-01-01T00:00:00Z"
    });

    AgentModel {
        agent_id,
        user_id,
        name: "测试Agent".to_string(),
        description: Some("用于测试的Agent".to_string()),
        prompt_template: "测试提示词".to_string(),
        capabilities: json!(["BackendDevelopment", "FrontendDevelopment"]),
        config: json!({}),
        git_config: None,
        status: "idle".to_string(),
        current_task_id: None,
        total_tasks_completed: 10,
        success_rate: 0.85,
        average_completion_time: 252,
        skill_profile: Some(skill_profile),
        skill_assessments: Some(json!([])),
        performance_trend: Some(json!({"trend": "stable", "score": 8.0})),
        created_at: now,
        updated_at: now,
        last_active_at: now,
    }
}