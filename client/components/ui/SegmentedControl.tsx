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
  /** shape='square' で各オプションを正方形 (W=H=--control-h) にする (g/oz 等の 1-2 文字向け) */
  shape?: 'rect' | 'square'
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, className = '', shape = 'rect' }) => {
  const isSquare = shape === 'square'
  const sizeStyle: React.CSSProperties = isSquare
    ? { height: 'var(--control-h)', width: 'var(--control-h)' }
    : { height: 'var(--control-h)' }
  const sizeClass = isSquare
    ? 'px-0 rounded-md text-xs font-medium transition-all duration-200 inline-flex items-center justify-center'
    : 'px-3 rounded-md text-xs font-medium transition-all duration-200 inline-flex items-center gap-1'

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {options.map((option) => {
        const activeClass = option.activeClassName ?? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm'
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
            className={`gear-glass-chip ${sizeClass} ${stateClass}`}
            style={sizeStyle}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
