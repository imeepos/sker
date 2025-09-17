import { useState, useCallback } from 'react'
import { ChatPro, ChatProEvent } from './index'
import { EventMsg } from '../../types/protocol/EventMsg'
// 生成唯一ID的工具函数
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

/**
 * ChatPro 组件使用示例
 * 
 * 演示如何:
 * - 使用 ChatPro 组件
 * - 处理不同类型的 EventMsg
 * - 管理事件状态
 * - 处理用户交互
 */
export function ChatProExample() {
  const [events, setEvents] = useState<ChatProEvent[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // 创建示例事件
  const createSampleEvents = useCallback(() => {
    const sampleEvents: ChatProEvent[] = [
      {
        id: generateId(),
        event: {
          type: 'user_message',
          message: '你好，能帮我解释一下什么是 React Hooks 吗？'
        } as EventMsg,
        timestamp: new Date(Date.now() - 300000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'task_started',
          model_context_window: BigInt(8192)
        } as EventMsg,
        timestamp: new Date(Date.now() - 280000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'agent_message',
          message: `# React Hooks 详解

React Hooks 是 React 16.8 引入的一个新特性，它允许你在**函数组件**中使用状态和其他 React 特性。

## 主要的 Hook 类型

### 1. useState
用于在函数组件中添加状态：

\`\`\`jsx
const [count, setCount] = useState(0)
\`\`\`

### 2. useEffect
用于处理副作用（如数据获取、订阅等）：

\`\`\`jsx
useEffect(() => {
  document.title = \`点击了 \${count} 次\`
}, [count])
\`\`\`

### 3. useContext
用于访问 React Context：

\`\`\`jsx
const theme = useContext(ThemeContext)
\`\`\`

## Hook 规则

1. **只在最顶层调用 Hook** - 不要在循环、条件或嵌套函数中调用
2. **只在 React 函数中调用 Hook** - 在函数组件或自定义 Hook 中使用

这些规则确保 Hook 在每次组件渲染时都能以相同的顺序被调用。`
        } as EventMsg,
        timestamp: new Date(Date.now() - 260000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'token_count',
          info: {
            total_token_usage: {
              input_tokens: BigInt(25),
              cached_input_tokens: BigInt(0),
              output_tokens: BigInt(180),
              reasoning_output_tokens: BigInt(0),
              total_tokens: BigInt(205)
            },
            last_token_usage: {
              input_tokens: BigInt(25),
              cached_input_tokens: BigInt(0),
              output_tokens: BigInt(180),
              reasoning_output_tokens: BigInt(0),
              total_tokens: BigInt(205)
            },
            model_context_window: BigInt(8192)
          }
        } as EventMsg,
        timestamp: new Date(Date.now() - 240000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'task_complete',
          last_agent_message: null
        } as EventMsg,
        timestamp: new Date(Date.now() - 230000),
        status: 'completed'
      }
    ]

    setEvents(sampleEvents)
  }, [])

  // 处理消息发送
  const handleSendMessage = useCallback(async (message: string, attachments?: File[]) => {
    // 添加用户消息事件
    const userMessageEvent: ChatProEvent = {
      id: generateId(),
      event: {
        type: 'user_message',
        message
      } as EventMsg,
      timestamp: new Date(),
      status: 'completed'
    }

    setEvents(prev => [...prev, userMessageEvent])
    setIsProcessing(true)

    // 模拟处理过程
    setTimeout(() => {
      // 添加任务开始事件
      const taskStartEvent: ChatProEvent = {
        id: generateId(),
        event: {
          type: 'task_started',
          model_context_window: BigInt(8192)
        } as EventMsg,
        timestamp: new Date(),
        status: 'completed'
      }

      setEvents(prev => [...prev, taskStartEvent])

      // 模拟 AI 回复
      setTimeout(() => {
        const agentMessageEvent: ChatProEvent = {
          id: generateId(),
          event: {
            type: 'agent_message',
            message: `收到您的消息："${message}"

这是一个使用 **ChatPro** 组件的示例回复。组件特性：

- ✅ 使用 EventMsgRenderer 渲染所有事件类型
- ✅ 支持 Markdown 格式显示
- ✅ 实时状态指示和事件流
- ✅ 文件附件支持
- ✅ 符合 ag-ui 设计规范

${attachments && attachments.length > 0 ? 
  `\n您上传了 ${attachments.length} 个附件：${attachments.map(f => f.name).join(', ')}` : 
  ''
}`
          } as EventMsg,
          timestamp: new Date(),
          status: 'completed'
        }

        setEvents(prev => [...prev, agentMessageEvent])

        // 添加任务完成事件
        const taskCompleteEvent: ChatProEvent = {
          id: generateId(),
          event: {
            type: 'task_complete'
          } as EventMsg,
          timestamp: new Date(),
          status: 'completed'
        }

        setEvents(prev => [...prev, taskCompleteEvent])
        setIsProcessing(false)
      }, 2000)
    }, 500)
  }, [])

  // 处理停止处理
  const handleStopProcessing = useCallback(() => {
    setIsProcessing(false)
    
    // 添加中断事件
    const abortEvent: ChatProEvent = {
      id: generateId(),
      event: {
        type: 'turn_aborted'
      } as EventMsg,
      timestamp: new Date(),
      status: 'error'
    }

    setEvents(prev => [...prev, abortEvent])
  }, [])

  // 清除聊天记录
  const handleClearChat = useCallback(() => {
    setEvents([])
    setIsProcessing(false)
  }, [])

  // 打开设置
  const handleOpenSettings = useCallback(() => {
    alert('打开设置对话框')
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="p-4 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">ChatPro 组件示例</h1>
            <p className="text-sm text-muted-foreground">
              演示使用 events 系统的专业聊天界面
            </p>
          </div>
          <button
            onClick={createSampleEvents}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            加载示例对话
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatPro
          events={events}
          isProcessing={isProcessing}
          title="示例聊天会话"
          model="claude-3-sonnet"
          enableInput={true}
          onSendMessage={handleSendMessage}
          onStopProcessing={handleStopProcessing}
          onClearChat={handleClearChat}
          onOpenSettings={handleOpenSettings}
        />
      </div>
    </div>
  )
}