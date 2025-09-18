/**
 * EventsList组件测试页面
 * 用于验证分层显示和事件合并功能
 */

import { memo, useState } from 'react'
import { EventsList } from './EventsList'
import { EventLayer, EventCategory } from '../../types/events'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Separator } from '../ui/separator'

// 测试数据
const createTestEventLayers = (): EventLayer[] => {
  const now = Date.now()
  
  return [
    {
      milestone: {
        id: 'user-msg-1',
        conversationId: 'test-conv',
        event: {
          type: 'user_message',
          message: '请帮我分析这个问题'
        },
        timestamp: now - 10000,
        status: 'completed'
      },
      relatedEvents: [],
      isExpanded: false,
      category: EventCategory.MILESTONE,
      aggregatedData: {
        totalUpdates: 1,
        lastUpdateTime: now - 10000
      }
    },
    {
      milestone: {
        id: 'agent-msg-1',
        conversationId: 'test-conv',
        event: {
          type: 'agent_message',
          message: '我正在分析您的问题，这需要几个步骤来完成...'
        },
        timestamp: now - 8000,
        status: 'processing'
      },
      relatedEvents: [
        {
          id: 'agent-delta-1',
          conversationId: 'test-conv',
          event: {
            type: 'agent_message_delta',
            delta: '我正在分析'
          },
          timestamp: now - 7900,
          status: 'completed'
        },
        {
          id: 'agent-delta-2',
          conversationId: 'test-conv',
          event: {
            type: 'agent_message_delta',
            delta: '您的问题，'
          },
          timestamp: now - 7800,
          status: 'completed'
        },
        {
          id: 'agent-delta-3',
          conversationId: 'test-conv',
          event: {
            type: 'agent_message_delta',
            delta: '这需要几个步骤来完成...'
          },
          timestamp: now - 7700,
          status: 'completed'
        }
      ],
      isExpanded: false,
      category: EventCategory.MILESTONE,
      aggregatedData: {
        totalUpdates: 4,
        lastUpdateTime: now - 7700,
        combinedContent: '我正在分析您的问题，这需要几个步骤来完成...'
      }
    },
    {
      milestone: {
        id: 'tool-call-1',
        conversationId: 'test-conv',
        event: {
          type: 'mcp_tool_call_begin',
          tool_name: 'file_search',
          call_id: 'call-123'
        },
        timestamp: now - 6000,
        status: 'processing'
      },
      relatedEvents: [
        {
          id: 'reasoning-1',
          conversationId: 'test-conv',
          event: {
            type: 'agent_reasoning',
            reasoning: '首先，我需要搜索相关文件来获取更多信息'
          },
          timestamp: now - 5900,
          status: 'completed'
        }
      ],
      isExpanded: false,
      category: EventCategory.MILESTONE,
      aggregatedData: {
        totalUpdates: 2,
        lastUpdateTime: now - 5900
      }
    },
    {
      milestone: {
        id: 'tool-call-end-1',
        conversationId: 'test-conv',
        event: {
          type: 'mcp_tool_call_end',
          tool_name: 'file_search',
          call_id: 'call-123',
          result: { Ok: '找到了相关文件' }
        },
        timestamp: now - 3000,
        status: 'completed'
      },
      relatedEvents: [],
      isExpanded: false,
      category: EventCategory.MILESTONE,
      aggregatedData: {
        totalUpdates: 1,
        lastUpdateTime: now - 3000
      }
    }
  ]
}

export const EventsListTest = memo(function EventsListTest() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [testEventLayers] = useState<EventLayer[]>(createTestEventLayers)
  const [showTraditionalView, setShowTraditionalView] = useState(false)

  // 转换为传统事件格式用于比较
  const traditionalEvents = testEventLayers.flatMap(layer => [
    {
      id: layer.milestone.id,
      event: layer.milestone.event,
      timestamp: new Date(layer.milestone.timestamp),
      status: layer.milestone.status
    },
    ...layer.relatedEvents.map(e => ({
      id: e.id,
      event: e.event,
      timestamp: new Date(e.timestamp),
      status: e.status
    }))
  ])

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(prev => prev === eventId ? null : eventId)
  }

  return (
    <div className="h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl h-full flex flex-col">
        {/* 头部控制区 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">EventsList 组件测试</h1>
              <p className="text-muted-foreground mt-1">
                测试分层显示和事件合并功能
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                {showTraditionalView ? '传统模式' : '分层模式'}
              </Badge>
              <Button
                variant="outline"
                onClick={() => setShowTraditionalView(!showTraditionalView)}
              >
                切换显示模式
              </Button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">里程碑事件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {testEventLayers.length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">相关事件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {testEventLayers.reduce((sum, layer) => sum + layer.relatedEvents.length, 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">传统模式事件数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {traditionalEvents.length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">选中事件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {selectedEventId || '无'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* 事件列表展示区 */}
        <div className="flex-1 mt-4 overflow-hidden">
          <div className="bg-muted/30 rounded-lg p-4 h-full overflow-auto">
            <EventsList
              events={showTraditionalView ? traditionalEvents : []}
              eventLayers={showTraditionalView ? undefined : testEventLayers}
              selectedEventId={selectedEventId}
              onEventSelect={handleEventSelect}
              isProcessing={false}
              conversationId="test-conv"
              enableLayeredView={!showTraditionalView}
              className="max-w-4xl mx-auto"
            />
          </div>
        </div>

        {/* 底部信息区 */}
        <div className="mt-4 p-3 bg-muted/50 rounded text-sm text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>
              {showTraditionalView 
                ? `显示 ${traditionalEvents.length} 个传统事件项` 
                : `显示 ${testEventLayers.length} 个分层事件，包含 ${testEventLayers.reduce((sum, layer) => sum + layer.relatedEvents.length, 0)} 个相关事件`
              }
            </span>
            <span>
              选中: {selectedEventId || '无'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})