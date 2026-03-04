import React from 'react'
import { ULClassification } from '../../utils/types'
import { STATUS_TONES, COLORS } from '../../utils/designSystem'
import { alpha } from '../../styles/tokens'

interface ULStatusBadgeProps {
  classification: ULClassification
  baseWeight?: number
}

const UL_STATUS_CONFIG = {
  ultralight: { label: '⚡ UL', color: STATUS_TONES.success.text, bgColor: STATUS_TONES.success.background },
  lightweight: { label: 'LW', color: STATUS_TONES.warning.text, bgColor: STATUS_TONES.warning.background },
  traditional: { label: 'Trad', color: COLORS.gray[500], bgColor: alpha(COLORS.gray[500], 0.08) }
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
