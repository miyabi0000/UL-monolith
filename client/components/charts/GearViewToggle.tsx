import React from 'react'
import SegmentedControl from '../ui/SegmentedControl'

type GearViewMode = 'table' | 'card' | 'compare'

interface GearViewToggleProps {
  gearViewMode: GearViewMode
  showCheckboxes: boolean
  onGearViewModeChange: (mode: GearViewMode) => void
  onToggleCheckboxes: () => void
}

/**
 * Card / Table / Compare (A|B) ビューモード切替。
 *
 * Compare モードと showCheckboxes (Edit モード) が排他なので、
 * compare 選択時に Edit が有効なら先に抜ける副作用を持つ。
 */
const GearViewToggle: React.FC<GearViewToggleProps> = ({
  gearViewMode,
  showCheckboxes,
  onGearViewModeChange,
  onToggleCheckboxes,
}) => {
  const inactive = gearViewMode === 'compare'
    ? 'text-gray-400 dark:text-gray-500'
    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100'

  return (
    <SegmentedControl
      options={[
        {
          key: 'card',
          label: 'Card',
          onClick: () => onGearViewModeChange('card'),
          isActive: gearViewMode === 'card',
          inactiveClassName: inactive,
          ariaLabel: 'Card view',
        },
        {
          key: 'table',
          label: 'Table',
          onClick: () => onGearViewModeChange('table'),
          isActive: gearViewMode === 'table',
          inactiveClassName: inactive,
          ariaLabel: 'Table view',
        },
        {
          key: 'compare',
          label: 'A|B',
          onClick: () => {
            if (gearViewMode === 'compare') {
              onGearViewModeChange('table')
            } else {
              if (showCheckboxes) onToggleCheckboxes()
              onGearViewModeChange('compare')
            }
          },
          isActive: gearViewMode === 'compare',
          isDisabled: showCheckboxes && gearViewMode !== 'compare',
          activeClassName: 'bg-gray-700 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm',
          ariaLabel: 'Compare view',
          title: showCheckboxes ? 'Exit Edit mode first' : 'Compare items',
        },
      ]}
    />
  )
}

export default GearViewToggle
