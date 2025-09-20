use tauri::State;
use std::sync::Arc;
use codex_database::{
    DatabaseConnection,
    repository::project_repository::{ProjectRepository, CreateProjectData},
};
use uuid::Uuid;
use crate::models::{CreateProjectRequest, UpdateProjectRequest};

// 数据库连接管理器
pub type DatabaseHandle = Arc<DatabaseConnection>;

/// 创建新项目
#[tauri::command]
pub async fn create_project(
    request: CreateProjectRequest,
    token: String,
    db: State<'_, DatabaseHandle>,
) -> Result<crate::models::Project, String> {
    // 验证token并获取当前用户
    let auth_service = crate::auth::AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await
        .map_err(|e| format!("身份验证失败: {}", e))?;
    
    println!("创建新项目: {} (用户: {})", request.name, current_user.username);
    
    let db = &**db;
    let project_repo = ProjectRepository::new(db.clone());
    
    // 使用当前登录用户的ID
    let user_id = current_user.user_id;
    
    // 创建项目
    let project_data = CreateProjectData {
        user_id,
        name: request.name.clone(),
        description: request.description.clone(),
        repository_url: request.repository_url.clone(),
        workspace_path: request.workspace_path.clone(),
    };
    
    let created_project = project_repo.create(project_data).await
        .map_err(|e| format!("创建项目失败: {}", e))?;
    
    // 转换为前端模型
    let project = crate::models::Project {
        project_id: created_project.project_id.to_string(),
        user_id: created_project.user_id.to_string(),
        name: created_project.name,
        description: created_project.description,
        repository_url: created_project.repository_url,
        main_branch: created_project.main_branch,
        workspace_path: created_project.workspace_path,
        technology_stack: created_project.technology_stack
            .and_then(|v| serde_json::from_value::<Vec<String>>(v).ok())
            .unwrap_or_default(),
        status: created_project.status,
        created_at: created_project.created_at.to_rfc3339(),
        updated_at: created_project.updated_at.to_rfc3339(),
    };
    
    println!("项目创建成功: {}", project.project_id);
    Ok(project)
}

/// 获取项目列表
#[tauri::command]
pub async fn get_projects(
    token: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Vec<crate::models::Project>, String> {
    // 验证token并获取当前用户
    let auth_service = crate::auth::AuthService::new((**db).clone());
    let current_user = auth_service.validate_token(&token).await
        .map_err(|e| format!("身份验证失败: {}", e))?;
    
    println!("获取用户 {} 的项目列表", current_user.username);
    
    let db = &**db;
    let project_repo = ProjectRepository::new(db.clone());
    
    // 获取当前用户的所有项目
    let projects = project_repo.find_by_user(current_user.user_id).await
        .map_err(|e| format!("查询项目失败: {}", e))?;
    
    let result: Vec<crate::models::Project> = projects.into_iter().map(|p| {
        crate::models::Project {
            project_id: p.project_id.to_string(),
            user_id: p.user_id.to_string(),
            name: p.name,
            description: p.description,
            repository_url: p.repository_url,
            main_branch: p.main_branch,
            workspace_path: p.workspace_path,
            technology_stack: p.technology_stack
                .and_then(|v| serde_json::from_value::<Vec<String>>(v).ok())
                .unwrap_or_default(),
            status: p.status,
            created_at: p.created_at.to_rfc3339(),
            updated_at: p.updated_at.to_rfc3339(),
        }
    }).collect();
    
    println!("返回项目数量: {}", result.len());
    Ok(result)
}

/// 获取项目详情
#[tauri::command]
pub async fn get_project(
    project_id: String,
    db: State<'_, DatabaseHandle>,
) -> Result<Option<crate::models::Project>, String> {
    println!("获取项目详情: {}", project_id);
    
    let project_uuid = Uuid::parse_str(&project_id)
        .map_err(|_| "无效的项目ID格式")?;
    
    let db = &**db;
    let project_repo = ProjectRepository::new(db.clone());
    
    let project = project_repo.find_by_id(project_uuid).await
        .map_err(|e| format!("查询项目失败: {}", e))?;
    
    match project {
        Some(p) => {
            let result = crate::models::Project {
                project_id: p.project_id.to_string(),
                user_id: p.user_id.to_string(),
                name: p.name,
                description: p.description,
                repository_url: p.repository_url,
                main_branch: p.main_branch,
                workspace_path: p.workspace_path,
                technology_stack: p.technology_stack
                    .and_then(|v| serde_json::from_value::<Vec<String>>(v).ok())
                    .unwrap_or_default(),
                status: p.status,
                created_at: p.created_at.to_rfc3339(),
                updated_at: p.updated_at.to_rfc3339(),
            };
            Ok(Some(result))
        }
        None => Ok(None)
    }
}

/// 更新项目
#[tauri::command]
pub async fn update_project(
    request: UpdateProjectRequest,
    db: State<'_, DatabaseHandle>,
) -> Result<crate::models::Project, String> {
    println!("更新项目: {}", request.project_id);
    
    let project_uuid = Uuid::parse_str(&request.project_id)
        .map_err(|_| "无效的项目ID格式")?;
    
    let db = &**db;
    let project_repo = ProjectRepository::new(db.clone());
    
    // 目前简化实现：只支持状态更新
    if let Some(status) = request.status {
        let updated_project = project_repo.update_status(project_uuid, &status).await
            .map_err(|e| format!("更新项目状态失败: {}", e))?;
        
        let result = crate::models::Project {
            project_id: updated_project.project_id.to_string(),
            user_id: updated_project.user_id.to_string(),
            name: updated_project.name,
            description: updated_project.description,
            repository_url: updated_project.repository_url,
            main_branch: updated_project.main_branch,
            workspace_path: updated_project.workspace_path,
            technology_stack: updated_project.technology_stack
                .and_then(|v| serde_json::from_value::<Vec<String>>(v).ok())
                .unwrap_or_default(),
            status: updated_project.status,
            created_at: updated_project.created_at.to_rfc3339(),
            updated_at: updated_project.updated_at.to_rfc3339(),
        };
        
        println!("项目状态更新成功: {}", result.project_id);
        Ok(result)
    } else {
        Err("目前只支持状态更新".to_string())
    }
}

/// 删除项目
#[tauri::command]
pub async fn delete_project(
    project_id: String,
    db: State<'_, DatabaseHandle>,
) -> Result<(), String> {
    println!("删除项目: {}", project_id);
    
    let project_uuid = Uuid::parse_str(&project_id)
        .map_err(|_| "无效的项目ID格式")?;
    
    let db = &**db;
    let project_repo = ProjectRepository::new(db.clone());
    
    project_repo.delete(project_uuid).await
        .map_err(|e| format!("删除项目失败: {}", e))?;
    
    println!("项目删除成功: {}", project_id);
    Ok(())
}