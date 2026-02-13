import React from 'react'
import { ProcurementStatus } from '../../utils/types'

interface StatusBadgeProps {
  status: ProcurementStatus
  compact?: boolean
}

const STATUS_CONFIG = {
  owned: { color: '#10B981', bgColor: '#D1FAE5', icon: '✓', label: 'Owned' },
  partial: { color: '#F59E0B', bgColor: '#FEF3C7', icon: '◐', label: 'Partial' },
  need: { color: '#EF4444', bgColor: '#FEE2E2', icon: '!', label: 'Need' }
} as const

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const config = STATUS_CONFIG[status]

  if (compact) {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
        style={{ backgroundColor: config.bgColor, color: config.color }}
        title={config.label}
      >
        {config.icon}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  )
}

export default StatusBadge
