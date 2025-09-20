import * as React from 'react';
import { Send, MoreVertical, Settings, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/card';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Input } from '@/shared/components/ui/Input';
import { useChatStore } from '@/shared/stores/chat';
import { useMessages } from '../hooks/useChat';
import type { ChatWindowProps, ChatMessage } from '../types';

export function ChatWindow({
  conversationId,
  messages: externalMessages,
  isLoading,
  onSendMessage,
  onLoadMore,
}: ChatWindowProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  const {
    settings,
    getConversationDraft,
    setDraft,
    clearDraft,
    getActiveConversation,
  } = useChatStore();

  // 如果没有传入conversationId，则使用store中的活动会话
  const activeConversation = getActiveConversation();
  const currentConversationId = conversationId || activeConversation?.id;
  
  // 获取消息数据
  const messagesParams = React.useMemo(() => ({
    conversation_id: currentConversationId || '',
    limit: 50,
  }), [currentConversationId]);

  const {
    messages: hookMessages,
    isLoading: isLoadingMessages,
    sendMessage,
    isSending,
  } = useMessages(messagesParams);

  // 使用外部传入的messages或hook获取的messages
  const messages = externalMessages || hookMessages;
  const loading = isLoading || isLoadingMessages;

  // 消息输入状态
  const [inputValue, setInputValue] = React.useState('');
  const [isComposing, setIsComposing] = React.useState(false);

  // 获取和恢复草稿
  React.useEffect(() => {
    if (currentConversationId) {
      const draft = getConversationDraft(currentConversationId);
      setInputValue(draft);
    }
  }, [currentConversationId, getConversationDraft]);

  // 保存草稿
  React.useEffect(() => {
    if (currentConversationId && inputValue) {
      const timeoutId = setTimeout(() => {
        setDraft(currentConversationId, inputValue);
      }, 500); // 防抖保存
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentConversationId, inputValue, setDraft]);

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

  // 处理发送消息
  const handleSendMessage = React.useCallback(async () => {
    if (!inputValue.trim() || !currentConversationId || isSending) return;

    const content = inputValue.trim();
    setInputValue('');
    
    // 清除草稿
    if (currentConversationId) {
      clearDraft(currentConversationId);
    }

    try {
      if (onSendMessage) {
        onSendMessage(content);
      } else {
        await sendMessage({
          conversation_id: currentConversationId,
          content,
          role: 'user',
        });
      }
    } catch (error) {
      // 发送失败时恢复输入内容
      setInputValue(content);
      console.error('发送消息失败:', error);
    }
  }, [inputValue, currentConversationId, isSending, onSendMessage, sendMessage, clearDraft]);

  // 处理键盘事件
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, isComposing]);

  // 渲染单个消息
  const renderMessage = React.useCallback((message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[80%] ${
            isUser
              ? 'bg-primary text-primary-foreground ml-12'
              : 'bg-muted mr-12'
          } rounded-lg px-4 py-3`}
        >
          {/* 消息内容 */}
          <div className={`text-sm ${settings.fontSize === 'small' ? 'text-xs' : settings.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
            {message.content}
          </div>
          
          {/* 时间戳 */}
          {settings.showTimestamps && (
            <div className={`text-xs mt-1 opacity-70 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(message.created_at * 1000).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </div>
    );
  }, [settings.showTimestamps, settings.fontSize]);

  // 如果没有活动会话
  if (!currentConversationId) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            <Send className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">开始聊天</h3>
            <p className="text-sm">选择或创建一个会话开始聊天</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col h-full">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="font-medium">
              {activeConversation?.title || '聊天'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {messages.length} 条消息
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">加载消息中...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>还没有消息，开始对话吧！</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {/* 加载更多按钮 */}
            {onLoadMore && (
              <div className="text-center mb-4">
                <Button variant="outline" size="sm" onClick={onLoadMore}>
                  加载更多消息
                </Button>
              </div>
            )}
            
            {/* 消息列表 */}
            {messages.map(renderMessage)}
            
            {/* 发送中指示器 */}
            {isSending && (
              <div className="flex justify-start mb-4">
                <div className="bg-muted rounded-lg px-4 py-3 mr-12">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* 消息输入区域 */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="输入消息..."
              disabled={isSending}
              className="resize-none"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 输入提示 */}
        <div className="text-xs text-muted-foreground mt-2">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </Card>
  );
}