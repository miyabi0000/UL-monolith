import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartData, ChartViewMode } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import Card from './ui/Card'

// ==================== 定数 ====================
const CHART_CONFIG = {
  height: 500,
  outerRadius: {
    outer: 200,
    inner: 140
  },
  innerRadius: {
    outer: 140,
    inner: 90
  },
  centerMaxWidth: 160
} as const

const DEFAULT_COLOR = '#6B7280'
const SELECTED_STROKE_COLOR = '#374151'
const SELECTED_STROKE_WIDTH = 3

// ==================== ヘルパー関数 ====================
const generateItemColor = (baseColor: string, index: number, total: number): string => {
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const diff = max - min

  let h = 0
  if (diff !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / diff) % 6
    else if (max === gNorm) h = (bNorm - rNorm) / diff + 2
    else h = (rNorm - gNorm) / diff + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const l = (max + min) / 2
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1))

  const progress = index / total
  const newSaturation = Math.max(0.3, Math.min(0.9, s * (1 - progress * 0.7)))
  const newLightness = Math.max(0.4, Math.min(0.7, l + progress * 0.2))

  return `hsl(${h}, ${Math.round(newSaturation * 100)}%, ${Math.round(newLightness * 100)}%)`
}

const formatValue = (value: number, mode: ChartViewMode): string => {
  if (mode === 'cost') {
    return `¥${Math.round(value / 100).toLocaleString()}`
  }
  return `${value}g`
}

const getItemValue = (item: any, mode: ChartViewMode): number => {
  return mode === 'cost' ? item.totalPrice : item.totalWeight
}

// ==================== サブコンポーネント ====================
interface SummaryButtonProps {
  mode: ChartViewMode
  currentMode: ChartViewMode
  label: string
  icon: string
  color: string
  value: string
  onClick: () => void
}

const SummaryButton: React.FC<SummaryButtonProps> = ({
  mode,
  currentMode,
  label,
  icon,
  color,
  value,
  onClick
}) => {
  const isSelected = currentMode === mode

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-2 rounded-lg hover:scale-105"
      style={{
        backgroundColor: isSelected ? `${color}30` : `${color}10`,
        border: isSelected ? `2px solid ${color}` : '2px solid transparent'
      }}
      onClick={onClick}
    >
      <div className="flex items-center space-x-1 mb-0.5">
        <span
          className="text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded shadow-sm"
          style={{ backgroundColor: color, color: COLORS.white }}
        >
          {icon}
        </span>
        <span className="text-[10px] font-medium" style={{ color: COLORS.text.secondary }}>
          {label}
        </span>
      </div>
      <div className="text-sm font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

interface CategoryItemProps {
  category: any
  isSelected: boolean
  viewMode: ChartViewMode
  onClick: () => void
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  viewMode,
  onClick
}) => (
  <div
    className="flex items-center justify-between p-2 rounded cursor-pointer transition-colors"
    style={{
      backgroundColor: isSelected ? COLORS.primary.light : 'transparent',
      border: isSelected ? `1px solid ${COLORS.primary.medium}` : '1px solid transparent'
    }}
    onClick={onClick}
  >
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
        {category.name}
      </span>
    </div>
    <div className="text-right">
      <div className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
        {formatValue(category.value, viewMode)}
      </div>
      <div className="text-xs" style={{ color: COLORS.text.secondary }}>
        {category.percentage}%
      </div>
    </div>
  </div>
)

// ==================== メインコンポーネント ====================
interface GearChartProps {
  data: ChartData[]
  totalWeight: number
  totalCost: number
  viewMode: ChartViewMode
  selectedCategories: string[]
  onCategorySelect: (categories: string[]) => void
  onViewModeChange: (mode: ChartViewMode) => void
}

