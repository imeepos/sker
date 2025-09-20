// 智能体卡片组件
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/shared/components/ui/dropdown-menu';
import { Switch } from '@/shared/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { 
  Play, 
  Edit, 
  Copy, 
  Trash2, 
  MoreHorizontal, 
  Bot, 
  Calendar,
  Activity,
  Zap,
  Globe,
  Lock
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { format } from '@/shared/utils/format';
import type { AgentCardProps } from '../types';

export function AgentCard({
  agent,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  compact = false,
}: AgentCardProps) {
  const handleCardClick = () => {
    onSelect?.(agent);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(agent);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(agent.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(agent);
  };

  const handleToggleActive = (e: React.MouseEvent, checked: boolean) => {
    e.stopPropagation();
    onToggleActive?.(agent.id, checked);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md group',
        'border-border/50 hover:border-border',
        !agent.is_active && 'opacity-75',
        compact && 'p-3'
      )}
      onClick={handleCardClick}
    >
      <CardHeader className={cn('pb-3', compact && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* 头像 */}
            <Avatar className={cn('h-10 w-10', compact && 'h-8 w-8')}>
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="object-cover" />
              ) : (
                <div className="flex items-center justify-center bg-primary/10 text-primary">
                  <Bot className={cn('h-5 w-5', compact && 'h-4 w-4')} />
                </div>
              )}
            </Avatar>

            {/* 基本信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className={cn('text-base truncate', compact && 'text-sm')}>
                  {agent.name}
                </CardTitle>
                
                {/* 状态指示器 */}
                <div className="flex items-center space-x-1">
                  {agent.is_public ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <Globe className="h-3 w-3 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>公开智能体</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="h-3 w-3 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>私有智能体</TooltipContent>
                    </Tooltip>
                  )}
                  
                  {agent.is_active && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      </TooltipTrigger>
                      <TooltipContent>活跃中</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              <CardDescription className={cn('text-xs line-clamp-2', compact && 'text-xs')}>
                {agent.description}
              </CardDescription>
            </div>
          </div>

          {/* 操作菜单 */}
          <div className="flex items-center space-x-1">
            {/* 快速执行按钮 */}
            {agent.is_active && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(agent);
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>执行智能体</TooltipContent>
              </Tooltip>
            )}

            {/* 更多操作 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => handleToggleActive(e, !agent.is_active)}
                  className={agent.is_active ? 'text-orange-600' : 'text-green-600'}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {agent.is_active ? '禁用' : '启用'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="pt-0">
          {/* 标签 */}
          {agent.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {agent.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {agent.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 能力 */}
          {agent.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {agent.capabilities.slice(0, 2).map((capability) => (
                <Badge key={capability} variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {capability}
                </Badge>
              ))}
              {agent.capabilities.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.capabilities.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format.relativeTime(agent.updated_at)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  更新时间: {format.dateTime(agent.updated_at)}
                </TooltipContent>
              </Tooltip>

              <span className="text-muted-foreground/70">•</span>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">
                  {agent.model}
                </span>
              </div>
            </div>

            {/* 激活状态开关 */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={agent.is_active}
                onCheckedChange={(checked) => handleToggleActive(new MouseEvent('click') as any, checked)}
                className="scale-75"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}