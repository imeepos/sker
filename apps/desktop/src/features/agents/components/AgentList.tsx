// 智能体列表组件
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Plus, Bot, Grid3X3, List, Search } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { AgentCard } from './AgentCard';
import type { AgentListProps } from '../types';

// 加载状态骨架屏
function AgentCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="animate-pulse">
      <div className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start space-x-3">
          <div className={cn('bg-muted rounded-full', compact ? 'h-8 w-8' : 'h-10 w-10')} />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            {!compact && (
              <>
                <div className="flex space-x-2 mt-3">
                  <div className="h-5 bg-muted rounded w-12" />
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// 空状态组件
function EmptyState({ 
  message, 
  showCreateButton, 
  onCreateAgent 
}: { 
  message?: string; 
  showCreateButton?: boolean; 
  onCreateAgent?: () => void; 
}) {
  return (
    <Card className="border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 rounded-full p-4 mb-4">
          <Bot className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">暂无智能体</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {message || '还没有创建任何智能体，点击下方按钮开始创建第一个智能体。'}
        </p>
        {showCreateButton && (
          <Button onClick={onCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            创建智能体
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// 错误状态组件
function ErrorState({ error }: { error: string }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-destructive/10 rounded-full p-4 mb-4">
          <Search className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2 text-destructive">加载失败</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {error}
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          重试
        </Button>
      </CardContent>
    </Card>
  );
}

export function AgentList({
  agents = [],
  loading = false,
  error,
  viewMode = 'grid',
  onAgentSelect,
  onAgentEdit,
  onAgentDelete,
  onAgentDuplicate,
  emptyMessage,
  showCreateButton = true,
  onCreateAgent,
}: AgentListProps) {
  // 如果有错误，显示错误状态
  if (error) {
    return <ErrorState error={error} />;
  }

  // 如果正在加载，显示骨架屏
  if (loading) {
    const skeletonCount = viewMode === 'grid' ? 6 : 4;
    return (
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
      )}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <AgentCardSkeleton 
            key={index} 
            compact={viewMode === 'list'} 
          />
        ))}
      </div>
    );
  }

  // 如果没有智能体，显示空状态
  if (agents.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        showCreateButton={showCreateButton}
        onCreateAgent={onCreateAgent}
      />
    );
  }

  // 渲染智能体列表
  return (
    <div className={cn(
      viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-3'
    )}>
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onSelect={onAgentSelect}
          onEdit={onAgentEdit}
          onDelete={onAgentDelete}
          onDuplicate={onAgentDuplicate}
          compact={viewMode === 'list'}
        />
      ))}
    </div>
  );
}

// 带工具栏的智能体列表组件
export function AgentListWithToolbar({
  agents = [],
  loading = false,
  error,
  viewMode = 'grid',
  onViewModeChange,
  onAgentSelect,
  onAgentEdit,
  onAgentDelete,
  onAgentDuplicate,
  emptyMessage,
  showCreateButton = true,
  onCreateAgent,
  totalCount = 0,
  className,
}: AgentListProps & {
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  totalCount?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {loading ? (
              '加载中...'
            ) : (
              `共 ${totalCount} 个智能体`
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 视图模式切换 */}
          {onViewModeChange && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 创建按钮 */}
          {showCreateButton && (
            <Button onClick={onCreateAgent}>
              <Plus className="h-4 w-4 mr-2" />
              创建智能体
            </Button>
          )}
        </div>
      </div>

      {/* 智能体列表 */}
      <AgentList
        agents={agents}
        loading={loading}
        error={error}
        viewMode={viewMode}
        onAgentSelect={onAgentSelect}
        onAgentEdit={onAgentEdit}
        onAgentDelete={onAgentDelete}
        onAgentDuplicate={onAgentDuplicate}
        emptyMessage={emptyMessage}
        showCreateButton={false} // 已经在工具栏显示了
        onCreateAgent={onCreateAgent}
      />
    </div>
  );
}