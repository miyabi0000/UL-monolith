import React from 'react'
import SegmentedControl from '../ui/SegmentedControl'
import CardIcon from '../icons/CardIcon'
import TableIcon from '../icons/TableIcon'
import CompareIcon from '../icons/CompareIcon'

type GearViewMode = 'table' | 'card' | 'compare'

interface GearViewToggleProps {
  gearViewMode: GearViewMode
  showCheckboxes: boolean
  onGearViewModeChange: (mode: GearViewMode) => void
  onToggleCheckboxes: () => void
}

/**
 * Card / Table / Compare ビューモード切替 (icon only, 正方形)
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
      shape="square"
      options={[
        {
          key: 'card',
          label: <CardIcon className="w-4 h-4" />,
          onClick: () => onGearViewModeChange('card'),
          isActive: gearViewMode === 'card',
          inactiveClassName: inactive,
          ariaLabel: 'Card view',
          title: 'Card',
        },
        {
          key: 'table',
          label: <TableIcon className="w-4 h-4" />,
          onClick: () => onGearViewModeChange('table'),
          isActive: gearViewMode === 'table',
          inactiveClassName: inactive,
          ariaLabel: 'Table view',
          title: 'Table',
        },
        {
          key: 'compare',
          label: <CompareIcon className="w-4 h-4" />,
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
          activeClassName: 'bg-gray-700 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm',
          ariaLabel: 'Compare view',
          title: showCheckboxes ? 'Exit Edit mode first' : 'Compare items',
        },
      ]}
    />
  )
}

export default GearViewToggle
