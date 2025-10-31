import React, { useState, useRef, useEffect, useCallback } from 'react'

interface SeasonBarProps {
  seasons?: string[]
  isEditing?: boolean
  onChange?: (seasons: string[]) => void
  size?: 'sm' | 'md'
}

const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const
const SEASON_COUNT = 4
const MAX_SEASON_INDEX = 3

const SEASON_LABELS: Record<string, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter'
}

const SEASON_LABELS_SHORT: Record<string, string> = {
  spring: 'Sp',
  summer: 'Su',
  fall: 'Fa',
  winter: 'Wi'
}

const SeasonBar: React.FC<SeasonBarProps> = ({
  seasons = [],
  isEditing = false,
  onChange,
  size = 'md'
}) => {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null)

  // 選択された季節から開始・終了インデックスを計算
  const getIndices = (): { start: number; end: number } => {
    if (!seasons || seasons.length === 0) {
      return { start: -1, end: -1 }
    }

    const indices = seasons
      .map(s => SEASONS.indexOf(s as any))
      .filter(i => i !== -1)
      .sort((a, b) => a - b)

    if (indices.length === 0) {
      return { start: -1, end: -1 }
    }

    return { start: indices[0], end: indices[indices.length - 1] }
  }

  const { start: startIndex, end: endIndex } = getIndices()

  // ドラッグ中の一時的な状態を保持
  const [tempIndices, setTempIndices] = useState<{ start: number; end: number } | null>(null)

  // 表示用のインデックス（ドラッグ中は一時的な値を使用）
  const displayStart = tempIndices ? tempIndices.start : startIndex
  const displayEnd = tempIndices ? tempIndices.end : endIndex

  // インデックスから季節配列を生成
  const indicesToSeasons = (start: number, end: number): string[] => {
    if (start === -1 || end === -1) return []
    return SEASONS.slice(start, end + 1) as unknown as string[]
  }

  // マウス/タッチ位置からインデックスを計算
  const getIndexFromPosition = (clientX: number): number => {
    if (!sliderRef.current) return 0

    const rect = sliderRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width))

    // 4つの季節を均等に配置
    const rawIndex = percentage * MAX_SEASON_INDEX
    return Math.round(rawIndex)
  }

  // ドラッグ開始
  const handleMouseDown = (handle: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditing) return

    e.preventDefault()
    e.stopPropagation()
    setDraggingHandle(handle)
  }

  // onChangeをrefに保存して依存配列から除外
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // ドラッグ中
  useEffect(() => {
    if (!draggingHandle || !isEditing) return

    let latestIndices: { start: number; end: number } | null = null

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const newIndex = getIndexFromPosition(clientX)

      let newStart = startIndex
      let newEnd = endIndex

      if (draggingHandle === 'start') {
        newStart = Math.min(newIndex, endIndex === -1 ? MAX_SEASON_INDEX : endIndex)
        if (newEnd === -1) newEnd = newStart
      } else {
        newEnd = Math.max(newIndex, startIndex === -1 ? 0 : startIndex)
        if (newStart === -1) newStart = newEnd
      }

      // ローカル変数に保存（クロージャで参照）
      latestIndices = { start: newStart, end: newEnd }
      // ドラッグ中は一時的な状態を保存するだけ（onChangeは呼ばない）
      setTempIndices(latestIndices)
    }

    const handleUp = () => {
      // ドラッグ終了時に一度だけonChangeを呼ぶ（ローカル変数から取得）
      if (latestIndices && onChangeRef.current) {
        const newSeasons = indicesToSeasons(latestIndices.start, latestIndices.end)
        onChangeRef.current(newSeasons)
      }
      setDraggingHandle(null)
      setTempIndices(null)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleUp)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingHandle, startIndex, endIndex, isEditing])

  // 各季節の位置（0-3のインデックスを0%-100%に変換）
  const getPosition = (index: number): number => {
    if (index === -1) return 0
    return (index / MAX_SEASON_INDEX) * 100
  }

  const hasSelection = displayStart !== -1 && displayEnd !== -1
  const isSmall = size === 'sm'
  const labels = isSmall ? SEASON_LABELS_SHORT : SEASON_LABELS

  // 選択なしの場合（編集モードでない場合のみ"-"を表示）
  if (!hasSelection && !isEditing) {
    return (
      <div className="w-full text-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
      </div>
    )
  }

  return (
    <div className="season-bar w-full" onClick={(e) => e.stopPropagation()}>
      {/* 季節ラベル */}
      <div className={`flex justify-between mb-1 ${isSmall ? 'text-[9px]' : 'text-[10px]'} text-gray-500 dark:text-gray-400 select-none`}>
        {SEASONS.map(season => (
          <span key={season} className="text-center" style={{ width: '25%' }}>
            {labels[season]}
          </span>
        ))}
      </div>

      {/* スライダー */}
      <div
        ref={sliderRef}
        className={`relative ${isSmall ? 'h-1.5' : 'h-2'} bg-gray-200 dark:bg-gray-700 rounded-full`}
        style={{ userSelect: 'none' }}
      >
        {/* 選択範囲バー */}
        {hasSelection && (
          <div
            className="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
            style={{
              left: `${getPosition(displayStart)}%`,
              right: `${100 - getPosition(displayEnd)}%`
            }}
          />
        )}

        {/* 開始ハンドル */}
        {hasSelection && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${isSmall ? 'w-3 h-3' : 'w-4 h-4'} bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full shadow-md transition-transform ${
              isEditing ? 'cursor-grab hover:scale-125' : 'cursor-default'
            } ${draggingHandle === 'start' ? 'scale-125 cursor-grabbing' : ''}`}
            style={{ left: `${getPosition(displayStart)}%` }}
            onMouseDown={handleMouseDown('start')}
            onTouchStart={handleMouseDown('start')}
          />
        )}

        {/* 終了ハンドル */}
        {hasSelection && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${isSmall ? 'w-3 h-3' : 'w-4 h-4'} bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full shadow-md transition-transform ${
              isEditing ? 'cursor-grab hover:scale-125' : 'cursor-default'
            } ${draggingHandle === 'end' ? 'scale-125 cursor-grabbing' : ''}`}
            style={{ left: `${getPosition(displayEnd)}%` }}
            onMouseDown={handleMouseDown('end')}
            onTouchStart={handleMouseDown('end')}
          />
        )}

        {/* 季節の区切り線 */}
        {SEASONS.map((season, index) => (
          <div
            key={season}
            className="absolute top-0 h-full w-px bg-gray-300 dark:bg-gray-600 opacity-30"
            style={{ left: `${getPosition(index)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export default SeasonBar
