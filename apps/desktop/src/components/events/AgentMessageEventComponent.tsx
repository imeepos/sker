import { EventMsg } from '../../types/protocol/EventMsg'
import { AgentMessageEvent } from '../../types/protocol/AgentMessageEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Bot, ChevronDown, ChevronRight, Copy, CheckCircle2 } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface AgentMessageEventComponentProps {
  event: EventMsg & { type: 'agent_message' }
  className?: string
  timestamp?: Date
}

export function AgentMessageEventComponent({ event, className, timestamp }: AgentMessageEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  const messageData = event as AgentMessageEvent

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageData.message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Bot className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">
                智能助手消息
              </CardTitle>
              <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                消息
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(timestamp)}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none prose-pre:p-0 prose-pre:bg-transparent">
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
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" {...rest}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {messageData.message}
              </ReactMarkdown>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}