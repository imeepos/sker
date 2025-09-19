//! # 多Agent系统集成测试
//! 
//! 这些测试验证各模块之间的集成以及整体系统的功能性。

use codex_multi_agent::*;
use std::collections::HashMap;

#[cfg(test)]
mod integration_tests {
    use super::*;
    
    /// 测试完整的Agent创建到任务分配流程
    #[test]
    fn test_complete_agent_workflow() {
        // 1. 创建Agent配置
        let agent_config = agent_management::AgentConfig {
            name: "集成测试Agent".to_string(),
            description: "用于集成测试的Agent".to_string(),
            prompt_template: "你是一个专业的开发助手".to_string(),
            capabilities: vec![
                AgentCapability::FrontendDevelopment,
                AgentCapability::Testing,
            ],
            max_concurrent_tasks: 2,
            timeout_minutes: 60,
            git_config: Some(agent_management::GitConfig {
                user_name: "test-agent".to_string(),
                user_email: "test@example.com".to_string(),
                ssh_key_path: None,
                default_branch: "main".to_string(),
                sign_commits: false,
                gpg_key_id: None,
                custom_config: HashMap::new(),
            }),
            custom_settings: HashMap::new(),
            priority_weight: 0.7,
            verbose_logging: true,
            resource_limits: Some(agent_management::ResourceLimits {
                max_memory_mb: Some(1024),
                max_cpu_usage: Some(0.8),
                max_disk_usage_mb: Some(2048),
                max_network_bandwidth_kbps: Some(1000),
                max_execution_time_seconds: Some(3600),
            }),
        };
        
        // 验证配置有效性
        assert!(agent_config.validate().is_ok());
        assert!(agent_config.has_capability(&AgentCapability::FrontendDevelopment));
        assert!(agent_config.has_all_capabilities(&[
            AgentCapability::FrontendDevelopment,
            AgentCapability::Testing,
        ]));
        
        // 2. 创建项目信息
        let _project_info = project_management::ProjectInfo {
            name: "集成测试项目".to_string(),
            description: "用于验证多Agent系统的测试项目".to_string(),
            version: "1.0.0".to_string(),
            repository_url: "https://github.com/test/integration-project".to_string(),
            main_branch: "main".to_string(),
            technology_stack: vec![
                "React".to_string(),
                "TypeScript".to_string(),
                "Node.js".to_string(),
            ],
            coding_standards: project_management::CodingStandards::default(),
            workspace_path: std::path::PathBuf::from("/tmp/test-project"),
            project_type: project_management::ProjectType::WebApplication,
            priority: project_management::ProjectPriority::High,
            target_completion_date: Some(chrono::Utc::now() + chrono::Duration::days(30)),
            owner: "test-owner".to_string(),
            team_members: vec![
                project_management::TeamMember {
                    name: "Alice".to_string(),
                    email: "alice@example.com".to_string(),
                    role: "Frontend Developer".to_string(),
                    permissions: vec![
                        project_management::Permission::Read,
                        project_management::Permission::Write,
                    ],
                    is_admin: false,
                },
            ],
            tags: vec!["integration-test".to_string(), "web-app".to_string()],
            external_dependencies: vec![],
            environments: HashMap::new(),
        };
        
        // 3. 创建任务信息
        let task_info = llm_orchestration::TaskInfo {
            task_id: TaskId::new(),
            title: "实现登录页面".to_string(),
            description: "创建用户登录界面，包括表单验证和错误处理".to_string(),
            task_type: TaskType::Development,
            priority: TaskPriority::High,
            estimated_hours: 8,
            required_capabilities: vec![
                AgentCapability::FrontendDevelopment,
                AgentCapability::Testing,
            ],
            dependencies: vec![],
            acceptance_criteria: vec![
                "用户可以输入用户名和密码".to_string(),
                "表单验证正确工作".to_string(),
                "登录成功后重定向到首页".to_string(),
                "包含单元测试".to_string(),
            ],
            tags: vec!["frontend".to_string(), "authentication".to_string()],
            related_files: vec!["src/components/Login.tsx".to_string()],
            test_requirements: llm_orchestration::TaskTestRequirements {
                needs_unit_tests: true,
                needs_integration_tests: true,
                needs_e2e_tests: false,
                required_coverage: 0.9,
                special_test_scenarios: vec![
                    "无效凭据登录".to_string(),
                    "网络错误处理".to_string(),
                ],
            },
            complexity_assessment: llm_orchestration::ComplexityAssessment {
                technical_complexity: 4,
                business_complexity: 3,
                integration_complexity: 2,
                overall_complexity: 3,
                complexity_notes: vec!["需要与后端API集成".to_string()],
            },
            risk_factors: vec![
                llm_orchestration::RiskFactor {
                    risk_type: llm_orchestration::RiskType::Technical,
                    risk_level: llm_orchestration::RiskLevel::Medium,
                    description: "API集成可能存在兼容性问题".to_string(),
                    impact_assessment: "可能导致功能延期".to_string(),
                    mitigation_strategies: vec![
                        "提前与后端团队沟通API规范".to_string(),
                        "准备Mock数据进行并行开发".to_string(),
                    ],
                },
            ],
            subtasks: vec![],
            related_issues: vec!["#123".to_string()],
        };
        
        // 验证Agent能力匹配
        assert!(agent_config.has_all_capabilities(&task_info.required_capabilities));
        
        // 4. 创建任务分配
        let assignment = llm_orchestration::TaskAssignment {
            task_id: task_info.task_id.clone(),
            agent_id: AgentId::new(),
            assigned_at: chrono::Utc::now(),
            estimated_start_time: chrono::Utc::now() + chrono::Duration::hours(1),
            estimated_completion: chrono::Utc::now() + chrono::Duration::hours(9),
            assignment_reasoning: "Agent具备所需的前端开发和测试能力".to_string(),
            confidence_score: 0.85,
            assignment_strategy: llm_orchestration::AssignmentStrategy::CapabilityBased,
            alternative_agents: vec![],
        };
        
        // 验证分配合理性
        assert!(assignment.confidence_score > 0.8);
        assert_eq!(assignment.assignment_strategy, llm_orchestration::AssignmentStrategy::CapabilityBased);
        
        // 5. 验证序列化和反序列化
        let agent_json = serde_json::to_string(&agent_config).expect("Agent配置序列化失败");
        let _deserialized_agent: agent_management::AgentConfig = 
            serde_json::from_str(&agent_json).expect("Agent配置反序列化失败");
        
        let task_json = serde_json::to_string(&task_info).expect("任务信息序列化失败");
        let _deserialized_task: llm_orchestration::TaskInfo = 
            serde_json::from_str(&task_json).expect("任务信息反序列化失败");
        
        println!("✅ 完整的Agent工作流程测试通过");
    }
    
