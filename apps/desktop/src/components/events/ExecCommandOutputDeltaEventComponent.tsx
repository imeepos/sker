import { EventMsg } from '../../types/protocol/EventMsg'
import { ExecCommandOutputDeltaEvent } from '../../types/protocol/ExecCommandOutputDeltaEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Terminal, ChevronDown, ChevronRight, Copy, CheckCircle2, FileText } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { useState } from 'react'

interface ExecCommandOutputDeltaEventComponentProps {
  event: EventMsg & { type: 'exec_command_output_delta' }
  className?: string
  timestamp?: Date
}

export function ExecCommandOutputDeltaEventComponent({ event, className, timestamp }: ExecCommandOutputDeltaEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  const outputData = event as ExecCommandOutputDeltaEvent

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputData.chunk)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const isStderr = outputData.stream === 'stderr'

  return (
    <Card className={cn("border-l-4", isStderr ? "border-l-orange-500 bg-orange-50" : "border-l-gray-500 bg-gray-50", className)}>
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
              <Terminal className={cn("w-4 h-4", isStderr ? "text-orange-600" : "text-gray-600")} />
              <CardTitle className={cn("text-sm font-medium", isStderr ? "text-orange-800" : "text-gray-800")}>
                命令输出
              </CardTitle>
              <Badge variant="outline" className={cn(
                isStderr 
                  ? "text-orange-600 bg-orange-100 border-orange-200"
                  : "text-gray-600 bg-gray-100 border-gray-200"
              )}>
                <FileText className="w-3 h-3 mr-1" />
                {outputData.stream || 'stdout'}
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
            <div className="p-2 bg-gray-900 border rounded text-sm font-mono max-h-40 overflow-auto">
              <pre className={cn(
                "whitespace-pre-wrap",
                isStderr ? "text-red-400" : "text-green-400"
              )}>
                {outputData.chunk}
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}