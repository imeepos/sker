import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Terminal, 
  Search, 
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  Bug
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  ScrollArea
} from '../../ui'
import { cn } from '../../../lib/utils'

// 日志级别类型
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 日志条目接口
export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  details?: any
  sessionId?: string
  source?: string
}

// 日志过滤器
interface LogFilter {
  level?: LogLevel | 'all'
  search?: string
  sessionId?: string | 'all'
  source?: string | 'all'
  timeRange?: {
    start?: Date
    end?: Date
  }
}

// 组件属性
interface ExecutionLogViewerProps {
  logs: LogEntry[]
  onRefresh?: () => Promise<void>
  onDownload?: () => Promise<void>
  onClear?: () => Promise<void>
  autoScroll?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  maxDisplayLogs?: number
  showTimestamp?: boolean
  showSource?: boolean
  showDetails?: boolean
  enableVirtualScroll?: boolean
}

// 日志级别样式映射
const getLogLevelStyle = (level: LogLevel) => {
  switch (level) {
    case 'debug':
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-l-gray-400',
        badge: 'secondary' as const,
        icon: Bug
      }
    case 'info':
      return {
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-l-blue-400',
        badge: 'default' as const,
        icon: Info
      }
    case 'warn':
      return {
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-l-yellow-400',
        badge: 'secondary' as const,
        icon: AlertTriangle
      }
    case 'error':
      return {
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-l-red-400',
        badge: 'destructive' as const,
        icon: AlertCircle
      }
    default:
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-l-gray-400',
        badge: 'outline' as const,
        icon: Info
      }
  }
}

// 格式化时间戳
const formatTimestamp = (timestamp: Date, showMilliseconds: boolean = false) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  // 如果是今天的日志，只显示时间
  if (diff < 24 * 60 * 60 * 1000) {
    return timestamp.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...(showMilliseconds && { fractionalSecondDigits: 3 })
    })
  }
  
  // 其他情况显示完整日期时间
  return timestamp.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}

