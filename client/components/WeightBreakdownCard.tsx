import React from 'react'
import { WeightBreakdown, ULStatus, UL_THRESHOLDS, WEIGHT_CLASS_COLORS } from '../utils/types'
import { mondrian, BORDERS } from '../utils/designSystem'
import Card from './ui/Card'
import ULStatusBadge from './ui/ULStatusBadge'
import { formatWeight, formatWeightLarge } from '../utils/weightUnit'
import { useWeightUnit } from '../contexts/WeightUnitContext'

interface WeightBreakdownCardProps {
  breakdown: WeightBreakdown
  ulStatus: ULStatus
}

// SVGアイコンコンポーネント
const BackpackIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V10" />
    <path d="M9 20V14H15V20" />
    <path d="M5 10C5 7.79 6.79 6 9 6H15C17.21 6 19 7.79 19 10" />
    <path d="M9 6V4C9 3.45 9.45 3 10 3H14C14.55 3 15 3.45 15 4V6" />
    <path d="M12 10V12" />
  </svg>
)

const ShirtIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2.79V2C16 1.45 15.55 1 15 1H9C8.45 1 8 1.45 8 2V2.79L3.62 3.46C3.24 3.52 3 3.86 3 4.24V8L8 10V22C8 22.55 8.45 23 9 23H15C15.55 23 16 22.55 16 22V10L21 8V4.24C21 3.86 20.76 3.52 20.38 3.46Z" />
  </svg>
)

const UtensilsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2V11C3 12.1 3.9 13 5 13H6V22H8V13H9C10.1 13 11 12.1 11 11V2" />
    <path d="M7 2V8" />
    <path d="M17 2C17 2 21 3 21 8C21 13 17 14 17 14V22H15V14C15 14 11 13 11 8C11 3 15 2 15 2" />
  </svg>
)

const WEIGHT_CLASS_CONFIG = {
  base: { Icon: BackpackIcon, label: 'BASE', color: WEIGHT_CLASS_COLORS.base },
  worn: { Icon: ShirtIcon, label: 'WORN', color: WEIGHT_CLASS_COLORS.worn },
  consumable: { Icon: UtensilsIcon, label: 'CONS', color: WEIGHT_CLASS_COLORS.consumable }
} as const

const WeightBreakdownCard: React.FC<WeightBreakdownCardProps> = ({ breakdown, ulStatus }) => {
  const { unit } = useWeightUnit()

  const ulProgress = Math.min(100, (breakdown.baseWeight / UL_THRESHOLDS.ultralight) * 100)
  // Mondrian 配色: 達成=Blue, 警告=Yellow, 超過=Red
  const ulBarColor =
    ulProgress < 85  ? mondrian.blue
  : ulProgress < 100 ? mondrian.yellow
                     : mondrian.red

  return (
    <Card hover className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-900">
          WEIGHT BREAKDOWN
        </h3>
        <ULStatusBadge classification={ulStatus.classification} baseWeight={ulStatus.baseWeight} />
      </div>

      {/* Weight Class Cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Base */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50">
          <BackpackIcon className="w-5 h-5 text-gray-500 mb-1" />
          <span className="text-2xs font-medium text-gray-500">
            {WEIGHT_CLASS_CONFIG.base.label}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatWeight(breakdown.baseWeight, unit)}
          </span>
        </div>

        {/* Worn */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-100">
          <ShirtIcon className="w-5 h-5 text-gray-500 mb-1" />
          <span className="text-2xs font-medium text-gray-500">
            {WEIGHT_CLASS_CONFIG.worn.label}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatWeight(breakdown.wornWeight, unit)}
          </span>
        </div>

        {/* Consumable */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-100">
          <UtensilsIcon className="w-5 h-5 text-gray-500 mb-1" />
          <span className="text-2xs font-medium text-gray-500">
            {WEIGHT_CLASS_CONFIG.consumable.label}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatWeight(breakdown.consumables, unit)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-200 my-2" />

      {/* Summary Stats */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Packed Weight</span>
          <span className="font-medium text-gray-900">
            {formatWeight(breakdown.packedWeight, unit)}
            <span className="text-2xs text-gray-400 ml-1">(Base + Cons)</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Skin-out Weight</span>
          <span className="font-medium text-gray-900">
            {formatWeight(breakdown.skinOutWeight, unit)}
            <span className="text-2xs text-gray-400 ml-1">(All)</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Big3</span>
          <span className="font-medium text-gray-700">
            {formatWeight(breakdown.big3, unit)}
            <span className="text-2xs text-gray-400 ml-1">(Pack+Shelter+Sleep)</span>
          </span>
        </div>
      </div>

      {/* UL Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-2xs text-gray-500">
            Base Weight: {formatWeightLarge(breakdown.baseWeight, unit)}
          </span>
          <span className="text-2xs text-gray-500">
            {Math.round(ulProgress)}% of UL limit
          </span>
        </div>
        <div
          className="w-full h-2 overflow-hidden"
          style={{ background: 'var(--surface-level-2)', border: BORDERS.default }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: ulBarColor,
              width: `${ulProgress}%`
            }}
          />
        </div>
        <div className="text-3xs text-gray-400 mt-0.5 text-right">
          UL limit: {formatWeightLarge(UL_THRESHOLDS.ultralight, unit)}
        </div>
      </div>
    </Card>
  )
}

export default WeightBreakdownCard