const GearChart: React.FC<GearChartProps> = React.memo(({
  data,
  totalWeight,
  totalCost,
  viewMode,
  selectedCategories,
  onCategorySelect,
  onViewModeChange
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // ==================== データ処理 ====================
  const displayData = useMemo(() => {
    return data.map(category => ({
      ...category,
      value: viewMode === 'cost' ? category.cost : category.weight
    }))
  }, [data, viewMode])

  const totalValue = viewMode === 'cost' ? totalCost : totalWeight

  const sortedData = useMemo(() => {
    return [...displayData].sort((a, b) => b.value - a.value).map(category => ({
      ...category,
      percentage: totalValue > 0 ? Math.round((category.value / totalValue) * 100) : 0,
      sortedItems: (category.items || [])
        .filter(item => getItemValue(item, viewMode) > 0)
        .sort((a, b) => getItemValue(b, viewMode) - getItemValue(a, viewMode))
        .map(item => {
          const itemValue = getItemValue(item, viewMode)
          return {
            ...item,
            systemPercentage: category.value > 0 ? Math.round((itemValue / category.value) * 100) : 0,
            totalPercentage: totalValue > 0 ? Math.round((itemValue / totalValue) * 100) : 0
          }
        })
    }))
  }, [displayData, totalValue, viewMode])

  const selectedCategory = selectedCategories.length === 1 ? selectedCategories[0] : null
  const selectedData = useMemo(
    () => (selectedCategory ? sortedData.find(d => d.name === selectedCategory) : null),
    [sortedData, selectedCategory]
  )

  const outerPieData = useMemo(() => {
    return (selectedData?.sortedItems || []).map(item => ({
      name: item.name,
      value: getItemValue(item, viewMode),
      id: item.id
    }))
  }, [selectedData, viewMode])

  // ==================== イベントハンドラー ====================
  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategorySelect([])
    } else {
      onCategorySelect([categoryName])
    }
    setSelectedItem(null)
  }

  const handleItemClick = (itemId: string) => {
    setSelectedItem(selectedItem === itemId ? null : itemId)
  }

  const handleCenterClick = () => {
    onCategorySelect([])
    setSelectedItem(null)
  }

  // ==================== レンダリング ====================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-4">
      {/* グラフエリア */}
      <Card variant="square" className="p-3">
        <div className="relative flex items-center justify-center" style={{ height: CHART_CONFIG.height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* 外側円 - アイテム */}
              {selectedCategory && (
                <Pie
                  data={outerPieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={CHART_CONFIG.outerRadius.outer}
                  innerRadius={CHART_CONFIG.outerRadius.inner}
                  onClick={(entry) => handleItemClick(entry.id)}
                  className="cursor-pointer"
                >
                  {outerPieData.map((item, index) => {
                    const fillColor = generateItemColor(
                      selectedData?.color || DEFAULT_COLOR,
                      index,
                      selectedData?.sortedItems?.length || 1
                    )
                    return (
                      <Cell
                        key={`item-${index}`}
                        fill={fillColor}
                        opacity={selectedItem === item.id ? 1 : 0.8}
                        stroke="none"
                        strokeWidth={0}
                      />
                    )
                  })}
                </Pie>
              )}

              {/* 内側円 - カテゴリ */}
              <Pie
                data={sortedData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={CHART_CONFIG.innerRadius.outer}
                innerRadius={CHART_CONFIG.innerRadius.inner}
                onClick={(entry) => handleCategoryClick(entry.name)}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`category-${index}`}
                    fill={entry.color}
                    stroke={selectedCategory === entry.name ? SELECTED_STROKE_COLOR : 'none'}
                    strokeWidth={selectedCategory === entry.name ? SELECTED_STROKE_WIDTH : 0}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: number) => [formatValue(value, viewMode), viewMode === 'cost' ? 'Cost' : 'Weight']}
                labelFormatter={(label) => String(label)}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 中央表示 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-center cursor-pointer hover:bg-gray-50 rounded-full p-4 transition-colors pointer-events-auto"
              style={{ maxWidth: CHART_CONFIG.centerMaxWidth }}
              onClick={handleCenterClick}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: COLORS.text.primary }}>
                {formatValue(totalValue, viewMode)}
              </div>
              <div className="text-xs uppercase tracking-wide font-bold" style={{ color: COLORS.text.secondary }}>
                TOTAL
              </div>
              {selectedCategory && (
                <div className="mt-2">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded truncate block"
                    style={{ color: COLORS.text.primary, backgroundColor: COLORS.primary.light }}
                  >
                    {selectedCategory}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* サイドパネル */}
      <Card variant="square" className="p-3">
        {/* Pack Summary */}
        <div className="mb-4 pb-3 border-b" style={{ borderColor: COLORS.primary.light }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: COLORS.text.primary }}>
            PACK SUMMARY
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <SummaryButton
              mode="weight"
              currentMode={viewMode}
              label="Total Weight"
              icon="W"
              color={COLORS.primary.dark}
              value={`${totalWeight}g`}
              onClick={() => onViewModeChange('weight')}
            />
            <SummaryButton
              mode="cost"
              currentMode={viewMode}
              label="Total Cost"
              icon="¥"
              color={COLORS.primary.medium}
              value={`¥${Math.round(totalCost / 100).toLocaleString()}`}
              onClick={() => onViewModeChange('cost')}
            />
          </div>
        </div>

        {/* Distribution */}
        <h4 className="font-semibold mb-3 text-xs" style={{ color: COLORS.text.primary }}>
          DISTRIBUTION
        </h4>
        <div className="space-y-2">
          {sortedData.map((category) => (
            <CategoryItem
              key={category.name}
              category={category}
              isSelected={selectedCategory === category.name}
              viewMode={viewMode}
              onClick={() => handleCategoryClick(category.name)}
            />
          ))}
        </div>
      </Card>
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