// 日志条目组件
const LogEntryComponent: React.FC<{
  log: LogEntry
  showTimestamp: boolean
  showSource: boolean
  showDetails: boolean
  searchQuery?: string
}> = ({ log, showTimestamp, showSource, showDetails, searchQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const style = getLogLevelStyle(log.level)
  const Icon = style.icon

  // 高亮搜索关键词
  const highlightText = (text: string, query?: string) => {
    if (!query || !query.trim()) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const handleCopy = async () => {
    const logText = `[${formatTimestamp(log.timestamp, true)}] ${log.level.toUpperCase()}: ${log.message}`
    const success = await copyToClipboard(logText)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  return (
    <div className={cn(
      "border-l-4 p-3 hover:bg-gray-50/50 transition-colors group",
      style.border,
      style.bg
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", style.color)} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={style.badge} className="text-xs">
                {log.level.toUpperCase()}
              </Badge>
              
              {showTimestamp && (
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTimestamp(log.timestamp)}
                </span>
              )}
              
              {showSource && log.source && (
                <span className="text-xs text-muted-foreground bg-gray-100 px-1 rounded">
                  {log.source}
                </span>
              )}
              
              {log.sessionId && (
                <span className="text-xs text-muted-foreground bg-blue-100 px-1 rounded">
                  #{log.sessionId.slice(-6)}
                </span>
              )}
            </div>
            
            <div className="text-sm font-mono break-words">
              {highlightText(log.message, searchQuery)}
            </div>
            
            {showDetails && log.details && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 px-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      隐藏详情
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      查看详情
                    </>
                  )}
                </Button>
                
                {isExpanded && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          title="复制日志"
        >
          {copySuccess ? (
            <span className="text-green-600 text-xs">✓</span>
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  )
}

// 主组件
export const ExecutionLogViewer: React.FC<ExecutionLogViewerProps> = ({
  logs,
  onRefresh,
  onDownload,
  onClear,
  autoScroll = true,
  autoRefresh = false,
  refreshInterval = 5000,
  maxDisplayLogs = 1000,
  showTimestamp = true,
  showSource = true,
  showDetails = true,
  enableVirtualScroll = false
}) => {
  const [filters, setFilters] = useState<LogFilter>({
    level: 'all',
    search: '',
    sessionId: 'all'
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  // 过滤和搜索日志
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      const matchesLevel = filters.level === 'all' || log.level === filters.level
      const matchesSearch = !filters.search || 
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        (log.source && log.source.toLowerCase().includes(filters.search.toLowerCase()))
      const matchesSession = filters.sessionId === 'all' || log.sessionId === filters.sessionId
      
      return matchesLevel && matchesSearch && matchesSession
    })

    // 限制显示的日志数量
    if (filtered.length > maxDisplayLogs) {
      filtered = filtered.slice(-maxDisplayLogs)
    }

    return filtered
  }, [logs, filters, maxDisplayLogs])

  // 日志统计
  const logStats = useMemo(() => {
    const stats = { debug: 0, info: 0, warn: 0, error: 0, total: logs.length }
    logs.forEach(log => {
      stats[log.level]++
    })
    return stats
  }, [logs])

  // 获取唯一的会话ID
  const sessionIds = useMemo(() => {
    const ids = new Set(logs.map(log => log.sessionId).filter(Boolean))
    return Array.from(ids)
  }, [logs])

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current && shouldAutoScroll.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [])

  // 处理刷新
  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('刷新日志失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 处理下载
  const handleDownload = async () => {
    if (!onDownload) return
    
    try {
      await onDownload()
    } catch (error) {
      console.error('下载日志失败:', error)
    }
  }

  // 处理清空
  const handleClear = async () => {
    if (!onClear) return
    
    try {
      await onClear()
    } catch (error) {
      console.error('清空日志失败:', error)
    }
  }

  // 监听日志变化，自动滚动
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom()
    }
  }, [filteredLogs, autoScroll, scrollToBottom])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return

    const interval = setInterval(handleRefresh, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, onRefresh, handleRefresh])

  // 监听滚动事件，判断是否需要自动滚动
  const handleScroll = useCallback((event: React.UIEvent) => {
    const target = event.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10
    shouldAutoScroll.current = isAtBottom
  }, [])

  return (
    <Card className="execution-log-viewer">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            执行日志
            <Badge variant="outline" className="ml-2">
              {filteredLogs.length}/{logs.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                刷新
              </Button>
            )}
            
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-1"
              >
                <Download className="w-4 h-4" />
                下载
              </Button>
            )}
            
            {onClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="gap-1"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
            )}
          </div>
        </div>

        {/* 日志统计 */}
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-blue-600">
            总计: {logStats.total}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            错误: {logStats.error}
          </Badge>
          <Badge variant="outline" className="text-yellow-600">
            警告: {logStats.warn}
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            信息: {logStats.info}
          </Badge>
          <Badge variant="outline" className="text-gray-600">
            调试: {logStats.debug}
          </Badge>
        </div>
      </CardHeader>

      {/* 过滤器 */}
      <CardContent className="border-b pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索日志内容..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* 级别过滤 */}
          <Select 
            value={filters.level || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, level: value as LogLevel | 'all' }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择日志级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部级别</SelectItem>
              <SelectItem value="debug">DEBUG</SelectItem>
              <SelectItem value="info">INFO</SelectItem>
              <SelectItem value="warn">WARN</SelectItem>
              <SelectItem value="error">ERROR</SelectItem>
            </SelectContent>
          </Select>

          {/* 会话过滤 */}
          <Select 
            value={filters.sessionId || 'all'} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, sessionId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择执行会话" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部会话</SelectItem>
              {sessionIds.map(sessionId => (
                <SelectItem key={sessionId} value={sessionId!}>
                  会话 #{sessionId!.slice(-6)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      {/* 日志内容 */}
      <CardContent className="p-0">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Terminal className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">暂无日志</p>
            <p className="text-sm">根据当前筛选条件未找到日志记录</p>
          </div>
        ) : (
          <ScrollArea 
            ref={scrollAreaRef}
            className={cn("", enableVirtualScroll && "h-[400px]")}
            onScrollCapture={handleScroll}
          >
            <div className="space-y-0">
              {filteredLogs.map((log, index) => (
                <LogEntryComponent
                  key={`${log.id}-${index}`}
                  log={log}
                  showTimestamp={showTimestamp}
                  showSource={showSource}
                  showDetails={showDetails}
                  searchQuery={filters.search}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* 自动刷新指示器 */}
      {autoRefresh && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
            实时更新
          </Badge>
        </div>
      )}
    </Card>
  )
}

export default ExecutionLogViewer