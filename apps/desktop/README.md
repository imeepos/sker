# Sker Desktop AI 对话应用

基于 Tauri + React + TypeScript 构建的AI对话桌面应用。

## 🎯 功能特性

### 已实现功能 ✅

1. **对话管理**
   - ✅ 创建新对话 (`create_conversation`)
   - ✅ 发送消息 (`send_message`) 
   - ✅ 加载对话历史 (`load_conversations`)
   - ✅ 删除对话 (`delete_conversation`)

2. **流式AI响应**
   - ✅ 实时流式消息传输
   - ✅ WebSocket事件系统 (`conversation-{id}`)
   - ✅ Delta/Done/Error事件处理

3. **数据持久化**
   - ✅ SQLite数据库存储
   - ✅ 对话和消息自动保存
   - ✅ 本地数据目录管理

4. **前端界面**
   - ✅ shadcn/ui 组件库
   - ✅ Zustand状态管理
   - ✅ TypeScript类型定义
   - ✅ 响应式聊天界面

### 待完善功能 🔄

1. **AI集成**
   - 🔄 集成真实AI API (目前使用Mock客户端)
   - 🔄 支持多AI提供商 (OpenAI, Claude, 本地模型)
   - 🔄 模型配置和选择

2. **高级功能**
   - 🔄 消息搜索
   - 🔄 对话导出
   - 🔄 主题切换
   - 🔄 快捷键支持

## 🏗️ 架构设计

### 后端架构 (Rust + Tauri)

```
src-tauri/
├── src/
│   ├── lib.rs           # 应用程序入口
│   ├── models.rs        # 数据模型定义
│   ├── storage.rs       # SQLite数据库管理
│   ├── ai_client.rs     # AI客户端抽象层
│   └── commands.rs      # Tauri命令实现
```

### 前端架构 (React + TypeScript)

```
src/
├── components/
│   ├── chat/           # 聊天相关组件
│   └── ui/            # 基础UI组件
├── stores/
│   └── chat.ts        # Zustand状态管理
├── types/
│   └── chat.ts        # TypeScript类型定义
└── hooks/
    └── useChat.ts     # 聊天相关Hooks
```

## 🔧 技术栈

### 后端
- **Tauri** - 跨平台桌面应用框架
- **Rust** - 系统编程语言
- **SQLx** - 异步SQL工具包
- **SQLite** - 轻量级数据库
- **Tokio** - 异步运行时

### 前端  
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Zustand** - 状态管理
- **shadcn/ui** - UI组件库
- **Tailwind CSS** - 样式框架

## 🚀 开发指南

### 环境要求
- Node.js >= 18
- Rust >= 1.70
- pnpm

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run tauri dev
```

### 构建应用
```bash
pnpm run tauri build
```

## 📦 核心组件

### 1. 数据模型

```rust
// 对话实体
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<Message>,
    pub created_at: i64,
    pub updated_at: i64,
    pub model: String,
    pub is_active: bool,
}

// 消息实体
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: i64,
    pub is_streaming: Option<bool>,
}
```

### 2. Tauri命令

```rust
#[tauri::command]
async fn create_conversation() -> Result<String, String>

#[tauri::command] 
async fn send_message(request: SendMessageRequest) -> Result<(), String>

#[tauri::command]
async fn load_conversations() -> Result<Vec<Conversation>, String>

#[tauri::command]
async fn delete_conversation(conversation_id: String) -> Result<(), String>
```

### 3. 事件系统

```typescript
// 监听流式响应
listen<StreamEvent>(`conversation-${conversationId}`, (event) => {
  handleStreamEvent(conversationId, event.payload)
})
```

## 🔒 安全考虑

1. **数据隔离** - 每个用户的数据存储在独立目录
2. **输入验证** - 所有用户输入进行验证和清理
3. **错误处理** - 完整的错误捕获和处理机制
4. **API安全** - AI API密钥安全存储和传输

## 🐛 故障排除

### 常见问题

1. **编译错误** - 确保Rust和Node.js版本正确
2. **数据库错误** - 检查写入权限和磁盘空间
3. **AI响应问题** - 验证API配置和网络连接

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
