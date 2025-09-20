use serde::{Deserialize, Serialize};


/// 消息角色枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

/// 消息实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: i64,
    pub is_streaming: Option<bool>,
}

/// 对话实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<Message>,
    pub created_at: i64,
    pub updated_at: i64,
    pub model: String,
    pub is_active: bool,
}

/// 流式响应事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum StreamEvent {
    #[serde(rename = "delta")]
    Delta { content: String },
    #[serde(rename = "done")]
    Done,
    #[serde(rename = "error")]
    Error { error: String },
}

/// 发送消息请求
#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub conversation_id: String,
    pub content: String,
}

/// 项目实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub project_id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub repository_url: String,
    pub main_branch: String,
    pub workspace_path: String,
    pub technology_stack: Vec<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

/// 创建项目请求
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub repository_url: String,
    pub main_branch: Option<String>,
    pub workspace_path: String,
    pub technology_stack: Option<Vec<String>>,
}

/// 更新项目请求
#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub project_id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub repository_url: Option<String>,
    pub main_branch: Option<String>,
    pub workspace_path: Option<String>,
    pub technology_stack: Option<Vec<String>>,
    pub status: Option<String>,
}

/// 项目请求（用于查询）
#[derive(Debug, Deserialize)]
pub struct ProjectRequest {
    pub project_id: Option<String>,
    pub user_id: Option<String>,
    pub name: Option<String>,
    pub status: Option<String>,
}

/// 智能体实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub agent_id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub prompt_template: String,
    pub capabilities: Vec<String>,
    pub config: serde_json::Value,
    pub git_config: Option<serde_json::Value>,
    pub status: String,
    pub current_task_id: Option<String>,
    pub total_tasks_completed: i32,
    pub success_rate: f64,
    pub average_completion_time: i32,
    pub created_at: String,
    pub updated_at: String,
    pub last_active_at: String,
    pub skill_profile: Option<serde_json::Value>,
    pub skill_assessments: Option<serde_json::Value>,
    pub performance_trend: Option<serde_json::Value>,
}

/// 创建智能体请求
#[derive(Debug, Deserialize)]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: Option<String>,
    pub prompt_template: String,
    pub capabilities: Vec<String>,
    pub config: Option<serde_json::Value>,
    pub git_config: Option<serde_json::Value>,
}

/// 更新智能体请求
#[derive(Debug, Deserialize)]
pub struct UpdateAgentRequest {
    pub agent_id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub prompt_template: Option<String>,
    pub capabilities: Option<Vec<String>>,
    pub config: Option<serde_json::Value>,
    pub git_config: Option<serde_json::Value>,
    pub status: Option<String>,
}

/// 智能体工作历史
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentWorkHistory {
    pub history_id: String,
    pub agent_id: String,
    pub task_id: String,
    pub task_type: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub success: Option<bool>,
    pub completion_time_minutes: Option<i32>,
    pub quality_score: Option<f64>,
    pub work_details: Option<serde_json::Value>,
    pub technologies_used: Vec<String>,
    pub error_message: Option<String>,
    pub created_at: String,
}

/// 智能体性能指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPerformanceMetrics {
    pub metrics_id: String,
    pub agent_id: String,
    pub period_start: String,
    pub period_end: String,
    pub tasks_completed: i32,
    pub tasks_successful: i32,
    pub avg_completion_time: f64,
    pub avg_code_quality: f64,
    pub skill_improvements: serde_json::Value,
    pub created_at: String,
}


impl Message {
    /// 创建用户消息
    pub fn new_user_message(conversation_id: String, content: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            conversation_id,
            role: MessageRole::User,
            content,
            timestamp: chrono::Utc::now().timestamp_millis(),
            is_streaming: None,
        }
    }

    /// 创建助手消息
    pub fn new_assistant_message(conversation_id: String, content: String, is_streaming: bool) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            conversation_id,
            role: MessageRole::Assistant,
            content,
            timestamp: chrono::Utc::now().timestamp_millis(),
            is_streaming: Some(is_streaming),
        }
    }

    /// 创建系统消息
    pub fn new_system_message(conversation_id: String, content: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            conversation_id,
            role: MessageRole::System,
            content,
            timestamp: chrono::Utc::now().timestamp_millis(),
            is_streaming: None,
        }
    }
}

impl Conversation {
    /// 创建新对话
    pub fn new(model: String) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: "新的对话".to_string(),
            messages: Vec::new(),
            created_at: now,
            updated_at: now,
            model,
            is_active: true,
        }
    }

    /// 添加消息
    pub fn add_message(&mut self, message: Message) {
        self.messages.push(message);
        self.updated_at = chrono::Utc::now().timestamp_millis();
        
        // 如果是第一条用户消息，使用其内容作为标题
        if self.messages.len() == 1 && self.messages[0].role == MessageRole::User {
            self.title = self.messages[0].content.chars().take(30).collect::<String>();
            if self.messages[0].content.len() > 30 {
                self.title.push_str("...");
            }
        }
    }

    /// 更新最后一条消息
    pub fn update_last_message(&mut self, content: Option<String>, is_streaming: Option<bool>) {
        if let Some(last_message) = self.messages.last_mut() {
            if let Some(new_content) = content {
                last_message.content = new_content;
            }
            if let Some(streaming) = is_streaming {
                last_message.is_streaming = Some(streaming);
            }
            self.updated_at = chrono::Utc::now().timestamp_millis();
        }
    }
}

