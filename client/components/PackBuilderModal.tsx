import React, { useState, useMemo, useCallback, useEffect } from 'react'
import type { GearItemWithCalculated, Category, Pack } from '../utils/types'
import { isBig3Category } from '../utils/types'

interface PackBuilderModalProps {
  pack: Pack
  allItems: GearItemWithCalculated[]
  categories: Category[]
  onSave: (itemIds: string[]) => void
  onClose: () => void
}

const PackBuilderModal: React.FC<PackBuilderModalProps> = ({
  pack,
  allItems,
  categories,
  onSave,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(pack.itemIds)
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 左カラム: フィルタ済みアイテムリスト
  const filteredItems = useMemo(() => {
    let result = allItems
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.brand && item.brand.toLowerCase().includes(term))
      )
    }
    if (selectedCategory) {
      result = result.filter((item) => item.categoryId === selectedCategory)
    }
    return result
  }, [allItems, searchTerm, selectedCategory])

  // 右カラム: パック内アイテム（選択順を維持）
  const packItems = useMemo(() => {
    const idSet = selectedIds
    return allItems.filter((item) => idSet.has(item.id))
  }, [allItems, selectedIds])

  // 重量サマリー
  const weightSummary = useMemo(() => {
    let base = 0, worn = 0, consumable = 0
    for (const item of packItems) {
      const w = (item.weightGrams || 0) * item.requiredQuantity
      switch (item.weightClass) {
        case 'worn': worn += w; break
        case 'consumable': consumable += w; break
        default: base += w; break
      }
    }
    return { base, worn, consumable, total: base + worn + consumable }
  }, [packItems])

  const toggleItem = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }, [])

  const handleSave = () => {
    onSave(Array.from(selectedIds))
  }

  const hasChanges = useMemo(() => {
    const original = new Set(pack.itemIds)
    if (original.size !== selectedIds.size) return true
    for (const id of selectedIds) {
      if (!original.has(id)) return true
    }
    return false
  }, [pack.itemIds, selectedIds])

  // カテゴリ一覧（アイテムが存在するもののみ）
  const availableCategories = useMemo(() => {
    const categoryIds = new Set(allItems.map((item) => item.categoryId).filter(Boolean))
    return categories.filter((cat) => categoryIds.has(cat.id))
  }, [allItems, categories])

  const formatWeight = (grams: number) => {
    if (grams >= 1000) return `${(grams / 1000).toFixed(2)}kg`
    return `${grams}g`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel-xl flex flex-col"
        style={{ height: 'min(85vh, 720px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm neu-divider px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {pack.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedIds.size} items / {formatWeight(weightSummary.total)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn-primary text-sm px-3 py-1.5 disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>

        {/* 2カラムコンテンツ */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 左カラム: 全ギアリスト */}
          <div className="flex-[3] flex flex-col min-w-0 border-r border-gray-200 dark:border-slate-700">
            {/* 検索バー */}
            <div className="px-3 py-2 flex-shrink-0 space-y-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search gear..."
                  className="input w-full pl-8 pr-3 py-1.5 text-sm"
                  autoFocus
                />
              </div>

              {/* カテゴリフィルタ */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={[
                    'flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors',
                    selectedCategory === null
                      ? 'bg-gray-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  ].join(' ')}
                >
                  All
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={[
                      'flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors',
                      selectedCategory === cat.id
                        ? 'text-white dark:text-slate-900'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    ].join(' ')}
                    style={selectedCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* アイテムリスト */}
            <div className="flex-1 overflow-y-auto px-1">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {searchTerm || selectedCategory ? 'No matching items' : 'No gear items'}
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {filteredItems.map((item) => {
                    const isInPack = selectedIds.has(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={[
                          'w-full flex items-center gap-2 px-2 py-2 text-left transition-colors',
                          isInPack
                            ? 'bg-emerald-50/60 dark:bg-emerald-900/15'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                        ].join(' ')}
                      >
                        {/* サムネイル */}
                        <div className="w-9 h-9 flex-shrink-0 rounded bg-white dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-contain" loading="lazy" />
                          ) : (
                            <span className="text-[8px] text-gray-400 text-center leading-tight line-clamp-2 px-0.5">
                              {item.name}
                            </span>
                          )}
                        </div>

                        {/* 名前・カテゴリ */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.brand && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {item.brand}
                              </span>
                            )}
                            {item.category && (
                              <span
                                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.category.color }}
                              />
                            )}
                          </div>
                        </div>

                        {/* 重量 */}
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xs text-gray-600 dark:text-gray-300 tabular-nums">
                            {item.weightGrams ? `${item.weightGrams}g` : '—'}
                          </span>
                        </div>

                        {/* 追加/追加済みインジケータ */}
                        <div className="w-6 flex-shrink-0 flex justify-center">
                          {isInPack ? (
                            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 5v10M5 10h10" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右カラム: パック内容 */}
          <div className="flex-[2] flex flex-col min-w-0 bg-gray-50/50 dark:bg-slate-800/30">
            <div className="px-3 py-2 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Pack Contents
                <span className="ml-1.5 text-gray-900 dark:text-gray-100">{packItems.length}</span>
              </h3>
            </div>

            {/* パック内アイテムリスト */}
            <div className="flex-1 overflow-y-auto px-1">
              {packItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-2-3H6L4 7m16 0v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4" />
                  </svg>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    左のリストからアイテムを追加
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/60 dark:divide-slate-700/40">
                  {packItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-2 py-1.5 group"
                    >
                      {/* サムネイル */}
                      <div className="w-7 h-7 flex-shrink-0 rounded bg-white dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <span className="text-[7px] text-gray-400 text-center leading-tight line-clamp-2 px-0.5">
                            {item.name}
                          </span>
                        )}
                      </div>

                      {/* 名前 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                          {item.name}
                        </div>
                      </div>

                      {/* 重量 */}
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
                        {item.weightGrams ? `${item.weightGrams}g` : '—'}
                      </span>

                      {/* 削除ボタン */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from pack"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 重量サマリー */}
            {packItems.length > 0 && (
              <div className="flex-shrink-0 px-3 py-2 border-t border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Base</div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                      {formatWeight(weightSummary.base)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Worn</div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                      {formatWeight(weightSummary.worn)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Consumable</div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                      {formatWeight(weightSummary.consumable)}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 text-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatWeight(weightSummary.total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PackBuilderModal
