import React, { useState } from 'react'
import { PieChart, ResponsiveContainer } from 'recharts'
import BarChartBody from './BarChartBody'
import StandardPieBody from './StandardPieBody'
import DualRingPieBody from './DualRingPieBody'
import ChartCenterOverlay from './ChartCenterOverlay'
import type { BarItem } from './HorizontalBarChart'
import type { ChartViewMode, DonutSegment, WeightBreakdown, ULStatus } from '../../utils/types'
import type { SortedChartCategory, OuterPieEntry } from '../../utils/chart/pipeline'
import type { ChartSelection } from '../../utils/chart/chartTypes'
import { useChartGeometry } from './context/ChartGeometryContext'

interface ChartBodyProps {
  chartDisplayMode: 'pie' | 'bar'
  viewMode: ChartViewMode
  totalValue: number

  /** Chart の選択状態 (3 系統の散在 state を集約した union) */
  selection: ChartSelection
  /** 親が保持するカテゴリフィルタ (Bar / Pie の highlight 用) */
  selectedCategories: string[]

  // データ
  sortedData: SortedChartCategory[]
  outerPieData: OuterPieEntry[]
  selectedCategory: SortedChartCategory | null
  barData: BarItem[]
  dualRingInnerData: DonutSegment[] | null
  dualRingOuterData: DonutSegment[] | null

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
 *
 * 選択状態は ChartSelection union で受け取り、内部で各子コンポーネントが
 * 必要とする legacy 値 (selectedCategoryName / selectedItemId / chartFocus) に
 * 派生させる。
 */
const ChartBody: React.FC<ChartBodyProps> = (props) => {
  const geometry = useChartGeometry()
  const [outerActiveIndex, setOuterActiveIndex] = useState<number | null>(null)
  const [innerActiveIndex, setInnerActiveIndex] = useState<number | null>(null)

  // ChartSelection union → 子コンポーネント用の派生値
  const { selection } = props
  const selectedCategoryName =
    selection.kind === 'category' || selection.kind === 'item' ? selection.categoryName : null
  const selectedItemId = selection.kind === 'item' ? selection.itemId : null
  const chartFocus = selection.kind === 'classFocus' ? selection.focus : 'all'

  if (props.chartDisplayMode === 'bar') {
    return (
      <BarChartBody
        data={props.barData}
        totalValue={props.totalValue}
        viewMode={props.viewMode}
        selectedCategories={props.selectedCategories}
        selectedCategoryColor={props.selectedCategory?.color}
        selectedCategoryName={selectedCategoryName}
        onCategoryClick={props.onCategoryClick}
        onItemClick={props.onItemClick}
        onItemHover={props.onItemHover}
        hoveredItemId={props.hoveredItemId}
        onClearCategory={props.onClearCategorySelection}
      />
    )
  }

  const isClassMode =
    props.viewMode === 'weight-class' && props.dualRingInnerData && props.dualRingOuterData

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
              chartFocus={chartFocus}
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
              selectedCategoryName={selectedCategoryName}
              selectedItemId={selectedItemId}
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
        selectedCategoryName={selectedCategoryName}
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
        chartFocus={chartFocus}
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
