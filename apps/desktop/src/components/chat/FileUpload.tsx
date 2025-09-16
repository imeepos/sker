import { useState, useRef, DragEvent } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import { MessageAttachment } from '../../types/chat'

// 图片附件上传 - 仅支持协议层已实现的图片类型
import { 
  Image, 
  X, 
  Upload,
  AlertCircle 
} from 'lucide-react'

interface FileUploadProps {
  onFilesSelected: (attachments: MessageAttachment[]) => void
  onRemoveFile: (id: string) => void
  selectedFiles: MessageAttachment[]
  maxFiles?: number
  maxFileSize?: number // MB
  acceptedTypes?: string[]
  className?: string
}

export function FileUpload({ 
  onFilesSelected,
  onRemoveFile,
  selectedFiles,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/*'],
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = async (files: FileList) => {
    const newAttachments: MessageAttachment[] = []
    
    // 检查文件数量限制
    if (selectedFiles.length + files.length > maxFiles) {
      setUploadError(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 检查文件大小
      if (file.size > maxFileSize * 1024 * 1024) {
        setUploadError(`文件 "${file.name}" 超过 ${maxFileSize}MB 大小限制`)
        continue
      }

      // 检查文件类型
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })

      if (!isAccepted) {
        setUploadError(`不支持的文件类型: ${file.type}`)
        continue
      }

      // 创建文件URL
      const url = URL.createObjectURL(file)
      
      // 确定文件类型 - 只支持图片
      const attachmentType: MessageAttachment['type'] = 'image'

      // 创建附件对象
      const attachment: MessageAttachment = {
        id: `${Date.now()}-${i}`,
        type: attachmentType,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        url
      }

      // 获取图片尺寸
      try {
        const { width, height } = await getImageDimensions(file)
        attachment.width = width
        attachment.height = height
      } catch (error) {
        console.warn('获取图片尺寸失败:', error)
      }

      newAttachments.push(attachment)
    }

    if (newAttachments.length > 0) {
      onFilesSelected(newAttachments)
      setUploadError(null)
    }
  }

  // 获取图片尺寸
  const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // 拖拽处理
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  // 点击上传
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }


  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* 文件上传区域 */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p>拖拽文件到这里，或者</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleButtonClick}
              className="p-0 h-auto font-medium"
            >
              点击选择文件
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            支持图片格式，最大 {maxFileSize}MB
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(e.target.files)
          }
        }}
        className="hidden"
      />

      {/* 错误信息 */}
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadError(null)}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* 已选择的文件列表 */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            已选择文件 ({selectedFiles.length}/{maxFiles})
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Image className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.mimeType}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(file.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* 图片预览 */}
                <div className="mt-2">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-full max-h-20 rounded border object-cover"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 图片选择按钮 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*'
              fileInputRef.current.click()
            }
          }}
          className="flex items-center gap-1"
        >
          <Image className="w-3 h-3" />
          选择图片
        </Button>
      </div>
    </div>
  )
}