import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { FileUpload } from './FileUpload'
import { Send, Square, Paperclip, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { MessageAttachment } from '../../types/chat'

interface ChatInputProps {
  onSend: (message: string, attachments?: MessageAttachment[]) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  className?: string
  onStateChange?: (state: {
    message: string
    attachmentCount: number
    canSend: boolean
    loading: boolean
  }) => void
}

export function ChatInput({ 
  onSend, 
  disabled = false, 
  loading = false,
  placeholder = "输入消息...",
  className,
  onStateChange
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if ((trimmedMessage || attachments.length > 0) && !disabled && !loading) {
      onSend(trimmedMessage, attachments.length > 0 ? attachments : undefined)
      setMessage('')
      setAttachments([])
      setShowFileUpload(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: 换行 (目前input不支持多行,可考虑改为textarea)
        e.preventDefault()
      } else if (!isComposing) {
        // Enter: 发送消息
        e.preventDefault()
        handleSend()
      }
    }
  }

  const canSend = (message.trim().length > 0 || attachments.length > 0) && !disabled && !loading

  // 通知父组件状态变化
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        message,
        attachmentCount: attachments.length,
        canSend,
        loading
      })
    }
  }, [message, attachments.length, canSend, loading, onStateChange])

  const handleFilesSelected = (newAttachments: MessageAttachment[]) => {
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleRemoveFile = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload)
  }

  return (
    <Card className={cn("border-t rounded-none border-l-0 border-r-0 border-b-0", className)}>
      <CardContent className="p-4">
        {/* 文件上传区域 */}
        {showFileUpload && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">添加附件</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              selectedFiles={attachments}
              maxFiles={3}
              maxFileSize={10}
            />
          </div>
        )}

        <div className="flex gap-3 items-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFileUpload}
            disabled={disabled || loading}
            className={cn(
              "shrink-0",
              showFileUpload && "bg-primary/10 text-primary",
              attachments.length > 0 && "bg-primary text-primary-foreground"
            )}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={loading ? "AI 正在回复..." : placeholder}
              disabled={disabled || loading}
              className={cn(
                "pr-12 resize-none",
                attachments.length > 0 && "pr-20"
              )}
              autoFocus
            />
            
            {/* 附件数量指示器 */}
            {attachments.length > 0 && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                {attachments.length}
              </div>
            )}
            
            {/* Character count (optional) */}
            {message.length > 0 && attachments.length === 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {message.length}
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className="shrink-0"
          >
            {loading ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}