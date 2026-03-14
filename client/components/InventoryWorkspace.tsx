import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBulkGearExtraction } from '../hooks/useBulkGearExtraction';
import { useNotifications } from '../hooks/useNotifications';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../utils/AuthContext';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { SPACING_SCALE } from '../utils/designSystem';
import { ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode } from '../utils/types';
import GearChart from './GearChart';
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
  onSelectPack?: (packId: string) => void;
  onCreatePack?: (name: string) => void;
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
  // 新規パック作成インライン入力
  const [showNewPackInput, setShowNewPackInput] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const newPackInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showNewPackInput) {
      newPackInputRef.current?.focus();
    }
  }, [showNewPackInput]);

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

  const handleCreateNewPack = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPackName.trim();
    if (!trimmed || !onCreatePack) return;
    onCreatePack(trimmed);
    setNewPackName('');
    setShowNewPackInput(false);
  };

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

  const hasPacks = packList && packList.length > 0;

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
            <div className="sticky top-0 z-20 mb-3 rounded-xl bg-white/88 p-3 backdrop-blur dark:bg-slate-800/88 neu-raised">
              <div className="flex flex-wrap items-center gap-2">
                {/* Pack セレクター */}
                {packList !== undefined && (
                  <>
                    {hasPacks ? (
                      <select
                        value={selectedPackId ?? ''}
                        onChange={(e) => onSelectPack?.(e.target.value)}
                        className="h-8 rounded-lg border-0 bg-white dark:bg-slate-700 px-2 text-xs font-medium text-gray-900 dark:text-gray-100 shadow-sm focus:ring-1 focus:ring-gray-400 dark:focus:ring-slate-500 cursor-pointer"
                      >
                        {packList.map((pack) => (
                          <option key={pack.id} value={pack.id}>
                            {pack.name} ({activePackItemIds.length > 0 && pack.id === selectedPackId ? activePackItemIds.length : ''})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 px-1">Packs なし</span>
                    )}

                    {/* ⚙ 設定ボタン */}
                    {activePack && onOpenPackSettings && (
                      <button
                        type="button"
                        onClick={onOpenPackSettings}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100/80 dark:bg-slate-800/70 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                        title="Pack settings"
                        aria-label="Pack settings"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    )}

                    {/* + New Pack */}
                    {showNewPackInput ? (
                      <form onSubmit={handleCreateNewPack} className="flex items-center gap-1.5">
                        <input
                          ref={newPackInputRef}
                          className="h-8 rounded-lg border-0 bg-white dark:bg-slate-700 px-2 text-xs font-medium text-gray-900 dark:text-gray-100 shadow-sm focus:ring-1 focus:ring-gray-400 dark:focus:ring-slate-500 w-36"
                          placeholder="Pack name"
                          value={newPackName}
                          onChange={(e) => setNewPackName(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn-primary h-8 px-2 text-xs">
                          Create
                        </button>
                        <button
                          type="button"
                          className="btn-secondary h-8 px-2 text-xs"
                          onClick={() => { setShowNewPackInput(false); setNewPackName(''); }}
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="h-8 px-3 rounded-lg text-xs font-medium transition-colors bg-gray-100/80 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => setShowNewPackInput(true)}
                      >
                        + New
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="w-full">
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
            </div>
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
