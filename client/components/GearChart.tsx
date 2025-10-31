import React, { useState, useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartData, ChartViewMode } from '../utils/types'
import { COLORS, getPriorityColor } from '../utils/designSystem'
import Card from './ui/Card'

// ==================== 定数 ====================
const CHART_CONFIG = {
  height: {
    mobile: 500,  // ラベル分を追加
    tablet: 600,
    desktop: 700
  },
  outerRadius: {
    mobile: { outer: 120, inner: 85 },
    tablet: { outer: 160, inner: 115 },
    desktop: { outer: 200, inner: 140 }
  },
  innerRadius: {
    mobile: { outer: 85, inner: 55 },
    tablet: { outer: 115, inner: 75 },
    desktop: { outer: 140, inner: 90 }
  },
  centerMaxWidth: {
    mobile: 100,
    tablet: 130,
    desktop: 160
  }
} as const

const DEFAULT_COLOR = '#6B7280'
const SELECTED_COLOR = '#404040' // Gray color for selection (gray.700)
const SELECTED_STROKE_WIDTH = 3

// ==================== ヘルパー関数 ====================
/**
 * HEX形式の色を暗くする
 * @param color HEX形式の色（例: #FF6B6B）
 * @param amount 暗くする割合（0-1）
 * @returns 暗くされたHEX色
 */
const darkenColor = (color: string, amount: number = 0.2): string => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const newR = Math.max(0, Math.floor(r * (1 - amount)))
  const newG = Math.max(0, Math.floor(g * (1 - amount)))
  const newB = Math.max(0, Math.floor(b * (1 - amount)))

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

/**
 * HSL形式の色を暗くする
 * @param hslColor HSL形式の色（例: hsl(120, 50%, 60%)）
 * @param amount 暗くする割合（0-1）
 * @returns 暗くされたHSL色
 */
const darkenHslColor = (hslColor: string, amount: number = 0.2): string => {
  const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!hslMatch) return hslColor

  const h = parseInt(hslMatch[1])
  const s = parseInt(hslMatch[2])
  const l = parseInt(hslMatch[3])

  const newL = Math.max(0, Math.floor(l * (1 - amount)))

  return `hsl(${h}, ${s}%, ${newL}%)`
}

/**
 * カテゴリの基本色からアイテム用のグラデーション色を生成
 * @param baseColor カテゴリの基本色（HEX形式）
 * @param index アイテムのインデックス
 * @param total アイテムの総数
 * @returns HSL形式の色
 */
