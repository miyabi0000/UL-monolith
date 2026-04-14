import React, { useState } from 'react'
import { PieChart, ResponsiveContainer } from 'recharts'
import BarChartBody from './BarChartBody'
import StandardPieBody from './StandardPieBody'
import DualRingPieBody from './DualRingPieBody'
import ChartCenterOverlay from './ChartCenterOverlay'
import type { BarItem } from './HorizontalBarChart'
import type { ChartViewMode, ChartFocus, DonutSegment, WeightBreakdown, ULStatus } from '../../utils/types'
import type { SortedChartCategory, OuterPieEntry } from '../../utils/chart/pipeline'
import { useChartGeometry } from './context/ChartGeometryContext'

interface ChartBodyProps {
  chartDisplayMode: 'pie' | 'bar'
  viewMode: ChartViewMode
  totalValue: number

  // 通常モード用
  sortedData: SortedChartCategory[]
  outerPieData: OuterPieEntry[]
  selectedCategory: SortedChartCategory | null
  selectedCategoryName: string | null
  selectedItemId: string | null
  barData: BarItem[]

  // weight-class モード用
  dualRingInnerData: DonutSegment[] | null
  dualRingOuterData: DonutSegment[] | null
  chartFocus: ChartFocus
  selectedCategories: string[]

  // 中央表示
  selectedItemData: OuterPieEntry | null
  centerPulse: boolean
  onCenterClick: () => void
  weightBreakdown?: WeightBreakdown | null
  ulStatus?: ULStatus | null

  // ハンドラ
  onCategoryClick: (name: string) => void
  onItemClick: (id: string) => void
  onItemHover?: (id: string | null) => void
  onInnerRingClick: (segmentId: string) => void
  onDualRingOuterClick: (segmentId: string) => void
  onClearCategorySelection: () => void
  hoveredItemId?: string | null
}

/**
 * チャート本体の orchestrator。
 * chartDisplayMode と viewMode の組み合わせで適切な body を選ぶ。
 * ジオメトリは ChartGeometryContext から取得。
 */
const ChartBody: React.FC<ChartBodyProps> = (props) => {
  const geometry = useChartGeometry()
  const [outerActiveIndex, setOuterActiveIndex] = useState<number | null>(null)
  const [innerActiveIndex, setInnerActiveIndex] = useState<number | null>(null)

  if (props.chartDisplayMode === 'bar') {
    return (
      <BarChartBody
        data={props.barData}
        totalValue={props.totalValue}
        viewMode={props.viewMode}
        selectedCategories={props.selectedCategories}
        selectedCategoryColor={props.selectedCategory?.color}
        selectedCategoryName={props.selectedCategoryName}
        onCategoryClick={props.onCategoryClick}
        onItemClick={props.onItemClick}
        onItemHover={props.onItemHover}
        hoveredItemId={props.hoveredItemId}
        onClearCategory={props.onClearCategorySelection}
      />
    )
  }

  const isClassMode = props.viewMode === 'weight-class' && props.dualRingInnerData && props.dualRingOuterData

  return (
    <div
      className="relative flex items-center justify-center p-2 flex-1"
      style={{ minHeight: geometry.chartHeight }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {isClassMode ? (
            <DualRingPieBody
              innerData={props.dualRingInnerData!}
              outerData={props.dualRingOuterData!}
              selectedCategories={props.selectedCategories}
              chartFocus={props.chartFocus}
              outerActiveIndex={outerActiveIndex}
              innerActiveIndex={innerActiveIndex}
              setOuterActiveIndex={setOuterActiveIndex}
              setInnerActiveIndex={setInnerActiveIndex}
              onInnerClick={props.onInnerRingClick}
              onOuterClick={props.onDualRingOuterClick}
            />
          ) : (
            <StandardPieBody
              sortedData={props.sortedData}
              outerPieData={props.outerPieData}
              selectedCategory={props.selectedCategory}
              selectedCategoryName={props.selectedCategoryName}
              selectedItemId={props.selectedItemId}
              outerActiveIndex={outerActiveIndex}
              innerActiveIndex={innerActiveIndex}
              setOuterActiveIndex={setOuterActiveIndex}
              setInnerActiveIndex={setInnerActiveIndex}
              onCategoryClick={props.onCategoryClick}
              onItemClick={props.onItemClick}
              onItemHover={props.onItemHover}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      <ChartCenterOverlay
        selectedItemData={props.selectedItemData}
        selectedCategoryName={props.selectedCategoryName}
        selectedCategoryData={
          props.selectedCategory
            ? {
                value:      props.selectedCategory.value,
                color:      props.selectedCategory.color,
                percentage: props.selectedCategory.percentage,
              }
            : null
        }
        viewMode={props.viewMode}
        chartFocus={props.chartFocus}
        weightBreakdown={props.weightBreakdown}
        ulStatus={props.ulStatus}
        totalValue={props.totalValue}
        isPulsing={props.centerPulse}
        onClick={props.onCenterClick}
      />
    </div>
  )
}

export default ChartBody
