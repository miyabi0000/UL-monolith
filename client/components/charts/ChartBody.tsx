import React, { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import BarChartBody from './BarChartBody'
import ChartCenterOverlay from './ChartCenterOverlay'
import ActiveCalloutShape from './ActiveCalloutShape'
import GradientDefs, { GradientColorEntry } from './GradientDefs'
import { sanitizeDefId } from './gradientHelpers'
import { darkenColor, generateItemColor } from '../../utils/colorHelpers'
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

/** 有機的デザインの共通パラメータ */
const ORGANIC_CORNER_RADIUS = 14
const ORGANIC_PAD_ANGLE = 0.018
const CASCADE_DELAY_MS = 90 // 各セクターが順に花開くカスケード間隔

const cellTransition = {
  transition: 'fill 0.5s ease, stroke 0.4s ease, opacity 0.4s ease',
  outline: 'none',
  cursor: 'pointer',
} as const

/** inline animation-delay を cascade 付きで生成 */
const cascadeDelay = (index: number, baseMs: number = 0): React.CSSProperties => ({
  animationDelay: `${baseMs + index * CASCADE_DELAY_MS}ms`,
})

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

  // ==================== グラデーション ID 一覧 ====================
  // 各セクターの色に対し GradientDefs 内で radialGradient を定義し、
  // Cell 側で fill="url(#<id>)" から参照する。
  const dualOuterGradIds = useMemo(
    () => outerData.map((_, i) => sanitizeDefId('grad-dual-outer', i)),
    [outerData],
  )
  const dualInnerGradIds = useMemo(
    () => innerData.map((entry) => sanitizeDefId('grad-dual-inner', entry.id)),
    [innerData],
  )
  const itemGradIds = useMemo(
    () => props.outerPieData.map((item) => sanitizeDefId('grad-item', item.id)),
    [props.outerPieData],
  )
  const categoryGradIds = useMemo(
    () => props.sortedData.map((entry) => sanitizeDefId('grad-cat', entry.name)),
    [props.sortedData],
  )

  // GradientDefs へ渡す全エントリ (同一 <defs> 内で一括定義)
  const allGradientEntries: GradientColorEntry[] = useMemo(() => {
    const entries: GradientColorEntry[] = []
    if (isClassMode) {
      outerData.forEach((e, i) => entries.push({ id: dualOuterGradIds[i], color: e.color }))
      innerData.forEach((e, i) => entries.push({ id: dualInnerGradIds[i], color: e.color }))
    } else {
      props.outerPieData.forEach((_, i) =>
        entries.push({ id: itemGradIds[i], color: generateItemColor(baseColor, i, itemCount) }),
      )
      props.sortedData.forEach((e, i) =>
        entries.push({ id: categoryGradIds[i], color: getCategoryColor(e.name) }),
      )
    }
    return entries
  }, [
    isClassMode,
    outerData,
    innerData,
    props.outerPieData,
    props.sortedData,
    dualOuterGradIds,
    dualInnerGradIds,
    itemGradIds,
    categoryGradIds,
    baseColor,
    itemCount,
  ])

  return (
    <div
      className="relative flex items-center justify-center p-2 flex-1"
      style={{ minHeight: geometry.chartHeight }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* SVG <defs>: グラデーション + 有機的ノイズ / グロー filter の定義
           * Recharts は PieChart の children を SVG 内にそのまま render するため、
           * <defs> を最初の子として配置すれば後続の <Cell fill="url(#...)"> から参照できる。 */}
          <GradientDefs entries={allGradientEntries} />

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
                cornerRadius={ORGANIC_CORNER_RADIUS}
                paddingAngle={ORGANIC_PAD_ANGLE}
                activeShape={ActiveCalloutShape as any}
                activeIndex={outerActiveIndex ?? undefined}
                onClick={(entry: DonutSegment) => props.onDualRingOuterClick(entry.id)}
                onMouseEnter={(_: DonutSegment, idx: number) => setOuterActiveIndex(idx)}
                onMouseLeave={() => setOuterActiveIndex(null)}
                className="cursor-pointer"
                isAnimationActive={false}
              >
                {outerData.map((entry, index) => {
                  const isSelected = props.selectedCategories.includes(entry.label)
                  const baseOpacity = hasFocus ? 0.55 : 0.82
                  return (
                    <Cell
                      key={`dual-outer-${index}`}
                      fill={`url(#${dualOuterGradIds[index]})`}
                      stroke={isSelected ? darkenColor(entry.color, 0.2) : 'rgba(255,255,255,0.65)'}
                      strokeWidth={isSelected ? 2 : 0.8}
                      opacity={isSelected ? 1 : baseOpacity}
                      className={`chart-sector-bloom${isSelected ? ' chart-sector-selected' : ''}`}
                      style={{ ...cellTransition, ...cascadeDelay(index, 80) }}
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
                cornerRadius={ORGANIC_CORNER_RADIUS}
                paddingAngle={ORGANIC_PAD_ANGLE}
                activeShape={ActiveCalloutShape as any}
                activeIndex={innerActiveIndex ?? undefined}
                onClick={(entry: DonutSegment) => props.onInnerRingClick(entry.id)}
                onMouseEnter={(_: DonutSegment, idx: number) => setInnerActiveIndex(idx)}
                onMouseLeave={() => setInnerActiveIndex(null)}
                className="cursor-pointer"
                isAnimationActive={false}
              >
                {innerData.map((entry, index) => {
                  const isFocused = chartFocus === entry.id
                  const hasOther = chartFocus !== 'all' && chartFocus !== entry.id
                  return (
                    <Cell
                      key={`dual-inner-${index}`}
                      fill={`url(#${dualInnerGradIds[index]})`}
                      stroke={isFocused ? darkenColor(entry.color, 0.3) : 'rgba(255,255,255,0.7)'}
                      strokeWidth={isFocused ? 2.5 : 1.2}
                      opacity={isFocused || !hasOther ? 1 : 0.4}
                      className={`chart-sector-bloom${isFocused ? ' chart-sector-selected' : ''}`}
                      style={{
                        ...cellTransition,
                        ...cascadeDelay(index, 320),
                        filter: isFocused ? `drop-shadow(0 0 10px ${entry.color}aa)` : 'none',
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
                  cornerRadius={ORGANIC_CORNER_RADIUS}
                  paddingAngle={ORGANIC_PAD_ANGLE}
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
                  isAnimationActive={false}
                >
                  {props.outerPieData.map((item, index) => {
                    const isSelected = selectedItemId === item.id
                    const darkStroke = darkenColor(baseColor, 0.2)
                    return (
                      <Cell
                        key={`item-${index}`}
                        fill={`url(#${itemGradIds[index]})`}
                        stroke={isSelected ? darkStroke : 'rgba(255,255,255,0.5)'}
                        strokeWidth={isSelected ? 2 : 0.8}
                        opacity={isSelected ? 1 : 0.9}
                        className={`chart-sector-bloom${isSelected ? ' chart-sector-selected' : ''}`}
                        style={{
                          ...cellTransition,
                          ...cascadeDelay(index, 220),
                          filter: isSelected ? `drop-shadow(0 0 8px ${darkStroke}99)` : 'none',
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
                cornerRadius={ORGANIC_CORNER_RADIUS}
                paddingAngle={ORGANIC_PAD_ANGLE}
                activeShape={ActiveCalloutShape as any}
                activeIndex={innerActiveIndex ?? undefined}
                onClick={(entry: SortedChartCategory) => props.onCategoryClick(entry.name)}
                onMouseEnter={(_: SortedChartCategory, idx: number) => setInnerActiveIndex(idx)}
                onMouseLeave={() => setInnerActiveIndex(null)}
                className="cursor-pointer"
                isAnimationActive={false}
              >
                {props.sortedData.map((entry, index) => {
                  const color = getCategoryColor(entry.name)
                  const isSelected = selectedCategoryName === entry.name
                  const darkStroke = darkenColor(color, 0.25)
                  return (
                    <Cell
                      key={`category-${entry.name}`}
                      fill={`url(#${categoryGradIds[index]})`}
                      stroke={isSelected ? darkStroke : 'rgba(255,255,255,0.6)'}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={hasCategorySelection && !isSelected ? 0.38 : 1}
                      className={`chart-sector-bloom${isSelected ? ' chart-sector-selected' : ''}`}
                      style={{
                        ...cellTransition,
                        ...cascadeDelay(index, 80),
                        filter: isSelected ? `drop-shadow(0 0 9px ${darkStroke}99)` : 'none',
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
