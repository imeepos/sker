import * as React from 'react';
import { Copy, Edit, Trash2, Reply, MoreHorizontal, User, Bot, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/card';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { useChatStore, type ChatMessageWithStatus } from '@/shared/stores/chat';

interface MessageListProps {
  conversationId: string;
  messages: ChatMessageWithStatus[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReplyToMessage?: (messageId: string) => void;
  className?: string;
}

// 修改MessageComponentProps以使用扩展类型
interface ExtendedMessageComponentProps {
  message: ChatMessageWithStatus;
  isOwn?: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

// 单个消息组件
function MessageItem({ 
  message, 
  showTimestamp = true,
  onEdit,
  onDelete,
  onReply,
}: ExtendedMessageComponentProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content);

  const { settings } = useChatStore();

  // 处理复制消息
  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(message.content);
  }, [message.content]);

  // 处理编辑消息
  const handleEdit = React.useCallback(() => {
    setIsEditing(true);
  }, []);

  // 保存编辑
  const handleSaveEdit = React.useCallback(() => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, message.id, onEdit]);

  // 取消编辑
  const handleCancelEdit = React.useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  // 处理键盘事件
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // 渲染消息状态指示器
  const renderStatusIndicator = () => {
    if (!message.status) return null;

    switch (message.status) {
      case 'sending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case 'sent':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  // 获取用户头像
  const renderAvatar = () => {
    if (message.role === 'user') {
      return (
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      );
    } else if (message.role === 'assistant') {
      return (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      );
    }
    return null;
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`group flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 助手头像 (左侧) */}
      {!isUser && (
        <div className="mr-3 mt-1">
          {renderAvatar()}
        </div>
      )}

      <div
        className={`max-w-[80%] relative ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : isAssistant
            ? 'bg-muted text-muted-foreground'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        } rounded-lg px-4 py-3`}
      >
        {/* 系统消息标识 */}
        {isSystem && (
          <div className="text-xs font-medium mb-2 opacity-70">
            系统消息
          </div>
        )}

        {/* 消息内容 */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border border-muted-foreground/20 rounded px-2 py-1 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
              >
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className={`whitespace-pre-wrap ${
            settings.fontSize === 'small' ? 'text-xs' : 
            settings.fontSize === 'large' ? 'text-base' : 'text-sm'
          }`}>
            {/* 流式内容显示 */}
            {message.isStreaming ? (
              <span>
                {message.streamContent || message.content}
                <span className="animate-pulse">|</span>
              </span>
            ) : (
              message.content
            )}
          </div>
        )}

        {/* 消息元信息 */}
        <div className={`flex items-center justify-between mt-2 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}>
          {/* 时间戳和状态 */}
          {showTimestamp && (
            <div className="flex items-center space-x-2">
              {renderStatusIndicator()}
              <span className="text-xs opacity-70">
                {new Date(message.created_at * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          {/* 操作按钮 */}
          {(isHovered || isEditing) && !isSystem && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(message.id)}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                >
                  <Reply className="w-3 h-3" />
                </Button>
              )}

              {isUser && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="w-3 h-3 mr-2" />
                    复制
                  </DropdownMenuItem>
                  {onReply && (
                    <DropdownMenuItem onClick={() => onReply(message.id)}>
                      <Reply className="w-3 h-3 mr-2" />
                      回复
                    </DropdownMenuItem>
                  )}
                  {isUser && onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="w-3 h-3 mr-2" />
                      编辑
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(message.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      删除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {message.error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
            发送失败: {message.error}
          </div>
        )}
      </div>

      {/* 用户头像 (右侧) */}
      {isUser && (
        <div className="ml-3 mt-1">
          {renderAvatar()}
        </div>
      )}
    </div>
  );
}

// 消息列表组件
export function MessageList({
  messages,
  isLoading = false,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  className,
}: MessageListProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { settings } = useChatStore();

  // 自动滚动到底部
  const scrollToBottom = React.useCallback(() => {
    if (settings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [settings.autoScroll]);

  // 消息变化时滚动到底部
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 处理滚动到顶部加载更多
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading]);

  if (isLoading && messages.length === 0) {
    return (
      <Card className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">加载消息中...</p>
        </div>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">开始对话</h3>
          <p className="text-sm">还没有消息，发送第一条消息开始聊天吧！</p>
        </div>
      </Card>
    );
  }

  return (
    <ScrollArea 
      className={`flex-1 ${className}`} 
      ref={scrollAreaRef}
      onScrollCapture={handleScroll}
    >
      <div className="p-4 space-y-0">
        {/* 加载更多指示器 */}
        {isLoading && messages.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        )}

        {/* 加载更多按钮 */}
        {onLoadMore && !isLoading && (
          <div className="text-center mb-4">
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              加载更多消息
            </Button>
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.role === 'user'}
            showTimestamp={settings.showTimestamps}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onReply={onReplyToMessage}
          />
        ))}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}