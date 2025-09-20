use tauri::State;
use std::sync::Arc;
use codex_database::DatabaseConnection;
use uuid::Uuid;
use crate::models::{
    Agent, CreateAgentRequest, UpdateAgentRequest, 
    AgentWorkHistory, AgentPerformanceMetrics
};

// 数据库连接管理器
pub type DatabaseHandle = Arc<DatabaseConnection>;

/// 创建新智能体
#[tauri::command]
pub async fn create_agent(
    request: CreateAgentRequest,
    token: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Agent, String> {
    // 验证token并获取当前用户
    let auth_service = crate::auth::AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await
        .map_err(|e| format!("身份验证失败: {}", e))?;

    println!("创建新智能体: {} (用户: {})", request.name, current_user.username);

    let db = &**db;
    let agent_repo = codex_database::repository::agent_repository::AgentRepository::new(db.clone());

    // 处理能力数组
    let capabilities_json = serde_json::to_value(&request.capabilities)
        .map_err(|e| format!("能力序列化失败: {}", e))?;

    // 创建智能体数据
    let agent_data = codex_database::repository::agent_repository::CreateAgentData {
        user_id: current_user.user_id,
        name: request.name.clone(),
        description: request.description.clone(),
        prompt_template: request.prompt_template.clone(),
        capabilities: capabilities_json,
        config: request.config.unwrap_or_else(|| serde_json::json!({})),
        git_config: request.git_config,
    };

    let created_agent = agent_repo.create(agent_data).await
        .map_err(|e| format!("创建智能体失败: {}", e))?;

    // 转换为前端模型
    let agent = Agent {
        agent_id: created_agent.agent_id.to_string(),
        user_id: created_agent.user_id.to_string(),
        name: created_agent.name,
        description: created_agent.description,
        prompt_template: created_agent.prompt_template,
        capabilities: serde_json::from_value(created_agent.capabilities).unwrap_or_default(),
        config: created_agent.config,
        git_config: created_agent.git_config,
        status: created_agent.status,
        current_task_id: created_agent.current_task_id.map(|id| id.to_string()),
        total_tasks_completed: created_agent.total_tasks_completed,
        success_rate: created_agent.success_rate,
        average_completion_time: created_agent.average_completion_time,
        created_at: created_agent.created_at.to_rfc3339(),
        updated_at: created_agent.updated_at.to_rfc3339(),
        last_active_at: created_agent.last_active_at.to_rfc3339(),
        skill_profile: created_agent.skill_profile,
        skill_assessments: created_agent.skill_assessments,
        performance_trend: created_agent.performance_trend,
    };

    println!("智能体创建成功: {}", agent.agent_id);
    Ok(agent)
}

/// 获取智能体列表
#[tauri::command]
pub async fn get_agents(
    token: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Vec<Agent>, String> {
    // 验证token并获取当前用户
    let auth_service = crate::auth::AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await
        .map_err(|e| format!("身份验证失败: {}", e))?;

    println!("获取用户 {} 的智能体列表", current_user.username);

    let db = &**db;
    let agent_repo = codex_database::repository::agent_repository::AgentRepository::new(db.clone());

    // 获取当前用户的所有智能体
    let agents = agent_repo.find_by_user_id(current_user.user_id).await
        .map_err(|e| format!("查询智能体失败: {}", e))?;

    let result: Vec<Agent> = agents.into_iter().map(|a| {
        Agent {
            agent_id: a.agent_id.to_string(),
            user_id: a.user_id.to_string(),
            name: a.name,
            description: a.description,
            prompt_template: a.prompt_template,
            capabilities: serde_json::from_value(a.capabilities).unwrap_or_default(),
            config: a.config,
            git_config: a.git_config,
            status: a.status,
            current_task_id: a.current_task_id.map(|id| id.to_string()),
            total_tasks_completed: a.total_tasks_completed,
            success_rate: a.success_rate,
            average_completion_time: a.average_completion_time,
            created_at: a.created_at.to_rfc3339(),
            updated_at: a.updated_at.to_rfc3339(),
            last_active_at: a.last_active_at.to_rfc3339(),
            skill_profile: a.skill_profile,
            skill_assessments: a.skill_assessments,
            performance_trend: a.performance_trend,
        }
    }).collect();

    println!("返回智能体数量: {}", result.len());
    Ok(result)
}

/// 获取智能体详情
#[tauri::command]
pub async fn get_agent(
    agent_id: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Option<Agent>, String> {
    println!("获取智能体详情: {}", agent_id);

    let agent_uuid = Uuid::parse_str(&agent_id)
        .map_err(|_| "无效的智能体ID格式")?;

    let db = &**db;
    let agent_repo = codex_database::repository::agent_repository::AgentRepository::new(db.clone());

    let agent = agent_repo.find_by_id(agent_uuid).await
        .map_err(|e| format!("查询智能体失败: {}", e))?;

    match agent {
        Some(a) => {
            let result = Agent {
                agent_id: a.agent_id.to_string(),
                user_id: a.user_id.to_string(),
                name: a.name,
                description: a.description,
                prompt_template: a.prompt_template,
                capabilities: serde_json::from_value(a.capabilities).unwrap_or_default(),
                config: a.config,
                git_config: a.git_config,
                status: a.status,
                current_task_id: a.current_task_id.map(|id| id.to_string()),
                total_tasks_completed: a.total_tasks_completed,
                success_rate: a.success_rate,
                average_completion_time: a.average_completion_time,
                created_at: a.created_at.to_rfc3339(),
                updated_at: a.updated_at.to_rfc3339(),
                last_active_at: a.last_active_at.to_rfc3339(),
                skill_profile: a.skill_profile,
                skill_assessments: a.skill_assessments,
                performance_trend: a.performance_trend,
            };
            Ok(Some(result))
        }
        None => Ok(None)
    }
}

/// 更新智能体
#[tauri::command]
pub async fn update_agent(
    request: UpdateAgentRequest,
    db: State<'_, DatabaseHandle>,
) -> Result<Agent, String> {
    println!("更新智能体: {}", request.agent_id);

    let agent_uuid = Uuid::parse_str(&request.agent_id)
        .map_err(|_| "无效的智能体ID格式")?;

    let db = &**db;
    let agent_repo = codex_database::repository::agent_repository::AgentRepository::new(db.clone());

    // 验证智能体是否存在
    let _existing_agent = agent_repo.find_by_id(agent_uuid).await
        .map_err(|e| format!("查询智能体失败: {}", e))?
        .ok_or_else(|| "智能体不存在".to_string())?;

    // 处理状态更新
    if let Some(status) = request.status {
        let agent_status = match status.as_str() {
            "idle" => codex_database::entities::agent::AgentStatus::Idle,
            "working" => codex_database::entities::agent::AgentStatus::Working,
            "paused" => codex_database::entities::agent::AgentStatus::Paused,
            "error" => codex_database::entities::agent::AgentStatus::Error,
            "offline" => codex_database::entities::agent::AgentStatus::Offline,
            _ => return Err("无效的智能体状态".to_string()),
        };
        
        let updated_agent = agent_repo.update_status(agent_uuid, agent_status, None).await
            .map_err(|e| format!("更新智能体状态失败: {}", e))?;

        let result = Agent {
            agent_id: updated_agent.agent_id.to_string(),
            user_id: updated_agent.user_id.to_string(),
            name: updated_agent.name,
            description: updated_agent.description,
            prompt_template: updated_agent.prompt_template,
            capabilities: serde_json::from_value(updated_agent.capabilities).unwrap_or_default(),
            config: updated_agent.config,
            git_config: updated_agent.git_config,
            status: updated_agent.status,
            current_task_id: updated_agent.current_task_id.map(|id| id.to_string()),
            total_tasks_completed: updated_agent.total_tasks_completed,
            success_rate: updated_agent.success_rate,
            average_completion_time: updated_agent.average_completion_time,
            created_at: updated_agent.created_at.to_rfc3339(),
            updated_at: updated_agent.updated_at.to_rfc3339(),
            last_active_at: updated_agent.last_active_at.to_rfc3339(),
            skill_profile: updated_agent.skill_profile,
            skill_assessments: updated_agent.skill_assessments,
            performance_trend: updated_agent.performance_trend,
        };

        println!("智能体状态更新成功: {}", result.agent_id);
        Ok(result)
    } else {
        // TODO: 实现其他字段的更新
        Err("目前只支持状态更新".to_string())
    }
}

/// 删除智能体
#[tauri::command]
pub async fn delete_agent(
    agent_id: String,
    db: State<'_, DatabaseHandle>,
) -> Result<(), String> {
    println!("删除智能体: {}", agent_id);

    let agent_uuid = Uuid::parse_str(&agent_id)
        .map_err(|_| "无效的智能体ID格式")?;

    let db = &**db;
    let agent_repo = codex_database::repository::agent_repository::AgentRepository::new(db.clone());

    agent_repo.delete(agent_uuid).await
        .map_err(|e| format!("删除智能体失败: {}", e))?;

    println!("智能体删除成功: {}", agent_id);
    Ok(())
}

/// 获取智能体工作历史
#[tauri::command]
pub async fn get_agent_work_history(
    agent_id: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Vec<AgentWorkHistory>, String> {
    println!("获取智能体工作历史: {}", agent_id);

    let agent_uuid = Uuid::parse_str(&agent_id)
        .map_err(|_| "无效的智能体ID格式")?;

    let db = &**db;
    let work_history_repo = codex_database::repository::agent_work_history_repository::AgentWorkHistoryRepository::new(db.clone());

    let history_records = work_history_repo.find_by_agent_id(agent_uuid).await
        .map_err(|e| format!("查询工作历史失败: {}", e))?;

    let result: Vec<AgentWorkHistory> = history_records.into_iter().map(|h| {
        AgentWorkHistory {
            history_id: h.history_id.to_string(),
            agent_id: h.agent_id.to_string(),
            task_id: h.task_id.to_string(),
            task_type: h.task_type,
            started_at: h.started_at.to_rfc3339(),
            completed_at: h.completed_at.map(|dt| dt.to_rfc3339()),
            success: h.success,
            completion_time_minutes: h.completion_time_minutes,
            quality_score: h.quality_score,
            work_details: h.work_details,
            technologies_used: serde_json::from_value(h.technologies_used).unwrap_or_default(),
            error_message: h.error_message,
            created_at: h.created_at.to_rfc3339(),
        }
    }).collect();

    println!("返回工作历史记录数量: {}", result.len());
    Ok(result)
}

/// 获取智能体性能指标
#[tauri::command]
pub async fn get_agent_performance_metrics(
    agent_id: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Vec<AgentPerformanceMetrics>, String> {
    println!("获取智能体性能指标: {}", agent_id);

    let agent_uuid = Uuid::parse_str(&agent_id)
        .map_err(|_| "无效的智能体ID格式")?;

    let db = &**db;
    let metrics_repo = codex_database::repository::agent_performance_metrics_repository::AgentPerformanceMetricsRepository::new(db.clone());

    let metrics_records = metrics_repo.find_by_agent_id(agent_uuid).await
        .map_err(|e| format!("查询性能指标失败: {}", e))?;

    let result: Vec<AgentPerformanceMetrics> = metrics_records.into_iter().map(|m| {
        AgentPerformanceMetrics {
            metrics_id: m.metrics_id.to_string(),
            agent_id: m.agent_id.to_string(),
            period_start: m.period_start.to_rfc3339(),
            period_end: m.period_end.to_rfc3339(),
            tasks_completed: m.tasks_completed,
            tasks_successful: m.tasks_successful,
            avg_completion_time: m.avg_completion_time,
            avg_code_quality: m.avg_code_quality,
            skill_improvements: m.skill_improvements,
            created_at: m.created_at.to_rfc3339(),
        }
    }).collect();

    println!("返回性能指标记录数量: {}", result.len());
    Ok(result)
}