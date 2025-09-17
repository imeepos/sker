# ChatPro 组件

使用 `events` 系统的专业聊天界面组件，完全符合 ag-ui 设计规范。

## 概述

ChatPro 是一个专业的聊天界面组件，它使用现有的 EventMsg 渲染系统来显示各种类型的聊天事件和交互。

## 主要特性

- ✅ **事件驱动**：使用 `EventMsgRenderer` 统一渲染所有 `EventMsg` 类型
- ✅ **完整交互**：支持消息发送、文件上传、事件选择等完整交互功能
- ✅ **实时状态**：实时显示处理状态和事件流
- ✅ **响应式设计**：适配不同屏幕尺寸的响应式布局
- ✅ **ag-ui 规范**：完全符合项目 ag-ui 设计规范
- ✅ **类型安全**：完整的 TypeScript 类型支持

## 组件架构

### 主要组件

- **`ChatPro`** - 主组件，提供完整的聊天界面
- **`ChatProHeader`** - 头部组件，显示会话信息和操作按钮
- **`ChatProInput`** - 输入组件，支持文本输入和文件上传
- **`EventsList`** - 事件列表组件，使用 EventMsgRenderer 渲染事件
- **`ChatProExample`** - 使用示例组件

### 设计原则

1. **事件优先**：所有聊天内容都通过 EventMsg 事件表示
2. **组件复用**：充分利用现有的 events 组件系统
3. **状态管理**：清晰的状态管理和事件流控制
4. **用户体验**：优秀的交互体验和视觉反馈

## 快速开始

### 基础使用

```tsx
import { ChatPro, ChatProEvent } from './components/chat-pro'
import { EventMsg } from './types/protocol/EventMsg'

function MyApp() {
  const [events, setEvents] = useState<ChatProEvent[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSendMessage = (message: string, attachments?: File[]) => {
    // 处理用户消息
    const userEvent: ChatProEvent = {
      id: generateId(),
      event: { type: 'user_message', message } as EventMsg,
      timestamp: new Date(),
      status: 'completed'
    }
    setEvents(prev => [...prev, userEvent])
    
    // 触发 AI 处理...
  }

  return (
    <ChatPro
      events={events}
      isProcessing={isProcessing}
      title="我的聊天"
      model="claude-3-sonnet"
      onSendMessage={handleSendMessage}
    />
  )
}
```

### 事件类型支持

ChatPro 支持所有 EventMsg 类型，包括：

- `user_message` - 用户消息
- `agent_message` - AI 助手消息  
- `task_started` / `task_complete` - 任务状态
- `token_count` - Token 统计
- `mcp_tool_call_begin` / `mcp_tool_call_end` - MCP 工具调用
- `exec_command_begin` / `exec_command_end` - 命令执行
- `web_search_begin` / `web_search_end` - 网络搜索
- `error` - 错误事件
- 以及所有其他 EventMsg 类型...

### 事件状态管理

每个事件都可以有以下状态：

```tsx
type EventStatus = 'pending' | 'processing' | 'completed' | 'error'
```

状态会影响事件的视觉表现：
- `pending` - 灰色，等待处理
- `processing` - 蓝色，正在处理中
- `completed` - 绿色，已完成
- `error` - 红色，出现错误

## API 参考

### ChatPro Props

```tsx
interface ChatProProps {
  /** 事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 会话标题 */
  title?: string
  /** 模型名称 */
  model?: string
  /** 是否启用输入 */
  enableInput?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
  /** 设置回调 */
  onOpenSettings?: () => void
}
```

### ChatProEvent 类型

```tsx
interface ChatProEvent {
  id: string
  event: EventMsg
  timestamp: Date
  status?: 'pending' | 'processing' | 'completed' | 'error'
}
```

## 示例

查看 `ChatProExample.tsx` 文件获取完整的使用示例，包括：

- 如何创建和管理事件
- 如何处理用户交互
- 如何模拟 AI 响应流程
- 如何处理错误和状态变化

## 文件结构

```
chat-pro/
├── ChatPro.tsx              # 主组件
├── ChatProHeader.tsx        # 头部组件
├── ChatProInput.tsx         # 输入组件
├── EventsList.tsx          # 事件列表组件
├── ChatProExample.tsx      # 使用示例
├── index.ts               # 导出文件
└── README.md             # 说明文档
```

## 依赖关系

ChatPro 组件依赖以下现有系统：

- `EventMsgRenderer` - 事件渲染系统
- `EventMsg` 类型系统 - 标准事件类型定义
- `ag-ui` 组件库 - Card, Button, Badge 等基础组件
- `utils` 工具函数 - cn, formatTime 等工具函数

## 注意事项

1. **事件ID唯一性**：确保每个事件都有唯一的 ID
2. **类型安全**：使用正确的 EventMsg 类型结构
3. **状态管理**：合理管理事件状态和处理流程
4. **性能考虑**：对于大量事件，考虑使用虚拟滚动
5. **错误处理**：妥善处理异常情况和错误状态

## 扩展和自定义

ChatPro 组件设计为高度可定制的：

- 通过 `className` 自定义样式
- 通过回调函数集成自定义逻辑
- 通过 EventMsg 系统扩展新的事件类型
- 通过组件插槽扩展功能

## 最佳实践

1. **事件管理**：使用状态管理库（如 Zustand）管理复杂的事件状态
2. **类型安全**：始终使用 TypeScript 类型定义
3. **错误处理**：提供完善的错误处理和用户反馈
4. **性能优化**：使用 React.memo 和 useCallback 优化性能
5. **用户体验**：提供清晰的加载状态和操作反馈