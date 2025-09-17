// 简化的命令层 - 直接使用ConversationManager，借鉴CLI实现
use tauri::{State, Emitter, AppHandle};
use std::sync::Arc;
use codex_core::{ConversationManager, NewConversation};
use codex_core::config::{Config, ConfigOverrides, ConfigToml};
use codex_core::protocol::{Op, InputItem, EventMsg};
use codex_protocol::mcp_protocol::ConversationId;
use crate::{
    models::{Conversation, SendMessageRequest},
    settings::{SettingsManager, ApiProvider},
};
use serde_json::{Map, Value};

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
    
    // 从应用设置中获取 MCP 服务器配置
    let mcp_servers = get_mcp_servers_from_settings(&app_settings);
    
    // 创建配置，包含从设置中获取的 MCP 服务器
    let mut config_toml = ConfigToml::default();
    config_toml.mcp_servers = mcp_servers;
    
    Config::load_from_base_config_with_overrides(
        config_toml,
        ConfigOverrides {
            show_raw_agent_reasoning: Some(show_raw_reasoning),
            ..Default::default()
        },
        codex_home,
    ).map_err(|e| format!("创建配置失败: {}", e))
}

/// 从应用设置中获取 MCP 服务器配置
fn get_mcp_servers_from_settings(
    app_settings: &crate::settings::AppSettings,
) -> std::collections::HashMap<String, codex_core::config_types::McpServerConfig> {
    let mut servers = std::collections::HashMap::new();
    
    // 从设置中读取启用的 MCP 服务器
    for server in &app_settings.system.mcp_servers {
        if server.enabled {
            // 转换设置中的 McpServerConfig 到 core 中的 McpServerConfig
            let core_server = codex_core::config_types::McpServerConfig {
                command: server.command.clone(),
                args: server.args.clone(),
                env: server.env.clone(),
                startup_timeout_ms: server.startup_timeout_ms.map(|v| v as u64),
            };
            
            servers.insert(server.name.clone(), core_server);
        }
    }
    
    if servers.is_empty() {
        println!("当前没有启用的 MCP 服务器。请在设置页面中添加并启用 MCP 服务器配置。");
    } else {
        println!("已从设置中加载 {} 个启用的 MCP 服务器配置", servers.len());
        for name in servers.keys() {
            println!("  - {}", name);
        }
    }
    
    servers
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

/// 发送消息 - 使用符合协议规范的事件处理模式
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
    
    // 启动异步事件处理，使用标准的事件处理模式
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
            // 发送错误事件，使用前端期望的格式
            let mut error_event = Map::new();
            error_event.insert("type".to_string(), Value::String("error".to_string()));
            error_event.insert("message".to_string(), Value::String(format!("处理消息失败: {e}")));
            
            if let Ok(event_json) = serde_json::to_string(&error_event) {
                let _ = app_handle.emit(&format!("conversation_events_{}", conv_id), &event_json);
            }
            return;
        }
        
        // 事件处理循环 - 借鉴CLI的标准模式
        loop {
            tokio::select! {
                // 处理中断信号（虽然在桌面应用中可能不常用，但符合标准实践）
                _ = tokio::signal::ctrl_c() => {
                    println!("收到中断信号，正在停止对话...");
                    if let Err(e) = conversation.submit(Op::Interrupt).await {
                        eprintln!("发送中断信号失败: {e}");
                    }
                    break;
                }
                // 处理事件流
                res = conversation.next_event() => match res {
                    Ok(event) => {
                        // 检查是否为关闭完成事件
                        let is_shutdown_complete = matches!(event.msg, EventMsg::ShutdownComplete);
                        
                        // 将事件转换为前端期望的格式并发送
                        let frontend_event = convert_event_to_frontend_format(&event);
                        if let Ok(event_json) = serde_json::to_string(&frontend_event) {
                            if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &event_json) {
                                eprintln!("发送事件失败: {e}");
                            } else {
                                println!("成功发送事件: {:?}", frontend_event.get("type"));
                            }
                        } else {
                            eprintln!("序列化事件失败: {:?}", event);
                        }
                        
                        // 处理生命周期管理
                        match event.msg {
                            EventMsg::TaskComplete(_) => {
                                // 任务完成，但不立即退出，等待ShutdownComplete
                                println!("任务完成，等待关闭确认...");
                                if let Err(e) = conversation.submit(Op::Shutdown).await {
                                    eprintln!("发送关闭信号失败: {e}");
                                    break;
                                }
                            }
                            EventMsg::ShutdownComplete => {
                                // 真正的结束信号
                                println!("对话已正常关闭");
                                break;
                            }
                            EventMsg::Error(_) => {
                                // 错误事件，退出循环
                                println!("收到错误事件，结束对话");
                                break;
                            }
                            EventMsg::TurnAborted(_) => {
                                // 会话被中断
                                println!("会话被中断");
                                break;
                            }
                            _ => {
                                // 其他事件继续处理
                            }
                        }
                        
                        if is_shutdown_complete {
                            break;
                        }
                    }
                    Err(e) => {
                        eprintln!("获取事件失败: {e}");
                        // 发送错误事件，使用前端期望的格式
                        let mut error_event = Map::new();
                        error_event.insert("type".to_string(), Value::String("error".to_string()));
                        error_event.insert("message".to_string(), Value::String(format!("事件流错误: {e}")));
                        
                        if let Ok(event_json) = serde_json::to_string(&error_event) {
                            let _ = app_handle.emit(&format!("conversation_events_{}", conv_id), &event_json);
                        }
                        break;
                    }
                }
            }
        }
        
        println!("事件处理循环结束: {}", conv_id);
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

