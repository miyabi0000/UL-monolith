import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../utils/AuthContext';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { SPACING_SCALE } from '../utils/designSystem';
import { useIsMobile } from '../hooks/useResponsiveSize';
import { useGearFocus } from '../hooks/useGearFocus';
import { ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode } from '../utils/types';
import type { GearAdvisorContext } from '../services/llmAdvisor';
import ChartPanel from './ChartPanel';
import PackTabBar from './PackTabBar';
import NotificationPopup from './NotificationPopup';
import SkeletonLoader from './ui/SkeletonLoader';
import ChatSidebar from './ChatSidebar';

const CategoryManager = React.lazy(() => import('./CategoryManager'));
const Login = React.lazy(() => import('./Login'));

interface InventoryWorkspaceProps {
  appState: ReturnType<typeof useAppState>;
  embedded?: boolean;
  renderLoginModal?: boolean;
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
  onOpenPackSettings?: () => void;
}

export default function InventoryWorkspace({
  appState,
  embedded = false,
  renderLoginModal = true,
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
  onOpenPackSettings,
}: InventoryWorkspaceProps) {
  const { login } = useAuth();
  const {
    showLogin, setShowLogin,
    showCategoryManager, setShowCategoryManager,
    showChat, setShowChat,
    showCheckboxes, setShowCheckboxes,
    gearItems,
    categories,
    isLoading,
    weightBreakdown,
    ulStatus,
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory
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
   * "Edit" アイコンが押された時の挙動。
   * ギアは既にインライン編集（EditableFields）で直接編集できるため、
   * ここでは対象行を selected にしてハイライトするだけ。
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

  const handleLoginSuccess = () => {
    showSuccess('Login successful');
    setShowLogin(false);
  };

  /**
   * Chat の 📋 Compare アイコン押下: compare モードを toggle する。
   * GearViewToggle から Compare セグメントを外した分、Chat アイコンが唯一の
   * エントリ/離脱口になるため toggle 動作で両方向を扱う。
   * - 離脱時: checkbox 選択も解除する
   */
  const handleToggleCompareMode = useCallback(() => {
    setGearViewMode((prev) => {
      const nextIsCompare = prev !== 'compare';
      setShowCheckboxes(nextIsCompare);
      return nextIsCompare ? 'compare' : 'table';
    });
  }, [setShowCheckboxes]);

  const routeMapQuery = (activePack?.routeName || activePack?.name || '').trim();
  const mapEmbedUrl = routeMapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(routeMapQuery)}&output=embed`
    : '';

  const containerClassName = embedded
    ? 'w-full'
    : 'max-w-6xl mx-auto transition-all duration-150 ease-out px-2 sm:px-4 md:px-6 lg:px-4';

  // Chat サイドバー展開時の右余白:
  // - embedded (PacksPage 配下): PacksPage main で padding-right を持つため適用不要
  // - standalone (/p/:packId など): 自身で適用
  const chatPaddingRight = !embedded && showChat && !isMobile ? '400px' : undefined;
  const containerStyle = embedded
    ? undefined
    : {
        paddingTop: `${SPACING_SCALE.md}px`,
        paddingBottom: `${SPACING_SCALE.md}px`,
        paddingRight: chatPaddingRight
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
      onShowCategoryManager={() => setShowCategoryManager(true)}
      gearViewMode={gearViewMode}
      onGearViewModeChange={setGearViewMode}
      showCheckboxes={showCheckboxes}
      onToggleCheckboxes={() => setShowCheckboxes(!showCheckboxes)}
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

                {selectedPackId && (
                  <div role="tabpanel" className="grid gap-2 px-3 pt-1 pb-2">
                    <section className="px-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200">Pack Info</h3>
                        <div className="flex items-center gap-1">
                          {onOpenPackSettings && (
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={onOpenPackSettings}
                              title="Edit pack"
                              aria-label="Edit pack"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          {onDeletePack && (
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => {
                                if (window.confirm('Delete this pack?')) {
                                  onDeletePack(selectedPackId);
                                }
                              }}
                              title="Delete pack"
                              aria-label="Delete pack"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      {activePack && (
                        <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                          <p>{activePack.description || 'No description'}</p>
                          <p>{`Items: ${activePackItemIds.length}`}</p>
                        </div>
                      )}
                    </section>

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

                <div className="px-1 pb-1">
                  {gearChartPanel}
                </div>
              </div>
            )}

            {packList === undefined && <div className="w-full">{gearChartPanel}</div>}
          </div>
        )}
      </div>

      <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
        {showCategoryManager && (
          <CategoryManager
            onClose={() => setShowCategoryManager(false)}
            categories={categories}
            onAddCategory={handleCreateCategory}
            onEditCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {renderLoginModal && showLogin && (
          <Login
            isOpen={showLogin}
            onLogin={login}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </Suspense>

      {/* Chat 中心 UX: Add / Advisor 統合サイドバー */}
      <ChatSidebar
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onGearExtracted={handleGearExtracted}
        onToggleCompareMode={handleToggleCompareMode}
        isCompareMode={gearViewMode === 'compare'}
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
