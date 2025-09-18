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
    println!("MCP服务器配置加载完成，数量: {}", mcp_servers.len());
    
    // 创建配置，包含从设置中获取的 MCP 服务器
    let mut config_toml = ConfigToml::default();
    config_toml.mcp_servers = mcp_servers;
    
    println!("开始创建Codex配置...");
    Config::load_from_base_config_with_overrides(
        config_toml,
        ConfigOverrides {
            show_raw_agent_reasoning: Some(show_raw_reasoning),
            ..Default::default()
        },
        codex_home,
    ).map_err(|e| {
        eprintln!("创建配置失败详情: {:#}", e);
        format!("创建配置失败: {}", e)
    })
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
    
    // 创建配置时增加更详细的错误处理
    let config = match create_config().await {
        Ok(config) => {
            println!("配置创建成功");
            config
        }
        Err(e) => {
            eprintln!("配置创建失败: {}", e);
            return Err(format!("配置创建失败: {}", e));
        }
    };
    
    // 创建对话时增加更详细的错误处理
    let new_conversation: NewConversation = conversation_manager
        .new_conversation(config)
        .await
        .map_err(|e| {
            eprintln!("创建对话失败详情: {:#}", e);
            
            // 检查具体错误类型提供更有用的信息
            if let Some(codex_err) = e.downcast_ref::<codex_core::error::CodexErr>() {
                match codex_err {
                    codex_core::error::CodexErr::InternalAgentDied => {
                        "创建对话时agent loop异常终止，请检查API配置和MCP服务器设置".to_string()
                    }
                    _ => format!("创建对话失败: {}", e)
                }
            } else {
                format!("创建对话失败: {}", e)
            }
        })?;
    
    let conversation_id = new_conversation.conversation_id;
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
        println!("开始提交用户输入: {}", message_content);
        
        // 提交用户输入
        if let Err(e) = conversation.submit(Op::UserInput {
            items: vec![InputItem::Text {
                text: message_content,
            }],
        }).await {
            eprintln!("提交用户输入失败: {e}");
            eprintln!("错误详情: {e:#}");
            
            // 发送详细错误信息到前端
            let error_msg = format!("处理消息失败: {e:#}");
            let _ = app_handle.emit(&format!("conversation_events_{}", conv_id), &error_msg);
            return;
        }
        
        println!("用户输入提交成功，开始事件循环");
        
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
                        
                        // 发送完整的事件对象到前端（包含ID和消息）
                        if let Err(e) = app_handle.emit(&format!("conversation_events_{}", conv_id), &event) {
                            eprintln!("发送事件失败: {e}");
                        } else {
                            println!("成功发送事件");
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
                        eprintln!("错误详情: {e:#}");
                        
                        // 检查是否是agent loop死掉的错误
                        if let Some(codex_err) = e.downcast_ref::<codex_core::error::CodexErr>() {
                            match codex_err {
                                codex_core::error::CodexErr::InternalAgentDied => {
                                    eprintln!("检测到agent loop异常终止，可能原因：");
                                    eprintln!("1. API密钥配置错误");
                                    eprintln!("2. MCP服务器启动失败");
                                    eprintln!("3. 模型配置问题");
                                    eprintln!("4. 权限或网络问题");
                                }
                                _ => {}
                            }
                        }
                        
                        // 发送详细错误消息到前端
                        let error_msg = format!("事件流错误: {e:#}");
                        let _ = app_handle.emit(&format!("conversation_events_{}", conv_id), &error_msg);
                        break;
                    }
                }
            }
        }
        
        println!("对话 {} 事件处理完成", conv_id);
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

/// 处理执行命令审批
#[tauri::command]
pub async fn approve_exec_command(
    conversation_id: String,
    approval_id: String,
    decision: String, // "approved" | "approved_for_session" | "denied" | "abort"
    conversation_manager: State<'_, ConversationManagerHandle>,
) -> Result<(), String> {
    println!("处理执行命令审批: {} -> {}", approval_id, decision);
    
    let conversation_uuid = uuid::Uuid::parse_str(&conversation_id)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(ConversationId(conversation_uuid))
        .await
        .map_err(|e| format!("获取对话失败: {e}"))?;
    
    // 解析审批决策
    let review_decision = match decision.as_str() {
        "approved" => codex_core::protocol::ReviewDecision::Approved,
        "approved_for_session" => codex_core::protocol::ReviewDecision::ApprovedForSession,
        "denied" => codex_core::protocol::ReviewDecision::Denied,
        "abort" => codex_core::protocol::ReviewDecision::Abort,
        _ => return Err(format!("无效的审批决策: {}", decision)),
    };
    
    // 提交审批决策
    conversation.submit(Op::ExecApproval {
        id: approval_id,
        decision: review_decision,
    }).await
        .map_err(|e| format!("提交审批决策失败: {e}"))?;
    
    println!("审批决策已提交: {}", decision);
    Ok(())
}

