import React from 'react'
import { SUCCESS_TONE } from './styles'

interface QuantitySelectorProps {
  ownedQuantity: number
  requiredQuantity: number
  onOwnedChange: (value: number) => void
  onRequiredChange: (value: number) => void
}

/** 所持数 / 必要数のセレクタ対。所持数が必要数以上なら SUCCESS トーンで強調。 */
export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  ownedQuantity,
  requiredQuantity,
  onOwnedChange,
  onRequiredChange,
}) => {
  return (
    <div className="flex h-6 items-center justify-center gap-1">
      {/* Owned数（強調表示） */}
      <select
        value={ownedQuantity}
        onChange={(e) => onOwnedChange(parseInt(e.target.value))}
        className={`w-7 h-6 gear-input-num font-semibold gear-glass-control rounded border focus:outline-none focus:ring-0 appearance-none cursor-pointer ${
          ownedQuantity >= requiredQuantity ? '' : 'text-gray-900 dark:text-gray-100'
        }`}
        style={ownedQuantity >= requiredQuantity ? { color: SUCCESS_TONE.text } : undefined}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <span className="gear-text-sub text-gray-300 dark:text-gray-500">/</span>
      {/* Required 数 */}
      <select
        value={requiredQuantity}
        onChange={(e) => onRequiredChange(parseInt(e.target.value))}
        className="w-7 h-6 gear-input-num text-gray-500 dark:text-gray-300 gear-glass-control rounded border focus:outline-none focus:ring-0 appearance-none cursor-pointer"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1}</option>
        ))}
      </select>
    </div>
  )
}
