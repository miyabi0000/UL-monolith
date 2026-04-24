import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAppState } from '../hooks/useAppState';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { SPACING_SCALE } from '../utils/designSystem';
import { useIsMobile } from '../hooks/useResponsiveSize';
import { useGearFocus } from '../hooks/useGearFocus';
import { ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode } from '../utils/types';
import type { GearAdvisorContext } from '../services/llmAdvisor';
import ChartPanel from './ChartPanel';
import PackTabBar from './PackTabBar';
import PackInfoSection from './PackInfoSection';
import NotificationPopup from './NotificationPopup';
import SkeletonLoader from './ui/SkeletonLoader';
import ChatSidebar from './ChatSidebar';

// 旧 GearForm / CategoryManager / ChatPopup / UrlBulkImportModal / GearInputModal
// および Login モーダルは ChatSidebar 一本化 & Landing 導入で廃止済み。
// モーダル起動用の state も useAppState から削除されている。

interface InventoryWorkspaceProps {
  appState: ReturnType<typeof useAppState>;
  embedded?: boolean;
  items?: GearItemWithCalculated[];
  // Pack integration
  activePack?: Pack | null;
  activePackItemIds?: string[];
  onTogglePackItem?: (itemId: string) => void;
  onAddItemsToPack?: (itemIds: string[]) => number;
  // Pack selector UI
  packList?: Array<{ id: string; name: string }>;
  selectedPackId?: string | null;
  onSelectPack?: (packId: string | null) => void;
  onCreatePack?: (name: string) => void;
  onDeletePack?: (packId: string) => void;
  // Pack 編集: インラインフォームから呼ぶ CRUD アクション
  onUpdatePack?: (updates: { name: string; routeName?: string; description?: string }) => void;
  onCopyPackLink?: () => void;
  onOpenPackPublic?: () => void;
}

