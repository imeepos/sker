import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function Select({ value, onValueChange, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  // 处理点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={selectRef} className={cn('relative', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error('SelectTrigger must be used within a Select component')
  }

  return (
    <button
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context.setIsOpen(!context.isOpen)}
    >
      {children}
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{
          transform: context.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>
  )
}

export interface SelectValueProps {
  placeholder?: string
  className?: string
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const context = React.useContext(SelectContext)
  
  return (
    <span className={cn('text-left', className)}>
      {context?.value || placeholder}
    </span>
  )
}

export interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export function SelectContent({ className, children }: SelectContentProps) {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error('SelectContent must be used within a Select component')
  }

  if (!context.isOpen) {
    return null
  }

  return (
    <div className={cn(
      'absolute top-full left-0 z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 animate-in fade-in-0 zoom-in-95',
      className
    )}>
      <div className="max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export interface SelectItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function SelectItem({ value, className, children }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  
  if (!context) {
    throw new Error('SelectItem must be used within a Select component')
  }

  const isSelected = context.value === value

  const handleClick = () => {
    context.onValueChange?.(value)
    context.setIsOpen(false) // 选择后关闭下拉菜单
  }

  return (
    <button
      className={cn(
        'w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors',
        isSelected && 'bg-accent text-accent-foreground font-medium',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        {children}
        {isSelected && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </div>
    </button>
  )
}