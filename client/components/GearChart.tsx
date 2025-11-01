import React, { useState, useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartData, ChartViewMode } from '../utils/types'
import { COLORS, getPriorityColor } from '../utils/designSystem'
import Card from './ui/Card'

// ==================== 定数 ====================
const CHART_CONFIG = {
  height: {
    mobile: 500,
    tablet: 600,
    desktop: 650
  },
  outerRadius: {
    mobile: { outer: 130, inner: 95 },
    tablet: { outer: 180, inner: 130 },
    desktop: { outer: 220, inner: 160 }
  },
  innerRadius: {
    mobile: { outer: 95, inner: 60 },
    tablet: { outer: 130, inner: 85 },
    desktop: { outer: 160, inner: 105 }
  },
  centerMaxWidth: {
    mobile: 110,
    tablet: 150,
    desktop: 190
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
    // 常にWeight/Cost切り替え（カテゴリ選択状態に関係なく）
    onViewModeChange(viewMode === 'weight' ? 'cost' : 'weight')

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
      <div>
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
                      opacity={hasSelection && !isCategorySelected ? 0.4 : 1}
                      className={hasSelection && !isCategorySelected ? 'hover:opacity-60' : ''}
                      style={{
                        filter: isCategorySelected ? `drop-shadow(0 0 6px ${darkenedStrokeColor}99)` : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        cursor: 'pointer'
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
              {(() => {
                // レベル3: ギアアイテム選択時
                if (selectedItem && selectedData) {
                  const itemData = outerPieData.find(item => item.id === selectedItem)
                  if (itemData) {
                    return (
                      <>
                        <div
                          className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                          style={{
                            fontSize: screenSize === 'mobile' ? '1rem' : '1.2rem'
                          }}
                        >
                          {formatValue(itemData.value, viewMode)}
                        </div>
                        <div
                          className="font-semibold mb-0.5 px-2 text-center overflow-hidden"
                          style={{
                            fontSize: screenSize === 'mobile' ? '0.65rem' : '0.75rem',
                            color: itemData.color,
                            maxWidth: centerMaxWidth - 20,
                            lineHeight: '1.2',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}
                          title={itemData.name}
                        >
                          {itemData.name}
                        </div>
                        {itemData.brand && (
                          <div
                            className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2 text-center overflow-hidden"
                            style={{
                              fontSize: screenSize === 'mobile' ? '0.5rem' : '0.6rem',
                              maxWidth: centerMaxWidth - 20,
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis'
                            }}
                            title={itemData.brand}
                          >
                            {itemData.brand}
                          </div>
                        )}
                        <div
                          className="text-xs text-gray-500 dark:text-gray-400"
                          style={{
                            fontSize: screenSize === 'mobile' ? '0.55rem' : '0.6rem'
                          }}
                        >
                          {itemData.percentage}% of total
                        </div>
                      </>
                    )
                  }
                }

                // レベル2: カテゴリ選択時
                if (selectedCategory && selectedData) {
                  return (
                    <>
                      <div
                        className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                        style={{
                          fontSize: screenSize === 'mobile' ? '1.1rem' : '1.3rem'
                        }}
                      >
                        {formatValue(selectedData.value, viewMode)}
                      </div>
                      <div
                        className="uppercase tracking-wide font-bold mb-2"
                        style={{
                          fontSize: screenSize === 'mobile' ? '0.6rem' : '0.7rem',
                          color: selectedData.color
                        }}
                      >
                        {selectedCategory}
                      </div>
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400"
                        style={{
                          fontSize: screenSize === 'mobile' ? '0.55rem' : '0.65rem'
                        }}
                      >
                        {selectedData.percentage}% of total
                      </div>
                    </>
                  )
                }

                // レベル1: 未選択時
                return (
                  <>
                    <div
                      className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                      style={{
                        fontSize: screenSize === 'mobile' ? '1.1rem' : '1.3rem'
                      }}
                    >
                      {formatValue(totalValue, viewMode)}
                    </div>
                    <div
                      className="uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400"
                      style={{
                        fontSize: screenSize === 'mobile' ? '0.6rem' : '0.7rem'
                      }}
                    >
                      {viewMode === 'cost' ? 'TOTAL COST' : 'TOTAL WEIGHT'}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
