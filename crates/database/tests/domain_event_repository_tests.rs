//! 领域事件Repository测试

use crate::common::setup_test_db;
use codex_database::{
    repository::{
        DomainEventRepository,
        domain_event_repository::CreateDomainEventData,
    },
};
use serde_json::json;
use uuid::Uuid;

mod common;

#[tokio::test]
async fn test_create_domain_event() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    let event_data = CreateDomainEventData {
        aggregate_type: "Task".to_string(),
        aggregate_id,
        event_type: "TaskCreated".to_string(),
        event_data: json!({
            "title": "实现用户登录功能",
            "description": "创建用户登录API端点",
            "priority": "high",
            "estimated_hours": 8,
            "assigned_to": "agent_001"
        }),
        event_version: 1,
    };
    
    let event = event_repo.create(event_data).await.unwrap();
    
    assert_eq!(event.aggregate_type, "Task");
    assert_eq!(event.aggregate_id, aggregate_id);
    assert_eq!(event.event_type, "TaskCreated");
    assert_eq!(event.event_version, 1);
    assert!(event.event_data.get("title").is_some());
    assert!(event.occurred_at.naive_utc() <= chrono::Utc::now().naive_utc());
    assert!(event.created_at.naive_utc() <= chrono::Utc::now().naive_utc());
}

#[tokio::test]
async fn test_find_event_by_id() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    let event_data = CreateDomainEventData {
        aggregate_type: "Agent".to_string(),
        aggregate_id,
        event_type: "AgentStarted".to_string(),
        event_data: json!({
            "agent_name": "前端开发Agent",
            "capabilities": ["React", "TypeScript", "Testing"],
            "status": "active"
        }),
        event_version: 1,
    };
    
    let created_event = event_repo.create(event_data).await.unwrap();
    
    let found_event = event_repo
        .find_by_id(created_event.event_id)
        .await.unwrap()
        .unwrap();
    
    assert_eq!(found_event.event_id, created_event.event_id);
    assert_eq!(found_event.event_type, "AgentStarted");
}

#[tokio::test]
async fn test_find_events_by_aggregate_id() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    // 创建任务生命周期中的多个事件
    let task_events = vec![
        ("TaskCreated", json!({"title": "新任务", "status": "created"})),
        ("TaskAssigned", json!({"assigned_to": "agent_001", "assigned_at": "2024-01-15T10:00:00Z"})),
        ("TaskStarted", json!({"started_at": "2024-01-15T10:30:00Z", "estimated_completion": "2024-01-15T18:00:00Z"})),
        ("TaskUpdated", json!({"progress": 50, "notes": "已完成前端组件"})),
        ("TaskCompleted", json!({"completed_at": "2024-01-15T17:30:00Z", "actual_hours": 7})),
    ];
    
    for (i, (event_type, event_data)) in task_events.iter().enumerate() {
        let data = CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: event_type.to_string(),
            event_data: event_data.clone(),
            event_version: i as i32 + 1,
        };
        event_repo.create(data).await.unwrap();
    }
    
    let events = event_repo.find_by_aggregate_id(aggregate_id).await.unwrap();
    
    assert_eq!(events.len(), 5);
    
    // 验证事件按版本号排序
    for (i, event) in events.iter().enumerate() {
        assert_eq!(event.event_version, i as i32 + 1);
        assert_eq!(event.aggregate_id, aggregate_id);
    }
    
    // 验证事件类型顺序
    assert_eq!(events[0].event_type, "TaskCreated");
    assert_eq!(events[1].event_type, "TaskAssigned");
    assert_eq!(events[2].event_type, "TaskStarted");
    assert_eq!(events[3].event_type, "TaskUpdated");
    assert_eq!(events[4].event_type, "TaskCompleted");
}

