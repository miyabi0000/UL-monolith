import React from 'react'
import { ULClassification } from '../../utils/types'
import { COLORS, mondrian, BORDERS } from '../../utils/designSystem'
import { alpha } from '../../styles/tokens'
import { formatWeightLarge } from '../../utils/weightUnit'
import { useWeightUnit } from '../../contexts/WeightUnitContext'

interface ULStatusBadgeProps {
  classification: ULClassification
  baseWeight?: number
}

// De Stijl: UL = Blue (達成), LW = Yellow (警告), Trad = 黒枠グレー
const UL_STATUS_CONFIG = {
  ultralight:  { label: '⚡ UL',  color: COLORS.white,        bgColor: mondrian.blue },
  lightweight: { label: 'LW',     color: mondrian.black,      bgColor: alpha(mondrian.yellow, 0.4) },
  traditional: { label: 'Trad',   color: COLORS.text.primary, bgColor: COLORS.gray[200] }
} as const

const ULStatusBadge: React.FC<ULStatusBadgeProps> = ({ classification, baseWeight }) => {
  const config = UL_STATUS_CONFIG[classification]
  const { unit } = useWeightUnit()

  return (
    <span
      className="inline-flex items-center justify-center px-2 rounded-full text-xs font-bold"
      style={{
        height: 'var(--badge-h)',
        backgroundColor: config.bgColor,
        color: config.color,
        border: BORDERS.default,
      }}
      title={baseWeight ? `Base Weight: ${formatWeightLarge(baseWeight, unit)}` : undefined}
    >
      {config.label}
    </span>
  )
}

export default ULStatusBadge
