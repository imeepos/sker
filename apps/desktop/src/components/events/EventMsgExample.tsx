import { useState } from 'react'
import { EventMsg } from '../../types/protocol/EventMsg'
import { EventMsgRenderer } from './EventMsgRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/badge'
import { Play, Plus, Trash2 } from 'lucide-react'

/**
 * EventMsg 组件使用示例
 * 展示如何使用 EventMsgRenderer 渲染不同类型的事件
 */
export function EventMsgExample() {
  const [events, setEvents] = useState<(EventMsg & { id: string; timestamp: Date })[]>([])

  // 模拟事件数据
  const sampleEvents: (EventMsg & { id: string; timestamp: Date })[] = [
    {
      id: '1',
      type: 'task_started',
      model_context_window: BigInt(8192),
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'agent_message',
      message: '正在分析您的请求...',
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'mcp_tool_call_begin',
      call_id: 'tool-123',
      invocation: {
        server: 'filesystem',
        tool: 'read_file',
        arguments: { path: '/path/to/file.txt' }
      },
      timestamp: new Date()
    },
    {
      id: '4',
      type: 'exec_command_begin',
      command: 'npm install',
      working_directory: '/workspace',
      timestamp: new Date()
    },
    {
      id: '5',
      type: 'exec_command_output_delta',
      delta: 'Installing dependencies...\n',
      stream: 'stdout',
      timestamp: new Date()
    },
    {
      id: '6',
      type: 'exec_command_end',
      exit_code: 0,
      timestamp: new Date()
    },
    {
      id: '7',
      type: 'mcp_tool_call_end',
      call_id: 'tool-123',
      result: { content: 'File content here...', size: 1024 },
      duration_ms: 150,
      timestamp: new Date()
    },
    {
      id: '8',
      type: 'token_count',
      input_tokens: BigInt(256),
      output_tokens: BigInt(512),
      timestamp: new Date()
    },
    {
      id: '9',
      type: 'task_complete',
      timestamp: new Date()
    },
    {
      id: '10',
      type: 'error',
      error_message: '网络连接超时',
      timestamp: new Date()
    }
  ]

  const addEvent = (event: EventMsg & { id: string; timestamp: Date }) => {
    setEvents(prev => [...prev, { ...event, timestamp: new Date() }])
  }

  const addAllSampleEvents = () => {
    const eventsWithNewTimestamps = sampleEvents.map(event => ({
      ...event,
      timestamp: new Date()
    }))
    setEvents(eventsWithNewTimestamps)
  }

  const clearEvents = () => {
    setEvents([])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>EventMsg 组件示例</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                演示不同类型的 EventMsg 事件的交互组件渲染效果
              </p>
            </div>
            <Badge variant="outline">
              {events.length} 个事件
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={addAllSampleEvents} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              加载示例事件
            </Button>
            <Button variant="outline" onClick={clearEvents} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              清空事件
            </Button>
          </div>

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>点击"加载示例事件"查看不同类型的事件组件</p>
            </div>
          )}

          <div className="space-y-3">
            {events.map((event) => (
              <EventMsgRenderer
                key={event.id}
                event={event}
                timestamp={event.timestamp}
                className="w-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">组件特性</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">设计特性</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 基于 shadcn/ui 组件库</li>
                <li>• 统一的视觉设计语言</li>
                <li>• 颜色编码状态指示</li>
                <li>• 可折叠内容展示</li>
                <li>• 响应式布局设计</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">交互功能</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 一键复制事件内容</li>
                <li>• 详细信息展开/折叠</li>
                <li>• 时间戳显示</li>
                <li>• 状态图标和徽章</li>
                <li>• 键盘导航支持</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}