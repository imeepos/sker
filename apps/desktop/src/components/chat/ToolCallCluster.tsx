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
  Search, 
  FileText, 
  Folder,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { 
  isExploringToolCall,
  formatDuration,
  formatToolInvocation,
  getToolCallStatusStyle,
  safeJsonStringify
} from '../../lib/text-formatting'

interface ToolCallClusterProps {
  toolCalls: ToolCall[]
  className?: string
}

// 工具调用分组类型
type ToolCallGroup = {
  type: 'exploring' | 'individual'
  calls: ToolCall[]
  title: string
  icon: React.ReactNode
}

export function ToolCallCluster({ toolCalls, className }: ToolCallClusterProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  
  if (!toolCalls || toolCalls.length === 0) {
    return null
  }

  // 对工具调用进行分组
  const groups: ToolCallGroup[] = []
  let currentGroup: ToolCall[] = []
  
  for (const toolCall of toolCalls) {
    if (isExploringToolCall(toolCall)) {
      currentGroup.push(toolCall)
    } else {
      // 如果当前组有探索类工具调用，先处理它们
      if (currentGroup.length > 0) {
        groups.push({
          type: 'exploring',
          calls: [...currentGroup],
          title: getExploringGroupTitle(currentGroup),
          icon: <Search className="w-4 h-4" />
        })
        currentGroup = []
      }
      
      // 添加单独的工具调用
      groups.push({
        type: 'individual',
        calls: [toolCall],
        title: toolCall.name,
        icon: getToolIcon(toolCall.name)
      })
    }
  }
  
  // 处理剩余的探索类工具调用
  if (currentGroup.length > 0) {
    groups.push({
      type: 'exploring',
      calls: [...currentGroup],
      title: getExploringGroupTitle(currentGroup),
      icon: <Search className="w-4 h-4" />
    })
  }

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {groups.map((group, groupIndex) => (
        <ToolCallGroupCard
          key={groupIndex}
          group={group}
          isExpanded={expandedGroups.has(groupIndex)}
          onToggle={() => toggleGroup(groupIndex)}
        />
      ))}
    </div>
  )
}

interface ToolCallGroupCardProps {
  group: ToolCallGroup
  isExpanded: boolean
  onToggle: () => void
}

