"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, children, disabled, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "")
    const [isOpen, setIsOpen] = React.useState(false)
    const selectRef = React.useRef<HTMLDivElement>(null)
    
    const handleValueChange = React.useCallback((newValue: string) => {
      setInternalValue(newValue)
      onValueChange?.(newValue)
      setIsOpen(false)
    }, [onValueChange])

    // Handle click outside to close dropdown
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const contextValue = React.useMemo(() => ({
      value: value || internalValue,
      onValueChange: handleValueChange,
      isOpen,
      setIsOpen
    }), [value, internalValue, handleValueChange, isOpen])

    return (
      <SelectContext.Provider value={contextValue}>
        <div 
          ref={(node) => {
            selectRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          className={cn("relative", className)} 
          {...props}
        >
          {children}
        </div>
      </SelectContext.Provider>
    )
  }
)
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, disabled, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectTrigger must be used within a Select component")
    }

    return (
      <button
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        onClick={() => context.setIsOpen(!context.isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", context.isOpen && "rotate-180")} />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectContent must be used within a Select component")
    }

    if (!context.isOpen) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-full z-50 w-full mt-1 rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className, disabled, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectItem must be used within a Select component")
    }

    const isSelected = context.value === value

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 disabled:pointer-events-none disabled:opacity-50",
          isSelected && "bg-blue-50 text-blue-900",
          className
        )}
        onClick={() => !disabled && context.onValueChange(value)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

const SelectValue = React.forwardRef<HTMLSpanElement, { placeholder?: string }>(
  ({ placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectValue must be used within a Select component")
    }

    return (
      <span
        ref={ref}
        className={cn(
          "block truncate",
          !context.value && "text-gray-500"
        )}
        {...props}
      >
        {context.value || placeholder}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } 