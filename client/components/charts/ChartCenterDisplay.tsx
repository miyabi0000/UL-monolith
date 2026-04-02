import React from 'react'
import { ChartViewMode, ChartFocus, WeightBreakdown, ULStatus, UL_THRESHOLDS, DUAL_RING_COLORS } from '../../utils/types'
import { COLORS } from '../../utils/designSystem'
import { FONT_SIZES, UL_BADGE_COLORS, formatValue } from '../../utils/chartConfig'

const DEFAULT_COLOR = COLORS.gray[500]

type OuterPieDataItem = {
  id: string
  name: string
  value: number
  color: string
  brand?: string
  percentage: number
}

type SelectedCategoryInfo = {
  value: number
  color: string
  percentage: number
}

interface ChartCenterDisplayProps {
  selectedItemData: OuterPieDataItem | null
  selectedCategoryFromChart: string | null
  selectedCategoryData: SelectedCategoryInfo | null
  viewMode: ChartViewMode
  screenSize: 'mobile' | 'tablet' | 'desktop'
  centerMaxWidth: number
  chartFocus: ChartFocus
  weightBreakdown?: WeightBreakdown | null
  ulStatus?: ULStatus | null
  totalValue: number
}

const ChartCenterDisplay: React.FC<ChartCenterDisplayProps> = ({
  selectedItemData,
  selectedCategoryFromChart,
  selectedCategoryData,
  viewMode,
  screenSize,
  centerMaxWidth,
  chartFocus,
  weightBreakdown,
  ulStatus,
  totalValue
}) => {
  if (selectedItemData) {
    return (
      <>
        <div
          className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
          }}
        >
          {formatValue(selectedItemData.value, viewMode)}
        </div>
        <div
          className="font-semibold mb-0.5 px-1 text-center overflow-hidden"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop,
            color: selectedItemData.color,
            maxWidth: centerMaxWidth - 16,
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}
          title={selectedItemData.name}
        >
          {selectedItemData.name}
        </div>
        {selectedItemData.brand && (
          <div
            className="text-gray-500 dark:text-gray-400 mb-0.5 px-1 text-center overflow-hidden"
            style={{
              fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop,
              maxWidth: centerMaxWidth - 16,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}
            title={selectedItemData.brand}
          >
            {selectedItemData.brand}
          </div>
        )}
        <div
          className="text-gray-500 dark:text-gray-400"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
          }}
        >
          {selectedItemData.percentage}% of total
        </div>
      </>
    )
  }

  if (selectedCategoryFromChart && selectedCategoryData) {
    return (
      <>
        <div
          className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
          }}
        >
          {formatValue(selectedCategoryData.value, viewMode)}
        </div>
        <div
          className="uppercase tracking-wide font-bold mb-1"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop,
            color: selectedCategoryData.color
          }}
        >
          {selectedCategoryFromChart}
        </div>
        <div
          className="text-gray-500 dark:text-gray-400"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
          }}
        >
          {selectedCategoryData.percentage}% of total
        </div>
      </>
    )
  }

  if (viewMode === 'weight-class' && weightBreakdown && ulStatus) {
    const ulProgress = Math.min(100, (weightBreakdown.baseWeight / UL_THRESHOLDS.ultralight) * 100)
    const ulBadgeColor = UL_BADGE_COLORS[ulStatus.classification]
    const ulBadgeLabel = ulStatus.classification === 'ultralight'
      ? 'UL'
      : ulStatus.classification === 'lightweight'
        ? 'LW'
        : 'Trad'

    const otherWeight = weightBreakdown.baseWeight - weightBreakdown.big3
    const displayWeight = chartFocus === 'big3'
      ? weightBreakdown.big3
      : chartFocus === 'other'
        ? otherWeight
        : weightBreakdown.baseWeight
    const displayLabel = chartFocus === 'big3'
      ? 'BIG3'
      : chartFocus === 'other'
        ? 'OTHER'
        : 'BASE WEIGHT'
    const displayColor = chartFocus === 'big3'
      ? DUAL_RING_COLORS.big3
      : chartFocus === 'other'
        ? DUAL_RING_COLORS.other
        : undefined

    return (
      <>
        <div
          className="font-bold mb-0.5"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop,
            color: displayColor || 'inherit'
          }}
        >
          {(displayWeight / 1000).toFixed(2)}kg
        </div>
        <div
          className="uppercase tracking-wide font-bold mb-1"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop,
            color: displayColor || DEFAULT_COLOR
          }}
        >
          {displayLabel}
        </div>
        {chartFocus === 'all' && (
          <>
            <span
              className="px-1.5 py-0.5 rounded-full text-white font-bold"
              style={{
                fontSize: screenSize === 'mobile' ? FONT_SIZES.badge.mobile : FONT_SIZES.badge.desktop,
                backgroundColor: ulBadgeColor
              }}
            >
              {ulBadgeLabel}
            </span>
            <div
              className="text-gray-400 dark:text-gray-500 mt-0.5"
              style={{
                fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
              }}
            >
              {Math.round(ulProgress)}% of UL
            </div>
          </>
        )}
        {chartFocus !== 'all' && (
          <div
            className="text-gray-400 dark:text-gray-500 mt-0.5"
            style={{
              fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
            }}
          >
            {weightBreakdown.baseWeight > 0
              ? Math.round((displayWeight / weightBreakdown.baseWeight) * 100)
              : 0}% of Base
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div
        className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
        style={{
          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
        }}
      >
        {formatValue(totalValue, viewMode)}
      </div>
      <div
        className="uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400"
        style={{
          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop
        }}
      >
        {viewMode === 'cost' ? 'TOTAL COST' : 'TOTAL WEIGHT'}
      </div>
    </>
  )
}

export default ChartCenterDisplay
