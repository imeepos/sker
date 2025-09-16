use serde::{Deserialize, Serialize};

/// 计划项状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum StepStatus {
    Pending,
    InProgress,
    Completed,
}

/// 计划项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanItemArg {
    pub step: String,
    pub status: StepStatus,
}

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

/// 对话计划实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationPlan {
    pub id: String,
    pub conversation_id: String,
    pub explanation: Option<String>,
    pub plan_items: Vec<PlanItemArg>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 计划操作请求
#[derive(Debug, Deserialize)]
pub struct UpdatePlanRequest {
    pub conversation_id: String,
    pub explanation: Option<String>,
    pub plan: Vec<PlanItemArg>,
}

/// 计划项状态更新请求
#[derive(Debug, Deserialize)]
pub struct UpdatePlanItemRequest {
    pub conversation_id: String,
    pub item_index: usize,
    pub status: StepStatus,
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

impl ConversationPlan {
    /// 创建新的对话计划
    pub fn new(conversation_id: String, explanation: Option<String>, plan_items: Vec<PlanItemArg>) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            conversation_id,
            explanation,
            plan_items,
            created_at: now,
            updated_at: now,
        }
    }

    /// 更新计划项状态
    pub fn update_item_status(&mut self, item_index: usize, status: StepStatus) -> Result<(), String> {
        if item_index >= self.plan_items.len() {
            return Err(format!("计划项索引 {} 超出范围", item_index));
        }

        // 确保同一时间只有一个项目处于进行中状态
        if status == StepStatus::InProgress {
            for item in &mut self.plan_items {
                if item.status == StepStatus::InProgress {
                    item.status = StepStatus::Pending;
                }
            }
        }

        self.plan_items[item_index].status = status;
        self.updated_at = chrono::Utc::now().timestamp_millis();
        Ok(())
    }

    /// 添加计划项
    pub fn add_item(&mut self, step: String, status: StepStatus) {
        let item = PlanItemArg { step, status };
        self.plan_items.push(item);
        self.updated_at = chrono::Utc::now().timestamp_millis();
    }

    /// 获取当前进行中的项目
    pub fn get_in_progress_item(&self) -> Option<&PlanItemArg> {
        self.plan_items.iter().find(|item| item.status == StepStatus::InProgress)
    }

    /// 获取完成的项目数量
    pub fn completed_count(&self) -> usize {
        self.plan_items.iter().filter(|item| item.status == StepStatus::Completed).count()
    }

    /// 获取总项目数量
    pub fn total_count(&self) -> usize {
        self.plan_items.len()
    }

    /// 计算完成进度百分比
    pub fn progress_percentage(&self) -> f32 {
        if self.plan_items.is_empty() {
            return 0.0;
        }
        (self.completed_count() as f32 / self.total_count() as f32) * 100.0
    }
}