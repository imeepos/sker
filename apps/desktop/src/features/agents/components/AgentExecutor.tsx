// 智能体执行组件
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/textarea';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
import { 
  Play, 
  Square, 
  Trash2, 
  Bot, 
  User, 
  Clock, 
  Zap,
  Copy,
  Settings
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { format } from '@/shared/utils/format';
import type { AgentExecutorProps, AgentExecution } from '../types';

// 执行结果组件
function ExecutionResult({ 
  execution, 
  onCopy 
}: { 
  execution: AgentExecution; 
  onCopy?: (text: string) => void; 
}) {
  const getStatusColor = (status: AgentExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500';
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: AgentExecution['status']) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'running':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '执行失败';
      default:
        return '未知状态';
    }
  };

  return (
    <div className="space-y-3 py-3">
      {/* 用户输入 */}
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <div className="flex items-center justify-center bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap break-words">
              {execution.input}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format.dateTime(execution.started_at)}</span>
          </div>
        </div>
      </div>

      {/* 智能体响应 */}
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <div className="flex items-center justify-center bg-secondary text-secondary-foreground">
            <Bot className="h-4 w-4" />
          </div>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-secondary/50 rounded-lg p-3">
            {execution.status === 'running' && !execution.output && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin h-3 w-3 border border-current rounded-full border-t-transparent" />
                <span>正在思考...</span>
              </div>
            )}
            
            {execution.output && (
              <div className="space-y-2">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {execution.output}
                </p>
                {onCopy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(execution.output!)}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                )}
              </div>
            )}
            
            {execution.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                错误: {execution.error}
              </div>
            )}
          </div>
          
          {/* 状态和元信息 */}
          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className={cn('h-2 w-2 rounded-full', getStatusColor(execution.status))} />
              <span>{getStatusText(execution.status)}</span>
            </div>
            
            {execution.completed_at && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  耗时 {Math.round((execution.completed_at - execution.started_at) / 1000)}s
                </span>
              </div>
            )}
            
            {execution.usage && (
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>{execution.usage.total_tokens} tokens</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentExecutor({
  agent,
  onExecute,
  onClear,
  loading = false,
  error,
  executions = [],
  maxHistoryItems = 10,
}: AgentExecutorProps) {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [executions]);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const trimmedInput = input.trim();
    setInput('');
    
    try {
      await onExecute(trimmedInput);
    } catch (error) {
      console.error('执行失败:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // 这里可以添加 toast 提示
  };

  const displayExecutions = executions.slice(-maxHistoryItems);

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="object-cover" />
            ) : (
              <div className="flex items-center justify-center bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.model}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 智能体状态 */}
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? '活跃' : '禁用'}
          </Badge>

          {/* 清空历史 */}
          {executions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {/* 设置 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 border-b bg-muted/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Temperature:</span>
              <span className="ml-2">{agent.parameters.temperature || 0.7}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Tokens:</span>
              <span className="ml-2">{agent.parameters.max_tokens || 2048}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Top P:</span>
              <span className="ml-2">{agent.parameters.top_p || 1.0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>
              <span className="ml-2">{agent.model}</span>
            </div>
          </div>
        </div>
      )}

      {/* 执行历史 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4">
            {displayExecutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Bot className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  还没有执行记录，发送一条消息开始与智能体对话
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {displayExecutions.map((execution, index) => (
                  <div key={execution.id}>
                    <ExecutionResult 
                      execution={execution} 
                      onCopy={handleCopy}
                    />
                    {index < displayExecutions.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 border-t bg-red-50 border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`与 ${agent.name} 对话...`}
              disabled={loading || !agent.is_active}
              className="resize-none min-h-[60px] max-h-[200px] pr-12"
              rows={1}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading || !agent.is_active}
              className="absolute right-2 bottom-2 h-8 w-8"
            >
              {loading ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>按 Enter 发送，Shift + Enter 换行</span>
              {!agent.is_active && (
                <span className="text-orange-600">智能体已禁用</span>
              )}
            </div>
            <div>
              {input.length > 0 && `${input.length} 字符`}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}