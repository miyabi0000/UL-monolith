import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import type { ChartViewMode } from '../../utils/types'
import { formatChartAxisValue } from '../../utils/chartHelpers'
import { useWeightUnit } from '../../contexts/WeightUnitContext'
import { primitiveColors, alpha } from '../../styles/tokens'
import { formatWeight } from '../../utils/weightUnit'
import { FONT_SIZES, BAR_LABEL_MAX_CHARS } from '../../utils/chartConfig'
import GradientDefs, { grainFilterId } from './GradientDefs'
import { CHART_CELL_TRANSITION, CHART_OPACITY_BASE, CHART_OPACITY_DIMMED } from './chartTokens'
import { useChartGeometry } from './context/ChartGeometryContext'

export interface BarItem {
  id?: string
  name: string
  value: number
  color: string
  percentage: number
  unit: string
}

export interface HorizontalBarChartProps {
  data: BarItem[]
  totalValue: number
  viewMode: ChartViewMode
  selectedCategories: string[]
  onCategoryClick: (name: string) => void
  onItemClick?: (id: string) => void
  /** Bar hover で Table/Card 側にアイテム id を通知 */
  onItemHover?: (id: string | null) => void
  /** Table/Card 側からの hover を受けて該当バーを強調表示 */
  hoveredItemId?: string | null
}

// カスタムツールチップ（recharts が content として要素を受け取る）
const ChartTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  const { unit } = useWeightUnit()
  if (!active || !payload?.length) return null
  const item = payload[0].payload as BarItem
  const formattedValue = item.unit === '¥'
    ? `¥${Math.round(item.value / 100).toLocaleString()}`
    : formatWeight(item.value, unit)
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-md px-2.5 py-1.5 text-xs pointer-events-none">
      <div className="font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{item.name}</div>
      <div className="text-gray-500 dark:text-gray-400">{formattedValue} · {item.percentage}%</div>
    </div>
  )
}

const YAXIS_WIDTH_DESKTOP = 80
const YAXIS_WIDTH_MOBILE = 70

// YAxis カスタムティック（左寄せ）
// recharts の `x` は tick line（YAxis 右端）位置で渡ってくるが、recharts 内部の
// gap で `x < yAxisWidth` になるため `x - yAxisWidth + offset` だと左にはみ出す。
// `payload.coordinate ?? 0` (= y軸内の相対位置) を起点に、開始 x を固定値で扱う。
const CategoryTick: React.FC<{
  x?: number
  y?: number
  payload?: { value: string }
  selectedCategories: string[]
  fontSize: number
  maxChars: number
  /** 左パディング（固定 px） */
  leftPad?: number
}> = ({ y = 0, payload, selectedCategories, fontSize, maxChars, leftPad = 4 }) => {
  const name = payload?.value ?? ''
  const isSelected = selectedCategories.includes(name)
  const label = name.length > maxChars ? `${name.slice(0, Math.max(1, maxChars - 1))}…` : name
  return (
    <text
      x={leftPad}
      y={y}
      textAnchor="start"
      dominantBaseline="middle"
      style={{
        fontSize,
        fill: isSelected ? primitiveColors.gray[700] : primitiveColors.gray[500],
        fontWeight: isSelected ? 600 : 400,
      }}
    >
      {label}
    </text>
  )
}

const BAR_HEIGHT = 24
const BAR_GAP = 8
const MIN_CHART_HEIGHT = 120
const HEIGHT_PADDING = 32

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  viewMode,
  selectedCategories,
  onCategoryClick,
  onItemClick,
  onItemHover,
  hoveredItemId,
}) => {
  const { unit } = useWeightUnit()
  const { screenSize } = useChartGeometry()
  const isMobile = screenSize === 'mobile'
  const hasSelection = selectedCategories.length > 0
  const chartHeight = Math.max(MIN_CHART_HEIGHT, data.length * (BAR_HEIGHT + BAR_GAP) + HEIGHT_PADDING)

  // モバイルは Y 軸幅を圧縮し、左マージンを 0 にしてカテゴリ名の収納幅を確保
  const yAxisWidth = isMobile ? YAXIS_WIDTH_MOBILE : YAXIS_WIDTH_DESKTOP
  const labelFontSize = isMobile ? FONT_SIZES.axis.label.mobile : FONT_SIZES.axis.label.desktop
  const tickFontSize  = isMobile ? FONT_SIZES.axis.tick.mobile  : FONT_SIZES.axis.tick.desktop
  const maxChars      = isMobile ? BAR_LABEL_MAX_CHARS.mobile   : BAR_LABEL_MAX_CHARS.desktop

  return (
    <div style={{ width: '100%', height: chartHeight }}>
      {/* Pie と同じ grain フィルターを参照するため defs を 0px SVG に同梱 */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <GradientDefs />
      </svg>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: isMobile ? 0 : 4, bottom: 4 }}
          barSize={BAR_HEIGHT}
          barCategoryGap={BAR_GAP}
        >
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatChartAxisValue(value, viewMode, unit)}
            tick={{ fontSize: tickFontSize, fill: primitiveColors.gray[400] }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            axisLine={false}
            tickLine={false}
            tick={(props) => (
              <CategoryTick
                y={props.y}
                payload={props.payload}
                selectedCategories={selectedCategories}
                fontSize={labelFontSize}
                maxChars={maxChars}
              />
            )}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: alpha(primitiveColors.gray[400], 0.08) }}
            wrapperStyle={{ outline: 'none', maxWidth: isMobile ? '70%' : undefined }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            onClick={(entry: BarItem) => {
              if (onItemClick && entry.id) {
                onItemClick(entry.id)
              } else {
                onCategoryClick(entry.name)
              }
            }}
            onMouseEnter={(entry: BarItem) => {
              if (onItemHover && entry.id) onItemHover(entry.id)
            }}
            onMouseLeave={() => {
              if (onItemHover) onItemHover(null)
            }}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => {
              const isSelected = selectedCategories.includes(entry.name)
              const isHovered = Boolean(hoveredItemId && entry.id === hoveredItemId)
              // Pie と同じロジック: fill はベースカラー固定、強調は opacity のみで表現
              const dim = hasSelection && !isSelected && !entry.id && !isHovered
              const opacity = dim ? CHART_OPACITY_DIMMED : CHART_OPACITY_BASE
              return (
                <Cell
                  key={entry.id ?? entry.name}
                  fill={entry.color}
                  stroke="none"
                  opacity={opacity}
                  style={{
                    transition: CHART_CELL_TRANSITION,
                    filter: `url(#${grainFilterId(index)})`,
                  }}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HorizontalBarChart