#[tokio::test]
async fn test_find_events_by_aggregate_type() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    
    // 创建不同聚合类型的事件
    let aggregates = vec![
        ("Task", "TaskCreated"),
        ("Task", "TaskUpdated"),
        ("Agent", "AgentStarted"),
        ("Project", "ProjectCreated"),
        ("Task", "TaskCompleted"),
        ("Agent", "AgentStopped"),
    ];
    
    for (aggregate_type, event_type) in aggregates {
        let event_data = CreateDomainEventData {
            aggregate_type: aggregate_type.to_string(),
            aggregate_id: Uuid::new_v4(),
            event_type: event_type.to_string(),
            event_data: json!({"test": true}),
            event_version: 1,
        };
        event_repo.create(event_data).await.unwrap();
    }
    
    // 查找Task类型的事件
    let task_events = event_repo.find_by_aggregate_type("Task").await.unwrap();
    assert_eq!(task_events.len(), 3);
    for event in task_events {
        assert_eq!(event.aggregate_type, "Task");
    }
    
    // 查找Agent类型的事件
    let agent_events = event_repo.find_by_aggregate_type("Agent").await.unwrap();
    assert_eq!(agent_events.len(), 2);
    for event in agent_events {
        assert_eq!(event.aggregate_type, "Agent");
    }
    
    // 查找Project类型的事件
    let project_events = event_repo.find_by_aggregate_type("Project").await.unwrap();
    assert_eq!(project_events.len(), 1);
    assert_eq!(project_events[0].aggregate_type, "Project");
}

#[tokio::test]
async fn test_find_events_by_event_type() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    
    // 创建不同事件类型的事件
    let events = vec![
        ("TaskCreated", "Task"),
        ("TaskCreated", "Task"),
        ("TaskUpdated", "Task"),
        ("AgentStarted", "Agent"),
        ("TaskCreated", "Task"),
    ];
    
    for (event_type, aggregate_type) in events {
        let event_data = CreateDomainEventData {
            aggregate_type: aggregate_type.to_string(),
            aggregate_id: Uuid::new_v4(),
            event_type: event_type.to_string(),
            event_data: json!({"timestamp": chrono::Utc::now().to_rfc3339()}),
            event_version: 1,
        };
        event_repo.create(event_data).await.unwrap();
    }
    
    // 查找TaskCreated事件
    let task_created_events = event_repo.find_by_event_type("TaskCreated").await.unwrap();
    assert_eq!(task_created_events.len(), 3);
    for event in task_created_events {
        assert_eq!(event.event_type, "TaskCreated");
    }
    
    // 查找TaskUpdated事件
    let task_updated_events = event_repo.find_by_event_type("TaskUpdated").await.unwrap();
    assert_eq!(task_updated_events.len(), 1);
    assert_eq!(task_updated_events[0].event_type, "TaskUpdated");
    
    // 查找AgentStarted事件
    let agent_started_events = event_repo.find_by_event_type("AgentStarted").await.unwrap();
    assert_eq!(agent_started_events.len(), 1);
    assert_eq!(agent_started_events[0].event_type, "AgentStarted");
}

#[tokio::test]
async fn test_find_events_by_version_range() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    // 创建版本1到10的事件
    for version in 1..=10 {
        let event_data = CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskUpdated".to_string(),
            event_data: json!({
                "version": version,
                "progress": version * 10,
                "updated_at": chrono::Utc::now().to_rfc3339()
            }),
            event_version: version,
        };
        event_repo.create(event_data).await.unwrap();
    }
    
    // 测试查找版本3到7的事件
    let events_3_to_7 = event_repo
        .find_by_aggregate_id_and_version_range(aggregate_id, 3, Some(7))
        .await.unwrap();
    
    assert_eq!(events_3_to_7.len(), 5); // 版本3,4,5,6,7
    for (i, event) in events_3_to_7.iter().enumerate() {
        assert_eq!(event.event_version, i as i32 + 3);
    }
    
    // 测试查找版本5及以后的事件
    let events_from_5 = event_repo
        .find_by_aggregate_id_and_version_range(aggregate_id, 5, None)
        .await.unwrap();
    
    assert_eq!(events_from_5.len(), 6); // 版本5,6,7,8,9,10
    assert_eq!(events_from_5[0].event_version, 5);
    assert_eq!(events_from_5[5].event_version, 10);
    
    // 测试查找单个版本
    let events_version_1 = event_repo
        .find_by_aggregate_id_and_version_range(aggregate_id, 1, Some(1))
        .await.unwrap();
    
    assert_eq!(events_version_1.len(), 1);
    assert_eq!(events_version_1[0].event_version, 1);
}

