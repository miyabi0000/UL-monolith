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

// シーズンアイコン
const SeasonIcon: React.FC<{ season: string; size?: 'sm' | 'md' }> = ({ season, size = 'md' }) => {
  const iconClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'

  switch (season) {
    case 'spring':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      )
    case 'summer':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )
    case 'fall':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2c3.5 0 6.5 2.8 6.5 6.3 0 2.5-1.5 4.7-3.6 5.7.6-.9.9-2 .9-3.1 0-3-2.4-5.4-5.4-5.4S2.9 8 2.9 11c0 1.1.3 2.2.9 3.1C1.8 13 .3 10.8.3 8.3.3 4.8 3.3 2 6.8 2H10zm0 12c-1.7 0-3.1-1.4-3.1-3.1S8.3 7.8 10 7.8s3.1 1.4 3.1 3.1S11.7 14 10 14zm0 4a1 1 0 01-1-1v-2a1 1 0 012 0v2a1 1 0 01-1 1z" />
        </svg>
      )
    case 'winter':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
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
                flex items-center justify-center rounded-md transition-all duration-150
                ${isSmall ? 'w-6 h-6' : 'w-8 h-8'}
                ${isEditing ? 'cursor-pointer' : 'cursor-default'}
                ${selected
                  ? 'bg-gray-700 text-white shadow-sm'
                  : isEditing
                    ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    : 'bg-transparent text-gray-300'
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
