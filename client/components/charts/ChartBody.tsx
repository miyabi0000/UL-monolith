import React, { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import BarChartBody from './BarChartBody'
import ChartCenterOverlay from './ChartCenterOverlay'
import ActiveCalloutShape from './ActiveCalloutShape'
import GradientDefs, { grainFilterId } from './GradientDefs'
import { generateItemColor } from '../../utils/colorHelpers'
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

/** Pie レイアウトの共通パラメータ */
const CHART_CORNER_RADIUS = 0
const CHART_PAD_ANGLE = 0.018

/** activeIndex に hover と selected の両方を反映 (重複は排除) */
const combineActive = (hovered: number | null, selected: number | null): number[] | undefined => {
  const set = new Set<number>()
  if (selected !== null && selected >= 0) set.add(selected)
  if (hovered !== null && hovered >= 0) set.add(hovered)
  if (set.size === 0) return undefined
  return Array.from(set)
}

/**
 * 状態間の一貫性を保つための共通トークン。
 * 枠線は全状態で廃止し、選択は opacity のみで表現する。色は常にベースカラーのまま。
 */
const CELL_TOKENS = {
  opacityBase: 1,
  opacityDimmed: 0.55,
} as const

const cellTransition = {
  // 状態遷移は 0.5s ease (従来 0.45s を 10% 遅く)
  transition: 'opacity 0.5s ease, fill 0.5s ease',
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

  // 選択済みインデックス (activeShape で「大きく固定」するため)
  const dualOuterSelectedIdx =
    props.selectedCategories.length === 1
      ? outerData.findIndex((e) => e.label === props.selectedCategories[0])
      : -1
  const dualInnerSelectedIdx =
    chartFocus !== 'all' ? innerData.findIndex((e) => e.id === chartFocus) : -1
  const categorySelectedIdx = selectedCategoryName
    ? props.sortedData.findIndex((e) => e.name === selectedCategoryName)
    : -1
  const itemSelectedIdx = selectedItemId
    ? props.outerPieData.findIndex((e) => e.id === selectedItemId)
    : -1

  return (
    <div
      className="relative flex items-center justify-center p-2 flex-1"
      style={{ minHeight: geometry.chartHeight }}
    >
      {/* 独立した 0px SVG に <defs> を配置する。
       * Recharts の PieChart は内部的に children 種別を厳密に扱うため <defs> が
       * ドロップされるリスクがあり、同じドキュメント内に 1 回だけ <defs> があれば
       * fill="url(#id)" は解決できる (modern browsers は SVG ルート跨ぎの参照を許容)。 */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <GradientDefs />
      </svg>

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
                cornerRadius={CHART_CORNER_RADIUS}
                paddingAngle={CHART_PAD_ANGLE}
                activeShape={ActiveCalloutShape as any}
                activeIndex={combineActive(outerActiveIndex, dualOuterSelectedIdx)}
                onClick={(entry: DonutSegment) => props.onDualRingOuterClick(entry.id)}
                onMouseEnter={(_: DonutSegment, idx: number) => setOuterActiveIndex(idx)}
                onMouseLeave={() => setOuterActiveIndex(null)}
                className="cursor-pointer"
                isAnimationActive={false}
              >
                {outerData.map((entry, index) => {
                  const isSelected = props.selectedCategories.includes(entry.label)
                  // focus 中かつ非選択は dim、それ以外は常にベース
                  const opacity = isSelected
                    ? CELL_TOKENS.opacityBase
                    : hasFocus
                      ? CELL_TOKENS.opacityDimmed
                      : CELL_TOKENS.opacityBase
                  return (
                    <Cell
                      key={`dual-outer-${index}`}
                      fill={entry.color}
                      stroke="none"
                      opacity={opacity}
                      style={{ ...cellTransition, filter: `url(#${grainFilterId(index)})` }}
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
                cornerRadius={CHART_CORNER_RADIUS}
                paddingAngle={CHART_PAD_ANGLE}
                activeShape={ActiveCalloutShape as any}
                activeIndex={combineActive(innerActiveIndex, dualInnerSelectedIdx)}
                onClick={(entry: DonutSegment) => props.onInnerRingClick(entry.id)}
                onMouseEnter={(_: DonutSegment, idx: number) => setInnerActiveIndex(idx)}
                onMouseLeave={() => setInnerActiveIndex(null)}
                className="cursor-pointer"
                isAnimationActive={false}
              >
                {innerData.map((entry, index) => {
                  const isFocused = chartFocus === entry.id
                  const hasOther = chartFocus !== 'all' && chartFocus !== entry.id
                  const opacity = isFocused || !hasOther
                    ? CELL_TOKENS.opacityBase
                    : CELL_TOKENS.opacityDimmed
                  return (
                    <Cell
                      key={`dual-inner-${index}`}
                      fill={entry.color}
                      stroke="none"
                      opacity={opacity}
                      style={{
                        ...cellTransition,
                        filter: `url(#${grainFilterId(index)})`,
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
                  cornerRadius={CHART_CORNER_RADIUS}
                  paddingAngle={CHART_PAD_ANGLE}
                  activeShape={ActiveCalloutShape as any}
                  activeIndex={combineActive(outerActiveIndex, itemSelectedIdx)}
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
                  isAnimationActive={false}
                >
                  {props.outerPieData.map((item, index) => {
                    const isSelected = selectedItemId === item.id
                    const hasItemSelection = selectedItemId !== null
                    const color = generateItemColor(baseColor, index, itemCount)
                    const opacity = isSelected
                      ? CELL_TOKENS.opacityBase
                      : hasItemSelection
                        ? CELL_TOKENS.opacityDimmed
                        : CELL_TOKENS.opacityBase
                    return (
                      <Cell
                        key={`item-${index}`}
                        fill={color}
                        stroke="none"
                        opacity={opacity}
                        style={{
                          ...cellTransition,
                          filter: `url(#${grainFilterId(index)})`,
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
                cornerRadius={CHART_CORNER_RADIUS}
                paddingAngle={CHART_PAD_ANGLE}
                activeShape={ActiveCalloutShape as any}
                activeIndex={combineActive(innerActiveIndex, categorySelectedIdx)}
                onClick={(entry: SortedChartCategory) => props.onCategoryClick(entry.name)}
                onMouseEnter={(_: SortedChartCategory, idx: number) => setInnerActiveIndex(idx)}
                onMouseLeave={() => setInnerActiveIndex(null)}
                className="cursor-pointer"
                isAnimationActive={false}
              >
                {props.sortedData.map((entry, index) => {
                  const color = getCategoryColor(entry.name)
                  const isSelected = selectedCategoryName === entry.name
                  const opacity = isSelected
                    ? CELL_TOKENS.opacityBase
                    : hasCategorySelection
                      ? CELL_TOKENS.opacityDimmed
                      : CELL_TOKENS.opacityBase
                  return (
                    <Cell
                      key={`category-${entry.name}`}
                      fill={color}
                      stroke="none"
                      opacity={opacity}
                      style={{
                        ...cellTransition,
                        filter: `url(#${grainFilterId(index)})`,
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
