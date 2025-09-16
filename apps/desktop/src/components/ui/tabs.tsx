import * as React from 'react'
import { cn } from '../../lib/utils'

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export function Tabs({ 
  defaultValue, 
  value: controlledValue, 
  onValueChange, 
  className, 
  children 
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  
  const value = controlledValue ?? internalValue
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  className?: string
  children: React.ReactNode
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div className={cn('flex border-b border-border', className)}>
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs')
  }

  const { value: currentValue, onValueChange } = context
  const isActive = currentValue === value

  return (
    <button
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        'hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary',
        'data-[state=active]:text-foreground',
        !isActive && 'text-muted-foreground',
        className
      )}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsContent must be used within Tabs')
  }

  const { value: currentValue } = context
  
  if (currentValue !== value) {
    return null
  }

  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  )
}