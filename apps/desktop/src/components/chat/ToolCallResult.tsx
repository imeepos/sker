import { useState } from 'react'
import { cn } from '../../lib/utils'
import { ToolCall } from '../../types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Code, 
  Image, 
  Download,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react'
import { 
  detectToolResultType,
  formatAndTruncateToolResult,
  formatJsonCompact,
  safeJsonStringify
} from '../../lib/text-formatting'

interface ToolCallResultProps {
  toolCall: ToolCall
  className?: string
  maxLines?: number
  lineWidth?: number
}

// 格式化结果显示，使用TUI的逻辑
const formatResult = (result: any, type: string) => {
  switch (type) {
    case 'json':
      if (typeof result === 'string') {
        // 如果是JSON字符串，使用紧凑格式
        const compactJson = formatJsonCompact(result)
        return compactJson || result
      }
      // 如果是对象，先转换为JSON再格式化
      const jsonStr = safeJsonStringify(result, null, 2)
      const compactJson = formatJsonCompact(jsonStr)
      return compactJson || jsonStr
    case 'text':
      return String(result)
    default:
      return String(result)
  }
}

// 获取结果图标
const getResultIcon = (type: string) => {
  switch (type) {
    case 'json':
      return <Code className="w-4 h-4" />
    case 'image':
      return <Image className="w-4 h-4" />
    case 'file':
      return <FileText className="w-4 h-4" />
    case 'url':
      return <ExternalLink className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

export function ToolCallResult({ 
  toolCall, 
  className, 
  maxLines = 5, 
  lineWidth = 80 
}: ToolCallResultProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  if (toolCall.status !== 'success' || !toolCall.result) {
    return null
  }

  const resultType = detectToolResultType(toolCall.result)
  const formattedResult = formatResult(toolCall.result, resultType)
  const truncatedResult = formatAndTruncateToolResult(formattedResult, maxLines, lineWidth)
  const resultIcon = getResultIcon(resultType)
  
  // 判断是否需要截断
  const isTruncated = truncatedResult !== formattedResult

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([formattedResult], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${toolCall.name}-result.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={cn("border-l-4 border-l-green-500", className)}>
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
              {resultIcon}
              <CardTitle className="text-sm font-medium">
                {toolCall.name} 执行结果
              </CardTitle>
              <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                成功
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* 智能预览 - 使用TUI截断逻辑 */}
            <div className="mb-3">
              <span className="text-xs text-muted-foreground font-medium">
                {isTruncated ? '预览：' : '结果：'}
              </span>
              <div className="mt-1 p-2 bg-muted rounded text-sm">
                {resultType === 'image' ? (
                  <img 
                    src={toolCall.result} 
                    alt="工具结果" 
                    className="max-w-full h-auto rounded"
                    style={{ maxHeight: '120px' }}
                  />
                ) : resultType === 'url' ? (
                  <a 
                    href={toolCall.result} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {toolCall.result}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                    {truncatedResult}
                  </pre>
                )}
              </div>
            </div>

            {/* 完整内容 - 仅在截断时显示 */}
            {isTruncated && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">完整内容：</span>
                <div className="mt-1 p-3 bg-gray-50 border rounded text-sm max-h-60 overflow-auto">
                  <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                    {formattedResult}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}