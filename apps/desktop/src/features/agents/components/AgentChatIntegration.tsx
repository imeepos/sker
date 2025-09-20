// 智能体与聊天模块集成组件
import { useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { 
  MessageSquare, 
  Bot, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { Agent } from '../api/agentsApi';
import type { Conversation } from '@/features/chat/api/chatApi';

interface AgentChatIntegrationProps {
  agent: Agent;
  conversation?: Conversation;
  onCreateConversation?: (agentId: string) => Promise<Conversation>;
  onSwitchToChat?: (conversationId: string) => void;
  className?: string;
}

export function AgentChatIntegration({
  agent,
  conversation,
  onCreateConversation,
  onSwitchToChat,
  className,
}: AgentChatIntegrationProps) {
  const [isCreating, setIsCreating] = useState(false);

  // 创建新的聊天会话
  const handleCreateConversation = useCallback(async () => {
    if (!onCreateConversation) return;
    
    setIsCreating(true);
    try {
      const newConversation = await onCreateConversation(agent.id);
      onSwitchToChat?.(newConversation.id);
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      setIsCreating(false);
    }
  }, [agent.id, onCreateConversation, onSwitchToChat]);


  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">聊天集成</CardTitle>
            <p className="text-sm text-muted-foreground">
              在聊天界面中使用此智能体
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 智能体信息 */}
        <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg">
          <Avatar className="h-8 w-8">
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="object-cover" />
            ) : (
              <div className="flex items-center justify-center bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-sm truncate">{agent.name}</p>
              <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-xs">
                {agent.is_active ? '活跃' : '禁用'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {agent.description}
            </p>
          </div>
        </div>

        <Separator />

        {/* 当前会话状态 */}
        {conversation ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">已连接到会话</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {conversation.title}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground">
              智能体已准备好在当前会话中响应消息
            </p>

            <Button
              onClick={() => onSwitchToChat?.(conversation.id)}
              className="w-full"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              切换到聊天界面
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full" />
                <span className="text-sm font-medium">未连接会话</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              创建新的聊天会话来与此智能体对话
            </p>

            <Button
              onClick={handleCreateConversation}
              disabled={isCreating || !agent.is_active}
              className="w-full"
              size="sm"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border border-current rounded-full border-t-transparent" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  创建聊天会话
                </>
              )}
            </Button>
          </div>
        )}

        {/* 智能体能力展示 */}
        {agent.capabilities.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">智能体能力</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 4).map((capability) => (
                  <Badge key={capability} variant="outline" className="text-xs">
                    {capability}
                  </Badge>
                ))}
                {agent.capabilities.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{agent.capabilities.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* 提示信息 */}
        {!agent.is_active && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700">
              智能体当前已禁用，请先启用后再创建聊天会话
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 智能体选择器组件（用于聊天界面）
interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentSelect: (agent: Agent | null) => void;
  loading?: boolean;
  className?: string;
}

export function AgentSelector({
  agents,
  selectedAgentId,
  onAgentSelect,
  loading = false,
  className,
}: AgentSelectorProps) {
  const activeAgents = agents.filter(agent => agent.is_active);
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  if (loading) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Bot className="h-4 w-4" />
          <span>智能体助手</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {selectedAgent ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <Avatar className="h-6 w-6">
                {selectedAgent.avatar ? (
                  <img src={selectedAgent.avatar} alt={selectedAgent.name} className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center bg-primary/10 text-primary">
                    <Bot className="h-3 w-3" />
                  </div>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedAgent.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedAgent.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAgentSelect(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              当前消息将由 <strong>{selectedAgent.name}</strong> 处理
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              选择一个智能体来辅助对话
            </p>
            
            {activeAgents.length === 0 ? (
              <p className="text-xs text-orange-600">
                暂无可用的智能体
              </p>
            ) : (
              <div className="grid gap-2">
                {activeAgents.slice(0, 3).map((agent) => (
                  <Button
                    key={agent.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onAgentSelect(agent)}
                    className="justify-start h-auto p-2"
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center bg-primary/10 text-primary">
                          <Bot className="h-3 w-3" />
                        </div>
                      )}
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.description}
                      </p>
                    </div>
                  </Button>
                ))}
                
                {activeAgents.length > 3 && (
                  <Button variant="ghost" size="sm" className="text-xs">
                    查看更多智能体...
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}