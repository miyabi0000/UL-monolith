import React from 'react'
import SegmentedControl from '../ui/SegmentedControl'
import CardIcon from '../icons/CardIcon'
import TableIcon from '../icons/TableIcon'
import CompareIcon from '../icons/CompareIcon'

type GearViewMode = 'table' | 'card' | 'compare'

interface GearViewToggleProps {
  gearViewMode: GearViewMode
  onGearViewModeChange: (mode: GearViewMode) => void
}

/**
 * Card / Table / Compare ビューモード切替 (icon only, 正方形)
 *
 * per-row ⋯ 編集に移行済みのため、グローバル Edit モードとの排他制御は不要。
 * Compare はここで自由に切替可能。
 */
const GearViewToggle: React.FC<GearViewToggleProps> = ({
  gearViewMode,
  onGearViewModeChange,
}) => {
  const inactive = 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100'

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
            onGearViewModeChange(gearViewMode === 'compare' ? 'table' : 'compare')
          },
          isActive: gearViewMode === 'compare',
          activeClassName: 'bg-gray-700 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm',
          inactiveClassName: inactive,
          ariaLabel: 'Compare view',
          title: 'Compare items',
        },
      ]}
    />
  )
}

export default GearViewToggle