    /// 测试事件系统集成
    #[test]
    fn test_event_system_integration() {
        use events::*;
        
        // 1. 创建Agent创建事件
        let agent_id = AgentId::new();
        let agent_config = agent_management::AgentConfig {
            name: "事件测试Agent".to_string(),
            description: "用于测试事件系统".to_string(),
            prompt_template: "测试提示".to_string(),
            capabilities: vec![AgentCapability::Testing],
            max_concurrent_tasks: 1,
            timeout_minutes: 30,
            git_config: None,
            custom_settings: HashMap::new(),
            priority_weight: 0.5,
            verbose_logging: false,
            resource_limits: None,
        };
        
        let agent_event = EventFactory::agent_created(
            agent_id.clone(),
            agent_config,
            "test-user".to_string(),
        );
        
        assert_eq!(agent_event.agent_id, agent_id);
        assert_eq!(agent_event.created_by, "test-user");
        assert_eq!(agent_event.metadata.source, EventSource::System);
        
        // 2. 创建任务执行事件
        let task_id = TaskId::new();
        let session_id = ExecutionSessionId::new();
        let execution_config = ExecutionConfig {
            timeout_seconds: 1800,
            max_retries: 3,
            verbose_logging: true,
            environment_variables: HashMap::new(),
            resource_limits: None,
            quality_checks: QualityCheckConfig {
                enable_style_check: true,
                enable_coverage_check: true,
                enable_security_check: true,
                min_coverage_threshold: Some(0.8),
                custom_rules: vec![],
            },
        };
        
        let task_event = EventFactory::task_execution_started(
            session_id.clone(),
            task_id.clone(),
            agent_id.clone(),
            chrono::Utc::now() + chrono::Duration::hours(2),
            execution_config,
        );
        
        assert_eq!(task_event.session_id, session_id);
        assert_eq!(task_event.task_id, task_id);
        assert_eq!(task_event.agent_id, agent_id);
        assert_eq!(task_event.metadata.source, EventSource::Agent);
        
        // 3. 测试错误事件
        let error_event = EventFactory::error(
            "ValidationError".to_string(),
            "Agent配置验证失败".to_string(),
            Some(agent_id.to_string()),
        );
        
        assert_eq!(error_event.error_type, "ValidationError");
        assert_eq!(error_event.metadata.priority, EventPriority::Critical);
        
        // 4. 测试事件序列化
        let event_json = serde_json::to_string(&agent_event).expect("事件序列化失败");
        let _deserialized_event: AgentCreatedEvent = 
            serde_json::from_str(&event_json).expect("事件反序列化失败");
        
        println!("✅ 事件系统集成测试通过");
    }
    
