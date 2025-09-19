//! 冲突处理实体单元测试

use codex_database::entities::{
    conflict::{self, ConflictType, ConflictSeverity, ConflictStatus},
    human_decision::{self, DecisionType},
    user::{self},
};
use codex_database::{initialize_database, DatabaseConfig};
use sea_orm::{ActiveValue::Set, ActiveModelTrait};
use serde_json::json;
use tempfile::tempdir;
use uuid::Uuid;

/// 创建测试数据库连接
async fn create_test_db() -> codex_database::DatabaseConnection {
    let temp_dir = tempdir().expect("创建临时目录失败");
    let db_path = temp_dir.path().join("test_conflict.db");
    let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
    
    let config = DatabaseConfig {
        database_url,
        max_connections: 1,
        min_connections: 1,
        connect_timeout: 10,
        idle_timeout: 60,
        enable_logging: false,
    };
    
    initialize_database(&config).await.expect("初始化测试数据库失败")
}

/// 创建测试用户
async fn create_test_user(db: &codex_database::DatabaseConnection) -> user::Model {
    let user = user::ActiveModel {
        user_id: Set(Uuid::new_v4()),
        username: Set("testuser".to_string()),
        email: Set("test@example.com".to_string()),
        password_hash: Set("hashed_password".to_string()),
        created_at: Set(chrono::Utc::now().into()),
        updated_at: Set(chrono::Utc::now().into()),
        profile_data: Set(None),
        settings: Set(None),
        is_active: Set(true),
        last_login_at: Set(None),
    };
    
    user.insert(db).await.expect("创建测试用户失败")
}

#[tokio::test]
async fn test_conflict_creation() {
    let db = create_test_db().await;
    let _user = create_test_user(&db).await;
    
    // 创建Git合并冲突
    let conflict_id = Uuid::new_v4();
    let related_entities = json!([
        {
            "type": "task",
            "id": "task-123",
            "description": "Feature A implementation"
        },
        {
            "type": "task", 
            "id": "task-456",
            "description": "Feature B implementation"
        }
    ]);
    let affected_tasks = json!(["task-123", "task-456"]);
    let affected_agents = json!(["agent-001", "agent-002"]);
    
    let conflict = conflict::ActiveModel {
        conflict_id: Set(conflict_id),
        conflict_type: Set(ConflictType::GitMerge.to_string()),
        severity: Set(ConflictSeverity::High.to_string()),
        title: Set("Git合并冲突".to_string()),
        description: Set("功能分支feature-A和feature-B在同一文件中存在冲突".to_string()),
        related_entities: Set(related_entities.clone()),
        affected_tasks: Set(affected_tasks.clone()),
        affected_agents: Set(affected_agents.clone()),
        status: Set(ConflictStatus::Detected.to_string()),
        escalated_to_human: Set(false),
        assigned_user_id: Set(None),
        resolution_strategy: Set(None),
        resolution_note: Set(None),
        auto_resolved: Set(false),
        detected_at: Set(chrono::Utc::now().into()),
        escalated_at: Set(None),
        resolved_at: Set(None),
    };
    
    let created_conflict = conflict.insert(&db).await.expect("创建冲突失败");
    
    // 验证冲突创建成功
    assert_eq!(created_conflict.conflict_id, conflict_id);
    assert_eq!(created_conflict.conflict_type, ConflictType::GitMerge.to_string());
    assert_eq!(created_conflict.severity, ConflictSeverity::High.to_string());
    assert_eq!(created_conflict.related_entities, related_entities);
    assert_eq!(created_conflict.affected_tasks, affected_tasks);
    assert_eq!(created_conflict.affected_agents, affected_agents);
}