export default function InventoryWorkspace({
  appState,
  embedded = false,
  items,
  activePack = null,
  activePackItemIds = [],
  onTogglePackItem,
  onAddItemsToPack,
  packList,
  selectedPackId,
  onSelectPack,
  onCreatePack,
  onDeletePack,
  onUpdatePack,
  onCopyPackLink,
  onOpenPackPublic,
}: InventoryWorkspaceProps) {
  const {
    showChat, setShowChat,
    gearItems,
    categories,
    isLoading,
    weightBreakdown,
    ulStatus,
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
  } = appState;

  const {
    messages,
    removeNotification,
    showSuccess,
    showError,
    showLoading
  } = useNotifications();
  const isMobile = useIsMobile();

  const [viewMode, setViewMode] = useState<ChartViewMode>('weight');
  const [quantityDisplayMode, setQuantityDisplayMode] = useState<QuantityDisplayMode>('all');
  const [gearViewMode, setGearViewMode] = useState<'table' | 'card' | 'compare'>(() => {
    const saved = localStorage.getItem('gearViewMode');
    return saved === 'table' || saved === 'card' || saved === 'compare' ? saved : 'table';
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // showCheckboxes は廃止: 行編集は per-row ⋯ メニュー、Compare は gearViewMode で判定

  // Chart ↔ Table/Card の双方向連動用: クリック選択 / ホバー強調
  const [selectedItemId, setSelectedItemIdRaw] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemIdRaw] = useState<string | null>(null);
  const setSelectedItemId = useCallback((id: string | null) => {
    setSelectedItemIdRaw((prev) => (prev === id ? prev : id));
  }, []);
  const setHoveredItemId = useCallback((id: string | null) => {
    setHoveredItemIdRaw((prev) => (prev === id ? prev : id));
  }, []);

  useEffect(() => {
    localStorage.setItem('gearViewMode', gearViewMode);
  }, [gearViewMode]);

  // 初回: リストが空なら Chat を自動で開く（Chat 中心 UX の入口誘導）
  const chatAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (chatAutoOpenedRef.current) return;
    if (isLoading) return;
    if (gearItems.length === 0) {
      setShowChat(true);
      chatAutoOpenedRef.current = true;
    }
  }, [isLoading, gearItems.length, setShowChat]);

  const scopedItems = items ?? gearItems;
  const activePackItems = useMemo(() => {
    if (!activePack) return [];
    return gearItems.filter((item) => activePackItemIds.includes(item.id));
  }, [activePack, gearItems, activePackItemIds]);
  const analysisItems = activePack ? activePackItems : scopedItems;

  useEffect(() => {
    setSelectedCategories([]);
  }, [analysisItems]);

  const chartData = useMemo(
    () => calculateChartData(analysisItems, quantityDisplayMode),
    [analysisItems, quantityDisplayMode]
  );
  const totals = useMemo(
    () => calculateTotals(analysisItems, quantityDisplayMode),
    [analysisItems, quantityDisplayMode]
  );

  // Advisor に渡すコンテキスト（ChatSidebar 内の "Advisor" モード用）
  const advisorContext = useMemo<GearAdvisorContext>(() => ({
    items: analysisItems,
    weightBreakdown: items ? null : weightBreakdown,
    ulStatus: items ? null : ulStatus,
    packName: activePack?.name ?? null,
  }), [analysisItems, items, weightBreakdown, ulStatus, activePack]);

  const handleAdvisorApplyEdit = useCallback(
    async (gearId: string, field: string, value: unknown) => {
      await handleUpdateGear(gearId, { [field]: value });
    },
    [handleUpdateGear],
  );

  const handleFocusGear = useGearFocus();

  /** ChatSidebar からギア抽出データが届いたら DB に保存する */
  const handleGearExtracted = useCallback(async (gearItem: any) => {
    const loadingId = showLoading('アイテムを作成中...');
    try {
      await handleCreateGear(gearItem);
      showSuccess('アイテムが追加されました');
    } catch (err) {
      showError('アイテムの作成に失敗しました');
      console.error('Error creating gear:', err);
    } finally {
      removeNotification(loadingId);
    }
  }, [handleCreateGear, showLoading, showSuccess, showError, removeNotification]);

  /**
   * 互換 shim: Card view 展開パネルの "Edit" / Advisor からの edit 要求で呼ばれる。
   * per-row 編集へ移行済みのため、ここでは該当行を selected にしてハイライトする
   * のみ。Card view の場合はユーザー自身で Table view に切替えて ⋯ → Edit を押す。
   */
  const handleEditGear = useCallback((gear: GearItemWithCalculated) => {
    setSelectedItemId(gear.id);
  }, [setSelectedItemId]);

  const handleUpdateItem = useCallback(async (id: string, field: string, value: GearFieldValue) => {
    try {
      await handleUpdateGear(id, { [field]: value });
    } catch (err) {
      showError('Failed to update item');
      console.error('Error updating item:', err);
    }
  }, [handleUpdateGear, showError]);

  const handleAddItemsToActivePack = useCallback((itemIds: string[]) => {
    if (!activePack || !onAddItemsToPack) return;
    const addedCount = onAddItemsToPack(itemIds);
    if (addedCount > 0) {
      showSuccess(`${activePack.name} に ${addedCount} 件追加しました`);
      return;
    }
    showError('追加対象がありません（すでにPackに入っています）');
  }, [activePack, onAddItemsToPack, showSuccess, showError]);

  // Route Map は pack.routeName が **明示的に** 登録されている時だけ表示する。
  //   1. routeName が空なら表示しない
  //   2. routeName === pack.name の場合、seed/デフォルトで同値のケースが多く
  //      （「あーだこーだ」のような非地名で世界地図が出る）、ユーザーが明示的に
  //      route を登録していないと判断して非表示にする
  const _routeName = activePack?.routeName?.trim() ?? '';
  const _packName = activePack?.name?.trim() ?? '';
  const routeMapQuery = _routeName && _routeName !== _packName ? _routeName : '';
  const mapEmbedUrl = routeMapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(routeMapQuery)}&output=embed`
    : '';

  const containerClassName = embedded
    ? 'w-full'
    : 'max-w-6xl mx-auto transition-all duration-150 ease-out px-2 sm:px-4 md:px-6 lg:px-4';

  // Chat は bottom sheet 化したため main に padding-right を差し込む必要はなくなった。
  const containerStyle = embedded
    ? undefined
    : {
        paddingTop: `${SPACING_SCALE.md}px`,
        paddingBottom: `${SPACING_SCALE.md}px`,
      };

  const gearChartPanel = (
    <ChartPanel
      data={chartData}
      totalWeight={totals.weight}
      totalCost={totals.price}
      viewMode={viewMode}
      quantityDisplayMode={quantityDisplayMode}
      selectedCategories={selectedCategories}
      onCategorySelect={setSelectedCategories}
      onViewModeChange={setViewMode}
      onQuantityDisplayModeChange={setQuantityDisplayMode}
      items={scopedItems}
      analysisItems={analysisItems}
      categories={categories}
      onEdit={handleEditGear}
      onDelete={handleDeleteGear}
      onUpdateItem={handleUpdateItem}
      gearViewMode={gearViewMode}
      onGearViewModeChange={setGearViewMode}
      weightBreakdown={items ? null : weightBreakdown}
      ulStatus={items ? null : ulStatus}
      activePack={activePack}
      activePackItemIds={activePackItemIds}
      onTogglePackItem={onTogglePackItem}
      onAddItemsToPack={handleAddItemsToActivePack}
      selectedItemId={selectedItemId}
      onItemSelect={setSelectedItemId}
      hoveredItemId={hoveredItemId}
      onItemHover={setHoveredItemId}
    />
  );

  return (
    <>
      <div className={containerClassName} style={containerStyle}>
        {isLoading ? (
          <>
            <SkeletonLoader variant="card" count={3} />
            <div className="mt-3">
              <SkeletonLoader variant="chart" />
            </div>
            <SkeletonLoader variant="table" />
          </>
        ) : (
          <div className={embedded ? 'w-full' : 'mb-16'}>
            {packList !== undefined && (
              <div className="mb-3">
                <PackTabBar
                  packList={packList}
                  selectedPackId={selectedPackId ?? null}
                  onSelectPack={(id) => onSelectPack?.(id)}
                  onCreatePack={onCreatePack}
                  onDeletePack={onDeletePack}
                />

                {/* Folder body: アクティブ tab の surface を共有して、
                 * タブとその内容が「1 つのフォルダ」として視覚的にまとまる */}
                <div className="pack-folder-body">
                  {selectedPackId && (
                    <div role="tabpanel" className="grid gap-2 px-3 pt-3 pb-2">
                      <PackInfoSection
                        pack={activePack}
                        itemCount={activePackItemIds.length}
                        onUpdate={onUpdatePack}
                        onDelete={onDeletePack ? () => {
                          if (window.confirm('Delete this pack?')) {
                            onDeletePack(selectedPackId);
                          }
                        } : undefined}
                        onCopyLink={onCopyPackLink}
                        onOpenPublic={onOpenPackPublic}
                      />

                      {mapEmbedUrl && (
                        <section className="rounded-lg p-3 bg-gray-50 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200">Route Map</h3>
                          <div className="mt-2 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                            <iframe
                              title="Route map"
                              src={mapEmbedUrl}
                              className="h-44 w-full"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  <div className="px-1 py-1">
                    {gearChartPanel}
                  </div>
                </div>
              </div>
            )}

            {packList === undefined && <div className="w-full">{gearChartPanel}</div>}
          </div>
        )}
      </div>

      {/* Chat 中心 UX: Add / Advisor 統合サイドバー */}
      <ChatSidebar
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onGearExtracted={handleGearExtracted}
        advisorContext={advisorContext}
        onApplyEdit={handleAdvisorApplyEdit}
        onFocusGear={handleFocusGear}
        categories={categories}
        existingItemCount={gearItems.length}
      />

      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </>
  );
}
