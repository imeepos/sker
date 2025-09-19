//! Project上下文信息增强功能测试

use uuid::Uuid;
use chrono::{DateTime, FixedOffset};
use serde_json::json;

use codex_database::entities::project::{
    Entity as Project, Model as ProjectModel, ActiveModel as ProjectActiveModel
};

/// 测试Project上下文增强功能
#[test]
fn test_project_context_enhancement() {
    let project_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let mut project = ProjectModel {
        project_id,
        user_id,
        name: "多Agent协同开发系统".to_string(),
        description: Some("基于DDD设计的多Agent协同开发系统".to_string()),
        repository_url: "https://github.com/test/multi-agent-system".to_string(),
        main_branch: "main".to_string(),
        workspace_path: "/workspace/multi-agent-system".to_string(),
        technology_stack: Some(json!(["rust", "typescript", "tauri", "sea-orm", "react"])),
        coding_standards: Some(json!({
            "rust": {
                "formatter": "rustfmt",
                "linter": "clippy",
                "style_guide": "standard"
            },
            "typescript": {
                "formatter": "prettier",
                "linter": "eslint",
                "style_guide": "airbnb"
            }
        })),
        git_settings: Some(json!({
            "auto_commit": true,
            "commit_message_template": "[{task_type}] {description}",
            "branch_protection": true
        })),
        codebase_info: Some(json!({
            "total_lines": 15000,
            "file_count": 120,
            "main_languages": {
                "rust": 0.6,
                "typescript": 0.35,
                "other": 0.05
            },
            "architecture_pattern": "DDD",
            "key_directories": ["crates", "apps", "docs"]
        })),
        project_context: Some(json!({
            "development_phase": "implementation",
            "team_size": 3,
            "deadline": "2024-12-31",
            "priority_features": ["agent_coordination", "task_management", "code_review"]
        })),
        quality_standards: Some(json!({
            "code_coverage": 80.0,
            "code_quality_score": 8.0,
            "performance_requirements": {
                "response_time_ms": 100,
                "memory_usage_mb": 512
            }
        })),
        automation_config: Some(json!({
            "ci_cd": {
                "auto_test": true,
                "auto_deploy": false,
                "test_coverage_threshold": 80.0
            },
            "code_review": {
                "auto_assign_reviewers": true,
                "require_approval_count": 2
            }
        })),
        status: "active".to_string(),
        created_at: now,
        updated_at: now,
    };

    // 测试技术栈管理
    project.add_technology("docker");
    let tech_stack = project.get_technology_stack();
    assert!(tech_stack.contains(&"docker".to_string()));

    // 测试代码库信息更新
    project.update_codebase_info(16000, 125, 0.65, 0.32, 0.03);
    let codebase_info = project.get_codebase_info();
    assert_eq!(codebase_info.total_lines, 16000);
    assert_eq!(codebase_info.file_count, 125);

    // 测试项目健康度评估
    let health_score = project.calculate_project_health();
    assert!(health_score >= 0.0 && health_score <= 100.0);
}

/// 测试项目配置管理
#[test]
fn test_project_configuration_management() {
    let project_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let mut project = ProjectModel {
        project_id,
        user_id,
        name: "配置测试项目".to_string(),
        description: None,
        repository_url: "https://github.com/test/config-test".to_string(),
        main_branch: "main".to_string(),
        workspace_path: "/workspace/config-test".to_string(),
        technology_stack: None,
        coding_standards: None,
        git_settings: None,
        codebase_info: None,
        project_context: None,
        quality_standards: None,
        automation_config: None,
        status: "setup".to_string(),
        created_at: now,
        updated_at: now,
    };

    // 测试初始化项目配置
    project.initialize_project_config();
    assert!(project.technology_stack.is_some());
    assert!(project.coding_standards.is_some());
    assert!(project.quality_standards.is_some());

    // 测试质量标准更新
    project.update_quality_standards(85.0, 8.5, 80, 256);
    let quality = project.get_quality_standards();
    assert_eq!(quality.code_coverage, 85.0);
    assert_eq!(quality.code_quality_score, 8.5);

    // 测试自动化配置
    project.configure_automation(true, false, 85.0, true, 3);
    let automation = project.get_automation_config();
    assert!(automation.ci_cd.auto_test);
    assert!(!automation.ci_cd.auto_deploy);
    assert_eq!(automation.ci_cd.test_coverage_threshold, 85.0);
}

/// 测试项目状态管理
#[test]
fn test_project_status_management() {
    let project_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let mut project = ProjectModel {
        project_id,
        user_id,
        name: "状态管理测试项目".to_string(),
        description: None,
        repository_url: "https://github.com/test/status-test".to_string(),
        main_branch: "main".to_string(),
        workspace_path: "/workspace/status-test".to_string(),
        technology_stack: Some(json!(["rust", "typescript"])),
        coding_standards: None,
        git_settings: None,
        codebase_info: Some(json!({
            "total_lines": 5000,
            "file_count": 50,
            "main_languages": {"rust": 0.7, "typescript": 0.3}
        })),
        project_context: Some(json!({
            "development_phase": "planning",
            "team_size": 2
        })),
        quality_standards: Some(json!({
            "code_coverage": 80.0,
            "code_quality_score": 8.0
        })),
        automation_config: None,
        status: "planning".to_string(),
        created_at: now,
        updated_at: now,
    };

    // 测试项目阶段转换
    assert_eq!(project.status, "planning");
    
    project.transition_to_development();
    assert_eq!(project.status, "development");
    
    project.transition_to_testing();
    assert_eq!(project.status, "testing");
    
    project.transition_to_production();
    assert_eq!(project.status, "production");

    // 测试项目可读性检查
    assert!(project.is_ready_for_development());
    assert!(project.has_quality_standards());
    assert!(project.has_technology_stack());
}