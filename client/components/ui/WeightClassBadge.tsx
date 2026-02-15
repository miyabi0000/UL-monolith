import React from 'react'
import { WeightClass } from '../../utils/types'

interface WeightClassBadgeProps {
  weightClass: WeightClass
  isBig3?: boolean
  compact?: boolean
}

// SVGアイコンコンポーネント
const BackpackIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V10" />
    <path d="M9 20V14H15V20" />
    <path d="M5 10C5 7.79 6.79 6 9 6H15C17.21 6 19 7.79 19 10" />
    <path d="M9 6V4C9 3.45 9.45 3 10 3H14C14.55 3 15 3.45 15 4V6" />
    <path d="M12 10V12" />
  </svg>
)

const ShirtIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2.79V2C16 1.45 15.55 1 15 1H9C8.45 1 8 1.45 8 2V2.79L3.62 3.46C3.24 3.52 3 3.86 3 4.24V8L8 10V22C8 22.55 8.45 23 9 23H15C15.55 23 16 22.55 16 22V10L21 8V4.24C21 3.86 20.76 3.52 20.38 3.46Z" />
  </svg>
)

const UtensilsIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2V11C3 12.1 3.9 13 5 13H6V22H8V13H9C10.1 13 11 12.1 11 11V2" />
    <path d="M7 2V8" />
    <path d="M17 2C17 2 21 3 21 8C21 13 17 14 17 14V22H15V14C15 14 11 13 11 8C11 3 15 2 15 2" />
  </svg>
)

const WEIGHT_CLASS_CONFIG = {
  base: {
    Icon: BackpackIcon,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    label: 'Base'
  },
  worn: {
    Icon: ShirtIcon,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    label: 'Worn'
  },
  consumable: {
    Icon: UtensilsIcon,
    color: '#F97316',
    bgColor: '#FED7AA',
    label: 'Cons'
  }
} as const

const WeightClassBadge: React.FC<WeightClassBadgeProps> = ({ weightClass, isBig3 = false, compact = false }) => {
  const config = WEIGHT_CLASS_CONFIG[weightClass]
  const IconComponent = config.Icon

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded"
          style={{ backgroundColor: config.bgColor, color: config.color }}
          title={`${config.label} - ${weightClass === 'base' ? '背負って運ぶ' : weightClass === 'worn' ? '身に着けて運ぶ' : '消費物'}`}
        >
          <IconComponent className="w-3 h-3" />
        </span>
        {isBig3 && (
          <span
            className="px-1 py-0.5 text-[9px] font-bold rounded bg-gray-200 text-gray-700"
            title="Big3: Backpack / Shelter / Sleep"
          >
            B3
          </span>
        )}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium gap-0.5"
        style={{ backgroundColor: config.bgColor, color: config.color }}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
      {isBig3 && (
        <span
          className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-200 text-gray-700"
          title="Big3: Backpack / Shelter / Sleep"
        >
          Big3
        </span>
      )}
    </span>
  )
}

export default WeightClassBadge