    /// 测试类型安全和一致性
    #[test]
    fn test_type_safety_and_consistency() {
        // 1. 测试优先级排序
        let mut priorities = vec![
            TaskPriority::Low,
            TaskPriority::Critical,
            TaskPriority::Medium,
            TaskPriority::High,
        ];
        priorities.sort();
        
        assert_eq!(priorities, vec![
            TaskPriority::Low,
            TaskPriority::Medium,
            TaskPriority::High,
            TaskPriority::Critical,
        ]);
        
        // 2. 测试ID类型的一致性
        {
            let agent_id = AgentId::new();
            let project_id = ProjectId::new();
            let task_id = TaskId::new();
            
            // ID应该是不同的
            assert_ne!(agent_id.to_string(), project_id.to_string());
            assert_ne!(project_id.to_string(), task_id.to_string());
            
            // UUID格式验证
            let uuid_regex = regex::Regex::new(
                r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
            ).unwrap();
            
            assert!(uuid_regex.is_match(&agent_id.to_string()));
            assert!(uuid_regex.is_match(&project_id.to_string()));
            assert!(uuid_regex.is_match(&task_id.to_string()));
        }
        
        // 3. 测试能力枚举的一致性
        let capabilities = vec![
            AgentCapability::FrontendDevelopment,
            AgentCapability::BackendDevelopment,
            AgentCapability::Testing,
            AgentCapability::CodeReview,
        ];
        
        for capability in capabilities {
            let json = serde_json::to_string(&capability).unwrap();
            let deserialized: AgentCapability = serde_json::from_str(&json).unwrap();
            assert_eq!(capability, deserialized);
        }
        
        println!("✅ 类型安全和一致性测试通过");
    }
    
    /// 测试分页功能
    #[test]
    fn test_pagination_functionality() {
        // 创建测试数据
        let test_items: Vec<i32> = (1..=100).collect();
        
        // 测试第一页
        let page1 = PaginationResponse::new(
            test_items[0..20].to_vec(),
            100,
            1,
            20,
        );
        
        assert_eq!(page1.current_page, 1);
        assert_eq!(page1.page_size, 20);
        assert_eq!(page1.total_count, 100);
        assert_eq!(page1.total_pages, 5);
        assert!(page1.has_next_page);
        assert!(!page1.has_previous_page);
        assert_eq!(page1.items.len(), 20);
        
        // 测试中间页
        let page3 = PaginationResponse::new(
            test_items[40..60].to_vec(),
            100,
            3,
            20,
        );
        
        assert_eq!(page3.current_page, 3);
        assert!(page3.has_next_page);
        assert!(page3.has_previous_page);
        
        // 测试最后一页
        let page5 = PaginationResponse::new(
            test_items[80..100].to_vec(),
            100,
            5,
            20,
        );
        
        assert_eq!(page5.current_page, 5);
        assert!(!page5.has_next_page);
        assert!(page5.has_previous_page);
        
        // 测试默认分页参数
        let default_params = PaginationParams::default();
        assert_eq!(default_params.page, Some(1));
        assert_eq!(default_params.page_size, Some(20));
        assert_eq!(default_params.sort_order, Some(SortOrder::Asc));
        
        println!("✅ 分页功能测试通过");
    }
    
