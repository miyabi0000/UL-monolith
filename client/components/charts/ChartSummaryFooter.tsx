import React from 'react'
import { ChartViewMode, WeightBreakdown, ChartFocus } from '../../utils/types'
import SegmentedControl from '../ui/SegmentedControl'
import WeightUnitToggle from '../ui/WeightUnitToggle'
import CurrencyToggle from '../ui/CurrencyToggle'
import ScaleIcon from '../icons/ScaleIcon'
import YenIcon from '../icons/YenIcon'
import BackpackIcon from '../icons/BackpackIcon'
import { useWeightUnit } from '../../contexts/WeightUnitContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { formatWeight } from '../../utils/weightUnit'
import { formatPriceWithCurrency } from '../../utils/formatters'

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
  wide?: boolean
  onClick?: () => void
}

const SummaryStatCard: React.FC<SummaryStatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  isActive = false,
  wide = false,
  onClick,
}) => {
  const cardClass = `flex items-center justify-center gap-3 rounded-md transition-all duration-200 ${
    wide ? 'px-5 py-2' : 'flex-col px-1 py-2'
  } ${
    isActive
      ? 'bg-gray-200 dark:bg-gray-600 ring-1 ring-gray-400 dark:ring-gray-500'
      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
  }`

  const content = wide ? (
    <>
      <div className="flex items-center gap-1.5 leading-none">
        {icon}
        <span className="text-2xs leading-none font-medium text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-sm leading-none font-bold text-gray-900 dark:text-gray-100">{value}</span>
      {subValue && <span className="text-2xs leading-none text-gray-500 dark:text-gray-400">{subValue}</span>}
    </>
  ) : (
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
  const { currency } = useCurrency()
  return (
    <div className="px-2 py-1.5 border-b border-gray-200">
      {/* view-mode toggle は中央、右端は viewMode に応じて g/oz or ¥/$ を出し分け */}
      <div className="grid grid-cols-3 items-center mb-1.5">
        <div />
        <div className="justify-self-center">
          <SegmentedControl
            shape="square"
            options={VIEW_MODE_OPTIONS.map(({ mode, label, icon: Icon }) => ({
              key: mode,
              onClick: () => onViewModeChange(mode),
              isActive: viewMode === mode,
              ariaLabel: `${label} mode`,
              title: label,
              label: <Icon className="w-4 h-4" />,
            }))}
          />
        </div>
        <div className="justify-self-end">
          {viewMode === 'cost' ? <CurrencyToggle /> : <WeightUnitToggle />}
        </div>
      </div>

      {/* viewMode に応じて表示する card を切替。
       * weight → Weight 1枚、cost → Price 1枚、weight-class → 4枚グリッド */}
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
        ) : viewMode === 'cost' ? (
          <div className="flex justify-center">
            <SummaryStatCard
              label="Price"
              value={formatPriceWithCurrency(totalCost, currency)}
              subValue={`${itemCount} items`}
              isActive
              wide
              icon={<YenIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <SummaryStatCard
              label="Weight"
              value={`${(totalWeight / 1000).toFixed(3)} kg`}
              subValue={`${totalWeight}g`}
              isActive
              wide
              icon={<ScaleIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartSummaryFooter
