import React from 'react'
import { ULClassification } from '../../utils/types'

interface ULStatusBadgeProps {
  classification: ULClassification
  baseWeight?: number
}

const UL_STATUS_CONFIG = {
  ultralight: { label: '⚡ UL', color: '#10B981', bgColor: '#D1FAE5' },
  lightweight: { label: 'LW', color: '#F59E0B', bgColor: '#FEF3C7' },
  traditional: { label: 'Trad', color: '#6B7280', bgColor: '#F3F4F6' }
} as const

const ULStatusBadge: React.FC<ULStatusBadgeProps> = ({ classification, baseWeight }) => {
  const config = UL_STATUS_CONFIG[classification]

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: config.bgColor, color: config.color }}
      title={baseWeight ? `Base Weight: ${(baseWeight / 1000).toFixed(2)}kg` : undefined}
    >
      {config.label}
    </span>
  )
}

export default ULStatusBadge