    /// 测试复杂场景下的数据一致性
    #[test]
    fn test_complex_scenario_data_consistency() {
        use llm_orchestration::*;
        
        // 创建复杂的项目上下文
        let project_context = ProjectContext {
            codebase_info: CodebaseInfo {
                total_files: 150,
                total_lines: 15000,
                main_languages: vec![
                    LanguageStats {
                        language: "TypeScript".to_string(),
                        file_count: 80,
                        line_count: 8000,
                        percentage: 53.3,
                        complexity_score: 6,
                        maintenance_score: 7,
                    },
                    LanguageStats {
                        language: "Rust".to_string(),
                        file_count: 45,
                        line_count: 5500,
                        percentage: 36.7,
                        complexity_score: 8,
                        maintenance_score: 8,
                    },
                ],
                framework_info: vec![
                    FrameworkInfo {
                        name: "React".to_string(),
                        version: "18.2.0".to_string(),
                        usage_scope: "前端UI框架".to_string(),
                        configuration_status: ConfigurationStatus::UpToDate,
                        update_recommendation: None,
                    },
                ],
                quality_metrics: CodeQualityMetrics {
                    test_coverage: 0.85,
                    average_complexity: 4.2,
                    duplication_rate: 0.03,
                    style_violations: 12,
                    security_issues: 2,
                    performance_issues: 5,
                    overall_quality_score: 8,
                },
                recent_commit_stats: CommitStats {
                    commits_last_30_days: 45,
                    active_contributors: 3,
                    average_commits_per_day: 1.5,
                    commit_type_distribution: {
                        let mut map = HashMap::new();
                        map.insert("feat".to_string(), 20);
                        map.insert("fix".to_string(), 15);
                        map.insert("refactor".to_string(), 10);
                        map
                    },
                    last_commit_time: chrono::Utc::now() - chrono::Duration::hours(2),
                },
                technical_debt: TechnicalDebtMetrics {
                    estimated_hours: 24,
                    severity_distribution: {
                        let mut map = HashMap::new();
                        map.insert("low".to_string(), 15);
                        map.insert("medium".to_string(), 8);
                        map.insert("high".to_string(), 3);
                        map
                    },
                    main_debt_types: vec![
                        DebtType::CodeDuplication,
                        DebtType::ComplexLogic,
                        DebtType::MissingTests,
                    ],
                    trend: DebtTrend::Decreasing,
                },
            },
            existing_architecture: Some("微服务架构，前后端分离".to_string()),
            development_constraints: vec![
                "必须向后兼容".to_string(),
                "性能不能降低".to_string(),
                "安全标准必须符合OWASP".to_string(),
            ],
            timeline_requirements: Some(TimelineRequirements {
                target_completion: chrono::Utc::now() + chrono::Duration::days(45),
                milestone_deadlines: vec![
                    Milestone {
                        id: "m1".to_string(),
                        name: "Alpha版本".to_string(),
                        deadline: chrono::Utc::now() + chrono::Duration::days(15),
                        deliverables: vec!["核心功能完成".to_string()],
                        dependent_tasks: vec![],
                        status: MilestoneStatus::Planned,
                        completion_rate: 0.0,
                        risk_level: RiskLevel::Low,
                    },
                ],
                critical_path_tasks: vec!["认证系统".to_string(), "数据库设计".to_string()],
                buffer_time_hours: 40,
                risk_factor: 1.2,
                work_calendar: WorkCalendar {
                    working_days: vec![1, 2, 3, 4, 5], // 周一到周五
                    hours_per_day: 8,
                    holidays: vec![],
                    team_leave_periods: vec![],
                },
            }),
            completed_tasks_summary: vec![],
            active_tasks: vec![],
            risk_assessment: RiskAssessment {
                overall_risk_level: RiskLevel::Medium,
                risk_items: vec![
                    RiskItem {
                        risk_id: "r001".to_string(),
                        description: "第三方API依赖不稳定".to_string(),
                        risk_type: RiskType::Dependency,
                        probability: 0.3,
                        impact: 0.7,
                        risk_score: 0.21,
                        status: RiskStatus::Monitoring,
                        owner: Some("架构师".to_string()),
                    },
                ],
                risk_matrix: RiskMatrix {
                    high_risk_count: 1,
                    medium_risk_count: 3,
                    low_risk_count: 5,
                    risk_distribution: HashMap::new(),
                },
                mitigation_plan: vec![
                    MitigationAction {
                        action_id: "a001".to_string(),
                        target_risk_id: "r001".to_string(),
                        description: "实现API重试机制和降级策略".to_string(),
                        action_type: MitigationActionType::Reduce,
                        responsible_person: "后端开发者".to_string(),
                        due_date: chrono::Utc::now() + chrono::Duration::days(7),
                        status: ActionStatus::Planned,
                    },
                ],
            },
            resource_availability: ResourceAvailability {
                available_agents: vec![],
                agent_workloads: HashMap::new(),
                estimated_resource_demand: ResourceDemand {
                    capability_demands: {
                        let mut map = HashMap::new();
                        map.insert("frontend_development".to_string(), 120);
                        map.insert("backend_development".to_string(), 80);
                        map.insert("testing".to_string(), 60);
                        map
                    },
                    peak_demand_periods: vec![],
                    total_estimated_hours: 260,
                },
                resource_gaps: vec![],
            },
            external_dependencies_status: vec![
                DependencyStatus {
                    name: "支付网关API".to_string(),
                    status: ExternalDependencyStatus::Available,
                    status_description: "服务正常".to_string(),
                    last_checked: chrono::Utc::now() - chrono::Duration::minutes(5),
                    impact_if_unavailable: "无法处理支付".to_string(),
                },
            ],
        };
        
        // 验证数据一致性
        assert_eq!(
            project_context.codebase_info.main_languages.len(),
            2
        );
        assert_eq!(
            project_context.codebase_info.quality_metrics.overall_quality_score,
            8
        );
        assert_eq!(
            project_context.risk_assessment.overall_risk_level,
            RiskLevel::Medium
        );
        
        // 验证计算字段的逻辑
        let total_risk_items = 
            project_context.risk_assessment.risk_matrix.high_risk_count +
            project_context.risk_assessment.risk_matrix.medium_risk_count +
            project_context.risk_assessment.risk_matrix.low_risk_count;
        assert_eq!(total_risk_items, 9);
        
        // 测试序列化和反序列化大对象
        let json = serde_json::to_string(&project_context).expect("项目上下文序列化失败");
        let deserialized: ProjectContext = 
            serde_json::from_str(&json).expect("项目上下文反序列化失败");
        
        assert_eq!(
            project_context.codebase_info.total_files,
            deserialized.codebase_info.total_files
        );
        assert_eq!(
            project_context.risk_assessment.overall_risk_level,
            deserialized.risk_assessment.overall_risk_level
        );
        
        println!("✅ 复杂场景数据一致性测试通过");
    }
    
