import React, { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import BarChartBody from './BarChartBody'
import ChartCenterOverlay from './ChartCenterOverlay'
import ActiveCalloutShape from './ActiveCalloutShape'
import GradientDefs, { grainFilterId } from './GradientDefs'
import { CHART_CELL_TRANSITION, CHART_OPACITY_BASE, CHART_OPACITY_DIMMED } from './chartTokens'
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

/**
 * activeIndex のリゾルバ。hover を selected より優先する。
 *
 * この優先順位により:
 *  - 未選択でホバー → ホバー先が bulge (プレビュー)
 *  - 選択中でホバーなし → 選択セクターが bulge 固定
 *  - 選択中に別セクターをホバー → ホバー先が bulge、mouse leave で選択に戻る
 *  - 同じセクターをホバー + 選択 → そのセクターだけ bulge
 *
 * 従来の [hovered, selected] 同時返却は 2 つの bulge が並ぶ視覚競合を
 * 生んでいたため、単一 index に統一して解消する。
 */
const chooseActive = (hovered: number | null, selected: number | null): number | undefined => {
  if (hovered !== null && hovered >= 0) return hovered
  if (selected !== null && selected >= 0) return selected
  return undefined
}

const cellTransition = {
  transition: CHART_CELL_TRANSITION,
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

  // Pie ごとの hover state (マウス中のセクター index)。
  //   outer = weight-class の外輪 / 標準モードの items
  //   inner = weight-class の内輪 (big3) / 標準モードの categories
  const [outerActiveIndex, setOuterActiveIndex] = useState<number | null>(null)
  const [innerActiveIndex, setInnerActiveIndex] = useState<number | null>(null)

  const { selection } = props
  const selectedCategoryName =
    selection.kind === 'category' || selection.kind === 'item' ? selection.categoryName : null
  const selectedItemId = selection.kind === 'item' ? selection.itemId : null
  const chartFocus = selection.kind === 'classFocus' ? selection.focus : 'all'

  // selection / viewMode の変化で Pie のデータ長・意味が変わるため、
  // hover state をクリアしてインデックスの古参照を断つ。
  // (例: Clothing 選択解除で items Pie が unmount → outerActiveIndex が
  //  消えたアイテムの古い index を指し続けるのを防ぐ)
  useEffect(() => {
    setOuterActiveIndex(null)
    setInnerActiveIndex(null)
  }, [selection.kind, props.viewMode, props.chartDisplayMode])

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
      style={{ height: geometry.chartHeight, minHeight: geometry.chartHeight }}
    >
      {/* 独立した 0px SVG に <defs> を配置する。
       * Recharts の PieChart は内部的に children 種別を厳密に扱うため <defs> が
       * ドロップされるリスクがあり、同じドキュメント内に 1 回だけ <defs> があれば
       * fill="url(#id)" は解決できる (modern browsers は SVG ルート跨ぎの参照を許容)。 */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <GradientDefs />
      </svg>

      <ResponsiveContainer width="100%" height={geometry.chartHeight}>
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
                activeIndex={chooseActive(outerActiveIndex, dualOuterSelectedIdx)}
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
                    ? CHART_OPACITY_BASE
                    : hasFocus
                      ? CHART_OPACITY_DIMMED
                      : CHART_OPACITY_BASE
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
                activeIndex={chooseActive(innerActiveIndex, dualInnerSelectedIdx)}
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
                    ? CHART_OPACITY_BASE
                    : CHART_OPACITY_DIMMED
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
                  activeIndex={chooseActive(outerActiveIndex, itemSelectedIdx)}
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
                      ? CHART_OPACITY_BASE
                      : hasItemSelection
                        ? CHART_OPACITY_DIMMED
                        : CHART_OPACITY_BASE
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
                activeIndex={chooseActive(innerActiveIndex, categorySelectedIdx)}
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
                    ? CHART_OPACITY_BASE
                    : hasCategorySelection
                      ? CHART_OPACITY_DIMMED
                      : CHART_OPACITY_BASE
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
