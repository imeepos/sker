/**
 * 流控制器演示组件
 * 用于测试和演示新的消息合并功能
 */

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/badge'
import { streamController } from '../../lib/streamController'

interface Update {
  conversationId: string
  messageId: string
  content: string
  timestamp: number
}

export function StreamControllerDemo() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  useEffect(() => {
    // 设置流控制器回调
    streamController.setOnContentUpdate((conversationId, messageId, content) => {
      setUpdates(prev => [...prev, {
        conversationId,
        messageId,
        content,
        timestamp: Date.now()
      }])
    })
  }, [])
  
  const runDemo1 = () => {
    if (isRunning) return
    setIsRunning(true)
    setUpdates([])
    
    const conversationId = 'demo-conv'
    const messageId = `demo-msg-${Date.now()}`
    
    console.log('开始演示1: 基本增量消息')
    
    // 模拟增量消息
    streamController.beginStream(conversationId, messageId)
    
    const deltas = ['我正在', '分析', '您的', '问题', '，请', '稍等...']
    
    deltas.forEach((delta, index) => {
      setTimeout(() => {
        streamController.pushDelta(conversationId, messageId, delta)
        
        if (index === deltas.length - 1) {
          // 最后一个增量后，延迟完成流
          setTimeout(() => {
            streamController.finalizeStream(conversationId, messageId)
            setIsRunning(false)
          }, 500)
        }
      }, index * 300)
    })
  }
  
  const runDemo2 = () => {
    if (isRunning) return
    setIsRunning(true)
    setUpdates([])
    
    const conversationId = 'demo-conv'
    const messageId = `demo-msg-${Date.now()}`
    
    console.log('开始演示2: 语义感知提交')
    
    streamController.beginStream(conversationId, messageId)
    
    const sentences = [
      '这是第一个句子。',
      ' 这是第二个句子！',
      ' 这是第三个句子？',
      '\n\n这是一个新段落的开始。'
    ]
    
    sentences.forEach((sentence, index) => {
      setTimeout(() => {
        streamController.pushDelta(conversationId, messageId, sentence)
        
        if (index === sentences.length - 1) {
          setTimeout(() => {
            streamController.finalizeStream(conversationId, messageId)
            setIsRunning(false)
          }, 500)
        }
      }, index * 800)
    })
  }
  
  const runDemo3 = () => {
    if (isRunning) return
    setIsRunning(true)
    setUpdates([])
    
    const conversationId = 'demo-conv'
    const messageId = `demo-msg-${Date.now()}`
    
    console.log('开始演示3: 最终消息覆盖')
    
    // 先发送一些增量
    streamController.beginStream(conversationId, messageId)
    streamController.pushDelta(conversationId, messageId, '正在生成')
    streamController.pushDelta(conversationId, messageId, '回复')
    streamController.pushDelta(conversationId, messageId, '...')
    
    // 1秒后应用完整最终消息
    setTimeout(() => {
      streamController.applyFinalMessage(
        conversationId, 
        messageId, 
        '这是完整的最终回复，替换了之前的增量内容。'
      )
      setIsRunning(false)
    }, 1000)
  }
  
  const clearUpdates = () => {
    setUpdates([])
  }
  
  const getStreamInfo = () => {
    const info = streamController.getStreamInfo('demo-conv')
    console.log('当前流状态:', info)
    alert(`当前流状态：\n${JSON.stringify(info, null, 2)}`)
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">流控制器演示</h1>
        <p className="text-muted-foreground">
          测试基于TUI的新消息合并策略
        </p>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex gap-3 mb-6">
        <Button 
          onClick={runDemo1} 
          disabled={isRunning}
          variant="default"
        >
          演示1: 基本增量
        </Button>
        <Button 
          onClick={runDemo2} 
          disabled={isRunning}
          variant="outline"
        >
          演示2: 语义感知
        </Button>
        <Button 
          onClick={runDemo3} 
          disabled={isRunning}
          variant="secondary"
        >
          演示3: 最终覆盖
        </Button>
        <Button 
          onClick={getStreamInfo} 
          variant="ghost"
        >
          查看流状态
        </Button>
        <Button 
          onClick={clearUpdates} 
          variant="destructive"
          size="sm"
        >
          清空
        </Button>
      </div>
      
      {/* 状态指示 */}
      <div className="mb-4">
        <Badge variant={isRunning ? "default" : "secondary"}>
          {isRunning ? "运行中..." : "就绪"}
        </Badge>
        <Badge variant="outline" className="ml-2">
          更新数量: {updates.length}
        </Badge>
      </div>
      
      {/* 更新列表 */}
      <Card>
        <CardHeader>
          <CardTitle>消息更新记录</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无更新记录
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {updates.map((update, index) => (
                <div 
                  key={index}
                  className="p-3 border border-border rounded-md bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {update.messageId}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-mono bg-background p-2 rounded border">
                    {update.content}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    长度: {update.content.length} 字符
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 说明 */}
      <div className="mt-6 text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">演示说明:</h3>
        <ul className="space-y-1">
          <li>• <strong>基本增量</strong>: 模拟传统的逐字符/词增量更新</li>
          <li>• <strong>语义感知</strong>: 在句子边界自动提交，减少UI更新频率</li>
          <li>• <strong>最终覆盖</strong>: 演示最终完整消息如何替换增量内容</li>
        </ul>
      </div>
    </div>
  )
}