#[tokio::test]
async fn test_create_batch_events() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    // 批量创建多个事件
    let batch_events = vec![
        CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskCreated".to_string(),
            event_data: json!({"title": "批量任务1"}),
            event_version: 1,
        },
        CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskAssigned".to_string(),
            event_data: json!({"agent": "agent_001"}),
            event_version: 2,
        },
        CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskStarted".to_string(),
            event_data: json!({"started_at": chrono::Utc::now().to_rfc3339()}),
            event_version: 3,
        },
    ];
    
    let created_events = event_repo.create_batch(batch_events).await.unwrap();
    
    assert_eq!(created_events.len(), 3);
    
    // 验证所有事件都正确创建
    for (i, event) in created_events.iter().enumerate() {
        assert_eq!(event.aggregate_id, aggregate_id);
        assert_eq!(event.event_version, i as i32 + 1);
    }
    
    // 验证事件类型
    let event_types: Vec<&str> = created_events.iter().map(|e| e.event_type.as_str()).collect();
    assert!(event_types.contains(&"TaskCreated"));
    assert!(event_types.contains(&"TaskAssigned"));
    assert!(event_types.contains(&"TaskStarted"));
}

#[tokio::test]
async fn test_get_latest_version() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    let empty_aggregate_id = Uuid::new_v4();
    
    // 测试空聚合的版本（应该返回0）
    let latest_version = event_repo.get_latest_version(empty_aggregate_id).await.unwrap();
    assert_eq!(latest_version, 0);
    
    // 创建版本1到5的事件
    for version in 1..=5 {
        let event_data = CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id,
            event_type: "TaskUpdated".to_string(),
            event_data: json!({"version": version}),
            event_version: version,
        };
        event_repo.create(event_data).await.unwrap();
    }
    
    // 获取最新版本
    let latest_version = event_repo.get_latest_version(aggregate_id).await.unwrap();
    assert_eq!(latest_version, 5);
    
    // 添加更高版本的事件
    let event_data = CreateDomainEventData {
        aggregate_type: "Task".to_string(),
        aggregate_id,
        event_type: "TaskCompleted".to_string(),
        event_data: json!({"completed": true}),
        event_version: 10, // 跳跃版本
    };
    event_repo.create(event_data).await.unwrap();
    
    // 验证最新版本更新
    let latest_version = event_repo.get_latest_version(aggregate_id).await.unwrap();
    assert_eq!(latest_version, 10);
}

#[tokio::test]
async fn test_complex_event_data() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    // 创建包含复杂数据的事件
    let complex_event_data = json!({
        "task_metadata": {
            "title": "重构数据库层",
            "description": "将现有的数据库访问层重构为Repository模式",
            "complexity": "high",
            "estimated_hours": 40
        },
        "technical_requirements": {
            "languages": ["Rust"],
            "frameworks": ["SeaORM", "Tokio"],
            "testing_requirements": {
                "unit_tests": true,
                "integration_tests": true,
                "coverage_threshold": 0.85
            }
        },
        "dependencies": {
            "prerequisite_tasks": ["task_001", "task_002"],
            "blocking_tasks": ["task_005"],
            "related_components": [
                {
                    "name": "user_repository",
                    "type": "repository",
                    "status": "needs_implementation"
                },
                {
                    "name": "task_repository",
                    "type": "repository", 
                    "status": "in_progress"
                }
            ]
        },
        "quality_gates": {
            "code_review": {
                "required_reviewers": 2,
                "automated_checks": ["clippy", "fmt", "test"]
            },
            "performance": {
                "max_query_time": "100ms",
                "memory_limit": "50MB"
            }
        },
        "deployment_config": {
            "environment": "staging",
            "rollback_strategy": "immediate",
            "health_checks": ["database_connectivity", "api_responsiveness"]
        }
    });
    
    let event_data = CreateDomainEventData {
        aggregate_type: "Task".to_string(),
        aggregate_id,
        event_type: "TaskCreatedWithComplexData".to_string(),
        event_data: complex_event_data.clone(),
        event_version: 1,
    };
    
    let event = event_repo.create(event_data).await.unwrap();
    
    assert_eq!(event.event_data, complex_event_data);
    
    // 验证可以正确查询和解析复杂数据
    let found_event = event_repo.find_by_id(event.event_id).await.unwrap().unwrap();
    
    assert_eq!(found_event.event_data["task_metadata"]["title"], "重构数据库层");
    assert_eq!(found_event.event_data["technical_requirements"]["frameworks"][0], "SeaORM");
    assert_eq!(found_event.event_data["quality_gates"]["performance"]["max_query_time"], "100ms");
}

