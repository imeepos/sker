//! # 基础使用示例
//! 
//! 演示如何使用 codex-multi-agent crate 的基本功能

use codex_multi_agent::{
    types::*,
    agent_management::{AgentConfig, GitConfig, ResourceLimits},
    project_management::{ProjectInfo, CodingStandards, ProjectType, ProjectPriority, 
                         TeamMember, Permission, ExternalDependency, DependencyType, 
                         EnvironmentConfig},
    llm_orchestration::{TaskInfo, TaskTestRequirements, ComplexityAssessment, 
                        RiskFactor, RiskType, RiskLevel, TaskAssignment, AssignmentStrategy},
    events::EventFactory,
    enabled_features, PaginationResponse,
};
use std::collections::HashMap;
use chrono::{Utc, Duration};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Codex Multi-Agent 系统示例");
    
    // 1. 显示启用的功能
    let features = enabled_features();
    println!("📦 启用的功能: {:?}", features);
    
    // 2. 创建Agent配置
    let agent_config = AgentConfig {
        name: "前端开发Agent".to_string(),
        description: "专门负责React和TypeScript开发的AI助手".to_string(),
        prompt_template: "你是一个专业的前端开发工程师，擅长React、TypeScript和现代Web技术。".to_string(),
        capabilities: vec![
            AgentCapability::FrontendDevelopment,
            AgentCapability::Testing,
            AgentCapability::CodeReview,
        ],
        max_concurrent_tasks: 3,
        timeout_minutes: 90,
        git_config: Some(GitConfig {
            user_name: "frontend-agent".to_string(),
            user_email: "frontend-agent@company.com".to_string(),
            ssh_key_path: None,
            default_branch: "main".to_string(),
            sign_commits: false,
            gpg_key_id: None,
            custom_config: HashMap::new(),
        }),
        custom_settings: {
            let mut settings = HashMap::new();
            settings.insert("preferred_framework".to_string(), 
                           serde_json::Value::String("React".to_string()));
            settings.insert("typescript_strict".to_string(), 
                           serde_json::Value::Bool(true));
            settings
        },
        priority_weight: 0.8,
        verbose_logging: true,
        resource_limits: Some(ResourceLimits {
            max_memory_mb: Some(2048),
            max_cpu_usage: Some(0.8),
            max_disk_usage_mb: Some(5120),
            max_network_bandwidth_kbps: Some(5000),
            max_execution_time_seconds: Some(5400), // 90分钟
        }),
    };
    
    // 验证Agent配置
    match agent_config.validate() {
        Ok(()) => println!("✅ Agent配置验证通过"),
        Err(e) => {
            eprintln!("❌ Agent配置验证失败: {}", e);
            return Err(e.into());
        }
    }
    
    println!("👤 Agent信息:");
    println!("   名称: {}", agent_config.name);
    println!("   能力: {:?}", agent_config.capabilities);
    println!("   最大并发任务: {}", agent_config.max_concurrent_tasks);
    
    // 3. 创建项目信息
    let project_info = ProjectInfo {
        name: "电商前端项目".to_string(),
        description: "现代化的电商平台前端应用".to_string(),
        version: "1.0.0".to_string(),
        repository_url: "https://github.com/company/ecommerce-frontend".to_string(),
        main_branch: "main".to_string(),
        technology_stack: vec![
            "React".to_string(),
            "TypeScript".to_string(),
            "Next.js".to_string(),
            "TailwindCSS".to_string(),
        ],
        coding_standards: CodingStandards::default(),
        workspace_path: std::path::PathBuf::from("/workspace/ecommerce-frontend"),
        project_type: ProjectType::WebApplication,
        priority: ProjectPriority::High,
        target_completion_date: Some(Utc::now() + Duration::days(60)),
        owner: "frontend-team-lead".to_string(),
        team_members: vec![
            TeamMember {
                name: "Alice Chen".to_string(),
                email: "alice@company.com".to_string(),
                role: "高级前端开发工程师".to_string(),
                permissions: vec![
                    Permission::Read,
                    Permission::Write,
                    Permission::Review,
                ],
                is_admin: false,
            },
            TeamMember {
                name: "Bob Wang".to_string(),
                email: "bob@company.com".to_string(),
                role: "前端架构师".to_string(),
                permissions: vec![
                    Permission::Read,
                    Permission::Write,
                    Permission::Review,
                    Permission::Admin,
                ],
                is_admin: true,
            },
        ],
        tags: vec![
            "frontend".to_string(),
            "react".to_string(),
            "typescript".to_string(),
            "ecommerce".to_string(),
        ],
        external_dependencies: vec![
            ExternalDependency {
                name: "支付API".to_string(),
                dependency_type: DependencyType::ExternalApi,
                version: "v2.1".to_string(),
                is_critical: true,
                documentation_url: Some("https://pay-api.company.com/docs".to_string()),
            },
        ],
        environments: {
            let mut envs = HashMap::new();
            envs.insert("development".to_string(), EnvironmentConfig {
                name: "开发环境".to_string(),
                description: "本地开发环境".to_string(),
                variables: {
                    let mut vars = HashMap::new();
                    vars.insert("NODE_ENV".to_string(), "development".to_string());
                    vars.insert("API_BASE_URL".to_string(), "http://localhost:3001".to_string());
                    vars
                },
                deployment_url: Some("http://localhost:3000".to_string()),
                is_production: false,
            });
            envs.insert("production".to_string(), EnvironmentConfig {
                name: "生产环境".to_string(),
                description: "线上生产环境".to_string(),
                variables: {
                    let mut vars = HashMap::new();
                    vars.insert("NODE_ENV".to_string(), "production".to_string());
                    vars.insert("API_BASE_URL".to_string(), "https://api.company.com".to_string());
                    vars
                },
                deployment_url: Some("https://shop.company.com".to_string()),
                is_production: true,
            });
            envs
        },
    };
    
    println!("\n🏗️ 项目信息:");
    println!("   名称: {}", project_info.name);
    println!("   类型: {:?}", project_info.project_type);
    println!("   优先级: {:?}", project_info.priority);
    println!("   技术栈: {:?}", project_info.technology_stack);
    println!("   团队成员数: {}", project_info.team_members.len());
    
    // 4. 创建任务信息
    let task = TaskInfo {
        task_id: TaskId::new(),
        title: "实现商品列表页面".to_string(),
        description: "创建商品列表页面，包括搜索、筛选、排序和分页功能".to_string(),
        task_type: TaskType::Development,
        priority: TaskPriority::High,
        estimated_hours: 16,
        required_capabilities: vec![
            AgentCapability::FrontendDevelopment,
            AgentCapability::Testing,
        ],
        dependencies: vec![],
        acceptance_criteria: vec![
            "页面能够正确显示商品列表".to_string(),
            "搜索功能正常工作".to_string(),
            "筛选器能够正确过滤商品".to_string(),
            "排序功能正常".to_string(),
            "分页组件工作正常".to_string(),
            "页面响应式设计适配移动端".to_string(),
            "单元测试覆盖率达到90%以上".to_string(),
        ],
        tags: vec!["frontend".to_string(), "product-list".to_string(), "ui".to_string()],
        related_files: vec![
            "src/pages/ProductList.tsx".to_string(),
            "src/components/ProductCard.tsx".to_string(),
            "src/components/SearchBar.tsx".to_string(),
            "src/components/FilterPanel.tsx".to_string(),
        ],
        test_requirements: TaskTestRequirements {
            needs_unit_tests: true,
            needs_integration_tests: true,
            needs_e2e_tests: true,
            required_coverage: 0.9,
            special_test_scenarios: vec![
                "搜索无结果的情况".to_string(),
                "网络错误处理".to_string(),
                "大量商品数据的性能测试".to_string(),
            ],
        },
        complexity_assessment: ComplexityAssessment {
            technical_complexity: 6,
            business_complexity: 4,
            integration_complexity: 5,
            overall_complexity: 5,
            complexity_notes: vec![
                "需要集成多个API端点".to_string(),
                "复杂的状态管理".to_string(),
                "性能优化要求较高".to_string(),
            ],
        },
        risk_factors: vec![
            RiskFactor {
                risk_type: RiskType::Technical,
                risk_level: RiskLevel::Medium,
                description: "API响应时间可能较长".to_string(),
                impact_assessment: "可能影响用户体验".to_string(),
                mitigation_strategies: vec![
                    "实现加载状态和骨架屏".to_string(),
                    "添加数据缓存机制".to_string(),
                    "实现虚拟滚动优化性能".to_string(),
                ],
            },
        ],
        subtasks: vec![],
        related_issues: vec!["#456".to_string(), "#789".to_string()],
    };
    
    // 验证Agent能力匹配
    if agent_config.has_all_capabilities(&task.required_capabilities) {
        println!("✅ Agent具备执行此任务所需的所有能力");
    } else {
        println!("⚠️ Agent缺少执行此任务所需的某些能力");
    }
    
    println!("\n📋 任务信息:");
    println!("   任务ID: {}", task.task_id);
    println!("   标题: {}", task.title);
    println!("   类型: {:?}", task.task_type);
    println!("   优先级: {:?}", task.priority);
    println!("   预估时间: {} 小时", task.estimated_hours);
    println!("   整体复杂度: {}/10", task.complexity_assessment.overall_complexity);
    
    // 5. 创建任务分配
    let assignment = TaskAssignment {
        task_id: task.task_id.clone(),
        agent_id: AgentId::new(),
        assigned_at: Utc::now(),
        estimated_start_time: Utc::now() + Duration::hours(1),
        estimated_completion: Utc::now() + Duration::hours(17),
        assignment_reasoning: "Agent具备前端开发和测试能力，与任务需求完全匹配".to_string(),
        confidence_score: 0.92,
        assignment_strategy: AssignmentStrategy::CapabilityBased,
        alternative_agents: vec![],
    };
    
    println!("\n🎯 任务分配:");
    println!("   分配给Agent: {}", assignment.agent_id);
    println!("   置信度: {:.1}%", assignment.confidence_score * 100.0);
    println!("   分配策略: {:?}", assignment.assignment_strategy);
    println!("   分配理由: {}", assignment.assignment_reasoning);
    
    // 6. 创建事件
    let agent_created_event = EventFactory::agent_created(
        assignment.agent_id.clone(),
        agent_config.clone(),
        "system-admin".to_string(),
    );
    
    println!("\n🔔 事件示例:");
    println!("   事件类型: Agent创建事件");
    println!("   事件ID: {}", agent_created_event.metadata.event_id);
    println!("   事件时间: {}", agent_created_event.metadata.timestamp);
    
    // 7. 测试序列化
    println!("\n🔄 序列化测试:");
    
    let agent_json = serde_json::to_string_pretty(&agent_config)?;
    println!("Agent配置序列化成功 ({} 字节)", agent_json.len());
    
    let task_json = serde_json::to_string_pretty(&task)?;
    println!("任务信息序列化成功 ({} 字节)", task_json.len());
    
    let event_json = serde_json::to_string_pretty(&agent_created_event)?;
    println!("事件序列化成功 ({} 字节)", event_json.len());
    
    // 8. 测试分页功能
    let test_data: Vec<i32> = (1..=100).collect();
    let page = PaginationResponse::new(
        test_data[0..20].to_vec(),
        100,
        1,
        20,
    );
    
    println!("\n📄 分页示例:");
    println!("   当前页: {}/{}", page.current_page, page.total_pages);
    println!("   每页大小: {}", page.page_size);
    println!("   总数量: {}", page.total_count);
    println!("   有下一页: {}", page.has_next_page);
    
    println!("\n✨ 示例执行完成！");
    Ok(())
}