import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { GearItemWithCalculated, ChartData, Category } from '../types'
import GearTable from '../components/GearTable'
import GearChart from '../components/GearChart'
// 遅延インポート（コード分割）
const GearForm = React.lazy(() => import('../components/GearForm'))
const CategoryManager = React.lazy(() => import('../components/CategoryManager'))  
const Login = React.lazy(() => import('../components/Login'))
const ChatPopup = React.lazy(() => import('../components/ChatPopup'))
import { useAuth } from '../context/AuthContext'
import seedData from '../data/seedGear.json'

// カテゴリ色取得のヘルパー関数
const getCategoryColor = (systemName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Clothing': '#FF6B6B',
    'Sleep': '#4ECDC4', 
    'Pack': '#FFE66D',
    'Electronics': '#4D96FF',
    'Hygiene': '#A66DFF'
  }
  return colorMap[systemName] || '#6B7280'
}

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingGear, setEditingGear] = useState<GearItemWithCalculated | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [gearData, setGearData] = useState(seedData)
  const [showGearDropdown, setShowGearDropdown] = useState(false)
  const [showCheckboxes, setShowCheckboxes] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Clothing', path: ['Clothing'], color: '#FF6B6B', createdAt: new Date().toISOString() },
    { id: '2', name: 'Sleep', path: ['Sleep'], color: '#4ECDC4', createdAt: new Date().toISOString() },
    { id: '3', name: 'Pack', path: ['Pack'], color: '#FFE66D', createdAt: new Date().toISOString() },
    { id: '4', name: 'Electronics', path: ['Electronics'], color: '#4D96FF', createdAt: new Date().toISOString() },
    { id: '5', name: 'Hygiene', path: ['Hygiene'], color: '#A66DFF', createdAt: new Date().toISOString() },
  ])

  // シードデータを新しい型に変換
  const gearItems: GearItemWithCalculated[] = useMemo(() => {
    return (gearData as any[]).map((item, index) => {
      const required = Math.max(1, Number(item.required_quantity) || 1)
      const owned = Math.max(0, Number(item.owned_quantity) || 0)
      const weight = Number(item.weight_grams) || 0
      const price = Number(item.price_cents) || 0
      const priority = Math.min(5, Math.max(1, Number(item.priority) || 3))
      
      return {
        id: String(index),
        userId: 'user1',
        name: item.name || item.brand || 'Unknown Item',
        brand: item.brand || undefined,
        productUrl: item.product_url || undefined,
        requiredQuantity: required,
        ownedQuantity: owned,
        weightGrams: weight > 0 ? weight : undefined,
        priceCents: price > 0 ? price : undefined,
        season: item.season || undefined,
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // 計算フィールド
        shortage: required - owned,
        totalWeight: (weight || 0) * required,
        
        // カテゴリ情報（簡易）
        category: {
          id: `cat-${index}`,
          name: item.system || 'Other',
          path: [item.system || 'Other'],
          color: getCategoryColor(item.system),
          createdAt: new Date().toISOString()
        }
      }
    })
  }, [gearData])

  // チャートデータの生成
  const chartData: ChartData[] = useMemo(() => {
    const categoryMap = new Map<string, { weight: number; items: GearItemWithCalculated[]; color: string }>()
    
    gearItems.forEach(item => {
      const categoryName = item.category?.name || 'Other'
      const existing = categoryMap.get(categoryName) || { weight: 0, items: [], color: item.category?.color || '#6B7280' }
      existing.weight += item.totalWeight
      existing.items.push(item)
      categoryMap.set(categoryName, existing)
    })

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.weight,
      color: data.color,
      items: data.items
    }))
  }, [gearItems])

  // 集計データの最適化
  const { totalWeight, totalPrice, missingItems } = useMemo(() => {
    let weight = 0
    let price = 0
    let missing = 0
    
    gearItems.forEach(item => {
      weight += item.totalWeight
      price += item.priceCents || 0
      if (item.shortage > 0) missing++
    })
    
    return { totalWeight: weight, totalPrice: price, missingItems: missing }
  }, [gearItems])

  const handleAddGear = useCallback(() => {
    setEditingGear(null)
    setShowForm(true)
  }, [])

  const handleEditGear = useCallback((gear: GearItemWithCalculated) => {
    setEditingGear(gear)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingGear(null)
  }, [])

  const handleDeleteGear = useCallback((ids: string[]) => {
    const updatedData = gearData.filter((_, index) => !ids.includes(String(index)))
    setGearData(updatedData)
    setShowCheckboxes(false)
  }, [gearData])

  const handleToggleDeleteMode = () => {
    setShowCheckboxes(!showCheckboxes)
    setShowGearDropdown(false)
  }

  const handleAddCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setCategories([...categories, newCategory])
  }

  const handleEditCategory = (updatedCategory: Category) => {
    setCategories(categories.map(cat => 
      cat.id === updatedCategory.id ? updatedCategory : cat
    ))
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId))
  }

  const handleSaveGear = (gear: GearItemWithCalculated) => {
    console.log('Save gear item:', gear)
    // Here you would typically save to a backend API
    // For now, just log the action
  }

  const handleUpdateItem = (id: string, field: string, value: any) => {
    const itemIndex = parseInt(id, 10)
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= gearData.length) {
      console.error('Invalid item ID:', id)
      return
    }
    
    const updatedData = gearData.map((item, index) => {
      if (index === itemIndex) {
        const updatedItem = { ...item }
        
        if (field === 'ownedQuantity') {
          const clampedValue = Math.max(0, Math.min(10, value))
          updatedItem.owned_quantity = clampedValue
          updatedItem.shortage = (Number(item.required_quantity || 1) - clampedValue)
        } else if (field === 'requiredQuantity') {
          const clampedValue = Math.max(1, Math.min(10, value))
          updatedItem.required_quantity = clampedValue
          updatedItem.shortage = (clampedValue - Number(item.owned_quantity || 0))
        } else if (field === 'priority') {
          const clampedValue = Math.max(1, Math.min(5, value))
          updatedItem.priority = clampedValue
        }
        
        return updatedItem
      }
      return item
    })
    setGearData(updatedData)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setShowGearDropdown(false)
    }
    
    if (showGearDropdown) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showGearDropdown])

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const success = await login(email, password)
    if (success) {
      setShowLogin(false)
    }
    return success
  }

  const handleGearExtracted = (gearData: any) => {
    // チャットから抽出されたギアデータを追加
    const newItem = {
      system: 'Other',
      system_layer: '',
      category: '',
      name: gearData.name,
      product_url: gearData.productUrl || '',
      brand: gearData.brand || '',
      required_quantity: gearData.requiredQuantity,
      owned_quantity: gearData.ownedQuantity,
      shortage: (gearData.requiredQuantity - gearData.ownedQuantity),
      weight_grams: gearData.weightGrams || null,
      total_weight_grams: gearData.weightGrams ? (gearData.weightGrams * gearData.requiredQuantity) : 0,
      price_cents: gearData.priceCents || 0,
      season: gearData.season || '',
      priority: gearData.priority
    }
    setGearData(prev => [...prev, newItem])
    setSuccessMessage('AIがギアを自動追加しました！')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">UL Gear Manager</h1>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <button 
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-gray-900 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to UL Gear Manager</h2>
              <p className="text-gray-600 mb-6">Please log in to manage your gear collection</p>
              <button
                onClick={() => setShowLogin(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Login to Continue
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Demo credentials: demo@example.com / demo123
              </p>
            </div>
          </div>
        ) : (
        <div>
        {/* Weight Analysis with compact summary cards */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Weight Analysis</h2>
            </div>
            <div className="p-6">
              <div className="flex gap-8">
                {/* Pie Chart */}
                <div className="flex-1">
                  <GearChart data={chartData} totalWeight={totalWeight} />
                </div>
                
                {/* Vertical Summary Cards */}
                <div className="w-32 space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">📦</div>
                    <div className="text-xs text-gray-500 mb-1">Items</div>
                    <div className="text-sm font-bold text-gray-900">{gearItems.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">⚖️</div>
                    <div className="text-xs text-gray-600 mb-1">Weight</div>
                    <div className="text-sm font-bold text-gray-900">{totalWeight}g</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-xs text-gray-600 mb-1">Cost</div>
                    <div className="text-sm font-bold text-gray-900">¥{Math.round(totalPrice / 100).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">❌</div>
                    <div className="text-xs text-gray-600 mb-1">Missing</div>
                    <div className="text-sm font-bold text-gray-900">{missingItems}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ギアテーブル */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gear Items</h2>
            <div className="flex items-center space-x-2 relative">
              {isAuthenticated && (
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Categories
                </button>
              )}
              <button
                onClick={handleAddGear}
                className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Gear
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowGearDropdown(!showGearDropdown)
                }}
                className="text-gray-300 hover:text-gray-500 p-1 rounded-full hover:bg-gray-50 transition-colors text-sm"
              >
                ⋮
              </button>
              
              {showGearDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-md z-50 min-w-[120px] py-1">
                  <button
                    onClick={() => {
                      console.log('Bulk edit functionality')
                      setShowGearDropdown(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors block"
                  >
                    Bulk Edit
                  </button>
                  <button
                    onClick={handleToggleDeleteMode}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors block"
                  >
                    {showCheckboxes ? 'Cancel Delete' : 'Delete Items'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <GearTable 
            items={gearItems} 
            onEdit={handleEditGear}
            onDelete={handleDeleteGear}
            onSave={handleSaveGear}
            onUpdateItem={handleUpdateItem}
            showCheckboxes={showCheckboxes}
          />
        </div>

        {/* フォームモーダル */}
        {showForm && (
          <React.Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Loading...</div></div>}>
            <GearForm
            gear={editingGear}
            categories={categories}
            onClose={handleCloseForm}
            onSave={(gear) => {
              if (editingGear) {
                // Edit existing gear
                const updatedData = gearData.map((item, index) => 
                  String(index) === editingGear.id ? {
                    ...item,
                    name: gear.name,
                    brand: gear.brand || '',
                    product_url: gear.productUrl || '',
                    required_quantity: gear.requiredQuantity,
                    owned_quantity: gear.ownedQuantity,
                    weight_grams: gear.weightGrams || null,
                    price_cents: gear.priceCents || 0,
                    priority: gear.priority
                  } : item
                )
                setGearData(updatedData)
                setSuccessMessage('Gear item updated successfully!')
              } else {
                // Add new gear
                const newItem = {
                  system: 'Other',
                  system_layer: '',
                  category: '',
                  name: gear.name,
                  product_url: gear.productUrl || '',
                  brand: gear.brand || '',
                  required_quantity: gear.requiredQuantity,
                  owned_quantity: gear.ownedQuantity,
                  shortage: (gear.requiredQuantity - gear.ownedQuantity),
                  weight_grams: gear.weightGrams || null,
                  total_weight_grams: gear.weightGrams ? (gear.weightGrams * gear.requiredQuantity) : 0,
                  price_cents: gear.priceCents || 0,
                  season: gear.season || '',
                  priority: gear.priority
                }
                setGearData([...gearData, newItem])
                setSuccessMessage('New gear item added successfully!')
              }
              handleCloseForm()
            }}
            />
          </React.Suspense>
        )}

        {/* カテゴリ管理モーダル */}
        {showCategoryManager && (
          <React.Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Loading...</div></div>}>
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onClose={() => setShowCategoryManager(false)}
            />
          </React.Suspense>
        )}

        </div>
        )}

        {/* Login Modal */}
        {showLogin && (
          <React.Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Loading...</div></div>}>
            <Login
              onLogin={handleLogin}
              onClose={() => setShowLogin(false)}
            />
          </React.Suspense>
        )}

        {/* Floating Chat Button */}
        {isAuthenticated && (
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center z-40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {/* Chat Popup */}
        <React.Suspense fallback={null}>
          <ChatPopup
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            onGearExtracted={handleGearExtracted}
          />
        </React.Suspense>

        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  )
}