#[tokio::test]
async fn test_event_sourcing_scenario() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let task_aggregate_id = Uuid::new_v4();
    
    // 模拟完整的任务生命周期事件流
    let task_lifecycle_events = vec![
        (1, "TaskCreated", json!({
            "title": "实现用户认证系统",
            "creator": "product_manager",
            "priority": "high",
            "estimated_hours": 16
        })),
        (2, "RequirementsAdded", json!({
            "requirements": [
                "支持邮箱/密码登录",
                "集成OAuth2.0",
                "实现JWT token管理",
                "添加密码强度验证"
            ],
            "acceptance_criteria": "所有认证流程通过安全审核"
        })),
        (3, "TaskAssigned", json!({
            "assigned_to": "security_agent",
            "assigned_by": "tech_lead",
            "assignment_reason": "专业安全开发经验",
            "expected_start": "2024-01-16T09:00:00Z"
        })),
        (4, "TaskStarted", json!({
            "started_at": "2024-01-16T09:15:00Z",
            "initial_plan": [
                "设计认证架构",
                "实现核心认证逻辑",
                "添加安全测试",
                "集成前端界面"
            ]
        })),
        (5, "ProgressUpdated", json!({
            "progress_percentage": 25,
            "completed_items": ["设计认证架构"],
            "current_focus": "实现核心认证逻辑",
            "notes": "已完成架构设计，开始编码实现",
            "updated_at": "2024-01-16T14:30:00Z"
        })),
        (6, "IssueEncountered", json!({
            "issue_type": "technical_blocker",
            "description": "OAuth2.0库版本兼容性问题",
            "severity": "medium",
            "estimated_delay": "4_hours",
            "proposed_solution": "升级到最新OAuth库版本"
        })),
        (7, "IssueResolved", json!({
            "resolution": "successfully_upgraded_oauth_library",
            "time_spent": "2_hours",
            "lessons_learned": "需要在项目初期更好地验证依赖版本兼容性"
        })),
        (8, "ProgressUpdated", json!({
            "progress_percentage": 75,
            "completed_items": [
                "设计认证架构",
                "实现核心认证逻辑",
                "集成OAuth2.0"
            ],
            "current_focus": "添加安全测试",
            "updated_at": "2024-01-17T11:45:00Z"
        })),
        (9, "QualityCheckPassed", json!({
            "check_type": "security_audit",
            "results": {
                "vulnerabilities_found": 0,
                "security_score": "A+",
                "recommendations": ["添加rate limiting", "实现账户锁定机制"]
            },
            "auditor": "security_team"
        })),
        (10, "TaskCompleted", json!({
            "completed_at": "2024-01-17T16:20:00Z",
            "actual_hours": 14,
            "final_deliverables": [
                "认证API端点",
                "JWT token管理",
                "OAuth2.0集成",
                "安全测试套件",
                "用户界面组件"
            ],
            "quality_metrics": {
                "test_coverage": "92%",
                "performance_score": "A",
                "security_score": "A+"
            }
        }))
    ];
    
    // 批量创建所有生命周期事件
    let batch_events: Vec<CreateDomainEventData> = task_lifecycle_events
        .into_iter()
        .map(|(version, event_type, event_data)| CreateDomainEventData {
            aggregate_type: "Task".to_string(),
            aggregate_id: task_aggregate_id,
            event_type: event_type.to_string(),
            event_data,
            event_version: version,
        })
        .collect();
    
    let created_events = event_repo.create_batch(batch_events).await.unwrap();
    assert_eq!(created_events.len(), 10);
    
    // 验证可以重建聚合状态
    let all_events = event_repo.find_by_aggregate_id(task_aggregate_id).await.unwrap();
    assert_eq!(all_events.len(), 10);
    
    // 验证事件顺序正确
    for (i, event) in all_events.iter().enumerate() {
        assert_eq!(event.event_version, i as i32 + 1);
    }
    
    // 验证特定事件类型查询
    let progress_events = all_events.iter()
        .filter(|e| e.event_type == "ProgressUpdated")
        .collect::<Vec<_>>();
    assert_eq!(progress_events.len(), 2);
    
    // 验证可以获取任务的当前状态（最新版本）
    let latest_version = event_repo.get_latest_version(task_aggregate_id).await.unwrap();
    assert_eq!(latest_version, 10);
    
    // 验证可以获取特定时间点的状态（版本5时的状态）
    let events_up_to_v5 = event_repo
        .find_by_aggregate_id_and_version_range(task_aggregate_id, 1, Some(5))
        .await.unwrap();
    assert_eq!(events_up_to_v5.len(), 5);
    assert_eq!(events_up_to_v5.last().unwrap().event_type, "ProgressUpdated");
}

