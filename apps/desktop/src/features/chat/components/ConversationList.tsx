import * as React from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Pin, 
  Archive,
  MessageCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/card';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/Dialog';
import { Badge } from '@/shared/components/ui/badge';
import { useChatStore } from '@/shared/stores/chat';
import { useConversations } from '../hooks/useChat';
import type { ConversationComponentProps } from '../types';

interface ConversationListProps {
  onConversationSelect?: (conversationId: string) => void;
  onConversationCreate?: () => void;
  className?: string;
}

// 单个会话项组件
function ConversationItem({
  conversation,
  isActive = false,
  onClick,
  onEdit,
  onDelete,
}: ConversationComponentProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(conversation.title);

  // 处理点击
  const handleClick = React.useCallback(() => {
    if (!isEditing) {
      onClick?.(conversation.id);
    }
  }, [isEditing, onClick, conversation.id]);

  // 处理编辑
  const handleEdit = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // 保存编辑
  const handleSaveEdit = React.useCallback(() => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onEdit?.(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, conversation.title, conversation.id, onEdit]);

  // 取消编辑
  const handleCancelEdit = React.useCallback(() => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  }, [conversation.title]);

  // 处理键盘事件
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // 处理删除
  const handleDelete = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除会话"${conversation.title}"吗？`)) {
      onDelete?.(conversation.id);
    }
  }, [onDelete, conversation.id, conversation.title]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // 昨天
    if (diff < 48 * 60 * 60 * 1000) {
      return '昨天';
    }
    
    // 本周
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // 更早
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
        isActive ? 'ring-2 ring-primary ring-offset-1 bg-primary/5' : 'hover:bg-muted/50'
      } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* 会话标题 */}
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              autoFocus
              className="h-6 text-sm"
            />
          ) : (
            <h4 className="font-medium text-sm truncate mb-1">
              {conversation.title}
            </h4>
          )}

          {/* 会话描述 */}
          {conversation.description && (
            <p className="text-xs text-muted-foreground truncate mb-2">
              {conversation.description}
            </p>
          )}

          {/* 会话信息 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3" />
              <span>
                {conversation.last_message_at 
                  ? formatTime(conversation.last_message_at)
                  : formatTime(conversation.updated_at)
                }
              </span>
            </div>
            
            {/* 消息计数 */}
            {conversation.metadata?.messageCount && (
              <Badge variant="secondary" className="text-xs">
                {conversation.metadata.messageCount}
              </Badge>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        {(isHovered || isActive) && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-3 h-3 mr-2" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="w-3 h-3 mr-2" />
                置顶
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="w-3 h-3 mr-2" />
                归档
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-3 h-3 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}

// 新建会话对话框
function NewConversationDialog({ onCreateConversation }: { onCreateConversation: (title: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');

  const handleCreate = React.useCallback(() => {
    if (title.trim()) {
      onCreateConversation(title.trim());
      setTitle('');
      setOpen(false);
    }
  }, [title, onCreateConversation]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  }, [handleCreate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
          <Plus className="w-4 h-4 mr-2" />
          新建会话
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建会话</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入会话标题..."
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>
              创建
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 会话列表主组件
export function ConversationList({
  onConversationSelect,
  onConversationCreate,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const {
    activeConversationId,
    setActiveConversation,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useChatStore();

  const {
    conversations,
    isLoading,
    createConversation,
    updateConversation,
    deleteConversation,
    isCreating,
  } = useConversations();

  // 过滤会话
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(query) ||
      conv.description?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // 处理会话选择
  const handleConversationSelect = React.useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    onConversationSelect?.(conversationId);
  }, [setActiveConversation, onConversationSelect]);

  // 处理创建会话
  const handleCreateConversation = React.useCallback((title: string) => {
    createConversation({ title });
    onConversationCreate?.();
  }, [createConversation, onConversationCreate]);

  // 处理编辑会话
  const handleEditConversation = React.useCallback((conversationId: string, title: string) => {
    updateConversation(conversationId, { title });
  }, [updateConversation]);

  // 处理删除会话
  const handleDeleteConversation = React.useCallback((conversationId: string) => {
    deleteConversation(conversationId);
  }, [deleteConversation]);

  if (sidebarCollapsed) {
    return (
      <div className={`w-16 border-r ${className}`}>
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="w-full h-10"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={`w-80 border-r flex flex-col h-full ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">聊天</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(true)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索会话..."
            className="pl-9"
          />
        </div>
      </div>

      {/* 新建会话按钮 */}
      <div className="p-3 border-b">
        <NewConversationDialog onCreateConversation={handleCreateConversation} />
      </div>

      {/* 会话列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading && conversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">加载会话中...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">
                {searchQuery ? '没有找到匹配的会话' : '暂无会话'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? '尝试使用其他关键词搜索' : '创建您的第一个会话开始聊天'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={handleConversationSelect}
                onEdit={handleEditConversation}
                onDelete={handleDeleteConversation}
              />
            ))
          )}

          {/* 创建中指示器 */}
          {isCreating && (
            <Card className="p-3 opacity-70">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm">正在创建会话...</span>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      <div className="p-3 border-t">
        <p className="text-xs text-muted-foreground">
          共 {conversations.length} 个会话
        </p>
      </div>
    </Card>
  );
}