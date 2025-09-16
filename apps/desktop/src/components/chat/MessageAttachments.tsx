import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import { MessageAttachment } from '../../types/chat'

// 图片附件显示 - 仅支持协议层已实现的图片附件
import { 
  ExternalLink 
} from 'lucide-react'

interface MessageAttachmentsProps {
  attachments: MessageAttachment[]
  isUser?: boolean
  className?: string
}

export function MessageAttachments({ 
  attachments, 
  isUser = false,
  className 
}: MessageAttachmentsProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) return null

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }


  // 处理图片点击
  const handleImageClick = (attachmentId: string) => {
    setExpandedImage(expandedImage === attachmentId ? null : attachmentId)
  }


  return (
    <div className={cn("space-y-2", className)}>
      {attachments.map((attachment) => {
        const isExpanded = expandedImage === attachment.id
        
        return (
          <Card key={attachment.id} className={cn(
            "overflow-hidden",
            isUser ? "bg-blue-400/20 border-blue-400/30" : "bg-muted/50"
          )}>
            {/* 图片附件 */}
            {(
              <div className="relative">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className={cn(
                    "w-full cursor-pointer transition-all duration-200",
                    isExpanded 
                      ? "max-h-96 object-contain" 
                      : "max-h-48 object-cover"
                  )}
                  onClick={() => handleImageClick(attachment.id)}
                  loading="lazy"
                />
                
                {/* 图片信息叠加 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">
                      {attachment.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{formatFileSize(attachment.size)}</span>
                      {attachment.width && attachment.height && (
                        <span>{attachment.width}×{attachment.height}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 展开/收起按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => handleImageClick(attachment.id)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}