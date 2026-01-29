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

// シーズンアイコン
const SeasonIcon: React.FC<{ season: string }> = ({ season }) => {
  switch (season) {
    case 'spring':
      // 花・芽のアイコン
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      )
    case 'summer':
      // 太陽のアイコン
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )
    case 'fall':
      // 落ち葉のアイコン
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2c3.5 0 6.5 2.8 6.5 6.3 0 2.5-1.5 4.7-3.6 5.7.6-.9.9-2 .9-3.1 0-3-2.4-5.4-5.4-5.4S2.9 8 2.9 11c0 1.1.3 2.2.9 3.1C1.8 13 .3 10.8.3 8.3.3 4.8 3.3 2 6.8 2H10zm0 12c-1.7 0-3.1-1.4-3.1-3.1S8.3 7.8 10 7.8s3.1 1.4 3.1 3.1S11.7 14 10 14zm0 4a1 1 0 01-1-1v-2a1 1 0 012 0v2a1 1 0 01-1 1z" />
        </svg>
      )
    case 'winter':
      // 雪のアイコン
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 1l.7 2.1L13 2l-1.1 2.4L14 5l-2.4-.4L11 7v3l2.6 1.5 2-1.2-.7 2.5L17 14l-2.4.4 1.1 2.4-2.4-1.1-.6 2.3H11v-3l-2.6-1.5-2 1.2.7-2.5L5 11l2.4-.4-1.1-2.4 2.4 1.1.6-2.3H11V4l2.6-1.5 2 1.2-.7-2.5L17 0l-2.4.4 1.1-2.4-2.4 1.1L10 1z" />
        </svg>
      )
    default:
      return null
  }
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

  // クリックでの初期選択ハンドラ
  const handleBarClick = (e: React.MouseEvent) => {
    if (!isEditing || hasSelection) return

    const clickedIndex = getIndexFromPosition(e.clientX)
    if (onChange) {
      onChange(indicesToSeasons(clickedIndex, clickedIndex))
    }
  }

  // 選択なしの場合（編集モードでない場合のみ"-"を表示）
  if (!hasSelection && !isEditing) {
    return (
      <div className="w-full text-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
      </div>
    )
  }

  return (
    <div className="season-bar w-full min-w-[140px] overflow-x-auto" onClick={(e) => e.stopPropagation()}>
      {/* 季節アイコン */}
      <div className="flex justify-between mb-1 text-gray-500 dark:text-gray-400 select-none">
        {SEASONS.map(season => (
          <div key={season} className="flex flex-col items-center gap-0.5" style={{ width: '25%' }}>
            <div className="flex items-center justify-center">
              <SeasonIcon season={season} />
            </div>
            <span className={`text-center font-medium ${isSmall ? 'text-[9px]' : 'text-[10px]'}`}>
              {isSmall ? SEASON_LABELS_SHORT[season] : labels[season]}
            </span>
          </div>
        ))}
      </div>

      {/* スライダー */}
      <div
        ref={sliderRef}
        className={`relative ${isSmall ? 'h-2.5' : 'h-3'} bg-gray-200 dark:bg-gray-700 rounded-full ${
          isEditing && !hasSelection ? 'cursor-pointer' : ''
        }`}
        style={{ userSelect: 'none' }}
        onClick={handleBarClick}
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
            className={`absolute top-1/2 ${isSmall ? 'w-4 h-4' : 'w-5 h-5'} bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full shadow-lg transition-transform ${
              isEditing ? 'cursor-grab hover:scale-110' : 'cursor-default'
            } ${draggingHandle === 'start' ? 'scale-110 cursor-grabbing z-10' : 'z-[5]'}`}
            style={{
              left: `${getPosition(displayStart)}%`,
              transform: displayStart === displayEnd
                ? 'translateY(-50%) translateX(calc(-50% - 2px))' // 同じ位置の場合は少し左にずらす
                : 'translateY(-50%) translateX(-50%)'
            }}
            onMouseDown={handleMouseDown('start')}
            onTouchStart={handleMouseDown('start')}
          />
        )}

        {/* 終了ハンドル */}
        {hasSelection && (
          <div
            className={`absolute top-1/2 ${isSmall ? 'w-4 h-4' : 'w-5 h-5'} bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full shadow-lg transition-transform ${
              isEditing ? 'cursor-grab hover:scale-110' : 'cursor-default'
            } ${draggingHandle === 'end' ? 'scale-110 cursor-grabbing z-10' : 'z-[5]'}`}
            style={{
              left: `${getPosition(displayEnd)}%`,
              transform: displayStart === displayEnd
                ? 'translateY(-50%) translateX(calc(-50% + 2px))' // 同じ位置の場合は少し右にずらす
                : 'translateY(-50%) translateX(-50%)'
            }}
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
