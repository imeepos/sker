use sqlx::{sqlite::SqlitePool, Row};

use crate::models::{Conversation, Message, MessageRole, ConversationPlan, PlanItemArg, StepStatus};

/// 数据库存储管理器
pub struct StorageManager {
    pool: SqlitePool,
}

impl StorageManager {
    /// 初始化存储管理器
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // 获取应用数据目录
        let app_data_dir = dirs::data_dir()
            .ok_or("无法获取应用数据目录")?
            .join("sker");
        
        // 确保目录存在
        tokio::fs::create_dir_all(&app_data_dir).await?;
        
        let db_path = app_data_dir.join("conversations.db");
        let db_url = format!("sqlite:{}", db_path.display());
        
        // 创建连接池
        let pool = SqlitePool::connect(&db_url).await?;
        
        let manager = Self { pool };
        
        // 初始化数据库表
        manager.initialize_tables().await?;
        
        Ok(manager)
    }

    /// 初始化数据库表
    async fn initialize_tables(&self) -> Result<(), sqlx::Error> {
        // 创建对话表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                model TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT 1
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // 创建消息表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                is_streaming BOOLEAN,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // 创建对话计划表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS conversation_plans (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                explanation TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id),
                UNIQUE(conversation_id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // 创建计划项表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS plan_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id TEXT NOT NULL,
                step_text TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed')),
                item_order INTEGER NOT NULL,
                FOREIGN KEY (plan_id) REFERENCES conversation_plans (id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// 保存对话
    pub async fn save_conversation(&self, conversation: &Conversation) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT OR REPLACE INTO conversations (id, title, created_at, updated_at, model, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&conversation.id)
        .bind(&conversation.title)
        .bind(conversation.created_at)
        .bind(conversation.updated_at)
        .bind(&conversation.model)
        .bind(conversation.is_active)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// 保存消息
    pub async fn save_message(&self, message: &Message) -> Result<(), sqlx::Error> {
        let role_str = match message.role {
            MessageRole::User => "user",
            MessageRole::Assistant => "assistant",
            MessageRole::System => "system",
        };

        sqlx::query(
            "INSERT OR REPLACE INTO messages (id, conversation_id, role, content, timestamp, is_streaming) 
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&message.id)
        .bind(&message.conversation_id)
        .bind(role_str)
        .bind(&message.content)
        .bind(message.timestamp)
        .bind(message.is_streaming)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// 加载所有对话
    pub async fn load_conversations(&self) -> Result<Vec<Conversation>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM conversations ORDER BY updated_at DESC")
            .fetch_all(&self.pool)
            .await?;

        let mut conversations = Vec::new();
        
        for row in rows {
            let conversation_id: String = row.get("id");
            
            // 加载该对话的所有消息
            let messages = self.load_messages(&conversation_id).await?;
            
            let conversation = Conversation {
                id: conversation_id,
                title: row.get("title"),
                messages,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                model: row.get("model"),
                is_active: row.get("is_active"),
            };
            
            conversations.push(conversation);
        }

        Ok(conversations)
    }

    /// 加载指定对话的消息
    pub async fn load_messages(&self, conversation_id: &str) -> Result<Vec<Message>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC")
            .bind(conversation_id)
            .fetch_all(&self.pool)
            .await?;

        let mut messages = Vec::new();
        
        for row in rows {
            let role_str: String = row.get("role");
            let role = match role_str.as_str() {
                "user" => MessageRole::User,
                "assistant" => MessageRole::Assistant,
                "system" => MessageRole::System,
                _ => MessageRole::User, // 默认为用户消息
            };

            let message = Message {
                id: row.get("id"),
                conversation_id: row.get("conversation_id"),
                role,
                content: row.get("content"),
                timestamp: row.get("timestamp"),
                is_streaming: row.get("is_streaming"),
            };
            
            messages.push(message);
        }

        Ok(messages)
    }

    /// 删除对话
    pub async fn delete_conversation(&self, conversation_id: &str) -> Result<(), sqlx::Error> {
        // 删除消息
        sqlx::query("DELETE FROM messages WHERE conversation_id = ?")
            .bind(conversation_id)
            .execute(&self.pool)
            .await?;

        // 删除对话
        sqlx::query("DELETE FROM conversations WHERE id = ?")
            .bind(conversation_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// 更新消息内容
    pub async fn update_message(&self, message_id: &str, content: &str, is_streaming: Option<bool>) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE messages SET content = ?, is_streaming = ? WHERE id = ?")
            .bind(content)
            .bind(is_streaming)
            .bind(message_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// 保存对话计划
    pub async fn save_conversation_plan(&self, plan: &ConversationPlan) -> Result<(), sqlx::Error> {
        // 开始事务
        let mut tx = self.pool.begin().await?;

        // 保存或更新计划基本信息
        sqlx::query(
            "INSERT OR REPLACE INTO conversation_plans (id, conversation_id, explanation, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(&plan.id)
        .bind(&plan.conversation_id)
        .bind(&plan.explanation)
        .bind(plan.created_at)
        .bind(plan.updated_at)
        .execute(&mut *tx)
        .await?;

        // 删除旧的计划项
        sqlx::query("DELETE FROM plan_items WHERE plan_id = ?")
            .bind(&plan.id)
            .execute(&mut *tx)
            .await?;

        // 保存新的计划项
        for (index, item) in plan.plan_items.iter().enumerate() {
            let status_str = match item.status {
                StepStatus::Pending => "pending",
                StepStatus::InProgress => "in_progress", 
                StepStatus::Completed => "completed",
            };

            sqlx::query(
                "INSERT INTO plan_items (plan_id, step_text, status, item_order) VALUES (?, ?, ?, ?)",
            )
            .bind(&plan.id)
            .bind(&item.step)
            .bind(status_str)
            .bind(index as i32)
            .execute(&mut *tx)
            .await?;
        }

        // 提交事务
        tx.commit().await?;
        Ok(())
    }

    /// 加载对话计划
    pub async fn load_conversation_plan(&self, conversation_id: &str) -> Result<Option<ConversationPlan>, sqlx::Error> {
        // 查询计划基本信息
        let plan_row = sqlx::query("SELECT * FROM conversation_plans WHERE conversation_id = ?")
            .bind(conversation_id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = plan_row {
            let plan_id: String = row.get("id");
            
            // 查询计划项
            let item_rows = sqlx::query("SELECT * FROM plan_items WHERE plan_id = ? ORDER BY item_order ASC")
                .bind(&plan_id)
                .fetch_all(&self.pool)
                .await?;

            let mut plan_items = Vec::new();
            for item_row in item_rows {
                let status_str: String = item_row.get("status");
                let status = match status_str.as_str() {
                    "pending" => StepStatus::Pending,
                    "in_progress" => StepStatus::InProgress,
                    "completed" => StepStatus::Completed,
                    _ => StepStatus::Pending,
                };

                plan_items.push(PlanItemArg {
                    step: item_row.get("step_text"),
                    status,
                });
            }

            let plan = ConversationPlan {
                id: plan_id,
                conversation_id: row.get("conversation_id"),
                explanation: row.get("explanation"),
                plan_items,
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            };

            Ok(Some(plan))
        } else {
            Ok(None)
        }
    }

    /// 更新计划项状态
    pub async fn update_plan_item_status(&self, conversation_id: &str, item_index: usize, status: StepStatus) -> Result<(), sqlx::Error> {
        // 先获取计划
        if let Some(mut plan) = self.load_conversation_plan(conversation_id).await? {
            plan.update_item_status(item_index, status).map_err(|e| sqlx::Error::Protocol(e))?;
            self.save_conversation_plan(&plan).await?;
        }
        Ok(())
    }

    /// 删除对话计划
    pub async fn delete_conversation_plan(&self, conversation_id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM conversation_plans WHERE conversation_id = ?")
            .bind(conversation_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}