import React from 'react'
import { ChartViewMode, WeightBreakdown, ChartFocus } from '../../utils/types'
import SegmentedControl from '../ui/SegmentedControl'
import WeightUnitToggle from '../ui/WeightUnitToggle'
import ScaleIcon from '../icons/ScaleIcon'
import YenIcon from '../icons/YenIcon'
import BackpackIcon from '../icons/BackpackIcon'
import { useWeightUnit } from '../../contexts/WeightUnitContext'
import { formatWeight, formatWeightLarge } from '../../utils/weightUnit'

const VIEW_MODE_OPTIONS = [
  { mode: 'weight', label: 'Weight', icon: ScaleIcon },
  { mode: 'cost', label: 'Cost', icon: YenIcon },
  { mode: 'weight-class', label: 'Class', icon: BackpackIcon }
] as const

interface SummaryStatCardProps {
  label: string
  value: string
  subValue?: string
  icon?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

const SummaryStatCard: React.FC<SummaryStatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  isActive = false,
  onClick,
}) => {
  const cardClass = `flex flex-col items-center justify-center px-1 py-2 rounded-md transition-all duration-200 ${
    isActive
      ? 'bg-gray-200 dark:bg-gray-600 ring-1 ring-gray-400 dark:ring-gray-500'
      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
  }`

  const content = (
    <>
      <div className="flex items-center gap-1.5 mb-1 leading-none">
        {icon}
        <span className="text-2xs leading-none font-medium text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-xs leading-none font-bold text-gray-900 dark:text-gray-100">{value}</span>
      {subValue && <span className="text-3xs leading-none mt-1 text-gray-500 dark:text-gray-400">{subValue}</span>}
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className={cardClass}>
        {content}
      </button>
    )
  }

  return <div className={cardClass}>{content}</div>
}

export interface ChartSummaryFooterProps {
  viewMode: ChartViewMode
  onViewModeChange: (mode: ChartViewMode) => void
  weightBreakdown?: WeightBreakdown | null
  weightClassSummaryCards: Array<{ key: string; label: string; value: number; focus: ChartFocus }>
  chartFocus: ChartFocus
  onToggleChartFocus: (focus: ChartFocus) => void
  totalWeight: number
  totalCost: number
  itemCount: number
}

const ChartSummaryFooter: React.FC<ChartSummaryFooterProps> = ({
  viewMode,
  onViewModeChange,
  weightBreakdown,
  weightClassSummaryCards,
  chartFocus,
  onToggleChartFocus,
  totalWeight,
  totalCost,
  itemCount
}) => {
  const { unit } = useWeightUnit()
  return (
    <div className="px-2 py-1.5 neu-divider">
      {/* Weight/Cost/Class と g/oz を同一 Y 軸 (1 行) に配置。
       * justify-between で左右に振り分け、items-center でベースラインも揃える */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <SegmentedControl
          options={VIEW_MODE_OPTIONS.map(({ mode, label, icon: Icon }) => ({
            key: mode,
            onClick: () => onViewModeChange(mode),
            isActive: viewMode === mode,
            ariaLabel: `${label} mode`,
            label: (
              <>
                <Icon className="w-3 h-3" />
                {label}
              </>
            ),
          }))}
        />
        <WeightUnitToggle />
      </div>

      <div>
        {viewMode === 'weight-class' && weightBreakdown ? (
          <div className="grid grid-cols-4 gap-1">
            {weightClassSummaryCards.map(card => (
              <SummaryStatCard
                key={card.key}
                label={card.label}
                value={formatWeight(card.value, unit)}
                isActive={chartFocus === card.focus}
                onClick={() => onToggleChartFocus(card.focus)}
              />
            ))}
          </div>
      ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <SummaryStatCard
              label="Weight"
              value={formatWeight(totalWeight, unit)}
              subValue={formatWeightLarge(totalWeight, unit)}
              isActive={viewMode === 'weight'}
              icon={<ScaleIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />}
            />
            <SummaryStatCard
              label="Price"
              value={`¥${Math.round(totalCost / 100).toLocaleString()}`}
              subValue={`${itemCount} items`}
              isActive={viewMode === 'cost'}
              icon={<YenIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />}
            />
          </div>
      )}
      </div>
    </div>
  )
}

export default ChartSummaryFooter