const generateItemColor = (baseColor: string, index: number, total: number): string => {
  // HEXからRGBに変換
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // RGBからHSLに変換
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

  // アイテムごとにグラデーションを適用
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
// カスタムツールチップ
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  viewMode: ChartViewMode
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, viewMode }) => {
  if (!active || !payload?.[0]) return null
  
  const data = payload[0].payload
  const isItem = 'brand' in data || 'id' in data
  
  return (
    <div 
      className="rounded-lg shadow-xl p-3 max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      style={{ 
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="font-bold text-sm mb-0.5 text-gray-900 dark:text-gray-100">
            {data.name}
          </p>
          {isItem && data.brand && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.brand}
            </p>
          )}
        </div>
        <div 
          className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
          style={{ backgroundColor: data.color || SELECTED_COLOR }}
        />
      </div>
      
      {/* メイン情報 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {viewMode === 'cost' ? '価格' : '重量'}:
          </span>
          <span className="font-bold text-sm" style={{ color: data.color || SELECTED_COLOR }}>
            {formatValue(data.value, viewMode)}
          </span>
        </div>
        
        {/* パーセンテージ */}
        {data.percentage !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              全体比:
            </span>
            <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
              {data.percentage}%
            </span>
          </div>
        )}
        
        {/* システムパーセンテージ（アイテムの場合） */}
        {isItem && data.systemPercentage !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              カテゴリ内:
            </span>
            <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
              {data.systemPercentage}%
            </span>
          </div>
        )}
      </div>
      
      {/* 追加情報（アイテムの場合） */}
      {isItem && (data.owned !== undefined || data.priority !== undefined) && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.owned !== undefined && data.needed !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">所有/必要: </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {data.owned}/{data.needed}
                </span>
              </div>
            )}
            {data.priority !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">優先度: </span>
                <span className="font-medium" style={{ color: getPriorityColor(data.priority) }}>
                  {data.priority}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
      className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-1.5 rounded-lg hover:scale-105 ${
        isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-1 mb-0.5">
        <span
          className="text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded shadow-sm"
          style={{ backgroundColor: color, color: COLORS.white }}
        >
          {icon}
        </span>
        <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <div className="text-xs font-bold" style={{ color }}>
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
}) => {
  const darkenedColor = darkenColor(category.color, 0.2)
  return (
    <div
      className="flex items-center justify-between p-1.5 rounded cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: isSelected ? `${category.color}15` : 'transparent',
        borderLeft: isSelected ? `3px solid ${darkenedColor}` : '3px solid transparent',
        paddingLeft: isSelected ? '5px' : '6px'
      }}
      onClick={onClick}
    >
      <div className="flex items-center space-x-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
          {category.name}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          {formatValue(category.value, viewMode)}
        </div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400">
          {category.percentage}%
        </div>
      </div>
    </div>
  )
}

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
  const [centerPulse, setCenterPulse] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // レスポンシブ対応
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // チャート設定を画面サイズに応じて取得
  const chartHeight = CHART_CONFIG.height[screenSize]
  const outerRadiusConfig = CHART_CONFIG.outerRadius[screenSize]
  const innerRadiusConfig = CHART_CONFIG.innerRadius[screenSize]
  const centerMaxWidth = CHART_CONFIG.centerMaxWidth[screenSize]

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
    return (selectedData?.sortedItems || []).map((item, index) => {
      const itemValue = getItemValue(item, viewMode)
      const fillColor = generateItemColor(
        selectedData?.color || DEFAULT_COLOR,
        index,
        selectedData?.sortedItems?.length || 1
      )
      return {
        name: item.name,
        value: itemValue,
        id: item.id,
        color: fillColor,
        brand: item.brand,
        owned: item.owned,
        needed: item.needed,
        priority: item.priority,
        percentage: item.totalPercentage,
        systemPercentage: item.systemPercentage
      }
    })
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
    // カテゴリが選択されている場合は選択解除
    if (selectedCategory) {
      onCategorySelect([])
      setSelectedItem(null)
    } else {
      // カテゴリが選択されていない場合は表示モードを切り替え
      onViewModeChange(viewMode === 'weight' ? 'cost' : 'weight')
    }

    // パルスアニメーション
    setCenterPulse(true)
    setTimeout(() => setCenterPulse(false), 600)
  }

  // ==================== レンダリング ====================
  return (
    <div className="space-y-2">
      {/* ヘッダー */}
      <div className="flex items-center">
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tracking-wide">
          GEAR ANALYSIS
        </h3>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-3">
        {/* グラフエリア */}
        <Card className="p-2">
        <div className="relative flex items-center justify-center" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* 外側円 - アイテム（先に描画） */}
              {selectedCategory && (
                <Pie
                  data={outerPieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={outerRadiusConfig.outer}
                  innerRadius={outerRadiusConfig.inner}
                  onClick={(entry) => handleItemClick(entry.id)}
                  className="cursor-pointer"
                >
                  {outerPieData.map((item, index) => {
                    const fillColor = generateItemColor(
                      selectedData?.color || DEFAULT_COLOR,
                      index,
                      selectedData?.sortedItems?.length || 1
                    )
                    const isSelected = selectedItem === item.id
                    const darkenedFillColor = darkenHslColor(fillColor, 0.2)
                    const darkenedStrokeColor = darkenColor(selectedData?.color || DEFAULT_COLOR, 0.2)
                    return (
                      <Cell
                        key={`item-${index}`}
                        fill={isSelected ? darkenedFillColor : fillColor}
                        opacity={isSelected ? 1 : 0.85}
                        stroke={isSelected ? darkenedStrokeColor : COLORS.white}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 6px ${darkenedStrokeColor}99)` : 'none',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                      />
                    )
                  })}
                </Pie>
              )}

              {/* 内側円 - カテゴリ（最後に描画して最上面に） */}
              <Pie
                data={sortedData.map(d => ({ ...d, color: d.color }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={innerRadiusConfig.outer}
                innerRadius={innerRadiusConfig.inner}
                onClick={(entry) => handleCategoryClick(entry.name)}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => {
                  const isCategorySelected = selectedCategory === entry.name
                  const hasSelection = selectedCategory !== null
                  const darkenedFillColor = darkenColor(entry.color, 0.15)
                  const darkenedStrokeColor = darkenColor(entry.color, 0.2)
                  return (
                    <Cell
                      key={`category-${entry.name}`}
                      fill={isCategorySelected ? darkenedFillColor : entry.color}
                      stroke={isCategorySelected ? darkenedStrokeColor : COLORS.white}
                      strokeWidth={isCategorySelected ? 2 : 1}
                      opacity={hasSelection ? 0.4 : 1}
                      style={{
                        filter: isCategorySelected ? `drop-shadow(0 0 6px ${darkenedStrokeColor}99)` : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    />
                  )
                })}
              </Pie>

              <Tooltip 
                content={<CustomTooltip viewMode={viewMode} />}
                cursor={false}
                wrapperStyle={{ outline: 'none', zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
                offset={30}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 中央表示 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-center cursor-pointer pointer-events-auto flex flex-col items-center justify-center"
              style={{ 
                width: innerRadiusConfig.inner * 2,
                height: innerRadiusConfig.inner * 2,
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                backgroundColor: centerPulse ? 'rgba(64, 64, 64, 0.05)' : 'transparent',
                transform: centerPulse ? 'scale(1.05)' : 'scale(1)',
                boxShadow: centerPulse ? '0 0 20px rgba(64, 64, 64, 0.3)' : 'none'
              }}
              onClick={handleCenterClick}
            >
              {selectedCategory && selectedData ? (
                // カテゴリ選択時: カテゴリの情報を表示
                <>
                  <div
                    className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                    style={{
                      fontSize: screenSize === 'mobile' ? '1.25rem' : '1.5rem'
                    }}
                  >
                    {formatValue(selectedData.value, viewMode)}
                  </div>
                  <div
                    className="uppercase tracking-wide font-bold mb-2"
                    style={{
                      fontSize: screenSize === 'mobile' ? '0.625rem' : '0.75rem',
                      color: selectedData.color
                    }}
                  >
                    {selectedCategory}
                  </div>
                  <div
                    className="text-xs text-gray-500 dark:text-gray-400"
                    style={{
                      fontSize: screenSize === 'mobile' ? '0.625rem' : '0.7rem'
                    }}
                  >
                    {selectedData.percentage}% of total
                  </div>
                </>
              ) : (
                // 未選択時: 全体の情報を表示
                <>
                  <div
                    className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                    style={{
                      fontSize: screenSize === 'mobile' ? '1.25rem' : '1.5rem'
                    }}
                  >
                    {formatValue(totalValue, viewMode)}
                  </div>
                  <div
                    className="uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400"
                    style={{
                      fontSize: screenSize === 'mobile' ? '0.625rem' : '0.75rem'
                    }}
                  >
                    {viewMode === 'cost' ? 'TOTAL COST' : 'TOTAL WEIGHT'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

        {/* サイドパネル */}
        <Card className="p-2">
          {/* Distribution */}
          <h4 className="font-semibold mb-2 text-[10px] text-gray-900 dark:text-gray-100 tracking-wide">
            DISTRIBUTION
          </h4>
          <div className="space-y-1.5">
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
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
