//! 项目实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 项目实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "projects")]
pub struct Model {
    /// 项目ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: Uuid,
    
    /// 项目所有者用户ID
    pub user_id: Uuid,
    
    /// 项目名称
    pub name: String,
    
    /// 项目描述
    pub description: Option<String>,
    
    /// Git仓库地址
    pub repository_url: String,
    
    /// 主分支名称
    pub main_branch: String,
    
    /// 工作空间路径
    pub workspace_path: String,
    
    /// 技术栈配置
    #[sea_orm(column_type = "Json")]
    pub technology_stack: Option<JsonValue>,
    
    /// 编码规范配置
    #[sea_orm(column_type = "Json")]
    pub coding_standards: Option<JsonValue>,
    
    /// Git设置
    #[sea_orm(column_type = "Json")]
    pub git_settings: Option<JsonValue>,
    
    /// 代码库信息
    #[sea_orm(column_type = "Json")]
    pub codebase_info: Option<JsonValue>,
    
    /// 项目上下文
    #[sea_orm(column_type = "Json")]
    pub project_context: Option<JsonValue>,
    
    /// 项目状态
    pub status: String,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
    
    /// 更新时间
    pub updated_at: DateTimeWithTimeZone,
    
    /// 质量标准配置（JSON格式存储QualityStandards）
    #[sea_orm(column_type = "Json")]
    pub quality_standards: Option<JsonValue>,
    
    /// 自动化配置（JSON格式存储AutomationConfig）
    #[sea_orm(column_type = "Json")]
    pub automation_config: Option<JsonValue>,
}

/// 项目关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与用户的关联关系
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::UserId"
    )]
    User,
    
    /// 与需求文档的关联关系
    #[sea_orm(has_many = "super::requirement_document::Entity")]
    RequirementDocuments,
    
    /// 与任务的关联关系
    #[sea_orm(has_many = "super::task::Entity")]
    Tasks,
}

/// 用户关联实现
impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

/// 需求文档关联实现
impl Related<super::requirement_document::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RequirementDocuments.def()
    }
}

/// 任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tasks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 代码库信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodebaseInfo {
    pub total_lines: i32,
    pub file_count: i32,
    pub rust_percentage: f64,
    pub typescript_percentage: f64,
    pub other_percentage: f64,
}

/// 质量标准结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityStandards {
    pub code_coverage: f64,
    pub code_quality_score: f64,
    pub performance_requirements: PerformanceRequirements,
}

/// 性能要求结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceRequirements {
    pub response_time_ms: i32,
    pub memory_usage_mb: i32,
}

/// 自动化配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationConfig {
    pub ci_cd: CiCdConfig,
    pub code_review: CodeReviewConfig,
}

/// CI/CD配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiCdConfig {
    pub auto_test: bool,
    pub auto_deploy: bool,
    pub test_coverage_threshold: f64,
}

/// 代码审查配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeReviewConfig {
    pub auto_assign_reviewers: bool,
    pub require_approval_count: i32,
}

/// Project实体的上下文信息管理业务方法实现
impl Model {
    /// 获取技术栈列表
    pub fn get_technology_stack(&self) -> Vec<String> {
        if let Some(tech_stack) = &self.technology_stack {
            if let Some(techs) = tech_stack.as_array() {
                return techs
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();
            }
        }
        vec![]
    }

    /// 添加技术栈
    pub fn add_technology(&mut self, technology: &str) {
        let mut techs = self.get_technology_stack();
        if !techs.contains(&technology.to_string()) {
            techs.push(technology.to_string());
            self.technology_stack = Some(serde_json::to_value(techs).unwrap_or_default());
            self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
        }
    }