#[tokio::test]
async fn test_conflict_escalation() {
    let db = create_test_db().await;
    let _user = create_test_user(&db).await;
    
    // 创建资源冲突
    let conflict = conflict::ActiveModel {
        conflict_id: Set(Uuid::new_v4()),
        conflict_type: Set(ConflictType::Resource.to_string()),
        severity: Set(ConflictSeverity::Critical.to_string()),
        title: Set("CPU资源争用".to_string()),
        description: Set("多个Agent同时请求高CPU使用率任务".to_string()),
        related_entities: Set(json!([])),
        affected_tasks: Set(json!(["task-789", "task-012"])),
        affected_agents: Set(json!(["agent-003", "agent-004", "agent-005"])),
        status: Set(ConflictStatus::Detected.to_string()),
        escalated_to_human: Set(false),
        assigned_user_id: Set(None),
        resolution_strategy: Set(None),
        resolution_note: Set(None),
        auto_resolved: Set(false),
        detected_at: Set(chrono::Utc::now().into()),
        escalated_at: Set(None),
        resolved_at: Set(None),
    };
    
    let created_conflict = conflict.insert(&db).await.expect("创建冲突失败");
    
    // 测试冲突上报
    let mut conflict_active: conflict::ActiveModel = created_conflict.into();
    conflict_active.status = Set(ConflictStatus::Escalated.to_string());
    conflict_active.escalated_to_human = Set(true);
    conflict_active.assigned_user_id = Set(Some(_user.user_id));
    conflict_active.escalated_at = Set(Some(chrono::Utc::now().into()));
    
    let escalated_conflict = conflict_active.update(&db).await.expect("上报冲突失败");
    assert_eq!(escalated_conflict.status, ConflictStatus::Escalated.to_string());
    assert_eq!(escalated_conflict.escalated_to_human, true);
    assert_eq!(escalated_conflict.assigned_user_id, Some(_user.user_id));
    assert!(escalated_conflict.escalated_at.is_some());
}

#[tokio::test]
async fn test_conflict_resolution() {
    let db = create_test_db().await;
    let _user = create_test_user(&db).await;
    
    // 创建任务依赖冲突
    let conflict = conflict::ActiveModel {
        conflict_id: Set(Uuid::new_v4()),
        conflict_type: Set(ConflictType::TaskDependency.to_string()),
        severity: Set(ConflictSeverity::Medium.to_string()),
        title: Set("循环依赖检测".to_string()),
        description: Set("任务A依赖任务B，但任务B也依赖任务A".to_string()),
        related_entities: Set(json!([
            {"type": "task", "id": "task-A"},
            {"type": "task", "id": "task-B"}
        ])),
        affected_tasks: Set(json!(["task-A", "task-B"])),
        affected_agents: Set(json!([])),
        status: Set(ConflictStatus::Escalated.to_string()),
        escalated_to_human: Set(true),
        assigned_user_id: Set(Some(_user.user_id)),
        resolution_strategy: Set(None),
        resolution_note: Set(None),
        auto_resolved: Set(false),
        detected_at: Set(chrono::Utc::now().into()),
        escalated_at: Set(Some(chrono::Utc::now().into())),
        resolved_at: Set(None),
    };
    
    let created_conflict = conflict.insert(&db).await.expect("创建冲突失败");
    
    // 测试冲突解决
    let mut conflict_active: conflict::ActiveModel = created_conflict.into();
    conflict_active.status = Set(ConflictStatus::Resolved.to_string());
    conflict_active.resolution_strategy = Set(Some("重新排序任务依赖".to_string()));
    conflict_active.resolution_note = Set(Some("移除任务B对任务A的依赖，保持任务A对任务B的依赖".to_string()));
    conflict_active.resolved_at = Set(Some(chrono::Utc::now().into()));
    
    let resolved_conflict = conflict_active.update(&db).await.expect("解决冲突失败");
    assert_eq!(resolved_conflict.status, ConflictStatus::Resolved.to_string());
    assert!(resolved_conflict.resolution_strategy.is_some());
    assert!(resolved_conflict.resolution_note.is_some());
    assert!(resolved_conflict.resolved_at.is_some());
}

