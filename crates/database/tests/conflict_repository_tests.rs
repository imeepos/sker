//! 冲突Repository测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{
        ConflictRepository, UserRepository,
        user_repository::CreateUserData,
        conflict_repository::{CreateConflictData, ConflictFilter},
    },
    entities::conflict::{ConflictType, ConflictSeverity, ConflictStatus},
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

#[tokio::test]
async fn test_create_conflict() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::High,
        title: "任务依赖冲突".to_string(),
        description: "任务A和任务B之间存在循环依赖".to_string(),
        related_entities: json!({
            "tasks": ["task_1", "task_2"],
            "dependencies": ["dep_1", "dep_2"]
        }),
        affected_tasks: json!(["task_1", "task_2"]),
        affected_agents: json!(["agent_1"]),
    };
    
    let conflict = conflict_repo.create(conflict_data).await.unwrap();
    
    assert_eq!(conflict.conflict_type, ConflictType::TaskDependency.to_string());
    assert_eq!(conflict.severity, ConflictSeverity::High.to_string());
    assert_eq!(conflict.title, "任务依赖冲突");
    assert_eq!(conflict.status, ConflictStatus::Detected.to_string());
    assert_eq!(conflict.escalated_to_human, false);
    assert_eq!(conflict.auto_resolved, false);
    assert!(conflict.detected_at.naive_utc() <= chrono::Utc::now().naive_utc());
}

#[tokio::test]
async fn test_find_conflict_by_id() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::Resource,
        severity: ConflictSeverity::Medium,
        title: "资源争用冲突".to_string(),
        description: "多个Agent同时请求相同资源".to_string(),
        related_entities: json!({
            "resource": "database_connection",
            "requesters": ["agent_1", "agent_2"]
        }),
        affected_tasks: json!(["task_1", "task_2"]),
        affected_agents: json!(["agent_1", "agent_2"]),
    };
    
    let created_conflict = conflict_repo.create(conflict_data).await.unwrap();
    
    let found_conflict = conflict_repo
        .find_by_id(created_conflict.conflict_id)
        .await.unwrap()
        .unwrap();
    
    assert_eq!(found_conflict.conflict_id, created_conflict.conflict_id);
    assert_eq!(found_conflict.title, "资源争用冲突");
}

#[tokio::test]
async fn test_find_conflicts_by_type() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建不同类型的冲突
    let conflict_types = vec![
        (ConflictType::TaskDependency, "依赖冲突1"),
        (ConflictType::Resource, "资源冲突1"),
        (ConflictType::TaskDependency, "依赖冲突2"),
        (ConflictType::GitMerge, "Git冲突1"),
    ];
    
    for (conflict_type, title) in conflict_types {
        let conflict_data = CreateConflictData {
            conflict_type,
            severity: ConflictSeverity::Medium,
            title: title.to_string(),
            description: format!("{}的描述", title),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        conflict_repo.create(conflict_data).await.unwrap();
    }
    
    // 查找TaskDependency类型的冲突
    let dependency_conflicts = conflict_repo
        .find_by_type(ConflictType::TaskDependency)
        .await.unwrap();
    
    assert_eq!(dependency_conflicts.len(), 2);
    for conflict in dependency_conflicts {
        assert_eq!(conflict.conflict_type, ConflictType::TaskDependency.to_string());
    }
    
    // 查找GitMergeConflict类型的冲突
    let git_conflicts = conflict_repo
        .find_by_type(ConflictType::GitMerge)
        .await.unwrap();
    
    assert_eq!(git_conflicts.len(), 1);
    assert_eq!(git_conflicts[0].title, "Git冲突1");
}

