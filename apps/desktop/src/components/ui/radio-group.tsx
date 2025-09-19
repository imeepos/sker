import * as React from "react"
import { cn } from "../../lib/utils"

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name?: string
} | null>(null)

export interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  children: React.ReactNode
  className?: string
}

export function RadioGroup({
  value,
  onValueChange,
  name,
  children,
  className
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn("grid gap-2", className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps {
  value: string
  id?: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function RadioGroupItem({
  value,
  id,
  disabled,
  className,
  children
}: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  
  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup')
  }

  const isChecked = context.value === value
  const handleChange = () => {
    if (!disabled) {
      context.onValueChange?.(value)
    }
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <button
        type="button"
        role="radio"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isChecked && "bg-primary"
        )}
        onClick={handleChange}
        id={id}
      >
        {isChecked && (
          <div className="flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
          </div>
        )}
      </button>
      {children && (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          onClick={handleChange}
        >
          {children}
        </label>
      )}
    </div>
  )
}