function ToolCallGroupCard({ group, isExpanded, onToggle }: ToolCallGroupCardProps) {
  const { calls, title, icon, type } = group
  
  // 计算组状态
  const hasRunning = calls.some(call => call.status === 'running')
  const hasError = calls.some(call => call.status === 'error')
  const allCompleted = calls.every(call => call.status === 'success')
  
  const groupStatus = hasRunning ? 'running' : hasError ? 'error' : allCompleted ? 'success' : 'pending'
  const statusStyle = getToolCallStatusStyle(groupStatus)
  
  // 计算总执行时间
  const totalDuration = calls.reduce((total, call) => {
    if (call.endTime) {
      return total + (call.endTime - call.startTime)
    }
    return total
  }, 0)

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200",
      statusStyle.borderColor,
      statusStyle.bgColor
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
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
              
              {hasRunning ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                icon
              )}
              
              <CardTitle className="text-sm font-medium">
                {type === 'exploring' ? (
                  <span>
                    {hasRunning ? '正在探索' : allCompleted ? '已探索' : '探索'}
                    {calls.length > 1 && ` (${calls.length})`}
                  </span>
                ) : (
                  title
                )}
              </CardTitle>
              
              <Badge variant="outline" className={cn("gap-1 text-xs", statusStyle.color)}>
                {getStatusIcon(groupStatus)}
                {getStatusText(groupStatus)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {totalDuration > 0 && (
                <span>{formatDuration(0, totalDuration)}</span>
              )}
              {type === 'exploring' && calls.length > 1 && (
                <span>{calls.length} 操作</span>
              )}
            </div>
          </div>
          
          {/* 简化的预览信息 */}
          {!isExpanded && type === 'exploring' && (
            <div className="text-xs text-muted-foreground mt-1">
              {getExploringPreview(calls)}
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            {calls.map((toolCall) => (
              <ToolCallItem
                key={toolCall.id}
                toolCall={toolCall}
                isCompact={type === 'exploring'}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

interface ToolCallItemProps {
  toolCall: ToolCall
  isCompact?: boolean
}

function ToolCallItem({ toolCall, isCompact }: ToolCallItemProps) {
  const statusStyle = getToolCallStatusStyle(toolCall.status)
  
  return (
    <div className={cn(
      "border rounded p-2",
      statusStyle.borderColor,
      isCompact ? "bg-background" : statusStyle.bgColor
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{toolCall.name}</span>
          {!isCompact && (
            <Badge variant="outline" className={cn("gap-1 text-xs", statusStyle.color)}>
              {getStatusIcon(toolCall.status)}
              {getStatusText(toolCall.status)}
            </Badge>
          )}
        </div>
        
        {toolCall.endTime && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(toolCall.startTime, toolCall.endTime)}
          </span>
        )}
      </div>
      
      {/* 参数显示 */}
      {Object.keys(toolCall.arguments).length > 0 && (
        <div className="text-xs text-muted-foreground">
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
            {formatToolInvocation(toolCall)}
          </code>
        </div>
      )}
      
      {/* 错误信息 */}
      {toolCall.status === 'error' && toolCall.error && (
        <div className="mt-1 text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
          {toolCall.error}
        </div>
      )}
      
      {/* 结果预览 */}
      {toolCall.result && toolCall.status === 'success' && (
        <div className="mt-1 text-xs text-muted-foreground">
          <div className="bg-muted p-1.5 rounded max-h-16 overflow-hidden">
            {typeof toolCall.result === 'string' 
              ? toolCall.result.substring(0, 100) + (toolCall.result.length > 100 ? '...' : '')
              : safeJsonStringify(toolCall.result).substring(0, 100) + '...'
            }
          </div>
        </div>
      )}
    </div>
  )
}

// 辅助函数
function getExploringGroupTitle(calls: ToolCall[]): string {
  const readCalls = calls.filter(c => c.name.toLowerCase().includes('read'))
  const searchCalls = calls.filter(c => c.name.toLowerCase().includes('search'))
  const listCalls = calls.filter(c => c.name.toLowerCase().includes('list'))
  
  if (readCalls.length > 0 && searchCalls.length > 0) {
    return '搜索和读取文件'
  } else if (readCalls.length > 0) {
    return '读取文件'
  } else if (searchCalls.length > 0) {
    return '搜索文件'
  } else if (listCalls.length > 0) {
    return '列出文件'
  }
  
  return '探索文件系统'
}

function getExploringPreview(calls: ToolCall[]): string {
  const completedCalls = calls.filter(c => c.status === 'success')
  const fileNames = completedCalls
    .map(c => {
      if (c.arguments.path) return c.arguments.path
      if (c.arguments.file) return c.arguments.file
      if (c.arguments.name) return c.arguments.name
      return null
    })
    .filter(Boolean)
    .slice(0, 3)
  
  if (fileNames.length > 0) {
    const preview = fileNames.join(', ')
    const remaining = completedCalls.length - fileNames.length
    return remaining > 0 ? `${preview} 等${remaining + fileNames.length}个文件` : preview
  }
  
  return `${calls.length} 个操作`
}

function getToolIcon(toolName: string): React.ReactNode {
  const name = toolName.toLowerCase()
  
  if (name.includes('read') || name.includes('cat')) {
    return <FileText className="w-4 h-4" />
  } else if (name.includes('list') || name.includes('ls') || name.includes('dir')) {
    return <Folder className="w-4 h-4" />
  } else if (name.includes('search') || name.includes('grep') || name.includes('find')) {
    return <Search className="w-4 h-4" />
  }
  
  return <FileText className="w-4 h-4" />
}

function getStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3" />
    case 'running':
      return <Loader2 className="w-3 h-3 animate-spin" />
    case 'success':
      return <CheckCircle className="w-3 h-3" />
    case 'error':
      return <AlertCircle className="w-3 h-3" />
    default:
      return <Clock className="w-3 h-3" />
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return '等待中'
    case 'running':
      return '执行中'
    case 'success':
      return '成功'
    case 'error':
      return '失败'
    default:
      return '未知'
  }
}