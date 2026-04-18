import React, { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import BarChartBody from './BarChartBody'
import ChartCenterOverlay from './ChartCenterOverlay'
import ActiveCalloutShape from './ActiveCalloutShape'
import { darkenColor, darkenHslColor, generateItemColor } from '../../utils/colorHelpers'
import { COLORS, getCategoryColor } from '../../utils/designSystem'
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

const DEFAULT_COLOR = COLORS.gray[500]

const cellTransition = {
  transition: 'all 0.2s ease',
  outline: 'none',
  cursor: 'pointer',
} as const

/**
 * チャート本体の orchestrator。
 *
 * recharts v2 の `PieChart` は `findAllByType(children, Pie)` で直接子の
 * displayName/name === 'Pie' だけを検出する（カスタム wrapper は透過しない）
 * ため、Pie / Cell はここに直書きする。wrapper で包むと pie が発見されず
 * SVG が空のまま描画される。
 */
const ChartBody: React.FC<ChartBodyProps> = (props) => {
  const geometry = useChartGeometry()
  const { outerRadiusConfig, innerRadiusConfig } = geometry
  const [outerActiveIndex, setOuterActiveIndex] = useState<number | null>(null)
  const [innerActiveIndex, setInnerActiveIndex] = useState<number | null>(null)

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

  // weight-class 用 (二重ドーナツ)
  const hasFocus = chartFocus !== 'all'
  const innerData = props.dualRingInnerData ?? []
  const outerData = props.dualRingOuterData ?? []

  // 標準モード用
  const hasCategorySelection = selectedCategoryName !== null
  const baseColor = props.selectedCategory?.color ?? DEFAULT_COLOR
  const itemCount = props.selectedCategory?.sortedItems?.length ?? 1

  return (
    <div
      className="relative flex items-center justify-center p-2 flex-1"
      style={{ minHeight: geometry.chartHeight }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {isClassMode ? (
            <>
              {/* 外輪: カテゴリ or Big3 内訳 */}
              <Pie
                data={outerData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={outerRadiusConfig.outer}
                innerRadius={outerRadiusConfig.inner}
                activeShape={ActiveCalloutShape as any}
                activeIndex={outerActiveIndex ?? undefined}
                onClick={(entry: DonutSegment) => props.onDualRingOuterClick(entry.id)}
                onMouseEnter={(_: DonutSegment, idx: number) => setOuterActiveIndex(idx)}
                onMouseLeave={() => setOuterActiveIndex(null)}
                className="cursor-pointer"
              >
                {outerData.map((entry, index) => {
                  const isSelected = props.selectedCategories.includes(entry.label)
                  const darkFill = darkenColor(entry.color, 0.15)
                  const baseOpacity = hasFocus ? 0.5 : 0.7
                  return (
                    <Cell
                      key={`dual-outer-${index}`}
                      fill={isSelected ? darkFill : entry.color}
                      stroke={COLORS.white}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={isSelected ? 0.95 : baseOpacity}
                      style={cellTransition}
                    />
                  )
                })}
              </Pie>
              {/* 内輪: Big3 / Other */}
              <Pie
                data={innerData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={innerRadiusConfig.outer}
                innerRadius={innerRadiusConfig.inner}
                activeShape={ActiveCalloutShape as any}
                activeIndex={innerActiveIndex ?? undefined}
                onClick={(entry: DonutSegment) => props.onInnerRingClick(entry.id)}
                onMouseEnter={(_: DonutSegment, idx: number) => setInnerActiveIndex(idx)}
                onMouseLeave={() => setInnerActiveIndex(null)}
                className="cursor-pointer"
              >
                {innerData.map((entry, index) => {
                  const isFocused = chartFocus === entry.id
                  const hasOther = chartFocus !== 'all' && chartFocus !== entry.id
                  const darkFill = darkenColor(entry.color, 0.25)
                  return (
                    <Cell
                      key={`dual-inner-${index}`}
                      fill={isFocused ? darkFill : entry.color}
                      stroke={isFocused ? darkFill : COLORS.white}
                      strokeWidth={isFocused ? 3 : 2}
                      opacity={isFocused || !hasOther ? 1 : 0.35}
                      style={{
                        ...cellTransition,
                        filter: isFocused ? `drop-shadow(0 0 8px ${entry.color}aa)` : 'none',
                      }}
                    />
                  )
                })}
              </Pie>
            </>
          ) : (
            <>
              {/* 外側円: 選択カテゴリのアイテム (先に描画して背面配置) */}
              {selectedCategoryName && (
                <Pie
                  data={props.outerPieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={outerRadiusConfig.outer}
                  innerRadius={outerRadiusConfig.inner}
                  activeShape={ActiveCalloutShape as any}
                  activeIndex={outerActiveIndex ?? undefined}
                  onClick={(entry: OuterPieEntry) => props.onItemClick(entry.id)}
                  onMouseEnter={(entry: OuterPieEntry, idx: number) => {
                    setOuterActiveIndex(idx)
                    props.onItemHover?.(entry?.id ?? null)
                  }}
                  onMouseLeave={() => {
                    setOuterActiveIndex(null)
                    props.onItemHover?.(null)
                  }}
                  className="cursor-pointer"
                >
                  {props.outerPieData.map((item, index) => {
                    const isSelected = selectedItemId === item.id
                    const color = generateItemColor(baseColor, index, itemCount)
                    const darkFill = darkenHslColor(color, 0.2)
                    const darkStroke = darkenColor(baseColor, 0.2)
                    return (
                      <Cell
                        key={`item-${index}`}
                        fill={isSelected ? darkFill : color}
                        stroke={isSelected ? darkStroke : COLORS.white}
                        strokeWidth={isSelected ? 2 : 1}
                        opacity={isSelected ? 1 : 0.85}
                        style={{
                          ...cellTransition,
                          filter: isSelected ? `drop-shadow(0 0 6px ${darkStroke}99)` : 'none',
                        }}
                      />
                    )
                  })}
                </Pie>
              )}
              {/* 内側円: カテゴリ (最後に描画して前面配置) */}
              <Pie
                data={props.sortedData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={innerRadiusConfig.outer}
                innerRadius={innerRadiusConfig.inner}
                activeShape={ActiveCalloutShape as any}
                activeIndex={innerActiveIndex ?? undefined}
                onClick={(entry: SortedChartCategory) => props.onCategoryClick(entry.name)}
                onMouseEnter={(_: SortedChartCategory, idx: number) => setInnerActiveIndex(idx)}
                onMouseLeave={() => setInnerActiveIndex(null)}
                className="cursor-pointer"
              >
                {props.sortedData.map((entry) => {
                  const color = getCategoryColor(entry.name)
                  const isSelected = selectedCategoryName === entry.name
                  const darkFill = darkenColor(color, 0.15)
                  const darkStroke = darkenColor(color, 0.2)
                  return (
                    <Cell
                      key={`category-${entry.name}`}
                      fill={isSelected ? darkFill : color}
                      stroke={isSelected ? darkStroke : COLORS.white}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={hasCategorySelection && !isSelected ? 0.4 : 1}
                      style={{
                        ...cellTransition,
                        filter: isSelected ? `drop-shadow(0 0 6px ${darkStroke}99)` : 'none',
                      }}
                    />
                  )
                })}
              </Pie>
            </>
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