    /// 性能基准测试
    #[test]
    fn test_performance_benchmarks() {
        use std::time::Instant;
        
        // 1. 测试大量ID生成的性能
        let start = Instant::now();
        let mut ids = Vec::new();
        
        for _ in 0..1000 {
            ids.push(AgentId::new());
        }
        
        let id_generation_time = start.elapsed();
        println!("生成1000个ID耗时: {:?}", id_generation_time);
        
        // 验证ID唯一性
        let mut unique_ids = std::collections::HashSet::new();
        for id in &ids {
            assert!(unique_ids.insert(id.clone()), "发现重复的ID");
        }
        
        // 2. 测试复杂对象序列化性能
        let agent_config = agent_management::AgentConfig {
            name: "性能测试Agent".to_string(),
            description: "用于测试序列化性能".to_string(),
            prompt_template: "长提示模板".repeat(100), // 创建长字符串
            capabilities: vec![
                AgentCapability::FrontendDevelopment,
                AgentCapability::BackendDevelopment,
                AgentCapability::Testing,
                AgentCapability::CodeReview,
                AgentCapability::Documentation,
            ],
            max_concurrent_tasks: 5,
            timeout_minutes: 120,
            git_config: None,
            custom_settings: {
                let mut settings = HashMap::new();
                for i in 0..50 {
                    settings.insert(
                        format!("setting_{}", i),
                        serde_json::Value::String(format!("value_{}", i)),
                    );
                }
                settings
            },
            priority_weight: 0.8,
            verbose_logging: true,
            resource_limits: None,
        };
        
        let start = Instant::now();
        let json = serde_json::to_string(&agent_config).expect("序列化失败");
        let serialization_time = start.elapsed();
        println!("序列化复杂配置耗时: {:?}", serialization_time);
        
        let start = Instant::now();
        let _: agent_management::AgentConfig = 
            serde_json::from_str(&json).expect("反序列化失败");
        let deserialization_time = start.elapsed();
        println!("反序列化复杂配置耗时: {:?}", deserialization_time);
        
        // 性能断言（这些阈值可能需要根据实际环境调整）
        assert!(id_generation_time.as_millis() < 1000, "ID生成过慢");
        assert!(serialization_time.as_millis() < 100, "序列化过慢");
        assert!(deserialization_time.as_millis() < 100, "反序列化过慢");
        
        println!("✅ 性能基准测试通过");
    }
}

