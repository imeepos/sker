# 工具调用UI组件使用指南

本文档介绍如何在桌面应用中使用工具调用UI组件来展示AI助手的工具调用过程。

## 🚀 v2.0 更新 - 参考TUI设计的智能化改进

基于Codex TUI的设计理念，我们对工具调用UI进行了全面升级：

### 主要改进
- **智能分组** - 自动识别探索类工具调用（文件读取、搜索等）并合并展示
- **JSON智能格式化** - 参考TUI的紧凑JSON格式，在保持可读性的同时节省空间
- **智能截断** - 基于终端显示最佳实践的文本截断策略
- **状态可视化** - 更丰富的状态图标和颜色系统

## 组件概览

已实现的工具调用UI组件包括：

### 1. 类型定义

`src/types/chat.ts` 中扩展了消息类型：

```typescript
// 工具调用状态
export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

// 工具调用信息
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  status: ToolCallStatus
  result?: any
  error?: string
  startTime: number
  endTime?: number
}

// 扩展的消息类型
export interface Message {
  // ... 原有字段
  toolCalls?: ToolCall[] // 工具调用列表
}
```

### 2. 核心组件

#### ToolCallCluster - 智能工具调用分组组件 🆕
- **主要组件** - 自动分组和展示工具调用
- 识别探索类工具调用（文件读取、搜索等）并合并展示
- 支持折叠/展开，节省屏幕空间
- 智能状态聚合和进度显示

```tsx
import { ToolCallCluster } from '@/components/chat/ToolCallCluster'

<ToolCallCluster toolCalls={message.toolCalls} />
```

#### ToolCallIndicator - 工具调用指示器
- 显示工具调用状态（等待、执行中、成功、失败）
- 展示工具名称和参数
- 显示执行时间
- 错误信息展示

```tsx
import { ToolCallIndicator } from '@/components/chat/ToolCallIndicator'

<ToolCallIndicator toolCall={toolCall} />
```

#### ToolCallResult - 工具调用结果展示 ⚡ 升级
- **TUI级别的智能格式化** - JSON紧凑格式，智能截断
- 智能检测结果类型（文本、JSON、图片、URL等）
- 可折叠的结果预览和完整内容
- 复制和下载功能
- 支持不同结果格式的渲染

```tsx
import { ToolCallResult } from '@/components/chat/ToolCallResult'

<ToolCallResult 
  toolCall={toolCall} 
  maxLines={5}      // 自定义最大行数
  lineWidth={80}    // 自定义行宽度
/>
```

#### ToolCallHistory - 工具调用历史
- 统计信息展示
- 按顺序展示所有工具调用
- 自动整合指示器和结果组件

```tsx
import { ToolCallHistory } from '@/components/chat/ToolCallHistory'

<ToolCallHistory toolCalls={message.toolCalls} />
```

### 3. 文本格式化工具库 🆕

`src/lib/text-formatting.ts` 提供TUI级别的文本处理能力：

```tsx
import { 
  formatJsonCompact,
  formatAndTruncateToolResult,
  detectToolResultType,
  isExploringToolCall,
  formatDuration 
} from '@/lib/text-formatting'

// JSON紧凑格式化
const compactJson = formatJsonCompact('{"name": "John", "age": 30}')
// 结果: {"name": "John", "age": 30}

// 智能截断
const truncated = formatAndTruncateToolResult(longText, 5, 80)

// 类型检测
const resultType = detectToolResultType(result) // 'json' | 'text' | 'image' | 'url'

// 探索类工具检测
const isExploring = isExploringToolCall(toolCall) // 文件读取、搜索等
```

### 4. 集成到MessageBubble

`MessageBubble` 组件已自动支持工具调用展示，默认使用 `ToolCallCluster`：

```tsx
// Message 对象包含 toolCalls 时会自动显示
const message: Message = {
  id: '1',
  conversationId: 'chat-1',
  role: 'assistant',
  content: '我来帮您搜索文件。',
  toolCalls: [
    {
      id: 'tool-1',
      name: 'file_search',
      arguments: { query: '*.tsx' },
      status: 'success',
      result: { files: ['App.tsx', 'main.tsx'] },
      startTime: Date.now() - 1000,
      endTime: Date.now()
    }
  ],
  timestamp: Date.now()
}
```

## 使用示例

### 创建工具调用消息

```typescript
import { Message, ToolCall } from '@/types/chat'

// 创建工具调用
const toolCall: ToolCall = {
  id: 'search-001',
  name: 'file_search',
  arguments: {
    query: '*.tsx',
    path: '/src/components'
  },
  status: 'running',
  startTime: Date.now()
}

// 创建包含工具调用的消息
const message: Message = {
  id: 'msg-001',
  conversationId: 'chat-001',
  role: 'assistant',
  content: '正在搜索文件...',
  toolCalls: [toolCall],
  timestamp: Date.now()
}
```

### 更新工具调用状态

```typescript
// 工具执行完成后更新状态
const updateToolCallStatus = (
  message: Message, 
  toolCallId: string, 
  status: ToolCallStatus,
  result?: any,
  error?: string
) => {
  const toolCall = message.toolCalls?.find(tc => tc.id === toolCallId)
  if (toolCall) {
    toolCall.status = status
    toolCall.endTime = Date.now()
    if (result) toolCall.result = result
    if (error) toolCall.error = error
  }
}
```

## 设计特性

### 遵循shadcn/ui规范
- 使用统一的设计Token和颜色系统
- 响应式设计，适配不同屏幕尺寸
- 支持暗色模式
- 一致的交互行为

### 状态可视化
- **等待中** (pending): 灰色时钟图标
- **执行中** (running): 蓝色旋转加载图标
- **成功** (success): 绿色对勾图标
- **失败** (error): 红色错误图标

### 结果格式支持
- **文本**: 纯文本显示
- **JSON**: 格式化代码展示
- **图片**: 内联图片预览
- **URL**: 可点击链接
- **文件**: 下载功能

## 演示组件

`ToolCallDemo` 组件提供了完整的演示，可以用来测试各种工具调用场景：

```tsx
import { ToolCallDemo } from '@/components/chat/ToolCallDemo'

// 在应用中使用演示组件
<ToolCallDemo />
```

## 扩展指南

### 添加新的结果类型支持

在 `ToolCallResult.tsx` 中扩展 `detectResultType` 函数：

```typescript
const detectResultType = (result: any): 'text' | 'json' | 'image' | 'file' | 'url' | 'your-type' => {
  // 添加您的类型检测逻辑
  if (isYourCustomType(result)) return 'your-type'
  // ... 现有逻辑
}
```

### 自定义工具调用样式

所有组件都支持 `className` 属性进行样式自定义：

```tsx
<ToolCallIndicator 
  toolCall={toolCall} 
  className="my-custom-styles"
/>
```

## 注意事项

1. **性能优化**: 大量工具调用时考虑虚拟滚动
2. **结果大小**: 大型结果会自动截断预览，提供完整内容查看
3. **错误处理**: 确保正确设置错误信息以便用户调试
4. **时间显示**: 自动格式化执行时间为合适的单位

## 与后端集成

工具调用UI组件设计为前端展示层，需要与MCP协议后端配合使用。确保：

1. 后端正确实现MCP工具调用协议
2. 前端正确映射MCP事件到ToolCall类型
3. 实时更新工具调用状态