// 简化的命令层 - 直接使用ConversationManager，借鉴CLI实现
use tauri::{State, Emitter, AppHandle};
use std::sync::Arc;
use codex_core::{ConversationManager, NewConversation};
use codex_core::config::{Config, ConfigToml, ConfigOverrides};
use codex_core::protocol::{Op, InputItem, EventMsg};
use codex_protocol::mcp_protocol::ConversationId;
use crate::{
    models::{Conversation, SendMessageRequest, ConversationPlan, UpdatePlanRequest, UpdatePlanItemRequest, StepStatus},
    storage::StorageManager,
    settings::{SettingsManager, ApiProvider},
};

// 全局对话管理器
type ConversationManagerHandle = Arc<ConversationManager>;

// 创建配置的辅助函数
async fn create_config() -> Result<Config, String> {
    // 创建配置目录
    let codex_home = std::env::var("SKER_HOME")
        .map(|h| std::path::PathBuf::from(h))
        .unwrap_or_else(|_| std::env::temp_dir().join("sker_temp"));
    
    // 确保目录存在
    std::fs::create_dir_all(&codex_home)
        .map_err(|e| format!("创建配置目录失败: {}", e))?;
    
    // 加载应用设置
    let settings_manager = SettingsManager::new()
        .map_err(|e| format!("创建设置管理器失败: {}", e))?;
    let app_settings = settings_manager.load_settings().await
        .map_err(|e| format!("加载设置失败: {}", e))?;
    
    let api_config = &app_settings.system.api_config;
    
    // 检查API配置
    if api_config.api_key.is_empty() {
        return Err("未配置API密钥！请在设置中配置API密钥".to_string());
    }
    
    // 设置环境变量
    match api_config.provider {
        ApiProvider::Openai => {
            std::env::set_var("OPENAI_API_KEY", &api_config.api_key);
        }
        ApiProvider::Custom => {
            std::env::set_var("OPENAI_API_KEY", &api_config.api_key);
            if let Some(base_url) = &api_config.base_url {
                std::env::set_var("OPENAI_BASE_URL", base_url);
            } else {
                return Err("自定义代理配置缺少base_url".to_string());
            }
        }
        ApiProvider::Anthropic => {
            std::env::set_var("ANTHROPIC_API_KEY", &api_config.api_key);
            if let Some(base_url) = &api_config.base_url {
                std::env::set_var("ANTHROPIC_BASE_URL", base_url);
            }
        }
    }
    
    let show_raw_reasoning = app_settings.conversation.stream_response;
    
    Config::load_from_base_config_with_overrides(
        ConfigToml::default(),
        ConfigOverrides {
            show_raw_agent_reasoning: Some(show_raw_reasoning),
            ..Default::default()
        },
        codex_home,
    ).map_err(|e| format!("创建配置失败: {}", e))
}

/// 创建新对话 - 直接使用ConversationManager
#[tauri::command]
pub async fn create_conversation(
    conversation_manager: State<'_, ConversationManagerHandle>,
) -> Result<String, String> {
    println!("开始创建新对话...");
    
    let config = create_config().await?;
    
    let NewConversation {
        conversation_id,
        conversation: _,
        session_configured: _,
    } = conversation_manager
        .new_conversation(config)
        .await
        .map_err(|e| format!("创建对话失败: {}", e))?;
    
    println!("成功创建对话: {}", conversation_id);
    Ok(conversation_id.to_string())
}