#[tokio::test]
async fn test_find_conflicts_by_severity() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建不同严重性的冲突
    let severities = vec![
        (ConflictSeverity::Low, "低严重性冲突"),
        (ConflictSeverity::Medium, "中等严重性冲突"),
        (ConflictSeverity::High, "高严重性冲突"),
        (ConflictSeverity::Critical, "严重冲突"),
        (ConflictSeverity::High, "另一个高严重性冲突"),
    ];
    
    for (severity, title) in severities {
        let conflict_data = CreateConflictData {
            conflict_type: ConflictType::TaskDependency,
            severity,
            title: title.to_string(),
            description: format!("{}的描述", title),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        conflict_repo.create(conflict_data).await.unwrap();
    }
    
    // 查找高严重性冲突
    let high_severity_conflicts = conflict_repo
        .find_by_severity(ConflictSeverity::High)
        .await.unwrap();
    
    assert_eq!(high_severity_conflicts.len(), 2);
    for conflict in high_severity_conflicts {
        assert_eq!(conflict.severity, ConflictSeverity::High.to_string());
    }
    
    // 查找严重冲突
    let critical_conflicts = conflict_repo
        .find_by_severity(ConflictSeverity::Critical)
        .await.unwrap();
    
    assert_eq!(critical_conflicts.len(), 1);
    assert_eq!(critical_conflicts[0].title, "严重冲突");
}

#[tokio::test]
async fn test_find_conflicts_by_status() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建冲突
    let mut conflicts = Vec::new();
    for i in 0..5 {
        let conflict_data = CreateConflictData {
            conflict_type: ConflictType::TaskDependency,
            severity: ConflictSeverity::Medium,
            title: format!("冲突 {}", i + 1),
            description: format!("冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        let conflict = conflict_repo.create(conflict_data).await.unwrap();
        conflicts.push(conflict);
    }
    
    // 将一些冲突升级
    conflict_repo.escalate_to_human(conflicts[0].conflict_id, None).await.unwrap();
    conflict_repo.escalate_to_human(conflicts[1].conflict_id, None).await.unwrap();
    
    // 解决一个冲突
    conflict_repo.resolve_conflict(
        conflicts[2].conflict_id,
        "手动解决".to_string(),
        Some("通过重新安排任务解决".to_string()),
        false,
    ).await.unwrap();
    
    // 查找不同状态的冲突
    let detected_conflicts = conflict_repo
        .find_by_status(ConflictStatus::Detected)
        .await.unwrap();
    assert_eq!(detected_conflicts.len(), 2); // conflicts[3] 和 conflicts[4]
    
    let escalated_conflicts = conflict_repo
        .find_by_status(ConflictStatus::Escalated)
        .await.unwrap();
    assert_eq!(escalated_conflicts.len(), 2); // conflicts[0] 和 conflicts[1]
    
    let resolved_conflicts = conflict_repo
        .find_by_status(ConflictStatus::Resolved)
        .await.unwrap();
    assert_eq!(resolved_conflicts.len(), 1); // conflicts[2]
}

#[tokio::test]
async fn test_find_unresolved_conflicts() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建不同状态的冲突
    let mut conflicts = Vec::new();
    for i in 0..4 {
        let conflict_data = CreateConflictData {
            conflict_type: ConflictType::TaskDependency,
            severity: ConflictSeverity::Medium,
            title: format!("冲突 {}", i + 1),
            description: format!("冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        let conflict = conflict_repo.create(conflict_data).await.unwrap();
        conflicts.push(conflict);
    }
    
    // 解决一个冲突
    conflict_repo.resolve_conflict(
        conflicts[0].conflict_id,
        "自动解决".to_string(),
        None,
        true,
    ).await.unwrap();
    
    // 忽略一个冲突
    conflict_repo.ignore_conflict(
        conflicts[1].conflict_id,
        "不重要".to_string(),
    ).await.unwrap();
    
    // 查找未解决的冲突
    let unresolved_conflicts = conflict_repo.find_unresolved().await.unwrap();
    
    assert_eq!(unresolved_conflicts.len(), 2); // conflicts[2] 和 conflicts[3]
    for conflict in unresolved_conflicts {
        assert_ne!(conflict.status, ConflictStatus::Resolved.to_string());
        assert_ne!(conflict.status, ConflictStatus::Ignored.to_string());
    }
}

#[tokio::test]
async fn test_escalate_to_human() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_repo = ConflictRepository::new(db.clone());
    
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::High,
        title: "需要人工干预的冲突".to_string(),
        description: "自动化无法解决的复杂冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([]),
    };
    
    let conflict = conflict_repo.create(conflict_data).await.unwrap();
    
    // 升级到人工处理
    let escalated_conflict = conflict_repo
        .escalate_to_human(conflict.conflict_id, Some(user_id))
        .await.unwrap();
    
    assert_eq!(escalated_conflict.status, ConflictStatus::Escalated.to_string());
    assert_eq!(escalated_conflict.escalated_to_human, true);
    assert_eq!(escalated_conflict.assigned_user_id, Some(user_id));
    assert!(escalated_conflict.escalated_at.is_some());
}

