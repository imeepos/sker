import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { MessageAttachments } from './MessageAttachments'
import { ToolCallCluster } from './ToolCallCluster'
import { cn, formatTime } from '../../lib/utils'
import { Message } from '../../types/chat'
import { Bot, User, Loader2 } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  className?: string
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  return (
    <div className={cn(
      "flex gap-3 max-w-4xl mx-auto p-4",
      isUser ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={isUser ? undefined : "/bot-avatar.png"} />
        <AvatarFallback className={cn(
          "text-xs font-medium",
          isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        "flex-1 min-w-0",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "relative",
          isUser 
            ? "bg-blue-500 text-white border-blue-500" 
            : "bg-background border-border",
          isSystem && "bg-amber-50 border-amber-200"
        )}>
          <CardContent className="p-3">
            {/* Loading indicator */}
            {message.isStreaming && (
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">正在思考...</span>
              </div>
            )}
            
            {/* 附件显示 */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3">
                <MessageAttachments 
                  attachments={message.attachments} 
                  isUser={isUser}
                />
              </div>
            )}

            {/* 工具调用显示 - 使用新的智能分组组件 */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className={cn(
                "mb-3",
                message.content && "mt-3" // 如果有内容，添加上边距
              )}>
                <ToolCallCluster toolCalls={message.toolCalls} />
              </div>
            )}
            
            {/* Message content with markdown support */}
            {message.content && (
              <div className={cn(
                "prose prose-sm max-w-none",
                isUser && "prose-invert",
                "prose-pre:p-0 prose-pre:bg-transparent",
                message.attachments && message.attachments.length > 0 && "mt-0"
              )}>
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { node, className, children, ...rest } = props
                      const match = /language-(\w+)/.exec(className || '')
                      const inline = !className
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md !mt-2 !mb-2"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={cn(
                          "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
                          isUser && "bg-blue-400 bg-opacity-30"
                        )} {...rest}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Metadata */}
            {message.metadata && (
              <div className={cn(
                "mt-2 text-xs opacity-70 border-t pt-2",
                isUser ? "border-blue-400" : "border-border"
              )}>
                {message.metadata.model && (
                  <span className="mr-3">模型: {message.metadata.model}</span>
                )}
                {message.metadata.tokens && (
                  <span className="mr-3">Token: {message.metadata.tokens}</span>
                )}
                {message.metadata.processingTime && (
                  <span>耗时: {message.metadata.processingTime}ms</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground mt-1 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}