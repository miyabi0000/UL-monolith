import React from 'react'

export interface SegmentedOption {
  key: string
  label: React.ReactNode
  onClick: () => void
  isActive: boolean
  isDisabled?: boolean
  title?: string
  ariaLabel?: string
  activeClassName?: string
  inactiveClassName?: string
  disabledClassName?: string
}

interface SegmentedControlProps {
  options: SegmentedOption[]
  className?: string
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, className = '' }) => (
  <div className={`inline-flex items-center gap-1 ${className}`}>
    {options.map((option) => {
      const activeClass = option.activeClassName ?? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 shadow-sm'
      const inactiveClass = option.inactiveClassName ?? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100'
      const disabledClass = option.disabledClassName ?? 'text-gray-300 dark:text-gray-500 cursor-not-allowed'
      const stateClass = option.isDisabled ? disabledClass : option.isActive ? activeClass : inactiveClass

      return (
        <button
          key={option.key}
          onClick={option.onClick}
          disabled={option.isDisabled}
          title={option.title}
          aria-label={option.ariaLabel}
          className={`gear-glass-chip h-6 px-2 rounded-md text-2xs font-medium transition-all duration-200 inline-flex items-center gap-1 ${stateClass}`}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

export default SegmentedControl
