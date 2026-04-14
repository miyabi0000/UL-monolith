import React from 'react'
import HorizontalBarChart, { type BarItem } from './HorizontalBarChart'
import type { ChartViewMode } from '../../utils/types'

interface BarChartBodyProps {
  data: BarItem[]
  totalValue: number
  viewMode: ChartViewMode
  selectedCategories: string[]
  selectedCategoryColor?: string
  selectedCategoryName?: string | null
  onCategoryClick: (name: string) => void
  onItemClick?: (id: string) => void
  onItemHover?: (id: string | null) => void
  hoveredItemId?: string | null
  /** カテゴリ drill-down 解除 */
  onClearCategory: () => void
}

/**
 * Bar チャート本体。
 * カテゴリ drill-down 中はブレッドクラムで解除可能。
 */
const BarChartBody: React.FC<BarChartBodyProps> = ({
  data,
  totalValue,
  viewMode,
  selectedCategories,
  selectedCategoryColor,
  selectedCategoryName,
  onCategoryClick,
  onItemClick,
  onItemHover,
  hoveredItemId,
  onClearCategory,
}) => (
  <div className="flex-1 flex flex-col overflow-y-auto">
    {selectedCategoryName && (
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-0">
        <button
          type="button"
          onClick={onClearCategory}
          className="flex items-center gap-0.5 text-2xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          All
        </button>
        <span className="text-2xs text-gray-400 dark:text-gray-500">/</span>
        <span className="text-2xs font-medium truncate" style={{ color: selectedCategoryColor }}>
          {selectedCategoryName}
        </span>
      </div>
    )}
    <div className="flex-1 w-full px-3 py-2 flex flex-col justify-center">
      <HorizontalBarChart
        data={data}
        totalValue={totalValue}
        viewMode={viewMode}
        selectedCategories={selectedCategories}
        onCategoryClick={onCategoryClick}
        onItemClick={onItemClick}
        onItemHover={onItemHover}
        hoveredItemId={hoveredItemId ?? null}
      />
    </div>
  </div>
)

export default BarChartBody
