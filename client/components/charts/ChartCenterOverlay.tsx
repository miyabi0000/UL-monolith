import React from 'react'
import { COLORS } from '../../utils/designSystem'
import { alpha } from '../../styles/tokens'
import ChartCenterDisplay from './ChartCenterDisplay'
import type { ChartViewMode, ChartFocus, WeightBreakdown, ULStatus } from '../../utils/types'
import type { OuterPieEntry, SortedChartCategory } from '../../utils/chart/pipeline'
import { useChartGeometry } from './context/ChartGeometryContext'

interface ChartCenterOverlayProps {
  selectedItemData: OuterPieEntry | null
  selectedCategoryName: string | null
  selectedCategoryData: Pick<SortedChartCategory, 'value' | 'color' | 'percentage'> | null
  viewMode: ChartViewMode
  chartFocus: ChartFocus
  weightBreakdown?: WeightBreakdown | null
  ulStatus?: ULStatus | null
  totalValue: number
  isPulsing: boolean
  onClick: () => void
}

/**
 * 中央表示 (絶対配置のオーバーレイ) + クリック時の pulse アニメーション。
 */
const ChartCenterOverlay: React.FC<ChartCenterOverlayProps> = ({
  selectedItemData,
  selectedCategoryName,
  selectedCategoryData,
  viewMode,
  chartFocus,
  weightBreakdown,
  ulStatus,
  totalValue,
  isPulsing,
  onClick,
}) => {
  const { screenSize, centerMaxWidth, innerRadiusConfig } = useChartGeometry()
  return (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div
      className="text-center cursor-pointer pointer-events-auto flex flex-col items-center justify-center"
      style={{
        width:           innerRadiusConfig.inner * 2,
        height:          innerRadiusConfig.inner * 2,
        borderRadius:    '50%',
        transition:      'all 0.5s ease',
        backgroundColor: isPulsing ? alpha(COLORS.gray[800], 0.05) : 'transparent',
        transform:       isPulsing ? 'scale(1.05)' : 'scale(1)',
        boxShadow:       isPulsing ? `0 0 20px ${alpha(COLORS.gray[800], 0.3)}` : 'none',
      }}
      onClick={onClick}
    >
      <ChartCenterDisplay
        selectedItemData={selectedItemData}
        selectedCategoryFromChart={selectedCategoryName}
        selectedCategoryData={selectedCategoryData}
        viewMode={viewMode}
        screenSize={screenSize}
        centerMaxWidth={centerMaxWidth}
        chartFocus={chartFocus}
        weightBreakdown={weightBreakdown}
        ulStatus={ulStatus}
        totalValue={totalValue}
      />
    </div>
  </div>
  )
}

export default ChartCenterOverlay
