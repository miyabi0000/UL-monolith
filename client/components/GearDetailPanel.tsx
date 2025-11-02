import React from 'react';
import { GearItemWithCalculated } from '../utils/types';
import GearCardCompact from './GearCardCompact';
import OverviewView from './DetailPanel/OverviewView';
import CategorySummaryView from './DetailPanel/CategorySummaryView';

export type PanelMode = 'item' | 'category' | 'overview';

interface GearDetailPanelProps {
  mode: PanelMode;
  selectedItem: GearItemWithCalculated | null;
  selectedCategory: string | null;
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onEdit: (item: GearItemWithCalculated) => void;
  onDelete: (id: string) => void;
  onItemClick: (itemId: string) => void;
}

const GearDetailPanel: React.FC<GearDetailPanelProps> = ({
  mode,
  selectedItem,
  selectedCategory,
  items,
  viewMode,
  onEdit,
  onDelete,
  onItemClick,
}) => {
  // モードに応じて適切なビューを表示
  if (mode === 'item') {
    return (
      <GearCardCompact
        item={selectedItem}
        viewMode={viewMode}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  if (mode === 'category' && selectedCategory) {
    return (
      <CategorySummaryView
        categoryName={selectedCategory}
        items={items}
        viewMode={viewMode}
        onItemClick={onItemClick}
      />
    );
  }

  // デフォルト: overview
  return <OverviewView items={items} viewMode={viewMode} />;
};

export default React.memo(GearDetailPanel);
