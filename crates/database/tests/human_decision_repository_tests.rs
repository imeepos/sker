//! 人工决策Repository测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{
        HumanDecisionRepository, ConflictRepository, UserRepository,
        user_repository::CreateUserData,
        conflict_repository::CreateConflictData,
        human_decision_repository::CreateHumanDecisionData,
    },
    entities::{
        conflict::{ConflictType, ConflictSeverity},
        human_decision::DecisionType,
    },
};
use serde_json::json;
use uuid::Uuid;

mod common;

/// 创建测试用户的辅助函数
async fn create_test_user(db: &codex_database::DatabaseConnection) -> Uuid {
    let repo = UserRepository::new(db.clone());
    let user_data = CreateUserData {
        username: format!("test_user_{}", &Uuid::new_v4().to_string()[..8]),
        email: format!("test_{}@example.com", &Uuid::new_v4().to_string()[..8]),
        password_hash: "password_hash".to_string(),
        profile_data: None,
        settings: None,
    };
    let user = repo.create(user_data).await.unwrap();
    user.user_id
}

/// 创建测试冲突的辅助函数
async fn create_test_conflict(db: &codex_database::DatabaseConnection) -> Uuid {
    let conflict_repo = ConflictRepository::new(db.clone());
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::High,
        title: "测试冲突".to_string(),
        description: "用于人工决策测试的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([]),
    };
    let conflict = conflict_repo.create(conflict_data).await.unwrap();
    conflict.conflict_id
}

#[tokio::test]
async fn test_create_human_decision() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    let decision_data = CreateHumanDecisionData {
        conflict_id,
        user_id,
        decision_type: DecisionType::Approve.to_string(),
        decision_data: Some(json!({
            "selected_option": "merge_strategy_a",
            "parameters": {
                "preserve_history": true,
                "squash_commits": false
            }
        })),
        reasoning: Some("策略A能更好地保持代码历史".to_string()),
        affected_entities: json!({
            "tasks": ["task_1", "task_2"],
            "files": ["src/main.rs", "tests/integration.rs"]
        }),
        follow_up_actions: json!([
            {
                "action": "notify_team",
                "target": "development_team",
                "message": "冲突已解决，请继续开发"
            },
            {
                "action": "update_documentation",
                "target": "conflict_resolution_log"
            }
        ]),
    };
    
    let decision = decision_repo.create(decision_data).await.unwrap();
    
    assert_eq!(decision.conflict_id, conflict_id);
    assert_eq!(decision.user_id, user_id);
    assert_eq!(decision.decision_type, DecisionType::Approve.to_string());
    assert!(decision.decision_data.is_some());
    assert_eq!(decision.reasoning, Some("策略A能更好地保持代码历史".to_string()));
    assert!(decision.created_at.naive_utc() <= chrono::Utc::now().naive_utc());
}

#[tokio::test]
async fn test_find_decision_by_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    let decision_data = CreateHumanDecisionData {
        conflict_id,
        user_id,
        decision_type: DecisionType::Reject.to_string(),
        decision_data: Some(json!({
            "rejection_reason": "proposed_solution_insufficient",
            "alternative_suggestions": ["strategy_b", "strategy_c"]
        })),
        reasoning: Some("当前方案风险太高".to_string()),
        affected_entities: json!({}),
        follow_up_actions: json!([]),
    };
    
    let created_decision = decision_repo.create(decision_data).await.unwrap();
    
    let found_decision = decision_repo
        .find_by_id(created_decision.decision_id)
        .await.unwrap()
        .unwrap();
    
    assert_eq!(found_decision.decision_id, created_decision.decision_id);
    assert_eq!(found_decision.decision_type, DecisionType::Reject.to_string());
    assert_eq!(found_decision.reasoning, Some("当前方案风险太高".to_string()));
}

#[tokio::test]
async fn test_find_decisions_by_conflict_id() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 为同一个冲突创建多个决策
    let decision_types = vec![
        (DecisionType::Approve, "初始批准"),
        (DecisionType::Modify, "修改方案"),
        (DecisionType::Approve, "最终批准"),
    ];
    
    for (decision_type, reasoning) in decision_types {
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            user_id,
            decision_type: decision_type.to_string(),
            decision_data: Some(json!({
                "step": reasoning,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })),
            reasoning: Some(reasoning.to_string()),
            affected_entities: json!({}),
            follow_up_actions: json!([]),
        };
        decision_repo.create(decision_data).await.unwrap();
    }
    
    let decisions = decision_repo.find_by_conflict_id(conflict_id).await.unwrap();
    
    assert_eq!(decisions.len(), 3);
    for decision in &decisions {
        assert_eq!(decision.conflict_id, conflict_id);
    }
    
    // 验证按时间倒序排列
    assert!(decisions[0].created_at >= decisions[1].created_at);
    assert!(decisions[1].created_at >= decisions[2].created_at);
}