#[tokio::test]
async fn test_human_decision_creation() {
    let db = create_test_db().await;
    let _user = create_test_user(&db).await;
    
    // 创建冲突
    let conflict = conflict::ActiveModel {
        conflict_id: Set(Uuid::new_v4()),
        conflict_type: Set(ConflictType::Timeline.to_string()),
        severity: Set(ConflictSeverity::High.to_string()),
        title: Set("交付时间冲突".to_string()),
        description: Set("两个关键任务的预期完成时间重叠".to_string()),
        related_entities: Set(json!([])),
        affected_tasks: Set(json!(["urgent-task-1", "urgent-task-2"])),
        affected_agents: Set(json!(["agent-006"])),
        status: Set(ConflictStatus::Escalated.to_string()),
        escalated_to_human: Set(true),
        assigned_user_id: Set(Some(_user.user_id)),
        resolution_strategy: Set(None),
        resolution_note: Set(None),
        auto_resolved: Set(false),
        detected_at: Set(chrono::Utc::now().into()),
        escalated_at: Set(Some(chrono::Utc::now().into())),
        resolved_at: Set(None),
    };
    
    let created_conflict = conflict.insert(&db).await.expect("创建冲突失败");
    
    // 创建人工决策
    let decision_data = json!({
        "priority_adjustment": {
            "urgent-task-1": "high",
            "urgent-task-2": "medium"
        },
        "timeline_adjustment": {
            "urgent-task-2": {
                "delay_hours": 24,
                "reason": "等待urgent-task-1完成"
            }
        }
    });
    
    let follow_up_actions = json!([
        {
            "action": "update_task_priority",
            "target": "urgent-task-1",
            "priority": "high"
        },
        {
            "action": "reschedule_task",
            "target": "urgent-task-2", 
            "delay_hours": 24
        },
        {
            "action": "notify_stakeholders",
            "message": "任务时间线已调整"
        }
    ]);
    
    let decision = human_decision::ActiveModel {
        decision_id: Set(Uuid::new_v4()),
        conflict_id: Set(created_conflict.conflict_id),
        user_id: Set(_user.user_id),
        decision_type: Set(DecisionType::Modify.to_string()),
        decision_data: Set(Some(decision_data.clone())),
        reasoning: Set(Some("调整任务优先级和时间线以避免资源冲突".to_string())),
        affected_entities: Set(json!(["urgent-task-1", "urgent-task-2", "agent-006"])),
        follow_up_actions: Set(follow_up_actions.clone()),
        created_at: Set(chrono::Utc::now().into()),
    };
    
    let created_decision = decision.insert(&db).await.expect("创建人工决策失败");
    
    // 验证决策创建成功
    assert_eq!(created_decision.conflict_id, created_conflict.conflict_id);
    assert_eq!(created_decision.user_id, _user.user_id);
    assert_eq!(created_decision.decision_type, DecisionType::Modify.to_string());
    assert_eq!(created_decision.decision_data, Some(decision_data));
    assert_eq!(created_decision.follow_up_actions, follow_up_actions);
}

#[tokio::test]
async fn test_auto_resolution() {
    let db = create_test_db().await;
    
    // 创建低严重性能力冲突（可自动解决）
    let conflict = conflict::ActiveModel {
        conflict_id: Set(Uuid::new_v4()),
        conflict_type: Set(ConflictType::Capability.to_string()),
        severity: Set(ConflictSeverity::Low.to_string()),
        title: Set("Agent能力匹配".to_string()),
        description: Set("找不到具有特定能力的Agent".to_string()),
        related_entities: Set(json!([
            {"type": "task", "id": "task-special"},
            {"type": "capability", "name": "SpecializedSkill"}
        ])),
        affected_tasks: Set(json!(["task-special"])),
        affected_agents: Set(json!([])),
        status: Set(ConflictStatus::Analyzing.to_string()),
        escalated_to_human: Set(false),
        assigned_user_id: Set(None),
        resolution_strategy: Set(None),
        resolution_note: Set(None),
        auto_resolved: Set(false),
        detected_at: Set(chrono::Utc::now().into()),
        escalated_at: Set(None),
        resolved_at: Set(None),
    };
    
    let created_conflict = conflict.insert(&db).await.expect("创建冲突失败");
    
    // 模拟自动解决
    let mut conflict_active: conflict::ActiveModel = created_conflict.into();
    conflict_active.status = Set(ConflictStatus::Resolved.to_string());
    conflict_active.auto_resolved = Set(true);
    conflict_active.resolution_strategy = Set(Some("分配给最匹配的Agent".to_string()));
    conflict_active.resolution_note = Set(Some("系统自动选择了具有相近能力的Agent-007".to_string()));
    conflict_active.resolved_at = Set(Some(chrono::Utc::now().into()));
    
    let resolved_conflict = conflict_active.update(&db).await.expect("自动解决冲突失败");
    assert_eq!(resolved_conflict.status, ConflictStatus::Resolved.to_string());
    assert_eq!(resolved_conflict.auto_resolved, true);
    assert_eq!(resolved_conflict.escalated_to_human, false);
}

