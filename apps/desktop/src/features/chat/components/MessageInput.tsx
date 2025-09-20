import * as React from 'react';
import { Send, Paperclip, Smile, Mic, Square, Settings } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Card } from '@/shared/components/ui/card';
import { useChatStore } from '@/shared/stores/chat';
import type { ChatInputProps } from '../types';

interface MessageInputProps extends ChatInputProps {
  conversationId?: string;
  isSending?: boolean;
  isTyping?: boolean;
  enableFileUpload?: boolean;
  enableEmoji?: boolean;
  enableVoice?: boolean;
  className?: string;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  conversationId,
  placeholder = '输入消息...',
  disabled = false,
  multiline = true,
  maxLength = 4000,
  isSending = false,
  isTyping = false,
  enableFileUpload = true,
  enableEmoji = true,
  enableVoice = true,
  className,
}: MessageInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const { settings, setDraft, getConversationDraft } = useChatStore();

  // 自动保存草稿
  React.useEffect(() => {
    if (conversationId && value && !isSending) {
      const timeoutId = setTimeout(() => {
        setDraft(conversationId, value);
      }, 500); // 防抖保存
      
      return () => clearTimeout(timeoutId);
    }
  }, [conversationId, value, isSending, setDraft]);

  // 恢复草稿
  React.useEffect(() => {
    if (conversationId && !value) {
      const draft = getConversationDraft(conversationId);
      if (draft) {
        onChange(draft);
      }
    }
  }, [conversationId, value, onChange, getConversationDraft]);

  // 自动调整文本框高度
  const adjustTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && multiline) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // 最大高度120px
      textarea.style.height = `${newHeight}px`;
    }
  }, [multiline]);

  // 文本变化时调整高度
  React.useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  // 处理发送消息
  const handleSubmit = React.useCallback(() => {
    if (!value.trim() || disabled || isSending || isComposing) return;
    
    onSubmit(value.trim());
  }, [value, disabled, isSending, isComposing, onSubmit]);

  // 处理键盘事件
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (multiline && e.shiftKey) {
        // Shift + Enter: 换行
        return;
      } else if (!multiline || !e.shiftKey) {
        // Enter: 发送消息
        e.preventDefault();
        handleSubmit();
      }
    }
  }, [handleSubmit, multiline]);

  // 处理文件上传
  const handleFileUpload = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,text/*,.pdf,.doc,.docx';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        // 这里可以处理文件上传逻辑
        console.log('上传文件:', files);
      }
    };
    
    input.click();
  }, []);

  // 处理表情符号
  const handleEmojiSelect = React.useCallback((emoji: string) => {
    const newValue = value + emoji;
    onChange(newValue);
    textareaRef.current?.focus();
  }, [value, onChange]);

  // 处理语音录制
  const handleVoiceToggle = React.useCallback(() => {
    if (isRecording) {
      // 停止录制
      setIsRecording(false);
      // 这里可以处理语音录制结束逻辑
    } else {
      // 开始录制
      setIsRecording(true);
      // 这里可以处理语音录制开始逻辑
    }
  }, [isRecording]);

  // 常用表情符号
  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '🎉', '😢', '😮', '😡', '🤔'];

  return (
    <Card className={`border-t ${className}`}>
      <div className="p-4">
        {/* 输入区域 */}
        <div className={`relative flex items-end space-x-2 p-2 border rounded-lg transition-colors ${
          isFocused ? 'border-primary' : 'border-muted-foreground/20'
        }`}>
          {/* 附件按钮 */}
          {enableFileUpload && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFileUpload}
                    disabled={disabled}
                    className="shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>上传文件</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* 文本输入框 */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className="min-h-[40px] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ 
                height: multiline ? 'auto' : '40px',
                overflow: multiline ? 'hidden' : 'auto'
              }}
            />
            
            {/* 字符计数 */}
            {maxLength && value.length > maxLength * 0.8 && (
              <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                {value.length}/{maxLength}
              </div>
            )}
          </div>

          {/* 表情按钮 */}
          {enableEmoji && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="shrink-0"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {commonEmojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="h-8 w-8 p-0"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 语音按钮 */}
          {enableVoice && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? "destructive" : "ghost"}
                    size="sm"
                    onClick={handleVoiceToggle}
                    disabled={disabled}
                    className="shrink-0"
                  >
                    {isRecording ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? '停止录制' : '语音输入'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* 发送按钮 */}
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled || isSending || isComposing}
            size="sm"
            className="shrink-0"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 底部信息栏 */}
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {/* 输入提示 */}
            <span>
              {multiline ? '按 Enter 发送，Shift + Enter 换行' : '按 Enter 发送'}
            </span>
            
            {/* 打字状态 */}
            {isTyping && (
              <span className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>对方正在输入...</span>
              </span>
            )}

            {/* 录音状态 */}
            {isRecording && (
              <span className="flex items-center space-x-1 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>正在录音...</span>
              </span>
            )}
          </div>

          {/* 设置按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <Settings className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span>字体大小: {settings.fontSize}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>自动滚动: {settings.autoScroll ? '开启' : '关闭'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>显示时间戳: {settings.showTimestamps ? '开启' : '关闭'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}