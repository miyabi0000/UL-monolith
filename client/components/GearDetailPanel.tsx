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
  return (
    <div className="w-full h-full min-w-0 overflow-hidden">
      {mode === 'item' && (
        <GearCardCompact
          item={selectedItem}
          viewMode={viewMode}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {mode === 'category' && selectedCategory && (
        <CategorySummaryView
          categoryName={selectedCategory}
          items={items}
          viewMode={viewMode}
          onItemClick={onItemClick}
        />
      )}

      {mode === 'overview' && (
        <OverviewView items={items} viewMode={viewMode} onItemClick={onItemClick} />
      )}
    </div>
  );
};

export default React.memo(GearDetailPanel);
