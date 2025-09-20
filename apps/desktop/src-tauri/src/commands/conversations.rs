use tauri::{State, Emitter, AppHandle};
use std::sync::Arc;
use codex_core::{ConversationManager, NewConversation};
use codex_core::protocol::{Op, InputItem, EventMsg};
use codex_protocol::mcp_protocol::ConversationId;
use crate::{
    models::{Conversation, SendMessageRequest},
    commands::config::create_config,
};

// 全局对话管理器
pub type ConversationManagerHandle = Arc<ConversationManager>;

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
    // 从字符串创建ConversationId
    let conversation_id = ConversationId::from_string(&conversation_id_str)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(conversation_id)
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
                            println!("成功发送事件: {}", event.id);
                        }
                        
                        // 处理生命周期管理
                        match event.msg {
                            EventMsg::TaskComplete(_) => {
                                // 任务完成，继续等待下一个用户输入，不自动关闭对话
                                println!("任务完成，等待下一个用户输入...");
                                // 桌面应用中不应该自动发送Shutdown信号
                                // 继续事件循环，等待下一个用户交互
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
    
    // 从字符串创建ConversationId
    let conversation_id = ConversationId::from_string(&conversation_id)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(conversation_id)
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

/// 处理执行命令审批
#[tauri::command]
pub async fn approve_exec_command(
    conversation_id: String,
    approval_id: String,
    decision: String, // "approved" | "approved_for_session" | "denied" | "abort"
    conversation_manager: State<'_, ConversationManagerHandle>,
) -> Result<(), String> {
    println!("处理执行命令审批: {} -> {}", approval_id, decision);
    
    // 从字符串创建ConversationId
    let conversation_id = ConversationId::from_string(&conversation_id)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(conversation_id)
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
    
    // 从字符串创建ConversationId
    let conversation_id = ConversationId::from_string(&conversation_id)
        .map_err(|_| "无效的对话ID")?;
    
    // 从ConversationManager获取对话实例
    let conversation = conversation_manager
        .get_conversation(conversation_id)
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