#[tokio::test]
async fn test_multi_aggregate_event_streams() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    
    // 创建多个聚合的事件流
    let task1_id = Uuid::new_v4();
    let task2_id = Uuid::new_v4();
    let agent1_id = Uuid::new_v4();
    let project1_id = Uuid::new_v4();
    
    let multi_aggregate_events = vec![
        // Task1 事件
        ("Task", task1_id, "TaskCreated", json!({"title": "前端开发"})),
        ("Task", task1_id, "TaskAssigned", json!({"agent": "frontend_agent"})),
        
        // Agent1 事件
        ("Agent", agent1_id, "AgentStarted", json!({"name": "frontend_agent"})),
        ("Agent", agent1_id, "TaskReceived", json!({"task_id": task1_id.to_string()})),
        
        // Task2 事件
        ("Task", task2_id, "TaskCreated", json!({"title": "后端API"})),
        
        // Project 事件
        ("Project", project1_id, "ProjectCreated", json!({"name": "Web应用开发"})),
        ("Project", project1_id, "TaskAdded", json!({"task_id": task1_id.to_string()})),
        ("Project", project1_id, "TaskAdded", json!({"task_id": task2_id.to_string()})),
        
        // Task1 继续
        ("Task", task1_id, "TaskStarted", json!({"started_by": agent1_id.to_string()})),
        ("Task", task1_id, "TaskCompleted", json!({"completed_at": "2024-01-15T18:00:00Z"})),
    ];
    
    // 创建所有事件
    for (i, (aggregate_type, aggregate_id, event_type, event_data)) in multi_aggregate_events.iter().enumerate() {
        let data = CreateDomainEventData {
            aggregate_type: aggregate_type.to_string(),
            aggregate_id: *aggregate_id,
            event_type: event_type.to_string(),
            event_data: event_data.clone(),
            event_version: 1, // 简化处理，实际应用中需要按聚合管理版本
        };
        event_repo.create(data).await.unwrap();
    }
    
    // 验证每个聚合的事件
    let task1_events = event_repo.find_by_aggregate_id(task1_id).await.unwrap();
    assert_eq!(task1_events.len(), 4);
    
    let agent1_events = event_repo.find_by_aggregate_id(agent1_id).await.unwrap();
    assert_eq!(agent1_events.len(), 2);
    
    let task2_events = event_repo.find_by_aggregate_id(task2_id).await.unwrap();
    assert_eq!(task2_events.len(), 1);
    
    let project1_events = event_repo.find_by_aggregate_id(project1_id).await.unwrap();
    assert_eq!(project1_events.len(), 3);
    
    // 验证按聚合类型查询
    let all_task_events = event_repo.find_by_aggregate_type("Task").await.unwrap();
    assert_eq!(all_task_events.len(), 5); // task1: 4个 + task2: 1个
    
    let all_agent_events = event_repo.find_by_aggregate_type("Agent").await.unwrap();
    assert_eq!(all_agent_events.len(), 2);
    
    let all_project_events = event_repo.find_by_aggregate_type("Project").await.unwrap();
    assert_eq!(all_project_events.len(), 3);
    
    // 验证按事件类型查询
    let task_created_events = event_repo.find_by_event_type("TaskCreated").await.unwrap();
    assert_eq!(task_created_events.len(), 2);
    
    let task_added_events = event_repo.find_by_event_type("TaskAdded").await.unwrap();
    assert_eq!(task_added_events.len(), 2);
}

#[tokio::test]
async fn test_delete_event() {
    let db = setup_test_db().await;
    
    let event_repo = DomainEventRepository::new(db.clone());
    let aggregate_id = Uuid::new_v4();
    
    let event_data = CreateDomainEventData {
        aggregate_type: "Task".to_string(),
        aggregate_id,
        event_type: "TaskCreated".to_string(),
        event_data: json!({"title": "待删除的任务"}),
        event_version: 1,
    };
    
    let event = event_repo.create(event_data).await.unwrap();
    
    // 验证事件存在
    let found_event = event_repo.find_by_id(event.event_id).await.unwrap();
    assert!(found_event.is_some());
    
    // 删除事件（注意：在实际事件溯源系统中，通常不应该删除事件）
    event_repo.delete(event.event_id).await.unwrap();
    
    // 验证事件已删除
    let found_event = event_repo.find_by_id(event.event_id).await.unwrap();
    assert!(found_event.is_none());
    
    // 验证聚合事件列表也不包含已删除事件
    let aggregate_events = event_repo.find_by_aggregate_id(aggregate_id).await.unwrap();
    assert_eq!(aggregate_events.len(), 0);
}