#[tokio::test]
async fn test_find_decisions_by_user_id() {
    let db = setup_test_db().await;
    
    let user1_id = create_test_user(&db).await;
    let user2_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 为不同用户创建决策
    let user_decisions = vec![
        (user1_id, "用户1的决策1"),
        (user1_id, "用户1的决策2"),
        (user2_id, "用户2的决策1"),
        (user1_id, "用户1的决策3"),
    ];
    
    for (user_id, reasoning) in user_decisions {
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            user_id,
            decision_type: DecisionType::Approve.to_string(),
            decision_data: Some(json!({
                "user_specific_data": reasoning
            })),
            reasoning: Some(reasoning.to_string()),
            affected_entities: json!({}),
            follow_up_actions: json!([]),
        };
        decision_repo.create(decision_data).await.unwrap();
    }
    
    // 查找用户1的决策
    let user1_decisions = decision_repo.find_by_user_id(user1_id).await.unwrap();
    assert_eq!(user1_decisions.len(), 3);
    for decision in user1_decisions {
        assert_eq!(decision.user_id, user1_id);
    }
    
    // 查找用户2的决策
    let user2_decisions = decision_repo.find_by_user_id(user2_id).await.unwrap();
    assert_eq!(user2_decisions.len(), 1);
    assert_eq!(user2_decisions[0].user_id, user2_id);
}

#[tokio::test]
async fn test_find_decisions_by_decision_type() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 创建不同类型的决策
    let decision_types = vec![
        DecisionType::Approve,
        DecisionType::Reject,
        DecisionType::Modify,
        DecisionType::Escalate,
        DecisionType::Approve, // 再创建一个Approve
    ];
    
    for decision_type in decision_types {
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            user_id,
            decision_type: decision_type.to_string(),
            decision_data: Some(json!({
                "type": decision_type.to_string()
            })),
            reasoning: Some(format!("{}类型的决策", decision_type)),
            affected_entities: json!({}),
            follow_up_actions: json!([]),
        };
        decision_repo.create(decision_data).await.unwrap();
    }
    
    // 查找批准类型的决策
    let approve_decisions = decision_repo
        .find_by_decision_type(&DecisionType::Approve.to_string())
        .await.unwrap();
    
    assert_eq!(approve_decisions.len(), 2);
    for decision in approve_decisions {
        assert_eq!(decision.decision_type, DecisionType::Approve.to_string());
    }
    
    // 查找拒绝类型的决策
    let reject_decisions = decision_repo
        .find_by_decision_type(&DecisionType::Reject.to_string())
        .await.unwrap();
    
    assert_eq!(reject_decisions.len(), 1);
    assert_eq!(reject_decisions[0].decision_type, DecisionType::Reject.to_string());
}

#[tokio::test]
async fn test_decision_with_complex_data() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 创建包含复杂数据的决策
    let complex_decision_data = json!({
        "resolution_strategy": {
            "type": "merge_with_modifications",
            "base_branch": "main",
            "feature_branch": "feature/new-api",
            "modifications": [
                {
                    "file": "src/api/mod.rs",
                    "action": "keep_feature_version",
                    "reason": "feature版本包含新功能"
                },
                {
                    "file": "tests/integration.rs",
                    "action": "merge_both",
                    "conflict_resolution": "manual_review_required"
                }
            ]
        },
        "performance_impact": {
            "estimated_cpu_increase": "5%",
            "memory_usage": "stable",
            "breaking_changes": false
        },
        "rollback_plan": {
            "commit_hash": "abc123def456",
            "automated_tests": true,
            "manual_verification_steps": [
                "verify_api_endpoints",
                "check_database_migrations",
                "validate_user_workflows"
            ]
        }
    });
    
    let complex_affected_entities = json!({
        "repositories": ["main-api", "frontend-app"],
        "services": ["user-service", "notification-service"],
        "databases": ["primary_db", "cache_db"],
        "third_party_integrations": ["payment_gateway", "analytics_service"]
    });
    
    let complex_follow_up_actions = json!([
        {
            "action": "deploy_to_staging",
            "priority": "high",
            "estimated_duration": "30_minutes",
            "prerequisites": ["run_full_test_suite", "backup_production_data"]
        },
        {
            "action": "notify_stakeholders",
            "recipients": ["product_manager", "qa_team", "devops_team"],
            "template": "conflict_resolution_notification",
            "include_technical_details": true
        },
        {
            "action": "schedule_production_deployment",
            "window": "next_maintenance_window",
            "approval_required": true,
            "rollback_threshold": "error_rate_above_1_percent"
        }
    ]);
    
    let decision_data = CreateHumanDecisionData {
        conflict_id,
        user_id,
        decision_type: DecisionType::Modify.to_string(),
        decision_data: Some(complex_decision_data.clone()),
        reasoning: Some("经过详细分析，采用修改合并策略能最好地平衡功能需求和系统稳定性".to_string()),
        affected_entities: complex_affected_entities.clone(),
        follow_up_actions: complex_follow_up_actions.clone(),
    };
    
    let decision = decision_repo.create(decision_data).await.unwrap();
    
    assert_eq!(decision.decision_data, Some(complex_decision_data));
    assert_eq!(decision.affected_entities, complex_affected_entities);
    assert_eq!(decision.follow_up_actions, complex_follow_up_actions);
}