/// 处理补丁应用审批
#[tauri::command]
pub async fn approve_patch_command(
    conversation_id: String,
    approval_id: String,
    decision: String, // "approved" | "approved_for_session" | "denied" | "abort"
    conversation_manager: State<'_, ConversationManagerHandle>,
) -> Result<(), String> {
    println!("处理补丁应用审批: {} -> {}", approval_id, decision);
    
    let conversation_uuid = uuid::Uuid::parse_str(&conversation_id)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(ConversationId(conversation_uuid))
        .await
        .map_err(|e| format!("获取对话失败: {e}"))?;
    
    // 解析审批决策
    let review_decision = match decision.as_str() {
        "approved" => codex_core::protocol::ReviewDecision::Approved,
        "approved_for_session" => codex_core::protocol::ReviewDecision::ApprovedForSession,
        "denied" => codex_core::protocol::ReviewDecision::Denied,
        "abort" => codex_core::protocol::ReviewDecision::Abort,
        _ => return Err(format!("无效的审批决策: {}", decision)),
    };
    
    // 提交审批决策
    conversation.submit(Op::PatchApproval {
        id: approval_id,
        decision: review_decision,
    }).await
        .map_err(|e| format!("提交审批决策失败: {e}"))?;
    
    println!("补丁审批决策已提交: {}", decision);
    Ok(())
}

/// 诊断系统配置状态
#[tauri::command]
pub async fn diagnose_system() -> Result<String, String> {
    let mut report = Vec::new();
    
    // 检查配置创建
    report.push("=== 系统诊断报告 ===".to_string());
    
    match create_config().await {
        Ok(_) => {
            report.push("✅ 配置创建成功".to_string());
        }
        Err(e) => {
            report.push(format!("❌ 配置创建失败: {}", e));
        }
    }
    
    // 检查环境变量
    report.push("\n=== 环境变量检查 ===".to_string());
    if std::env::var("OPENAI_API_KEY").is_ok() {
        report.push("✅ OPENAI_API_KEY 已设置".to_string());
    } else {
        report.push("❌ OPENAI_API_KEY 未设置".to_string());
    }
    
    if std::env::var("ANTHROPIC_API_KEY").is_ok() {
        report.push("✅ ANTHROPIC_API_KEY 已设置".to_string());
    } else {
        report.push("❌ ANTHROPIC_API_KEY 未设置".to_string());
    }
    
    // 检查设置
    report.push("\n=== 应用设置检查 ===".to_string());
    
    // 使用嵌套块来避免跨await边界的Send问题
    let settings_section = async {
        let settings_manager = SettingsManager::new()
            .map_err(|e| format!("❌ 设置管理器创建失败: {}", e))?;
            
        let app_settings = settings_manager.load_settings().await
            .map_err(|e| format!("❌ 应用设置加载失败: {}", e))?;
            
        let mut section_report = Vec::new();
        section_report.push("✅ 应用设置加载成功".to_string());
        section_report.push(format!("API提供商: {:?}", app_settings.system.api_config.provider));
        
        if app_settings.system.api_config.api_key.is_empty() {
            section_report.push("❌ API密钥未配置".to_string());
        } else {
            section_report.push("✅ API密钥已配置".to_string());
        }
        
        let enabled_mcp_count = app_settings.system.mcp_servers.iter().filter(|s| s.enabled).count();
        section_report.push(format!("MCP服务器: {} 个已启用", enabled_mcp_count));
        
        Ok::<Vec<String>, String>(section_report)
    }.await;
    
    match settings_section {
        Ok(mut section_lines) => {
            report.append(&mut section_lines);
        }
        Err(error_msg) => {
            report.push(error_msg);
        }
    }
    
    Ok(report.join("\n"))
}

/// 移除对话监听器 - 简化实现
#[tauri::command]
pub async fn remove_conversation_listener(
    _conversation_id: String,
) -> Result<(), String> {
    // 事件监听现在通过Tauri的事件系统直接处理
    Ok(())
}

