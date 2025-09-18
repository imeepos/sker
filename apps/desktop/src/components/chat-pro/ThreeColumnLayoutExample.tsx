import { useState, useCallback } from 'react'
import { ThreeColumnLayout, type NavigationItem, type Conversation } from './ThreeColumnLayout'
import { ChatProEvent } from './index'
import { EventMsg } from '../../types/protocol/EventMsg'

// 生成唯一ID的工具函数
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

/**
 * 三栏布局示例组件
 * 
 * 演示如何使用 ThreeColumnLayout 组件创建仿微信风格的聊天界面
 */
export function ThreeColumnLayoutExample() {
  // 模拟对话数据 - 添加更多数据测试滚动
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Claude AI助手',
      lastMessage: '你好！我是Claude，很高兴为您服务。有什么可以帮助您的吗？',
      timestamp: new Date(Date.now() - 300000), // 5分钟前
      unreadCount: 2,
      isStarred: true,
      status: 'online'
    },
    {
      id: '2', 
      title: '视频交付技术群',
      lastMessage: '杨明明：修复视频生成收费BUG',
      timestamp: new Date(Date.now() - 600000), // 10分钟前
      unreadCount: 5,
      isGroup: true
    },
    {
      id: '3',
      title: '工作小组',
      lastMessage: '会议安排在明天下午2点',
      timestamp: new Date(Date.now() - 1800000), // 30分钟前
      unreadCount: 0,
      isGroup: true,
      status: 'online'
    },
    {
      id: '4',
      title: '技术支持',
      lastMessage: '问题已解决，感谢您的反馈',
      timestamp: new Date(Date.now() - 3600000), // 1小时前
      unreadCount: 0,
      status: 'away'
    },
    {
      id: '5',
      title: '产品讨论',
      lastMessage: '新功能设计方案已经准备好了',
      timestamp: new Date(Date.now() - 7200000), // 2小时前
      unreadCount: 1,
      isGroup: true
    },
    // 添加更多对话数据测试滚动
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `${6 + i}`,
      title: `测试对话 ${i + 1}`,
      lastMessage: `这是第 ${i + 1} 个测试对话的最新消息，用于测试对话列表的滚动功能。`,
      timestamp: new Date(Date.now() - (7200000 + i * 300000)),
      unreadCount: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0,
      isStarred: Math.random() > 0.8,
      isGroup: Math.random() > 0.6,
      status: (['online', 'away', 'offline'] as const)[Math.floor(Math.random() * 3)]
    }))
  ])

  // 当前选中的对话和导航
  const [selectedConversationId, setSelectedConversationId] = useState<string>('1')
  const [_selectedNavigation, setSelectedNavigation] = useState<NavigationItem>('messages')

  // 当前对话的事件列表 - 添加更多事件数据测试滚动
  const [conversationEvents, setConversationEvents] = useState<Record<string, ChatProEvent[]>>({
    '1': [
      // 历史对话记录
      ...Array.from({ length: 10 }, (_, i) => [
        {
          id: generateId(),
          event: {
            type: 'user_message',
            message: `这是第 ${i + 1} 个用户消息，用来测试聊天区域的滚动功能。消息内容可能很长，包含多行文本，这样可以更好地测试滚动效果。`
          } as EventMsg,
          timestamp: new Date(Date.now() - (3600000 + i * 120000)),
          status: 'completed'
        },
        {
          id: generateId(),
          event: {
            type: 'task_started',
            model_context_window: BigInt(8192)
          } as EventMsg,
          timestamp: new Date(Date.now() - (3600000 + i * 120000 - 5000)),
          status: 'completed'
        },
        {
          id: generateId(),
          event: {
            type: 'agent_message',
            message: `这是第 ${i + 1} 个AI回复。

## 回复内容 ${i + 1}

这是一个比较详细的回复，包含：

### 要点 1
- 详细说明第一个要点
- 提供相关的解释和示例
- 确保内容充实且有用

### 要点 2  
- 第二个要点的详细阐述
- 包含更多的技术细节
- 帮助用户更好地理解

### 要点 3
- 最后一个要点的总结
- 提供行动建议
- 确保用户有明确的下一步

希望这个回复对您有帮助！有其他问题随时提问。`
          } as EventMsg,
          timestamp: new Date(Date.now() - (3600000 + i * 120000 - 10000)),
          status: 'completed'
        },
        {
          id: generateId(),
          event: {
            type: 'task_complete',
            last_agent_message: null
          } as EventMsg,
          timestamp: new Date(Date.now() - (3600000 + i * 120000 - 15000)),
          status: 'completed'
        }
      ]).flat(),
      
      // 最新的一轮对话
      {
        id: generateId(),
        event: {
          type: 'user_message',
          message: '你好，能介绍一下你的功能吗？'
        } as EventMsg,
        timestamp: new Date(Date.now() - 600000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'task_started',
          model_context_window: BigInt(8192)
        } as EventMsg,
        timestamp: new Date(Date.now() - 580000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'agent_message',
          message: `你好！我是Claude，一个AI助手。我可以帮助您：

## 主要功能

### 💬 对话交流
- 回答各种问题
- 提供专业建议
- 进行创意讨论

### 📝 文本处理  
- 写作和编辑
- 翻译多种语言
- 总结和分析

### 💻 编程支持
- 代码编写和调试
- 技术咨询
- 架构设计建议

### 🎯 专业服务
- 数据分析
- 研究支持
- 问题解决方案

我会尽力为您提供准确、有用的帮助。有什么具体需要协助的吗？`
        } as EventMsg,
        timestamp: new Date(Date.now() - 320000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'token_count',
          info: {
            total_token_usage: {
              input_tokens: BigInt(15),
              cached_input_tokens: BigInt(0),
              output_tokens: BigInt(156),
              reasoning_output_tokens: BigInt(0),
              total_tokens: BigInt(171)
            },
            last_token_usage: {
              input_tokens: BigInt(15),
              cached_input_tokens: BigInt(0),
              output_tokens: BigInt(156),
              reasoning_output_tokens: BigInt(0),
              total_tokens: BigInt(171)
            },
            model_context_window: BigInt(8192)
          }
        } as EventMsg,
        timestamp: new Date(Date.now() - 300000),
        status: 'completed'
      },
      {
        id: generateId(),
        event: {
          type: 'task_complete',
          last_agent_message: null
        } as EventMsg,
        timestamp: new Date(Date.now() - 290000),
        status: 'completed'
      }
    ]
  })

  const [isProcessing, setIsProcessing] = useState(false)

  // 处理导航切换
  const handleNavigationChange = useCallback((item: NavigationItem) => {
    setSelectedNavigation(item)
    console.log('导航切换到:', item)
  }, [])

  // 处理对话选择
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
    console.log('选择对话:', conversationId)
  }, [])

  // 处理发送消息
  const handleSendMessage = useCallback(async (message: string, attachments?: File[]) => {
    if (!selectedConversationId) return

    console.log('发送消息:', message, attachments)

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

    setConversationEvents(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), userMessageEvent]
    }))

    setIsProcessing(true)

    // 模拟AI处理
    setTimeout(() => {
      const taskStartEvent: ChatProEvent = {
        id: generateId(),
        event: {
          type: 'task_started',
          model_context_window: BigInt(8192)
        } as EventMsg,
        timestamp: new Date(),
        status: 'completed'
      }

      setConversationEvents(prev => ({
        ...prev,
        [selectedConversationId]: [...(prev[selectedConversationId] || []), taskStartEvent]
      }))

      // AI回复
      setTimeout(() => {
        const agentMessageEvent: ChatProEvent = {
          id: generateId(),
          event: {
            type: 'agent_message',
            message: `收到您的消息："${message}"

这是一个在三栏布局界面中的回复示例。界面特性：

- ✅ **左侧导航栏**：功能模块切换，仿微信风格
- ✅ **中间对话列表**：显示所有对话，支持搜索和筛选  
- ✅ **右侧聊天区域**：具体的对话内容和交互
- ✅ **响应式设计**：适配不同屏幕尺寸
- ✅ **实时更新**：消息状态和未读计数

${attachments && attachments.length > 0 ? 
  `\n📎 检测到 ${attachments.length} 个附件：${attachments.map(f => f.name).join(', ')}` : 
  ''
}`
          } as EventMsg,
          timestamp: new Date(),
          status: 'completed'
        }

        setConversationEvents(prev => ({
          ...prev,
          [selectedConversationId]: [...(prev[selectedConversationId] || []), agentMessageEvent]
        }))

        // 任务完成
        const taskCompleteEvent: ChatProEvent = {
          id: generateId(),
          event: {
            type: 'task_complete'
          } as EventMsg,
          timestamp: new Date(),
          status: 'completed'
        }

        setConversationEvents(prev => ({
          ...prev,
          [selectedConversationId]: [...(prev[selectedConversationId] || []), taskCompleteEvent]
        }))

        setIsProcessing(false)
      }, 2000)
    }, 500)
  }, [selectedConversationId])

  // 处理停止处理
  const handleStopProcessing = useCallback(() => {
    setIsProcessing(false)
    console.log('停止处理')
  }, [])

  // 处理清除会话
  const handleClearChat = useCallback(() => {
    if (selectedConversationId) {
      setConversationEvents(prev => ({
        ...prev,
        [selectedConversationId]: []
      }))
      console.log('清除会话:', selectedConversationId)
    }
  }, [selectedConversationId])

  // 处理创建新对话
  const handleCreateConversation = useCallback(() => {
    console.log('创建新对话')
    // 这里可以打开创建对话的对话框
  }, [])

  // 处理删除对话
  const handleDeleteConversation = useCallback((conversationId: string) => {
    console.log('删除对话:', conversationId)
    // 这里可以确认删除操作
  }, [])

  // 获取当前对话的事件
  const currentEvents = selectedConversationId ? (conversationEvents[selectedConversationId] || []) : []

  return (
    <div className="h-screen">
      <ThreeColumnLayout
        defaultNavigation="messages"
        defaultConversationId="1"
        conversations={conversations}
        events={currentEvents}
        isProcessing={isProcessing}
        onNavigationChange={handleNavigationChange}
        onConversationSelect={handleConversationSelect}
        onSendMessage={handleSendMessage}
        onStopProcessing={handleStopProcessing}
        onClearChat={handleClearChat}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </div>
  )
}