/// 发送消息 - 直接使用ConversationManager，借鉴CLI的事件处理模式
#[tauri::command] 
pub async fn send_message(
    request: SendMessageRequest,
    conversation_manager: State<'_, ConversationManagerHandle>,
    app: AppHandle,
) -> Result<(), String> {
    let conversation_id_str = request.conversation_id.clone();
    let conversation_id = uuid::Uuid::parse_str(&conversation_id_str)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(ConversationId(conversation_id))
        .await
        .map_err(|e| format!("获取对话失败: {e}"))?;
    
    // 启动异步事件处理，借鉴CLI的模式
    let app_handle = app.clone();
    let conv_id = conversation_id_str.clone();
    let message_content = request.content.clone();
    
    tokio::spawn(async move {
        // 提交用户输入
        if let Err(e) = conversation.submit(Op::UserInput {
            items: vec![InputItem::Text {
                text: message_content,
            }],
        }).await {
            eprintln!("提交用户输入失败: {e}");
            let error_event = serde_json::json!({
                "type": "error",
                "message": format!("处理消息失败: {e}")
            });
            let _ = app_handle.emit(&format!("conversation_events_{}", conv_id), &error_event);
            return;
        }
        
        // 事件处理循环 - 直接借鉴CLI的next_event模式
        loop {
            match conversation.next_event().await {
                Ok(event) => {
                    match event.msg {
                        EventMsg::UserMessage(user_msg) => {
                            let user_event = serde_json::json!({
                                "type": "user_message",
                                "content": user_msg.message
                            });
                            
                            if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &user_event) {
                                eprintln!("发送用户消息事件失败: {e}");
                            }
                        }
                        EventMsg::AgentMessage(agent_msg) => {
                            let ai_event = serde_json::json!({
                                "type": "agent_message",
                                "content": agent_msg.message
                            });
                            
                            if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &ai_event) {
                                eprintln!("发送AI消息事件失败: {e}");
                            }
                        }
                        EventMsg::AgentMessageDelta(delta) => {
                            let delta_event = serde_json::json!({
                                "type": "agent_message_delta",
                                "delta": delta.delta
                            });
                            
                            if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &delta_event) {
                                eprintln!("发送增量事件失败: {e}");
                            }
                        }
                        EventMsg::TaskComplete(_) => {
                            let complete_event = serde_json::json!({
                                "type": "task_complete"
                            });
                            
                            if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &complete_event) {
                                eprintln!("发送完成事件失败: {e}");
                            }
                            break;
                        }
                        EventMsg::Error(error_event) => {
                            let error_event = serde_json::json!({
                                "type": "error",
                                "message": error_event.message
                            });
                            
                            if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &error_event) {
                                eprintln!("发送错误事件失败: {e}");
                            }
                            break;
                        }
                        _ => {
                            // 其他事件类型，记录日志
                        }
                    }
                }
                Err(e) => {
                    eprintln!("获取事件失败: {e}");
                    let error_event = serde_json::json!({
                        "type": "error",
                        "message": format!("事件流错误: {e}")
                    });
                    
                    let _ = app_handle.emit(&format!("conversation_events_{}", conv_id), &error_event);
                    break;
                }
            }
        }
    });
    
    Ok(())
}

/// 加载对话历史 - 简化实现
#[tauri::command]
pub async fn load_conversations() -> Result<Vec<Conversation>, String> {
    // 暂时返回空列表，后续可以实现持久化存储
    Ok(Vec::new())
}

/// 删除对话 - 简化实现
#[tauri::command]
pub async fn delete_conversation(
    _conversation_id: String,
) -> Result<(), String> {
    // TODO: 实现对话删除功能
    Ok(())
}

/// 中断对话 - 暂时返回成功状态
#[tauri::command]
pub async fn interrupt_conversation(
    _conversation_id: String,
) -> Result<(), String> {
    // TODO: 实现对话中断功能
    Ok(())
}

/// 添加对话监听器 - 简化实现
#[tauri::command]
pub async fn add_conversation_listener(
    _conversation_id: String,
) -> Result<(), String> {
    // 事件监听现在通过Tauri的事件系统直接处理
    Ok(())
}

/// 移除对话监听器 - 简化实现
#[tauri::command]
pub async fn remove_conversation_listener(
    _conversation_id: String,
) -> Result<(), String> {
    // 事件监听现在通过Tauri的事件系统直接处理
    Ok(())
}

// ==================== 计划管理相关命令 ====================

