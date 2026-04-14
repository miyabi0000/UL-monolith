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
import { darkenColor } from '../../utils/colorHelpers'
import { formatChartAxisValue } from '../../utils/chartHelpers'
import { useWeightUnit } from '../../contexts/WeightUnitContext'
import { formatWeight } from '../../utils/weightUnit'

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
    <div className="bg-white dark:bg-slate-800 neu-raised rounded-md px-2.5 py-1.5 text-xs pointer-events-none">
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
        fill: isSelected ? '#374151' : '#6b7280',
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

const calcBarOpacity = (hasSelection: boolean, isSelected: boolean, hasItemId: boolean): number =>
  hasSelection && !isSelected && !hasItemId ? 0.35 : 1

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
            tick={{ fontSize: 9, fill: '#9ca3af' }}
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
            cursor={{ fill: 'rgba(156, 163, 175, 0.08)' }}
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
            {data.map((entry) => {
              const isSelected = selectedCategories.includes(entry.name)
              const isHovered = Boolean(hoveredItemId && entry.id === hoveredItemId)
              const opacity = calcBarOpacity(hasSelection, isSelected, Boolean(entry.id))
              return (
                <Cell
                  key={entry.id ?? entry.name}
                  fill={isSelected || isHovered ? darkenColor(entry.color, 0.15) : entry.color}
                  opacity={opacity}
                  style={{ transition: 'opacity 0.15s ease, fill 0.15s ease' }}
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
