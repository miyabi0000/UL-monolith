import React from 'react'

interface SeasonBarProps {
  seasons?: string[]
  isEditing?: boolean
  onChange?: (seasons: string[]) => void
  size?: 'sm' | 'md'
}

const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const

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

// 選択時のTailwindクラス（gray / orange / blue の3色に収束）
const SEASON_SELECTED_CLASSES: Record<string, string> = {
  spring: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200',
  summer: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-200',
  fall:   'bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600 text-orange-900 dark:text-orange-200',
  winter: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200',
}

// 非選択時のアイコン色クラス
const SEASON_ICON_CLASSES: Record<string, string> = {
  spring: 'text-gray-600 dark:text-gray-400',
  summer: 'text-orange-500 dark:text-orange-400',
  fall:   'text-orange-600 dark:text-orange-500',
  winter: 'text-blue-600 dark:text-blue-500',
}

// シーズンアイコン
const SeasonIcon: React.FC<{ season: string; size?: 'sm' | 'md' }> = ({ season, size = 'md' }) => {
  const iconClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  switch (season) {
    case 'spring':
      // 花: 4枚の楕円ペタル + 中心円
      return (
        <svg className={iconClass} viewBox="0 0 20 20" fill="currentColor">
          <ellipse cx="10" cy="5.5" rx="2.5" ry="3" />
          <ellipse cx="10" cy="14.5" rx="2.5" ry="3" />
          <ellipse cx="5.5" cy="10" rx="3" ry="2.5" />
          <ellipse cx="14.5" cy="10" rx="3" ry="2.5" />
          <circle cx="10" cy="10" r="2.5" />
        </svg>
      )
    case 'summer':
      // 太陽: 光線付き
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )
    case 'fall':
      // 葉: 上部が丸い涙型の葉っぱ
      return (
        <svg className={iconClass} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2C6.5 4.5 5 8 5 11C5 14.3 7.2 17 10 18C12.8 17 15 14.3 15 11C15 8 13.5 4.5 10 2Z" />
          <path d="M10.6 18.2L11 19.5H9L9.4 18.2C9.6 18.1 9.8 18 10 18C10.2 18 10.4 18.1 10.6 18.2Z" />
        </svg>
      )
    case 'winter':
      // 雪の結晶: 3本の棒を60°ずつ回転
      return (
        <svg className={iconClass} viewBox="0 0 20 20" fill="currentColor">
          <rect x="9.25" y="2.5" width="1.5" height="15" rx="0.75" />
          <rect x="9.25" y="2.5" width="1.5" height="15" rx="0.75" transform="rotate(60 10 10)" />
          <rect x="9.25" y="2.5" width="1.5" height="15" rx="0.75" transform="rotate(120 10 10)" />
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
  const isSmall = size === 'sm'
  const labels = isSmall ? SEASON_LABELS_SHORT : SEASON_LABELS

  const isSelected = (season: string) => seasons.includes(season)

  const toggleSeason = (season: string) => {
    if (!onChange) return

    if (isSelected(season)) {
      onChange(seasons.filter(s => s !== season))
    } else {
      // SEASONSの順序で並べる
      const newSeasons = [...seasons, season].sort(
        (a, b) => SEASONS.indexOf(a as any) - SEASONS.indexOf(b as any)
      )
      onChange(newSeasons)
    }
  }

  // 選択なしの場合（編集モードでない場合のみ"-"を表示）
  if (seasons.length === 0 && !isEditing) {
    return (
      <div className="w-full text-center">
        <span className="text-xs text-gray-400">-</span>
      </div>
    )
  }

  return (
    <div
      className="season-bar w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`flex ${isSmall ? 'gap-0.5' : 'gap-1'} justify-center`}>
        {SEASONS.map(season => {
          const selected = isSelected(season)

          return (
            <button
              key={season}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (isEditing) {
                  toggleSeason(season)
                }
              }}
              disabled={!isEditing}
              className={`
                flex items-center justify-center rounded-md transition-all duration-150 border
                ${isSmall ? 'w-5 h-5' : 'w-7 h-7'}
                ${isEditing ? 'cursor-pointer' : 'cursor-default'}
                ${selected
                  ? `shadow-sm ${SEASON_SELECTED_CLASSES[season]}`
                  : isEditing
                    ? `${SEASON_ICON_CLASSES[season]} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:brightness-95`
                    : `${SEASON_ICON_CLASSES[season]} border-transparent bg-transparent opacity-75`
                }
              `}
              title={SEASON_LABELS[season]}
            >
              <SeasonIcon season={season} size={size} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SeasonBar
