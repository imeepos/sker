import { useState } from 'react'
import { Message, ToolCall, ToolCallStatus } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { safeJsonStringify } from '../../lib/text-formatting'

// 模拟工具调用数据
const createMockToolCall = (
  id: string,
  name: string,
  args: Record<string, any>,
  status: ToolCallStatus = 'pending',
  result?: any,
  error?: string
): ToolCall => ({
  id,
  name,
  arguments: args,
  status,
  result,
  error,
  startTime: Date.now() - Math.random() * 5000,
  endTime: status === 'success' || status === 'error' ? Date.now() : undefined
})

export function ToolCallDemo() {
  const [messages, setMessages] = useState<Message[]>([])


  // 模拟不同类型的工具调用
  const demoScenarios = [
    {
      title: '探索文件系统',
      message: {
        id: '1',
        conversationId: 'demo',
        role: 'assistant' as const,
        content: '我来帮您搜索和读取相关文件。',
        toolCalls: [
          createMockToolCall(
            'search-1',
            'search_files',
            { query: '*.tsx', path: '/src/components' },
            'pending'
          ),
          createMockToolCall(
            'read-1',
            'read_file',
            { path: '/src/components/MessageBubble.tsx' },
            'pending'
          ),
          createMockToolCall(
            'read-2',
            'read_file',
            { path: '/src/components/ChatWindow.tsx' },
            'pending'
          )
        ],
        timestamp: Date.now()
      }
    },
    {
      title: '代码执行工具',
      message: {
        id: '2',
        conversationId: 'demo',
        role: 'assistant' as const,
        content: '执行Python代码计算结果。',
        toolCalls: [
          createMockToolCall(
            'exec-1',
            'python_executor',
            { code: 'import math\nresult = math.sqrt(144)\nprint(f"结果: {result}")' },
            'running'
          )
        ],
        timestamp: Date.now()
      }
    },
    {
      title: 'JSON数据处理',
      message: {
        id: '3',
        conversationId: 'demo',
        role: 'assistant' as const,
        content: '我来分析这些JSON数据。',
        toolCalls: [
          createMockToolCall(
            'json-1',
            'parse_data',
            { source: 'api', format: 'json' },
            'success',
            safeJsonStringify({
              users: [
                { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
                { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
                { id: 3, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'user' }
              ],
              pagination: { total: 150, page: 1, limit: 3 },
              metadata: { timestamp: '2024-01-15T10:30:00Z', version: '1.2.3' }
            })
          ),
          createMockToolCall(
            'json-2',
            'validate_schema',
            { schema: 'user_list', strict: true },
            'error',
            null,
            'Schema validation failed: missing required field "created_at" in user objects'
          )
        ],
        timestamp: Date.now()
      }
    }
  ]

  const simulateToolExecution = (messageIndex: number, toolIndex: number) => {
    setMessages(prev => {
      const newMessages = [...prev]
      const message = newMessages[messageIndex]
      if (message && message.toolCalls && message.toolCalls[toolIndex]) {
        const toolCall = message.toolCalls[toolIndex]
        
        // 开始执行
        toolCall.status = 'running'
        toolCall.startTime = Date.now()
        
        // 模拟执行完成
        setTimeout(() => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages]
            const msg = updatedMessages[messageIndex]
            if (msg && msg.toolCalls && msg.toolCalls[toolIndex]) {
              const tc = msg.toolCalls[toolIndex]
              tc.status = 'success'
              tc.endTime = Date.now()
              tc.result = `执行成功! 结果: ${Math.sqrt(144)}`
            }
            return updatedMessages
          })
        }, 2000)
      }
      return newMessages
    })
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>工具调用UI演示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {demoScenarios.map((scenario, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => {
                  setMessages(prev => [...prev, scenario.message])
                }}
              >
                {scenario.title}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setMessages([])}
            >
              清除演示
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 消息展示 */}
      <div className="space-y-4">
        {messages.map((message, messageIndex) => (
          <div key={message.id} className="space-y-2">
            <MessageBubble message={message} />
            
            {/* 调试按钮 */}
            {message.toolCalls && (
              <div className="flex gap-2 ml-12">
                {message.toolCalls.map((toolCall, toolIndex) => (
                  toolCall.status === 'pending' && (
                    <Button
                      key={toolCall.id}
                      size="sm"
                      variant="ghost"
                      onClick={() => simulateToolExecution(messageIndex, toolIndex)}
                    >
                      执行 {toolCall.name}
                    </Button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}