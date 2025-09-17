// 为剩余的 EventMsg 类型创建存根组件
import { EventMsg } from '../../types/protocol/EventMsg'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn, formatTime } from '../../lib/utils'
import { 
  MessageSquare, 
  Brain, 
  Settings, 
  FileText, 
  History, 
  List, 
  GitBranch, 
  AlertTriangle,
  Archive,
  Route,
  Eye,
  EyeOff
} from 'lucide-react'

interface BaseEventComponentProps {
  event: EventMsg
  className?: string
  timestamp?: Date
}

// Agent 推理相关事件组件
export function AgentMessageDeltaEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-blue-400 bg-blue-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-800">智能助手消息更新</CardTitle>
            <Badge variant="outline" className="text-blue-600 bg-blue-100 border-blue-200">增量</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function AgentReasoningEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-purple-500 bg-purple-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-sm font-medium text-purple-800">智能推理</CardTitle>
            <Badge variant="outline" className="text-purple-600 bg-purple-100 border-purple-200">推理</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function AgentReasoningDeltaEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-purple-400 bg-purple-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-sm font-medium text-purple-800">推理更新</CardTitle>
            <Badge variant="outline" className="text-purple-600 bg-purple-100 border-purple-200">增量</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function AgentReasoningRawContentEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-gray-500 bg-gray-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-800">原始推理内容</CardTitle>
            <Badge variant="outline" className="text-gray-600 bg-gray-100 border-gray-200">原始</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function AgentReasoningRawContentDeltaEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-gray-400 bg-gray-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-800">原始内容更新</CardTitle>
            <Badge variant="outline" className="text-gray-600 bg-gray-100 border-gray-200">增量</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function AgentReasoningSectionBreakEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-slate-500 bg-slate-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-t-2 border-slate-600" />
            <CardTitle className="text-sm font-medium text-slate-800">推理分段</CardTitle>
            <Badge variant="outline" className="text-slate-600 bg-slate-100 border-slate-200">分段</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

// 会话和配置相关组件
export function SessionConfiguredEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-green-500 bg-green-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-green-600" />
            <CardTitle className="text-sm font-medium text-green-800">会话配置完成</CardTitle>
            <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">配置</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

// 批准和请求相关组件
export function ExecApprovalRequestEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-amber-500 bg-amber-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-medium text-amber-800">执行批准请求</CardTitle>
            <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">等待批准</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function ApplyPatchApprovalRequestEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-amber-500 bg-amber-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-medium text-amber-800">补丁应用批准请求</CardTitle>
            <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">等待批准</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

// 其他事件组件
export function BackgroundEventEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-gray-400 bg-gray-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-800">后台事件</CardTitle>
            <Badge variant="outline" className="text-gray-600 bg-gray-100 border-gray-200">后台</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function StreamErrorEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-red-500 bg-red-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <CardTitle className="text-sm font-medium text-red-800">流错误</CardTitle>
            <Badge variant="destructive">错误</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function PatchApplyBeginEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-blue-500 bg-blue-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-800">开始应用补丁</CardTitle>
            <Badge variant="outline" className="text-blue-600 bg-blue-100 border-blue-200">进行中</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function PatchApplyEndEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-green-500 bg-green-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-green-600" />
            <CardTitle className="text-sm font-medium text-green-800">补丁应用完成</CardTitle>
            <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">完成</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function TurnDiffEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-orange-500 bg-orange-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-orange-600" />
            <CardTitle className="text-sm font-medium text-orange-800">轮次差异</CardTitle>
            <Badge variant="outline" className="text-orange-600 bg-orange-100 border-orange-200">差异</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function GetHistoryEntryResponseEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-teal-500 bg-teal-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <CardTitle className="text-sm font-medium text-teal-800">历史记录响应</CardTitle>
            <Badge variant="outline" className="text-teal-600 bg-teal-100 border-teal-200">历史</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function McpListToolsResponseEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-violet-500 bg-violet-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-violet-600" />
            <CardTitle className="text-sm font-medium text-violet-800">MCP 工具列表响应</CardTitle>
            <Badge variant="outline" className="text-violet-600 bg-violet-100 border-violet-200">工具列表</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function ListCustomPromptsResponseEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-pink-500 bg-pink-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-pink-600" />
            <CardTitle className="text-sm font-medium text-pink-800">自定义提示列表响应</CardTitle>
            <Badge variant="outline" className="text-pink-600 bg-pink-100 border-pink-200">提示列表</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function UpdatePlanArgsComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-emerald-500 bg-emerald-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-medium text-emerald-800">计划更新</CardTitle>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-100 border-emerald-200">计划</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function TurnAbortedEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-red-500 bg-red-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <CardTitle className="text-sm font-medium text-red-800">轮次中止</CardTitle>
            <Badge variant="destructive">中止</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function ConversationPathResponseEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-cyan-500 bg-cyan-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-cyan-600" />
            <CardTitle className="text-sm font-medium text-cyan-800">对话路径响应</CardTitle>
            <Badge variant="outline" className="text-cyan-600 bg-cyan-100 border-cyan-200">路径</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function ReviewRequestComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-amber-500 bg-amber-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-medium text-amber-800">进入审查模式</CardTitle>
            <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">审查</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}

export function ExitedReviewModeEventComponent({ event: _event, className, timestamp }: BaseEventComponentProps) {
  return (
    <Card className={cn("border-l-4 border-l-green-500 bg-green-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-green-600" />
            <CardTitle className="text-sm font-medium text-green-800">退出审查模式</CardTitle>
            <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">退出</Badge>
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
    </Card>
  )
}