/// 中断对话 - 发送中断信号给对话
#[tauri::command]
pub async fn interrupt_conversation(
    conversation_id: String,
    conversation_manager: State<'_, ConversationManagerHandle>,
) -> Result<(), String> {
    println!("正在中断对话: {}", conversation_id);
    
    let conversation_uuid = uuid::Uuid::parse_str(&conversation_id)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(ConversationId(conversation_uuid))
        .await
        .map_err(|e| format!("获取对话失败: {e}"))?;
    
    // 发送中断信号
    conversation.submit(Op::Interrupt).await
        .map_err(|e| format!("发送中断信号失败: {e}"))?;
    
    println!("对话中断信号已发送: {}", conversation_id);
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

/// 将 Codex 事件转换为前端期望的格式
fn convert_event_to_frontend_format(event: &codex_core::protocol::Event) -> Map<String, Value> {
    let mut frontend_event = Map::new();
    
    match &event.msg {
        EventMsg::UserMessage(user_msg) => {
            frontend_event.insert("type".to_string(), Value::String("user_message".to_string()));
            frontend_event.insert("content".to_string(), Value::String(user_msg.message.clone()));
        }
        EventMsg::AgentMessage(agent_msg) => {
            frontend_event.insert("type".to_string(), Value::String("agent_message".to_string()));
            frontend_event.insert("content".to_string(), Value::String(agent_msg.message.clone()));
        }
        EventMsg::AgentMessageDelta(delta) => {
            frontend_event.insert("type".to_string(), Value::String("agent_message_delta".to_string()));
            frontend_event.insert("delta".to_string(), Value::String(delta.delta.clone()));
        }
        EventMsg::McpToolCallBegin(tool_call_begin) => {
            frontend_event.insert("type".to_string(), Value::String("mcp_tool_call_begin".to_string()));
            frontend_event.insert("call_id".to_string(), Value::String(tool_call_begin.call_id.clone()));
            
            let mut invocation = Map::new();
            invocation.insert("server".to_string(), Value::String(tool_call_begin.invocation.server.clone()));
            invocation.insert("tool".to_string(), Value::String(tool_call_begin.invocation.tool.clone()));
            if let Some(args) = &tool_call_begin.invocation.arguments {
                invocation.insert("arguments".to_string(), args.clone());
            } else {
                invocation.insert("arguments".to_string(), Value::Null);
            }
            frontend_event.insert("invocation".to_string(), Value::Object(invocation));
        }
        EventMsg::McpToolCallEnd(tool_call_end) => {
            frontend_event.insert("type".to_string(), Value::String("mcp_tool_call_end".to_string()));
            frontend_event.insert("call_id".to_string(), Value::String(tool_call_end.call_id.clone()));
            
            let mut invocation = Map::new();
            invocation.insert("server".to_string(), Value::String(tool_call_end.invocation.server.clone()));
            invocation.insert("tool".to_string(), Value::String(tool_call_end.invocation.tool.clone()));
            if let Some(args) = &tool_call_end.invocation.arguments {
                invocation.insert("arguments".to_string(), args.clone());
            } else {
                invocation.insert("arguments".to_string(), Value::Null);
            }
            frontend_event.insert("invocation".to_string(), Value::Object(invocation));
            
            // 转换 Duration 为字符串格式，符合前端协议
            frontend_event.insert("duration".to_string(), Value::String(format!("{}ms", tool_call_end.duration.as_millis())));
            
            // 处理 Result 类型，转换为前端期望的格式
            match &tool_call_end.result {
                Ok(result) => {
                    frontend_event.insert("success".to_string(), Value::Bool(true));
                    if let Ok(result_json) = serde_json::to_value(result) {
                        frontend_event.insert("result".to_string(), result_json);
                    } else {
                        frontend_event.insert("result".to_string(), Value::Null);
                    }
                }
                Err(err) => {
                    frontend_event.insert("success".to_string(), Value::Bool(false));
                    frontend_event.insert("result".to_string(), Value::String(err.clone()));
                }
            }
        }
        EventMsg::WebSearchBegin(web_search_begin) => {
            frontend_event.insert("type".to_string(), Value::String("web_search_begin".to_string()));
            frontend_event.insert("call_id".to_string(), Value::String(web_search_begin.call_id.clone()));
            // 注意：WebSearchBegin 按协议规范不包含 query 字段
        }
        EventMsg::WebSearchEnd(web_search_end) => {
            frontend_event.insert("type".to_string(), Value::String("web_search_end".to_string()));
            frontend_event.insert("call_id".to_string(), Value::String(web_search_end.call_id.clone()));
            frontend_event.insert("query".to_string(), Value::String(web_search_end.query.clone()));
        }
        EventMsg::TaskComplete(task_complete) => {
            frontend_event.insert("type".to_string(), Value::String("task_complete".to_string()));
            if let Some(last_message) = &task_complete.last_agent_message {
                frontend_event.insert("last_agent_message".to_string(), Value::String(last_message.clone()));
            } else {
                frontend_event.insert("last_agent_message".to_string(), Value::Null);
            }
        }
        EventMsg::Error(error_event) => {
            frontend_event.insert("type".to_string(), Value::String("error".to_string()));
            frontend_event.insert("message".to_string(), Value::String(error_event.message.clone()));
        }
        EventMsg::TaskStarted(_) => {
            frontend_event.insert("type".to_string(), Value::String("task_started".to_string()));
        }
        EventMsg::TurnAborted(turn_aborted) => {
            frontend_event.insert("type".to_string(), Value::String("turn_aborted".to_string()));
            if let Ok(reason_json) = serde_json::to_value(&turn_aborted.reason) {
                frontend_event.insert("reason".to_string(), reason_json);
            }
        }
        EventMsg::ShutdownComplete => {
            frontend_event.insert("type".to_string(), Value::String("shutdown_complete".to_string()));
        }
        // 对于其他事件类型，尝试直接序列化 msg 部分
        _ => {
            if let Ok(msg_json) = serde_json::to_value(&event.msg) {
                if let Value::Object(mut msg_map) = msg_json {
                    // 如果 msg 已经有 type 字段，直接使用
                    // 否则尝试从枚举名推断
                    if !msg_map.contains_key("type") {
                        let type_name = match &event.msg {
                            EventMsg::SessionConfigured(_) => "session_configured",
                            EventMsg::StreamError(_) => "stream_error",
                            EventMsg::BackgroundEvent(_) => "background_event", 
                            EventMsg::TokenCount(_) => "token_count",
                            EventMsg::ExecCommandBegin(_) => "exec_command_begin",
                            EventMsg::ExecCommandEnd(_) => "exec_command_end",
                            EventMsg::ExecCommandOutputDelta(_) => "exec_command_output_delta",
                            EventMsg::PatchApplyBegin(_) => "patch_apply_begin",
                            EventMsg::PatchApplyEnd(_) => "patch_apply_end",
                            EventMsg::AgentReasoning(_) => "agent_reasoning",
                            EventMsg::AgentReasoningDelta(_) => "agent_reasoning_delta",
                            _ => "unknown"
                        };
                        msg_map.insert("type".to_string(), Value::String(type_name.to_string()));
                    }
                    return msg_map;
                }
            }
            
            // fallback: 创建最基本的事件格式
            frontend_event.insert("type".to_string(), Value::String("unknown".to_string()));
            frontend_event.insert("raw_event".to_string(), Value::String(format!("{:?}", event.msg)));
        }
    }
    
    frontend_event
}
