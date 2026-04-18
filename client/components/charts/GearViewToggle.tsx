import React from 'react'
import SegmentedControl from '../ui/SegmentedControl'
import CardIcon from '../icons/CardIcon'
import TableIcon from '../icons/TableIcon'

type GearViewMode = 'table' | 'card' | 'compare'

interface GearViewToggleProps {
  gearViewMode: GearViewMode
  /** 互換のため残置。Compare モード自体は Chat の 📋 アイコンから起動される */
  showCheckboxes: boolean
  onGearViewModeChange: (mode: GearViewMode) => void
  /** 互換のため残置、現状の描画では未使用 */
  onToggleCheckboxes: () => void
}

/**
 * Card / Table の 2 値ビューモード切替 (icon only, 正方形)。
 *
 * Compare モードへの切替は ChatSidebar の 📋 Compare アイコンに集約済み。
 * 本コンポーネントから compare セグメントは削除されており、
 * gearViewMode === 'compare' の間は active な segment が無い状態になる。
 */
const GearViewToggle: React.FC<GearViewToggleProps> = ({
  gearViewMode,
  onGearViewModeChange,
  showCheckboxes: _showCheckboxes,
  onToggleCheckboxes: _onToggleCheckboxes,
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
      ]}
    />
  )
}

export default GearViewToggle