/// 获取对话计划
#[tauri::command]
pub async fn get_conversation_plan(
    conversation_id: String,
    storage: State<'_, std::sync::Arc<tokio::sync::Mutex<StorageManager>>>,
) -> Result<Option<ConversationPlan>, String> {
    let storage_guard = storage.lock().await;
    storage_guard.load_conversation_plan(&conversation_id)
        .await
        .map_err(|e| format!("加载对话计划失败: {}", e))
}

/// 更新对话计划
#[tauri::command]
pub async fn update_conversation_plan(
    request: UpdatePlanRequest,
    storage: State<'_, std::sync::Arc<tokio::sync::Mutex<StorageManager>>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let plan = ConversationPlan::new(
        request.conversation_id.clone(),
        request.explanation,
        request.plan,
    );

    let storage_guard = storage.lock().await;
    storage_guard.save_conversation_plan(&plan)
        .await
        .map_err(|e| format!("保存对话计划失败: {}", e))?;

    // 发送计划更新事件到前端
    app.emit("plan-update", serde_json::json!({
        "conversation_id": request.conversation_id,
        "plan": plan
    })).map_err(|e| format!("发送计划更新事件失败: {}", e))?;

    Ok(())
}

/// 更新计划项状态
#[tauri::command]
pub async fn update_plan_item_status(
    request: UpdatePlanItemRequest,
    storage: State<'_, std::sync::Arc<tokio::sync::Mutex<StorageManager>>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let storage_guard = storage.lock().await;
    storage_guard.update_plan_item_status(
        &request.conversation_id,
        request.item_index,
        request.status.clone(),
    )
    .await
    .map_err(|e| format!("更新计划项状态失败: {}", e))?;

    // 重新获取更新后的计划并发送事件
    if let Ok(Some(updated_plan)) = storage_guard.load_conversation_plan(&request.conversation_id).await {
        app.emit("plan-item-updated", serde_json::json!({
            "conversation_id": request.conversation_id,
            "item_index": request.item_index,
            "new_status": request.status,
            "plan": updated_plan
        })).map_err(|e| format!("发送计划项更新事件失败: {}", e))?;
    }

    Ok(())
}

/// 清空对话计划
#[tauri::command]
pub async fn clear_conversation_plan(
    conversation_id: String,
    storage: State<'_, std::sync::Arc<tokio::sync::Mutex<StorageManager>>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let storage_guard = storage.lock().await;
    storage_guard.delete_conversation_plan(&conversation_id)
        .await
        .map_err(|e| format!("删除对话计划失败: {}", e))?;

    // 发送计划清空事件到前端
    app.emit("plan-cleared", serde_json::json!({
        "conversation_id": conversation_id
    })).map_err(|e| format!("发送计划清空事件失败: {}", e))?;

    Ok(())
}

/// 添加计划项
#[tauri::command]
pub async fn add_plan_item(
    conversation_id: String,
    step_text: String,
    status: StepStatus,
    storage: State<'_, std::sync::Arc<tokio::sync::Mutex<StorageManager>>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let storage_guard = storage.lock().await;
    
    // 获取现有计划或创建新计划
    let mut plan = match storage_guard.load_conversation_plan(&conversation_id).await {
        Ok(Some(existing_plan)) => existing_plan,
        Ok(None) => ConversationPlan::new(conversation_id.clone(), None, Vec::new()),
        Err(e) => return Err(format!("加载对话计划失败: {}", e)),
    };

    // 添加新项目
    plan.add_item(step_text, status);
    
    // 保存更新后的计划
    storage_guard.save_conversation_plan(&plan)
        .await
        .map_err(|e| format!("保存对话计划失败: {}", e))?;

    // 发送计划更新事件
    app.emit("plan-item-added", serde_json::json!({
        "conversation_id": conversation_id,
        "plan": plan
    })).map_err(|e| format!("发送计划项添加事件失败: {}", e))?;

    Ok(())
}