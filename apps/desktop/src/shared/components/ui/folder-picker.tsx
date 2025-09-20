import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from './Button'
import { Input } from './Input'
import { cn } from '@/shared/utils'

interface FolderPickerProps {
  value: string
  onChange: (path: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
}

/**
 * 文件夹选择组件
 * 使用 Tauri 的 dialog API 选择本地文件夹
 */
export function FolderPicker({
  value,
  onChange,
  placeholder = '选择工作空间路径',
  className,
  disabled = false,
  error
}: FolderPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false)

  const handleSelectFolder = async () => {
    try {
      setIsSelecting(true)
      
      // 使用 Tauri 的文件夹选择对话框
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: '选择工作空间路径',
        defaultPath: value || undefined
      })

      if (selectedPath && typeof selectedPath === 'string') {
        onChange(selectedPath)
      }
    } catch (error) {
      console.error('选择文件夹失败:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
          )}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSelectFolder}
          disabled={disabled || isSelecting}
          className="whitespace-nowrap"
        >
          {isSelecting ? '选择中...' : '浏览'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export { FolderPicker as default }