    /// 更新代码库信息
    pub fn update_codebase_info(
        &mut self,
        total_lines: i32,
        file_count: i32,
        rust_percentage: f64,
        typescript_percentage: f64,
        other_percentage: f64,
    ) {
        let codebase_info = serde_json::json!({
            "total_lines": total_lines,
            "file_count": file_count,
            "main_languages": {
                "rust": rust_percentage,
                "typescript": typescript_percentage,
                "other": other_percentage
            },
            "last_updated": chrono::Utc::now().to_rfc3339()
        });

        self.codebase_info = Some(codebase_info);
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 获取代码库信息
    pub fn get_codebase_info(&self) -> CodebaseInfo {
        if let Some(info) = &self.codebase_info {
            CodebaseInfo {
                total_lines: info["total_lines"].as_i64().unwrap_or(0) as i32,
                file_count: info["file_count"].as_i64().unwrap_or(0) as i32,
                rust_percentage: info["main_languages"]["rust"].as_f64().unwrap_or(0.0),
                typescript_percentage: info["main_languages"]["typescript"].as_f64().unwrap_or(0.0),
                other_percentage: info["main_languages"]["other"].as_f64().unwrap_or(0.0),
            }
        } else {
            CodebaseInfo {
                total_lines: 0,
                file_count: 0,
                rust_percentage: 0.0,
                typescript_percentage: 0.0,
                other_percentage: 0.0,
            }
        }
    }

    /// 初始化项目配置
    pub fn initialize_project_config(&mut self) {
        if self.technology_stack.is_none() {
            self.technology_stack = Some(serde_json::json!(["rust", "typescript"]));
        }

        if self.coding_standards.is_none() {
            self.coding_standards = Some(serde_json::json!({
                "rust": {
                    "formatter": "rustfmt",
                    "linter": "clippy"
                },
                "typescript": {
                    "formatter": "prettier",
                    "linter": "eslint"
                }
            }));
        }

        if self.quality_standards.is_none() {
            self.quality_standards = Some(serde_json::json!({
                "code_coverage": 80.0,
                "code_quality_score": 8.0,
                "performance_requirements": {
                    "response_time_ms": 100,
                    "memory_usage_mb": 512
                }
            }));
        }

        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 更新质量标准
    pub fn update_quality_standards(
        &mut self,
        code_coverage: f64,
        code_quality_score: f64,
        response_time_ms: i32,
        memory_usage_mb: i32,
    ) {
        let quality_standards = serde_json::json!({
            "code_coverage": code_coverage,
            "code_quality_score": code_quality_score,
            "performance_requirements": {
                "response_time_ms": response_time_ms,
                "memory_usage_mb": memory_usage_mb
            }
        });

        self.quality_standards = Some(quality_standards);
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 获取质量标准
    pub fn get_quality_standards(&self) -> QualityStandards {
        if let Some(standards) = &self.quality_standards {
            QualityStandards {
                code_coverage: standards["code_coverage"].as_f64().unwrap_or(80.0),
                code_quality_score: standards["code_quality_score"].as_f64().unwrap_or(8.0),
                performance_requirements: PerformanceRequirements {
                    response_time_ms: standards["performance_requirements"]["response_time_ms"].as_i64().unwrap_or(100) as i32,
                    memory_usage_mb: standards["performance_requirements"]["memory_usage_mb"].as_i64().unwrap_or(512) as i32,
                },
            }
        } else {
            QualityStandards {
                code_coverage: 80.0,
                code_quality_score: 8.0,
                performance_requirements: PerformanceRequirements {
                    response_time_ms: 100,
                    memory_usage_mb: 512,
                },
            }
        }
    }

    /// 配置自动化设置
    pub fn configure_automation(
        &mut self,
        auto_test: bool,
        auto_deploy: bool,
        test_coverage_threshold: f64,
        auto_assign_reviewers: bool,
        require_approval_count: i32,
    ) {
        let automation_config = serde_json::json!({
            "ci_cd": {
                "auto_test": auto_test,
                "auto_deploy": auto_deploy,
                "test_coverage_threshold": test_coverage_threshold
            },
            "code_review": {
                "auto_assign_reviewers": auto_assign_reviewers,
                "require_approval_count": require_approval_count
            }
        });

        self.automation_config = Some(automation_config);
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 获取自动化配置
    pub fn get_automation_config(&self) -> AutomationConfig {
        if let Some(config) = &self.automation_config {
            AutomationConfig {
                ci_cd: CiCdConfig {
                    auto_test: config["ci_cd"]["auto_test"].as_bool().unwrap_or(true),
                    auto_deploy: config["ci_cd"]["auto_deploy"].as_bool().unwrap_or(false),
                    test_coverage_threshold: config["ci_cd"]["test_coverage_threshold"].as_f64().unwrap_or(80.0),
                },
                code_review: CodeReviewConfig {
                    auto_assign_reviewers: config["code_review"]["auto_assign_reviewers"].as_bool().unwrap_or(true),
                    require_approval_count: config["code_review"]["require_approval_count"].as_i64().unwrap_or(2) as i32,
                },
            }
        } else {
            AutomationConfig {
                ci_cd: CiCdConfig {
                    auto_test: true,
                    auto_deploy: false,
                    test_coverage_threshold: 80.0,
                },
                code_review: CodeReviewConfig {
                    auto_assign_reviewers: true,
                    require_approval_count: 2,
                },
            }
        }
    }

    /// 计算项目健康度
    pub fn calculate_project_health(&self) -> f64 {
        let mut health_score = 0.0;
        let mut _factors = 0;

        // 技术栈完整性 (25%)
        if !self.get_technology_stack().is_empty() {
            health_score += 25.0;
        }
        _factors += 1;

        // 代码库信息完整性 (20%)
        let codebase = self.get_codebase_info();
        if codebase.total_lines > 0 {
            health_score += 20.0;
        }
        _factors += 1;

        // 质量标准配置 (25%)
        if self.quality_standards.is_some() {
            health_score += 25.0;
        }
        _factors += 1;

        // 自动化配置 (15%)
        if self.automation_config.is_some() {
            health_score += 15.0;
        }
        _factors += 1;

        // 编码规范配置 (15%)
        if self.coding_standards.is_some() {
            health_score += 15.0;
        }
        _factors += 1;

        health_score
    }

    /// 项目状态转换方法
    pub fn transition_to_development(&mut self) {
        self.status = "development".to_string();
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    pub fn transition_to_testing(&mut self) {
        self.status = "testing".to_string();
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    pub fn transition_to_production(&mut self) {
        self.status = "production".to_string();
        self.updated_at = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
    }

    /// 检查项目是否准备好进行开发
    pub fn is_ready_for_development(&self) -> bool {
        self.has_technology_stack() && 
        self.has_quality_standards() && 
        !self.repository_url.is_empty()
    }

    /// 检查是否有技术栈配置
    pub fn has_technology_stack(&self) -> bool {
        !self.get_technology_stack().is_empty()
    }

    /// 检查是否有质量标准配置
    pub fn has_quality_standards(&self) -> bool {
        self.quality_standards.is_some()
    }

    /// 获取项目摘要
    pub fn get_project_summary(&self) -> String {
        let health = self.calculate_project_health();
        let tech_count = self.get_technology_stack().len();
        let codebase = self.get_codebase_info();
        
        format!(
            "项目：{}，状态：{}，健康度：{:.1}%，技术栈：{}项，代码行数：{}，文件数：{}",
            self.name,
            self.status,
            health,
            tech_count,
            codebase.total_lines,
            codebase.file_count
        )
    }
}