#[tokio::test]
async fn test_resolve_conflict() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::Resource,
        severity: ConflictSeverity::Medium,
        title: "可解决的冲突".to_string(),
        description: "通过重新分配资源可以解决的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([]),
    };
    
    let conflict = conflict_repo.create(conflict_data).await.unwrap();
    
    // 解决冲突
    let resolution_strategy = "重新分配资源".to_string();
    let resolution_note = "将数据库连接分配给优先级更高的任务".to_string();
    
    let resolved_conflict = conflict_repo.resolve_conflict(
        conflict.conflict_id,
        resolution_strategy.clone(),
        Some(resolution_note.clone()),
        false, // 非自动解决
    ).await.unwrap();
    
    assert_eq!(resolved_conflict.status, ConflictStatus::Resolved.to_string());
    assert_eq!(resolved_conflict.resolution_strategy, Some(resolution_strategy));
    assert_eq!(resolved_conflict.resolution_note, Some(resolution_note));
    assert_eq!(resolved_conflict.auto_resolved, false);
    assert!(resolved_conflict.resolved_at.is_some());
}

#[tokio::test]
async fn test_ignore_conflict() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::Low,
        title: "可忽略的冲突".to_string(),
        description: "影响很小的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([]),
    };
    
    let conflict = conflict_repo.create(conflict_data).await.unwrap();
    
    // 忽略冲突
    let reason = "影响范围有限，暂时忽略".to_string();
    let ignored_conflict = conflict_repo
        .ignore_conflict(conflict.conflict_id, reason.clone())
        .await.unwrap();
    
    assert_eq!(ignored_conflict.status, ConflictStatus::Ignored.to_string());
    assert!(ignored_conflict.resolution_note.is_some());
    assert!(ignored_conflict.resolution_note.as_ref().unwrap().contains(&reason));
    assert!(ignored_conflict.resolved_at.is_some());
}

