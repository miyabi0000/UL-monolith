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
import GradientDefs, { grainFilterId } from './GradientDefs'
import { CHART_CELL_TRANSITION, CHART_OPACITY_BASE, CHART_OPACITY_DIMMED } from './chartTokens'

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

const YAXIS_WIDTH = 80

// YAxis カスタムティック（左寄せ）
const CategoryTick: React.FC<{
  x?: number
  y?: number
  payload?: { value: string }
  selectedCategories: string[]
}> = ({ x = 0, y = 0, payload, selectedCategories }) => {
  const name = payload?.value ?? ''
  const isSelected = selectedCategories.includes(name)
  const label = name.length > 11 ? `${name.slice(0, 10)}…` : name
  return (
    <text
      x={x - YAXIS_WIDTH + 4}
      y={y}
      textAnchor="start"
      dominantBaseline="middle"
      style={{
        fontSize: 10,
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
  const hasSelection = selectedCategories.length > 0
  const chartHeight = Math.max(MIN_CHART_HEIGHT, data.length * (BAR_HEIGHT + BAR_GAP) + HEIGHT_PADDING)

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
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          barSize={BAR_HEIGHT}
          barCategoryGap={BAR_GAP}
        >
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatChartAxisValue(value, viewMode, unit)}
            tick={{ fontSize: 9, fill: primitiveColors.gray[400] }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={YAXIS_WIDTH}
            axisLine={false}
            tickLine={false}
            tick={(props) => (
              <CategoryTick
                x={props.x}
                y={props.y}
                payload={props.payload}
                selectedCategories={selectedCategories}
              />
            )}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: alpha(primitiveColors.gray[400], 0.08) }}
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