#[tokio::test]
async fn test_conflict_enum_conversions() {
    // 测试ConflictType枚举转换
    assert_eq!(ConflictType::GitMerge.to_string(), "git_merge");
    assert_eq!(ConflictType::Resource.to_string(), "resource");
    assert_eq!(ConflictType::TaskDependency.to_string(), "task_dependency");
    assert_eq!(ConflictType::Capability.to_string(), "capability");
    assert_eq!(ConflictType::Timeline.to_string(), "timeline");
    
    // 测试ConflictSeverity枚举转换
    assert_eq!(ConflictSeverity::Low.to_string(), "low");
    assert_eq!(ConflictSeverity::Medium.to_string(), "medium");
    assert_eq!(ConflictSeverity::High.to_string(), "high");
    assert_eq!(ConflictSeverity::Critical.to_string(), "critical");
    
    // 测试ConflictStatus枚举转换
    assert_eq!(ConflictStatus::Detected.to_string(), "detected");
    assert_eq!(ConflictStatus::Analyzing.to_string(), "analyzing");
    assert_eq!(ConflictStatus::Escalated.to_string(), "escalated");
    assert_eq!(ConflictStatus::Resolving.to_string(), "resolving");
    assert_eq!(ConflictStatus::Resolved.to_string(), "resolved");
    assert_eq!(ConflictStatus::Ignored.to_string(), "ignored");
    
    // 测试DecisionType枚举转换
    assert_eq!(DecisionType::Approve.to_string(), "approve");
    assert_eq!(DecisionType::Reject.to_string(), "reject");
    assert_eq!(DecisionType::Modify.to_string(), "modify");
    assert_eq!(DecisionType::Escalate.to_string(), "escalate");
}

#[tokio::test]
async fn test_complex_conflict_scenario() {
    let db = create_test_db().await;
    let _user = create_test_user(&db).await;
    
    // 创建复杂的多类型冲突
    let complex_entities = json!([
        {
            "type": "task",
            "id": "task-complex-1",
            "title": "数据库迁移",
            "conflicts_with": ["task-complex-2"]
        },
        {
            "type": "task", 
            "id": "task-complex-2",
            "title": "API重构",
            "depends_on": ["task-complex-1"]
        },
        {
            "type": "agent",
            "id": "agent-specialist",
            "capabilities": ["DatabaseDevelopment", "BackendDevelopment"],
            "current_load": 0.9
        }
    ]);
    
    let conflict = conflict::ActiveModel {
        conflict_id: Set(Uuid::new_v4()),
        conflict_type: Set(ConflictType::Resource.to_string()),
        severity: Set(ConflictSeverity::Critical.to_string()),
        title: Set("复合资源和依赖冲突".to_string()),
        description: Set("数据库迁移和API重构任务存在资源争用和依赖冲突".to_string()),
        related_entities: Set(complex_entities),
        affected_tasks: Set(json!(["task-complex-1", "task-complex-2"])),
        affected_agents: Set(json!(["agent-specialist"])),
        status: Set(ConflictStatus::Detected.to_string()),
        escalated_to_human: Set(false),
        assigned_user_id: Set(None),
        resolution_strategy: Set(None),
        resolution_note: Set(None),
        auto_resolved: Set(false),
        detected_at: Set(chrono::Utc::now().into()),
        escalated_at: Set(None),
        resolved_at: Set(None),
    };
    
    let created_conflict = conflict.insert(&db).await.expect("创建复杂冲突失败");
    assert_eq!(created_conflict.severity, ConflictSeverity::Critical.to_string());
    assert!(created_conflict.related_entities.as_array().unwrap().len() > 0);
}