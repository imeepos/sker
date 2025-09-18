import React, { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { 
  Send,
  Paperclip,
  X,
  Image,
  FileText,
  Loader2
} from 'lucide-react'

interface ChatProInputProps {
  /** 输入提示文本 */
  placeholder?: string
  /** 是否禁用输入 */
  disabled?: boolean
  /** 最大字符数 */
  maxLength?: number
  /** 是否支持文件上传 */
  enableFileUpload?: boolean
  /** 支持的文件类型 */
  acceptedFileTypes?: string[]
  /** 最大文件大小(MB) */
  maxFileSize?: number
  /** 自定义样式类名 */
  className?: string
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
}

/**
 * ChatPro 输入组件 - 支持文本输入和文件附件
 * 
 * 特性:
 * - 多行文本输入，支持 Ctrl+Enter 发送
 * - 文件拖拽上传支持
 * - 文件预览和管理
 * - 字符数统计
 * - 响应式设计
 * - 符合 ag-ui 设计规范
 */
export function ChatProInput({
  placeholder = '输入消息...',
  disabled = false,
  maxLength = 4000,
  enableFileUpload = true,
  acceptedFileTypes = ['image/*', 'text/*', '.pdf', '.doc', '.docx'],
  maxFileSize = 10,
  className,
  onSendMessage
}: ChatProInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自动调整文本域高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
    }
    adjustTextareaHeight()
  }, [maxLength, adjustTextareaHeight])

  // 发送消息
  const handleSendMessage = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return
    if (disabled || isUploading) return

    onSendMessage?.(message.trim(), attachments.length > 0 ? attachments : undefined)
    setMessage('')
    setAttachments([])
    
    // 重置文本域高度
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }, 0)
  }, [message, attachments, disabled, isUploading, onSendMessage])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Enter 或 Cmd+Enter 发送消息
        e.preventDefault()
        handleSendMessage()
      } else if (!e.shiftKey) {
        // Enter 键发送消息（除非按住 Shift）
        e.preventDefault()
        handleSendMessage()
      }
    }
  }, [handleSendMessage])

  // 处理文件选择
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || !enableFileUpload) return

    setIsUploading(true)
    const validFiles: File[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 检查文件大小
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`文件 "${file.name}" 超过 ${maxFileSize}MB 限制`)
        continue
      }

      // 检查文件类型
      const isValidType = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.includes('*')) {
          const mimePrefix = type.split('/')[0]
          return file.type.startsWith(mimePrefix)
        }
        return file.type === type
      })

      if (!isValidType) {
        alert(`文件类型 "${file.type}" 不受支持`)
        continue
      }

      validFiles.push(file)
    }

    setAttachments(prev => [...prev, ...validFiles])
    setIsUploading(false)
  }, [enableFileUpload, maxFileSize, acceptedFileTypes])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (enableFileUpload && !disabled) {
      setIsDragOver(true)
    }
  }, [enableFileUpload, disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (enableFileUpload && !disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [enableFileUpload, disabled, handleFileSelect])

  // 移除附件
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 获取文件图标
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const canSend = !disabled && !isUploading && (message.trim() || attachments.length > 0)

  return (
    <Card className={cn('border-2 transition-colors', {
      'border-blue-200 bg-blue-50/50': isDragOver,
      'border-border': !isDragOver
    }, className)}>
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 附件预览区域 */}
        {attachments.length > 0 && (
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="w-4 h-4" />
              <span>附件 ({attachments.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <Badge
                  key={`${file.name}-${index}`}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1 max-w-xs"
                >
                  {getFileIcon(file)}
                  <span className="truncate text-xs">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 主输入区域 */}
        <div className="p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  'w-full resize-none border-0 bg-transparent',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-0',
                  'text-sm leading-5',
                  'min-h-[40px] max-h-[200px]',
                  { 'opacity-50 cursor-not-allowed': disabled }
                )}
                rows={1}
              />
              
              {/* 字符数统计 */}
              {message.length > maxLength * 0.8 && (
                <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                  {message.length}/{maxLength}
                </div>
              )}
            </div>

            <div className="flex items-end gap-1">
              {/* 文件上传按钮 */}
              {enableFileUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedFileTypes.join(',')}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 p-0"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}

              {/* 发送按钮 */}
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!canSend}
                className="h-10 w-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 拖拽覆盖层 */}
        {isDragOver && enableFileUpload && (
          <div className="absolute inset-0 bg-blue-50/80 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Paperclip className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium">拖放文件到这里</p>
              <p className="text-xs text-blue-600">支持 {acceptedFileTypes.join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}