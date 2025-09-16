import { useEffect, useRef } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { Message } from '../../types/chat'

interface MessageListProps {
  messages: Message[]
  className?: string
}

export function MessageList({ messages, className }: MessageListProps) {
  const lastMessageRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end' 
      })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-medium mb-2">开始新对话</h3>
          <p className="text-sm">向 AI 助手提问任何问题</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className={className}>
      <div className="py-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            ref={index === messages.length - 1 ? lastMessageRef : undefined}
          >
            <MessageBubble message={message} />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}