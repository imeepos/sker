use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

use crate::models::{Message, MessageRole, StreamEvent};

/// AI客户端配置
#[derive(Debug, Clone)]
pub struct AiClientConfig {
    pub model: String,
    pub max_tokens: u32,
    pub temperature: f32,
}

impl Default for AiClientConfig {
    fn default() -> Self {
        Self {
            model: "gpt-4".to_string(),
            max_tokens: 4096,
            temperature: 0.7,
        }
    }
}

/// AI客户端接口
pub trait AiClient: Send + Sync {
    /// 发送消息并返回流式响应
    fn send_message(
        &self,
        messages: Vec<Message>,
        config: AiClientConfig,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<mpsc::Receiver<StreamEvent>, Box<dyn std::error::Error>>> + Send + '_>>;
}

/// 模拟AI客户端（用于演示和测试）
pub struct MockAiClient;

impl MockAiClient {
    pub fn new() -> Self {
        Self
    }
}

impl AiClient for MockAiClient {
    fn send_message(
        &self,
        messages: Vec<Message>,
        _config: AiClientConfig,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<mpsc::Receiver<StreamEvent>, Box<dyn std::error::Error>>> + Send + '_>> {
        Box::pin(async move {
        let (tx, rx) = mpsc::channel(100);
        
        // 获取最后一条用户消息
        let user_message = messages
            .iter()
            .rev()
            .find(|m| m.role == MessageRole::User)
            .map(|m| m.content.as_str())
            .unwrap_or("没有找到用户消息");
        
        // 模拟AI响应
        let response = format!(
            "这是对您消息「{}」的模拟AI回复。\n\n在实际实现中，这里会调用真正的AI API，比如：\n- OpenAI GPT API\n- Anthropic Claude API\n- 或者本地模型\n\n当前这只是一个演示功能。",
            user_message
        );
        
        // 启动异步任务来发送流式响应
        tokio::spawn(async move {
            // 将响应分成单词进行流式传输
            let words: Vec<&str> = response.split_whitespace().collect();
            
            for word in words {
                // 发送增量内容
                if let Err(_) = tx.send(StreamEvent::Delta {
                    content: format!("{word} "),
                }).await {
                    break; // 接收器已关闭
                }
                
                // 模拟网络延迟
                sleep(Duration::from_millis(50)).await;
            }
            
            // 发送完成信号
            let _ = tx.send(StreamEvent::Done).await;
        });
        
        Ok(rx)
        })
    }
}

/// OpenAI客户端（集成sker-core）
pub struct OpenAiClient {
    _config: AiClientConfig,
}

impl OpenAiClient {
    pub fn new(config: AiClientConfig) -> Self {
        Self {
            _config: config,
        }
    }
}

impl AiClient for OpenAiClient {
    fn send_message(
        &self,
        _messages: Vec<Message>,
        _config: AiClientConfig,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<mpsc::Receiver<StreamEvent>, Box<dyn std::error::Error>>> + Send + '_>> {
        Box::pin(async move {
            // TODO: 集成sker-core的AI客户端
            // 现在返回错误，表示尚未实现
            Err("OpenAI客户端尚未实现，请使用MockAiClient进行测试".into())
        })
    }
}

/// AI客户端工厂
pub struct AiClientFactory;

impl AiClientFactory {
    /// 创建AI客户端
    pub fn create_client(provider: &str, config: AiClientConfig) -> Box<dyn AiClient> {
        match provider {
            "mock" => Box::new(MockAiClient::new()),
            "openai" => Box::new(OpenAiClient::new(config)),
            _ => {
                // 默认使用模拟客户端
                eprintln!("未知的AI提供商: {}，使用模拟客户端", provider);
                Box::new(MockAiClient::new())
            }
        }
    }
}