#[tokio::test]
async fn test_decision_statistics() {
    let db = setup_test_db().await;
    
    let user1_id = create_test_user(&db).await;
    let user2_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 创建不同类型的决策用于统计
    let decisions_config = vec![
        (user1_id, DecisionType::Approve),
        (user1_id, DecisionType::Approve),
        (user1_id, DecisionType::Reject),
        (user2_id, DecisionType::Modify),
        (user2_id, DecisionType::Escalate),
        (user1_id, DecisionType::Approve),
    ];
    
    for (user_id, decision_type) in decisions_config {
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            user_id,
            decision_type: decision_type.to_string(),
            decision_data: Some(json!({
                "automated": false,
                "complexity": "medium"
            })),
            reasoning: Some(format!("{}决策的原因", decision_type)),
            affected_entities: json!({}),
            follow_up_actions: json!([]),
        };
        decision_repo.create(decision_data).await.unwrap();
    }
    
    // 获取决策统计
    let stats = decision_repo.get_decision_statistics().await.unwrap();
    
    assert_eq!(stats.total_decisions, 6);
    assert_eq!(stats.decisions_by_type.get(&DecisionType::Approve.to_string()), Some(&3));
    assert_eq!(stats.decisions_by_type.get(&DecisionType::Reject.to_string()), Some(&1));
    assert_eq!(stats.decisions_by_type.get(&DecisionType::Modify.to_string()), Some(&1));
    assert_eq!(stats.decisions_by_type.get(&DecisionType::Escalate.to_string()), Some(&1));
    
    assert_eq!(stats.decisions_by_user.get(&user1_id.to_string()), Some(&4));
    assert_eq!(stats.decisions_by_user.get(&user2_id.to_string()), Some(&2));
    
    // 验证批准率
    let expected_approval_rate = 3.0 / 6.0;
    assert!((stats.approval_rate - expected_approval_rate).abs() < 0.001);
}

#[tokio::test]
async fn test_decision_time_analysis() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 创建一系列决策来分析时间模式
    for i in 0..5 {
        let decision_data = CreateHumanDecisionData {
            conflict_id,
            user_id,
            decision_type: DecisionType::Approve.to_string(),
            decision_data: Some(json!({
                "sequence": i,
                "batch": "time_analysis"
            })),
            reasoning: Some(format!("时间分析决策 {}", i + 1)),
            affected_entities: json!({}),
            follow_up_actions: json!([]),
        };
        decision_repo.create(decision_data).await.unwrap();
        
        // 添加小延迟确保不同的时间戳
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
    }
    
    // 获取时间范围内的决策
    let now = chrono::Utc::now();
    let one_hour_ago = now - chrono::Duration::hours(1);
    
    let recent_decisions = decision_repo
        .find_decisions_in_time_range(
            one_hour_ago,
            now,
        )
        .await.unwrap();
    
    assert_eq!(recent_decisions.len(), 5);
    
    // 验证时间排序
    for i in 1..recent_decisions.len() {
        assert!(recent_decisions[i-1].created_at >= recent_decisions[i].created_at);
    }
    
    // 获取决策频率分析
    let frequency_stats = decision_repo
        .get_decision_frequency_by_hour()
        .await.unwrap();
    
    assert!(frequency_stats.total_decisions >= 5);
    assert!(frequency_stats.average_decisions_per_hour > 0.0);
}

