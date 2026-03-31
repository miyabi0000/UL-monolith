import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useBulkGearExtraction } from '../hooks/useBulkGearExtraction';
import { useNotifications } from '../hooks/useNotifications';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../utils/AuthContext';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { SPACING_SCALE } from '../utils/designSystem';
import { ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode } from '../utils/types';
import GearChart from './GearChart';
import PackTabBar from './PackTabBar';
import NotificationPopup from './NotificationPopup';
import SkeletonLoader from './ui/SkeletonLoader';

const GearForm = React.lazy(() => import('./GearForm'));
const CategoryManager = React.lazy(() => import('./CategoryManager'));
const Login = React.lazy(() => import('./Login'));
const ChatPopup = React.lazy(() => import('./ChatPopup'));
const UrlBulkImportModal = React.lazy(() => import('./gear-input/UrlBulkImportModal'));
const GearInputModal = React.lazy(() => import('./gear-input/GearInputModal'));

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
    showForm, setShowForm,
    editingGear, setEditingGear,
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

  const [viewMode, setViewMode] = useState<ChartViewMode>('weight');
  const [quantityDisplayMode, setQuantityDisplayMode] = useState<QuantityDisplayMode>('all');
  const [gearViewMode, setGearViewMode] = useState<'table' | 'card' | 'compare'>(() => {
    const saved = localStorage.getItem('gearViewMode');
    return saved === 'table' || saved === 'card' || saved === 'compare' ? saved : 'table';
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showBulkReview, setShowBulkReview] = useState(false);

  const {
    extractGears,
    extractedGears,
    failedUrls,
    isExtracting,
    progress,
    reset: resetExtraction
  } = useBulkGearExtraction();

  useEffect(() => {
    localStorage.setItem('gearViewMode', gearViewMode);
  }, [gearViewMode]);


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

  const handleSaveGear = async (gearItem: any) => {
    const loadingId = showLoading(editingGear ? 'アイテムを更新中...' : 'アイテムを作成中...');

    try {
      if (editingGear) {
        await handleUpdateGear(editingGear.id, gearItem);
        showSuccess('アイテムが正常に更新されました');
      } else {
        await handleCreateGear(gearItem);
        showSuccess('アイテムが正常に作成されました');
      }

      setShowForm(false);
      setEditingGear(null);
    } catch (err) {
      showError(editingGear ? 'アイテムの更新に失敗しました' : 'アイテムの作成に失敗しました');
      console.error('Error saving gear:', err);
    } finally {
      removeNotification(loadingId);
    }
  };

  const handleEditGear = (gear: any) => {
    setEditingGear(gear);
    setShowForm(true);
  };

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

  const handleExtractUrls = async (urls: string[]) => {
    const loadingId = showLoading(`Extracting ${urls.length} URLs...`);

    try {
      await extractGears(urls, categories);
      removeNotification(loadingId);
    } catch (err) {
      showError('Failed to extract gear information');
      console.error('Error extracting URLs:', err);
      removeNotification(loadingId);
    }
  };

  const handleProceedToReview = () => {
    setShowUrlImport(false);
    setShowBulkReview(true);
  };

  const handleBulkReviewComplete = (savedCount: number, skippedCount: number) => {
    setShowBulkReview(false);
    resetExtraction();
    showSuccess(`${savedCount} items added, ${skippedCount} skipped`);
  };

  const routeMapQuery = (activePack?.routeName || activePack?.name || '').trim();
  const mapEmbedUrl = routeMapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(routeMapQuery)}&output=embed`
    : '';

  const containerClassName = embedded
    ? 'w-full'
    : 'max-w-6xl mx-auto transition-all duration-150 ease-out px-4 sm:px-6 md:px-8 lg:px-[16px]';

  const containerStyle = embedded
    ? { paddingRight: showChat ? '400px' : undefined }
    : {
        paddingTop: `${SPACING_SCALE.md}px`,
        paddingBottom: `${SPACING_SCALE.md}px`,
        paddingRight: showChat ? '400px' : undefined
      };

  const gearChartPanel = (
    <GearChart
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
      onShowForm={() => setShowForm(true)}
      onShowUrlImport={() => setShowUrlImport(true)}
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
              <div className="mb-3 rounded-2xl border border-gray-200/80 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 neu-raised overflow-hidden">
                <PackTabBar
                  packList={packList}
                  selectedPackId={selectedPackId ?? null}
                  onSelectPack={(id) => onSelectPack?.(id)}
                  onCreatePack={onCreatePack}
                  onDeletePack={onDeletePack}
                />

                <div role="tabpanel" className="grid gap-3 px-3 pb-3">
                  <section className="px-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200">Pack Info</h3>
                      {selectedPackId && onOpenPackSettings && (
                        <button
                          type="button"
                          className="btn-secondary h-7 px-2.5 text-xs"
                          onClick={onOpenPackSettings}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {activePack ? (
                      <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                        <p>{activePack.name}</p>
                        <p>{activePack.description || 'No description'}</p>
                        <p>{`Items: ${activePackItemIds.length}`}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">All gear is selected.</p>
                    )}
                  </section>

                  {mapEmbedUrl && (
                    <section className="rounded-2xl bg-white/80 dark:bg-slate-800/80 p-3 neu-inset border border-gray-200/70 dark:border-slate-700/70">
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200">Route Map</h3>
                      <div className="mt-2 overflow-hidden rounded-md border border-gray-200/80 dark:border-slate-700/80">
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

                <div className="px-3 pb-3 pt-3">
                  {gearChartPanel}
                </div>
              </div>
            )}

            {packList === undefined && <div className="w-full">{gearChartPanel}</div>}
          </div>
        )}
      </div>

      <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
        {showForm && (
          <GearForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingGear(null);
            }}
            onSave={handleSaveGear}
            categories={categories}
            editingGear={editingGear}
          />
        )}

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

        {showChat && (
          <ChatPopup
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            categories={categories}
            onGearExtracted={handleSaveGear}
          />
        )}

        {showUrlImport && (
          <UrlBulkImportModal
            isOpen={showUrlImport}
            onClose={() => {
              setShowUrlImport(false);
              resetExtraction();
            }}
            onExtract={handleExtractUrls}
            onProceed={handleProceedToReview}
            isExtracting={isExtracting}
            progress={progress}
            extractedCount={extractedGears.length}
            failedCount={failedUrls.length}
          />
        )}

        {showBulkReview && extractedGears.length > 0 && (
          <GearInputModal
            isOpen={showBulkReview}
            onClose={() => {
              setShowBulkReview(false);
              resetExtraction();
            }}
            onSave={handleSaveGear}
            categories={categories}
            bulkMode={true}
            bulkGears={extractedGears}
            onBulkComplete={handleBulkReviewComplete}
          />
        )}
      </Suspense>

      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </>
  );
}
