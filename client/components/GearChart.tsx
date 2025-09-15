import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartData } from '../utils/types'

// 色のバリエーションを生成するヘルパー関数
const generateItemColor = (baseColor: string, index: number, total: number) => {
  // HEXからRGBに変換
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // RGBからHSLに変換
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / diff) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / diff + 2;
    else h = (rNorm - gNorm) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
  
  // 時計回りに彩度を落とす
  const progress = index / total; // 0から1の進行度
  const newSaturation = Math.max(0.3, Math.min(0.9, s * (1 - progress * 0.7))); // 彩度を徐々に下げる
  const newLightness = Math.max(0.4, Math.min(0.7, l + progress * 0.2)); // 明度を徐々に上げる
  
  return `hsl(${h}, ${Math.round(newSaturation * 100)}%, ${Math.round(newLightness * 100)}%)`;
};

interface GearChartProps {
  data: ChartData[]
  totalWeight: number
}

const GearChart: React.FC<GearChartProps> = React.memo(({ data, totalWeight }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showAllItems, setShowAllItems] = useState<boolean>(false)

  // データの事前ソートと計算を一度だけ行う
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value).map(category => ({
      ...category,
      percentage: Math.round((category.value / totalWeight) * 100),
      // アイテムも事前にソート
      sortedItems: (category.items || [])
        .filter(item => item.totalWeight > 0)
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .map(item => ({
          ...item,
          systemPercentage: Math.round((item.totalWeight / category.value) * 100),
          totalPercentage: Math.round((item.totalWeight / totalWeight) * 100)
        }))
    }))
  }, [data, totalWeight])

  // 選択されたカテゴリとアイテムのデータを効率的に取得
  const selectedData = useMemo(() => 
    selectedCategory ? sortedData.find(d => d.name === selectedCategory) : null
  , [sortedData, selectedCategory])

  const selectedItemData = useMemo(() => 
    selectedItem && selectedData
      ? selectedData.sortedItems.find(item => item.id === selectedItem)
      : null
  , [selectedData, selectedItem])

  // 全アイテムのデータを取得（カテゴリごとの色とグラデーションを保持）
  const allItemsData = useMemo(() => {
    const allItems = sortedData.flatMap(category => 
      category.sortedItems.map((item, itemIndex) => ({
        ...item,
        categoryColor: category.color,
        categoryName: category.name,
        totalPercentage: Math.round((item.totalWeight / totalWeight) * 100),
        // カテゴリ内でのグラデーション色を生成
        gradientColor: generateItemColor(category.color, itemIndex, category.sortedItems.length)
      }))
    ).sort((a, b) => b.totalWeight - a.totalWeight)
    
    return allItems
  }, [sortedData, totalWeight])


  // 共通クリックハンドラー
  const handleCategoryClick = (categoryName: string) => {
    // All Items表示中も通常時も同じロジック
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName)
    setSelectedItem(null)
  }

  const handleItemClick = (itemId: string) => {
    setSelectedItem(selectedItem === itemId ? null : itemId)
  }

  const handleCenterClick = () => {
    if (showAllItems) {
      setShowAllItems(false)
    } else {
      setShowAllItems(true)
      setSelectedCategory(null)
      setSelectedItem(null)
    }
  }

  // 外側円データの共通化
  const outerPieData = useMemo(() => {
    return showAllItems 
      ? allItemsData.map(item => ({
          name: item.name,
          value: item.totalWeight,
          id: item.id,
          categoryColor: item.categoryColor,
          categoryName: item.categoryName
        }))
      : (selectedData?.sortedItems || []).map(item => ({
          name: item.name,
          value: item.totalWeight,
          id: item.id
        }))
  }, [showAllItems, allItemsData, selectedData])

  return (
    <div className="space-y-6">
      {/* 二重円グラフ */}
      <div className="relative h-[500px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* 外側円 - 最初に描画（背面） */}
            {(selectedCategory || showAllItems) && (
              <Pie
                data={outerPieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={200}
                innerRadius={140}
                onClick={(entry) => handleItemClick(entry.id)}
                className="cursor-pointer"
              >
                {outerPieData.map((item, index) => {
                  const fillColor = showAllItems ? 
                    allItemsData.find(allItem => allItem.id === item.id)?.gradientColor || '#6B7280' : 
                    generateItemColor(selectedData?.color || '#6B7280', index, selectedData?.sortedItems?.length || 1);

                  return (
                    <Cell 
                      key={`item-${index}`} 
                      fill={fillColor}
                      opacity={selectedItem === item.id ? 1 : 0.8}
                      stroke="none"
                      strokeWidth={0}
                    />
                  );
                })}
              </Pie>
            )}

            {/* 内側円 - 後から描画（前面） */}
            <Pie
              data={sortedData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={140}
              innerRadius={90}
              onClick={(entry) => handleCategoryClick(entry.name)}
              className="cursor-pointer"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`system-${index}`} 
                  fill={entry.color}
                  stroke={selectedCategory === entry.name ? '#374151' : 'none'}
                  strokeWidth={selectedCategory === entry.name ? 3 : 0}
                />
              ))}
            </Pie>
            
            <Tooltip 
              formatter={(value: number) => [`${value}g`, 'Weight']}
              labelFormatter={(label) => `${label}`}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* 中央表示 - 最前面 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="text-center cursor-pointer hover:bg-gray-50 rounded-full p-4 transition-colors pointer-events-auto"
            style={{ maxWidth: '140px' }}
            onClick={handleCenterClick}
          >
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalWeight}g</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {showAllItems ? 'All Items' : 'Total'}
            </div>
            {selectedCategory && !showAllItems && (
              <div className="mt-2">
                <span className="text-xs font-medium text-gray-700 px-2 py-1 bg-gray-100 rounded truncate block">
                  {selectedCategory}
                </span>
              </div>
            )}
            {selectedItemData && !showAllItems && (
              <div className="mt-1">
                <span className="text-xs text-gray-600 truncate block" style={{ maxWidth: '120px' }}>
                  {selectedItemData.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

                        {/* システム別重量割合 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">System Weight Distribution</h4>
                      <div className="space-y-2">
                        {sortedData.map((category) => (
                          <div
                            key={category.name}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                              selectedCategory === category.name
                                ? 'bg-blue-100 border border-blue-300'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedCategory(
                              selectedCategory === category.name ? null : category.name
                            )}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{category.value}g</div>
                              <div className="text-xs text-gray-500">{category.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

        {/* 選択システム内のアイテム重量割合 または 全アイテム表示 */}
        {(selectedCategory || showAllItems) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              {showAllItems ? (
                <>All Items</>
              ) : (
                <>
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: selectedData?.color || '#6B7280' }}
                  />
                  {selectedData?.name || 'Unknown'} Items
                </>
              )}
            </h4>
            <div className="space-y-2">
              {(showAllItems ? allItemsData : (selectedData?.sortedItems || [])).map((item, index) => {
                const itemColor = showAllItems ? 
                  (item as any).gradientColor : 
                  generateItemColor(selectedData?.color || '#6B7280', index, selectedData?.sortedItems?.length || 1);
                const percentage = showAllItems ? 
                  `${(item as any).totalPercentage}%` : 
                  `${item.systemPercentage}%`;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedItem === item.id
                        ? 'bg-gray-200 border-2 border-gray-400 shadow-md'
                        : 'hover:bg-gray-100 border border-gray-200'
                    }`}
                    onClick={() => setSelectedItem(
                      selectedItem === item.id ? null : item.id
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: itemColor }}
                      />
                      {showAllItems && (
                        <div className="text-xs text-gray-500 min-w-[60px]">
                          {(item as any).categoryName}
                        </div>
                      )}
                      {item.productUrl && (
                        <img
                          src={item.productUrl}
                          alt={item.name}
                          className="w-8 h-8 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate" style={{ maxWidth: '150px' }}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.weightGrams}g × {item.requiredQuantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-sm font-bold text-gray-900">{item.totalWeight}g</div>
                      <div className="text-xs text-gray-600">{percentage}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 選択アイテムの詳細 */}
      {selectedItemData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{selectedItemData.name}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Weight:</span>
              <div className="font-semibold text-lg">{selectedItemData.totalWeight}g</div>
            </div>
            <div>
              <span className="text-gray-600">System %:</span>
              <div className="font-semibold text-lg text-blue-600">
                {Math.round((selectedItemData.totalWeight / (selectedData?.value || 1)) * 100)}%
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total %:</span>
              <div className="font-semibold text-lg text-green-600">
                {Math.round((selectedItemData.totalWeight / totalWeight) * 100)}%
              </div>
            </div>
            <div>
              <span className="text-gray-600">Unit Weight:</span>
              <div className="font-semibold">{selectedItemData.weightGrams}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default GearChart