#[tokio::test]
async fn test_decision_update_operations() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 创建初始决策
    let decision_data = CreateHumanDecisionData {
        conflict_id,
        user_id,
        decision_type: DecisionType::Approve.to_string(),
        decision_data: Some(json!({
            "initial": true,
            "version": 1
        })),
        reasoning: Some("初始决策".to_string()),
        affected_entities: json!({"initial": "data"}),
        follow_up_actions: json!([{"action": "initial_action"}]),
    };
    
    let decision = decision_repo.create(decision_data).await.unwrap();
    
    // 更新决策数据
    let updated_decision_data = json!({
        "initial": false,
        "version": 2,
        "updated_at": chrono::Utc::now().to_rfc3339(),
        "additional_info": "经过进一步审查后的更新"
    });
    
    let updated_decision = decision_repo
        .update_decision_data(decision.decision_id, updated_decision_data.clone())
        .await.unwrap();
    
    assert_eq!(updated_decision.decision_data, Some(updated_decision_data));
    
    // 更新推理
    let new_reasoning = "经过团队讨论后，认为此方案最为合适".to_string();
    let updated_decision = decision_repo
        .update_reasoning(decision.decision_id, new_reasoning.clone())
        .await.unwrap();
    
    assert_eq!(updated_decision.reasoning, Some(new_reasoning));
    
    // 添加后续行动
    let additional_actions = json!([
        {"action": "schedule_review_meeting", "date": "2024-01-15"},
        {"action": "update_documentation", "priority": "medium"}
    ]);
    
    let updated_decision = decision_repo
        .add_follow_up_actions(decision.decision_id, additional_actions.clone())
        .await.unwrap();
    
    // 验证后续行动已添加（应该合并到现有的actions中）
    assert!(updated_decision.follow_up_actions.as_array().unwrap().len() >= 2);
}

#[tokio::test]
async fn test_delete_decision() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    let decision_data = CreateHumanDecisionData {
        conflict_id,
        user_id,
        decision_type: DecisionType::Approve.to_string(),
        decision_data: Some(json!({"test": "data"})),
        reasoning: Some("待删除的决策".to_string()),
        affected_entities: json!({}),
        follow_up_actions: json!([]),
    };
    
    let decision = decision_repo.create(decision_data).await.unwrap();
    
    // 验证决策存在
    let found_decision = decision_repo
        .find_by_id(decision.decision_id)
        .await.unwrap();
    assert!(found_decision.is_some());
    
    // 删除决策
    decision_repo.delete(decision.decision_id).await.unwrap();
    
    // 验证决策已删除
    let found_decision = decision_repo
        .find_by_id(decision.decision_id)
        .await.unwrap();
    assert!(found_decision.is_none());
}

#[tokio::test]
async fn test_decision_audit_trail() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_id = create_test_conflict(&db).await;
    
    let decision_repo = HumanDecisionRepository::new(db.clone());
    
    // 创建决策演进过程（模拟审计跟踪）
    let decision_evolution = vec![
        (DecisionType::Escalate, "需要更多信息", json!({"status": "pending_info"})),
        (DecisionType::Modify, "提出修改建议", json!({"modifications": ["change_a", "change_b"]})),
        (DecisionType::Approve, "修改后批准", json!({"final_approval": true, "conditions": ["monitor_performance"]})),
    ];
    
    let mut decision_ids = Vec::new();
    
    for (decision_type, reasoning, decision_data) in decision_evolution {
        let data = CreateHumanDecisionData {
            conflict_id,
            user_id,
            decision_type: decision_type.to_string(),
            decision_data: Some(decision_data),
            reasoning: Some(reasoning.to_string()),
            affected_entities: json!({"conflict_id": conflict_id.to_string()}),
            follow_up_actions: json!([{
                "action": "record_decision",
                "type": decision_type.to_string()
            }]),
        };
        
        let decision = decision_repo.create(data).await.unwrap();
        decision_ids.push(decision.decision_id);
        
        // 小延迟确保时间顺序
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
    }
    
    // 获取冲突的完整决策历史
    let decision_history = decision_repo.find_by_conflict_id(conflict_id).await.unwrap();
    
    assert_eq!(decision_history.len(), 3);
    
    // 验证决策按时间倒序排列
    assert_eq!(decision_history[0].decision_type, DecisionType::Approve.to_string());
    assert_eq!(decision_history[1].decision_type, DecisionType::Modify.to_string());
    assert_eq!(decision_history[2].decision_type, DecisionType::Escalate.to_string());
    
    // 验证每个决策都有正确的推理和数据
    for decision in &decision_history {
        assert!(decision.reasoning.is_some());
        assert!(decision.decision_data.is_some());
        assert!(decision.follow_up_actions.as_array().unwrap().len() > 0);
    }
    
    // 获取决策路径分析
    let decision_path = decision_repo
        .analyze_decision_path(conflict_id)
        .await.unwrap();
    
    assert_eq!(decision_path.total_decisions, 3);
    assert_eq!(decision_path.decision_sequence.len(), 3);
    assert!(decision_path.average_time_between_decisions > 0);
    
    // 验证最终决策状态
    assert_eq!(decision_path.final_decision_type, DecisionType::Approve.to_string());
    assert!(decision_path.is_resolved);
}