# EventMsg 交互组件

根据 ag-ui 规范为每种 EventMsg 类型实现的交互组件集合。

## 概述

本组件库为所有 `EventMsg` 类型提供了统一的交互式 UI 组件，支持：

- ✅ 完整的类型安全
- ✅ 统一的视觉设计语言
- ✅ 丰富的交互功能
- ✅ 响应式布局
- ✅ 可访问性支持

## 快速开始

### 基础使用

```tsx
import { EventMsgRenderer } from './components/events'
import { EventMsg } from './types/protocol/EventMsg'

const event: EventMsg = {
  type: 'task_started',
  model_context_window: BigInt(8192)
}

function MyComponent() {
  return (
    <EventMsgRenderer
      event={event}
      timestamp={new Date()}
      className="w-full"
    />
  )
}
```

### 批量渲染事件

```tsx
import { EventMsgRenderer } from './components/events'

function EventsList({ events }: { events: EventMsg[] }) {
  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <EventMsgRenderer
          key={index}
          event={event}
          timestamp={new Date()}
        />
      ))}
    </div>
  )
}
```

## 组件架构

### 主要组件

- **`EventMsgRenderer`** - 主渲染器，根据事件类型自动选择对应组件
- **具体事件组件** - 每种 EventMsg 类型对应的专用组件
- **存根组件** - 简化版本的通用组件

### 设计原则

1. **类型安全** - 完全基于 TypeScript 类型定义
2. **视觉一致性** - 遵循 ag-ui 设计规范
3. **交互丰富** - 支持展开/折叠、复制、时间显示等
4. **状态指示** - 使用颜色编码表示不同状态

## 支持的事件类型

### ✅ 完整实现的组件

| 事件类型 | 组件名 | 功能描述 |
|---------|-------|----------|
| `error` | `ErrorEventComponent` | 错误事件显示，支持详细错误信息 |
| `task_started` | `TaskStartedEventComponent` | 任务开始指示器 |
| `task_complete` | `TaskCompleteEventComponent` | 任务完成指示器 |
| `token_count` | `TokenCountEventComponent` | Token 使用统计显示 |
| `agent_message` | `AgentMessageEventComponent` | 智能助手消息，支持 Markdown |
| `user_message` | `UserMessageEventComponent` | 用户消息显示 |
| `mcp_tool_call_begin` | `McpToolCallBeginEventComponent` | MCP 工具调用开始 |
| `mcp_tool_call_end` | `McpToolCallEndEventComponent` | MCP 工具调用结束 |
| `exec_command_begin` | `ExecCommandBeginEventComponent` | 命令执行开始 |
| `exec_command_output_delta` | `ExecCommandOutputDeltaEventComponent` | 命令输出流 |
| `exec_command_end` | `ExecCommandEndEventComponent` | 命令执行结束 |
| `web_search_begin` | `WebSearchBeginEventComponent` | 网络搜索开始 |
| `web_search_end` | `WebSearchEndEventComponent` | 网络搜索结束 |

### ✅ 存根组件

其他所有 EventMsg 类型都有对应的存根组件，提供基础的视觉表示。

## 组件特性

### 视觉设计

- **颜色编码状态**：
  - 🟢 绿色：成功/完成状态
  - 🔵 蓝色：进行中状态
  - 🟡 黄色：等待/警告状态
  - 🔴 红色：错误/失败状态
  - ⚫ 灰色：信息/中性状态

- **统一布局**：
  - 左侧彩色边框指示状态
  - 标题区域显示事件类型和状态徽章
  - 可折叠的详细内容区域
  - 操作按钮（复制、下载等）

### 交互功能

- **可折叠内容** - 点击展开/收起详细信息
- **一键复制** - 复制事件相关信息到剪贴板
- **时间戳显示** - 显示事件发生时间
- **状态图标** - 直观的状态指示图标
- **响应式布局** - 适配不同屏幕尺寸

### 技术特性

- **TypeScript 支持** - 完整的类型定义
- **Tree Shaking** - 支持按需导入
- **可定制样式** - 支持 className 覆盖
- **无障碍访问** - 符合 WCAG 标准

## 自定义与扩展

### 添加新的事件组件

1. 创建新的组件文件：
```tsx
// components/events/MyCustomEventComponent.tsx
import { EventMsg } from '../../types/protocol/EventMsg'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface MyCustomEventComponentProps {
  event: EventMsg & { type: 'my_custom_event' }
  className?: string
  timestamp?: Date
}

export function MyCustomEventComponent({ event, className, timestamp }: MyCustomEventComponentProps) {
  // 组件实现
}
```

2. 在 `EventMsgRenderer` 中添加对应的 case：
```tsx
case 'my_custom_event':
  return <MyCustomEventComponent event={event} className={className} timestamp={timestamp} />
```

3. 导出新组件：
```tsx
// components/events/index.ts
export { MyCustomEventComponent } from './MyCustomEventComponent'
```

### 样式自定义

所有组件都支持通过 `className` prop 自定义样式：

```tsx
<EventMsgRenderer
  event={event}
  className="my-custom-styles border-2 border-blue-500"
/>
```

## 最佳实践

1. **性能优化**
   - 使用 `React.memo` 包装组件避免不必要的重渲染
   - 对大量事件使用虚拟滚动

2. **用户体验**
   - 保持一致的交互模式
   - 提供清晰的状态反馈
   - 确保内容的可读性

3. **可访问性**
   - 使用语义化的 HTML 结构
   - 提供适当的 ARIA 标签
   - 确保键盘导航功能

## 示例

查看 `EventMsgExample.tsx` 文件获取完整的使用示例。

## 依赖

- React 18+
- TypeScript 4.9+
- Tailwind CSS 3+
- Radix UI 组件
- Lucide React 图标

## 贡献

在添加新功能或修改现有组件时，请确保：

1. 遵循现有的设计模式
2. 添加适当的 TypeScript 类型
3. 编写清晰的文档
4. 测试跨浏览器兼容性