// 添加辅助测试工具
#[cfg(test)]
mod test_helpers {
    use super::*;
    
    /// 创建测试用的Agent配置
    pub fn create_test_agent_config(name: &str) -> agent_management::AgentConfig {
        agent_management::AgentConfig {
            name: name.to_string(),
            description: format!("测试Agent: {}", name),
            prompt_template: "你是一个测试助手".to_string(),
            capabilities: vec![AgentCapability::Testing],
            max_concurrent_tasks: 1,
            timeout_minutes: 30,
            git_config: None,
            custom_settings: HashMap::new(),
            priority_weight: 0.5,
            verbose_logging: false,
            resource_limits: None,
        }
    }
    
    /// 创建测试用的项目信息
    pub fn create_test_project_info(name: &str) -> project_management::ProjectInfo {
        project_management::ProjectInfo {
            name: name.to_string(),
            description: format!("测试项目: {}", name),
            version: "1.0.0".to_string(),
            repository_url: format!("https://github.com/test/{}", name),
            main_branch: "main".to_string(),
            technology_stack: vec!["Rust".to_string()],
            coding_standards: project_management::CodingStandards::default(),
            workspace_path: std::path::PathBuf::from("/tmp/test"),
            project_type: project_management::ProjectType::Library,
            priority: project_management::ProjectPriority::Medium,
            target_completion_date: None,
            owner: "test-owner".to_string(),
            team_members: vec![],
            tags: vec!["test".to_string()],
            external_dependencies: vec![],
            environments: HashMap::new(),
        }
    }
    
    /// 创建测试用的任务信息
    pub fn create_test_task_info(title: &str) -> llm_orchestration::TaskInfo {
        llm_orchestration::TaskInfo {
            task_id: TaskId::new(),
            title: title.to_string(),
            description: format!("测试任务: {}", title),
            task_type: TaskType::Testing,
            priority: TaskPriority::Medium,
            estimated_hours: 2,
            required_capabilities: vec![AgentCapability::Testing],
            dependencies: vec![],
            acceptance_criteria: vec!["测试通过".to_string()],
            tags: vec!["test".to_string()],
            related_files: vec![],
            test_requirements: llm_orchestration::TaskTestRequirements {
                needs_unit_tests: true,
                needs_integration_tests: false,
                needs_e2e_tests: false,
                required_coverage: 0.8,
                special_test_scenarios: vec![],
            },
            complexity_assessment: llm_orchestration::ComplexityAssessment {
                technical_complexity: 2,
                business_complexity: 1,
                integration_complexity: 1,
                overall_complexity: 1,
                complexity_notes: vec![],
            },
            risk_factors: vec![],
            subtasks: vec![],
            related_issues: vec![],
        }
    }
}

// 添加regex依赖用于测试
#[cfg(test)]
mod dependencies {
    #[allow(unused_imports)]
    use regex;
}