#[tokio::test]
async fn test_find_requiring_human_intervention() {
    let db = setup_test_db().await;
    
    let user_id = create_test_user(&db).await;
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建多个冲突
    let mut conflicts = Vec::new();
    for i in 0..5 {
        let conflict_data = CreateConflictData {
            conflict_type: ConflictType::TaskDependency,
            severity: if i < 2 { ConflictSeverity::High } else { ConflictSeverity::Medium },
            title: format!("冲突 {}", i + 1),
            description: format!("冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        let conflict = conflict_repo.create(conflict_data).await.unwrap();
        conflicts.push(conflict);
    }
    
    // 将前3个冲突升级到人工处理
    for i in 0..3 {
        conflict_repo.escalate_to_human(conflicts[i].conflict_id, Some(user_id)).await.unwrap();
    }
    
    // 查找需要人工干预的冲突
    let human_intervention_conflicts = conflict_repo
        .find_requiring_human_intervention()
        .await.unwrap();
    
    assert_eq!(human_intervention_conflicts.len(), 3);
    for conflict in human_intervention_conflicts {
        assert_eq!(conflict.escalated_to_human, true);
        assert_eq!(conflict.status, ConflictStatus::Escalated.to_string());
    }
}

#[tokio::test]
async fn test_find_assigned_to_user() {
    let db = setup_test_db().await;
    
    let user1_id = create_test_user(&db).await;
    let user2_id = create_test_user(&db).await;
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建多个冲突
    let mut conflicts = Vec::new();
    for i in 0..4 {
        let conflict_data = CreateConflictData {
            conflict_type: ConflictType::TaskDependency,
            severity: ConflictSeverity::Medium,
            title: format!("冲突 {}", i + 1),
            description: format!("冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        let conflict = conflict_repo.create(conflict_data).await.unwrap();
        conflicts.push(conflict);
    }
    
    // 分配冲突给不同用户
    conflict_repo.escalate_to_human(conflicts[0].conflict_id, Some(user1_id)).await.unwrap();
    conflict_repo.escalate_to_human(conflicts[1].conflict_id, Some(user1_id)).await.unwrap();
    conflict_repo.escalate_to_human(conflicts[2].conflict_id, Some(user2_id)).await.unwrap();
    // conflicts[3] 不分配
    
    // 解决user1的一个冲突
    conflict_repo.resolve_conflict(
        conflicts[0].conflict_id,
        "手动解决".to_string(),
        None,
        false,
    ).await.unwrap();
    
    // 查找分配给user1的冲突（只包括未解决的）
    let user1_conflicts = conflict_repo
        .find_assigned_to_user(user1_id)
        .await.unwrap();
    
    assert_eq!(user1_conflicts.len(), 1); // 只有conflicts[1]，conflicts[0]已解决
    assert_eq!(user1_conflicts[0].conflict_id, conflicts[1].conflict_id);
    
    // 查找分配给user2的冲突
    let user2_conflicts = conflict_repo
        .find_assigned_to_user(user2_id)
        .await.unwrap();
    
    assert_eq!(user2_conflicts.len(), 1);
    assert_eq!(user2_conflicts[0].conflict_id, conflicts[2].conflict_id);
}

#[tokio::test]
async fn test_conflict_pagination() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建多个冲突
    for i in 0..15 {
        let conflict_data = CreateConflictData {
            conflict_type: if i % 2 == 0 { ConflictType::TaskDependency } else { ConflictType::Resource },
            severity: match i % 3 {
                0 => ConflictSeverity::Low,
                1 => ConflictSeverity::Medium,
                _ => ConflictSeverity::High,
            },
            title: format!("分页冲突 {}", i + 1),
            description: format!("分页冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        conflict_repo.create(conflict_data).await.unwrap();
    }
    
    // 测试分页查询
    let (conflicts_page1, total_pages) = conflict_repo
        .find_with_pagination(0, 5, None)
        .await.unwrap();
    
    assert_eq!(conflicts_page1.len(), 5);
    assert_eq!(total_pages, 3); // 15条记录，每页5条，共3页
    
    // 测试第二页
    let (conflicts_page2, _) = conflict_repo
        .find_with_pagination(1, 5, None)
        .await.unwrap();
    
    assert_eq!(conflicts_page2.len(), 5);
    
    // 验证不同页的冲突不重复
    let page1_ids: Vec<_> = conflicts_page1.iter().map(|c| c.conflict_id).collect();
    let page2_ids: Vec<_> = conflicts_page2.iter().map(|c| c.conflict_id).collect();
    
    for id in &page1_ids {
        assert!(!page2_ids.contains(id));
    }
}

#[tokio::test]
async fn test_conflict_pagination_with_filter() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建不同类型和严重性的冲突
    let conflict_configs = vec![
        (ConflictType::TaskDependency, ConflictSeverity::High),
        (ConflictType::TaskDependency, ConflictSeverity::Medium),
        (ConflictType::Resource, ConflictSeverity::High),
        (ConflictType::TaskDependency, ConflictSeverity::Low),
        (ConflictType::GitMerge, ConflictSeverity::High),
        (ConflictType::TaskDependency, ConflictSeverity::High),
    ];
    
    for (i, (conflict_type, severity)) in conflict_configs.iter().enumerate() {
        let conflict_data = CreateConflictData {
            conflict_type: *conflict_type,
            severity: *severity,
            title: format!("过滤冲突 {}", i + 1),
            description: format!("过滤冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        conflict_repo.create(conflict_data).await.unwrap();
    }
    
    // 测试按类型和严重性过滤
    let filter = ConflictFilter {
        conflict_type: Some(ConflictType::TaskDependency),
        severity: Some(ConflictSeverity::High),
        status: None,
        escalated_to_human: None,
    };
    
    let (filtered_conflicts, _) = conflict_repo
        .find_with_pagination(0, 10, Some(filter))
        .await.unwrap();
    
    assert_eq!(filtered_conflicts.len(), 2); // 索引0和5
    for conflict in filtered_conflicts {
        assert_eq!(conflict.conflict_type, ConflictType::TaskDependency.to_string());
        assert_eq!(conflict.severity, ConflictSeverity::High.to_string());
    }
}

#[tokio::test]
async fn test_conflict_statistics() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    // 创建不同类型和状态的冲突
    let conflict_configs = vec![
        (ConflictType::TaskDependency, ConflictSeverity::High),
        (ConflictType::TaskDependency, ConflictSeverity::Medium),
        (ConflictType::Resource, ConflictSeverity::High),
        (ConflictType::GitMerge, ConflictSeverity::Low),
        (ConflictType::TaskDependency, ConflictSeverity::Critical),
    ];
    
    let mut conflicts = Vec::new();
    for (i, (conflict_type, severity)) in conflict_configs.iter().enumerate() {
        let conflict_data = CreateConflictData {
            conflict_type: *conflict_type,
            severity: *severity,
            title: format!("统计冲突 {}", i + 1),
            description: format!("统计冲突 {} 的描述", i + 1),
            related_entities: json!({}),
            affected_tasks: json!([]),
            affected_agents: json!([]),
        };
        let conflict = conflict_repo.create(conflict_data).await.unwrap();
        conflicts.push(conflict);
    }
    
    // 解决一些冲突
    conflict_repo.resolve_conflict(
        conflicts[0].conflict_id,
        "自动解决".to_string(),
        None,
        true, // 自动解决
    ).await.unwrap();
    
    conflict_repo.resolve_conflict(
        conflicts[1].conflict_id,
        "手动解决".to_string(),
        None,
        false, // 手动解决
    ).await.unwrap();
    
    // 升级一个冲突
    conflict_repo.escalate_to_human(conflicts[2].conflict_id, None).await.unwrap();
    
    // 获取统计信息
    let stats = conflict_repo.get_conflict_statistics().await.unwrap();
    
    assert_eq!(stats.total_conflicts, 5);
    assert_eq!(stats.resolved_conflicts, 2);
    assert_eq!(stats.auto_resolved, 1);
    assert_eq!(stats.escalated_conflicts, 1);
    assert_eq!(stats.resolution_rate, 0.4); // 2/5
    assert_eq!(stats.auto_resolution_rate, 0.2); // 1/5
    
    // 验证按类型统计
    assert_eq!(stats.by_type.get(&ConflictType::TaskDependency.to_string()), Some(&3));
    assert_eq!(stats.by_type.get(&ConflictType::Resource.to_string()), Some(&1));
    assert_eq!(stats.by_type.get(&ConflictType::GitMerge.to_string()), Some(&1));
    
    // 验证按严重性统计
    assert_eq!(stats.by_severity.get(&ConflictSeverity::High.to_string()), Some(&2));
    assert_eq!(stats.by_severity.get(&ConflictSeverity::Medium.to_string()), Some(&1));
    assert_eq!(stats.by_severity.get(&ConflictSeverity::Low.to_string()), Some(&1));
    assert_eq!(stats.by_severity.get(&ConflictSeverity::Critical.to_string()), Some(&1));
}

#[tokio::test]
async fn test_find_affecting_task() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    let task_id = "task_123";
    
    // 创建影响特定任务的冲突
    let conflict_data1 = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::High,
        title: "影响任务的冲突1".to_string(),
        description: "影响task_123的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([task_id, "task_456"]),
        affected_agents: json!([]),
    };
    
    let conflict_data2 = CreateConflictData {
        conflict_type: ConflictType::Resource,
        severity: ConflictSeverity::Medium,
        title: "影响任务的冲突2".to_string(),
        description: "另一个影响task_123的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([task_id]),
        affected_agents: json!([]),
    };
    
    // 创建不影响该任务的冲突
    let conflict_data3 = CreateConflictData {
        conflict_type: ConflictType::GitMerge,
        severity: ConflictSeverity::Low,
        title: "不相关的冲突".to_string(),
        description: "不影响task_123的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!(["task_789"]),
        affected_agents: json!([]),
    };
    
    let conflict1 = conflict_repo.create(conflict_data1).await.unwrap();
    let conflict2 = conflict_repo.create(conflict_data2).await.unwrap();
    let _conflict3 = conflict_repo.create(conflict_data3).await.unwrap();
    
    // 解决一个冲突
    conflict_repo.resolve_conflict(
        conflict2.conflict_id,
        "已解决".to_string(),
        None,
        false,
    ).await.unwrap();
    
    // 查找影响特定任务的冲突（只包括未解决的）
    let affecting_conflicts = conflict_repo
        .find_affecting_task(task_id)
        .await.unwrap();
    
    assert_eq!(affecting_conflicts.len(), 1);
    assert_eq!(affecting_conflicts[0].conflict_id, conflict1.conflict_id);
}

#[tokio::test]
async fn test_find_affecting_agent() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    let agent_id = "agent_123";
    
    // 创建影响特定Agent的冲突
    let conflict_data1 = CreateConflictData {
        conflict_type: ConflictType::Resource,
        severity: ConflictSeverity::High,
        title: "影响Agent的冲突1".to_string(),
        description: "影响agent_123的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([agent_id, "agent_456"]),
    };
    
    let conflict_data2 = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::Medium,
        title: "影响Agent的冲突2".to_string(),
        description: "另一个影响agent_123的冲突".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([agent_id]),
    };
    
    let conflict1 = conflict_repo.create(conflict_data1).await.unwrap();
    let _conflict2 = conflict_repo.create(conflict_data2).await.unwrap();
    
    // 解决一个冲突
    conflict_repo.resolve_conflict(
        conflict1.conflict_id,
        "已解决".to_string(),
        None,
        false,
    ).await.unwrap();
    
    // 查找影响特定Agent的冲突（只包括未解决的）
    let affecting_conflicts = conflict_repo
        .find_affecting_agent(agent_id)
        .await.unwrap();
    
    assert_eq!(affecting_conflicts.len(), 1);
    assert_eq!(affecting_conflicts[0].title, "影响Agent的冲突2");
}

#[tokio::test]
async fn test_delete_conflict() {
    let db = setup_test_db().await;
    
    let conflict_repo = ConflictRepository::new(db.clone());
    
    let conflict_data = CreateConflictData {
        conflict_type: ConflictType::TaskDependency,
        severity: ConflictSeverity::Medium,
        title: "待删除的冲突".to_string(),
        description: "这个冲突将被删除".to_string(),
        related_entities: json!({}),
        affected_tasks: json!([]),
        affected_agents: json!([]),
    };
    
    let conflict = conflict_repo.create(conflict_data).await.unwrap();
    
    // 验证冲突存在
    let found_conflict = conflict_repo
        .find_by_id(conflict.conflict_id)
        .await.unwrap();
    assert!(found_conflict.is_some());
    
    // 删除冲突
    conflict_repo.delete(conflict.conflict_id).await.unwrap();
    
    // 验证冲突已删除
    let found_conflict = conflict_repo
        .find_by_id(conflict.conflict_id)
        .await.unwrap();
    assert!(found_conflict.is_none());
}