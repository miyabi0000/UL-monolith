import React from 'react'
import { ProcurementStatus } from '../../utils/types'
import { STATUS_TONES } from '../../utils/designSystem'

interface StatusBadgeProps {
  status: ProcurementStatus
  compact?: boolean
}

const STATUS_CONFIG = {
  owned: { color: STATUS_TONES.success.text, bgColor: STATUS_TONES.success.background, icon: '✓', label: 'Owned' },
  partial: { color: STATUS_TONES.warning.text, bgColor: STATUS_TONES.warning.background, icon: '◐', label: 'Partial' },
  need: { color: STATUS_TONES.error.text, bgColor: STATUS_TONES.error.background, icon: '!', label: 'Need' }
} as const

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const config = STATUS_CONFIG[status]

  if (compact) {
    return (
      <span
        className="status-priority-token"
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
