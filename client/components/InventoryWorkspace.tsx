import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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
  workspaceScope?: 'all' | 'pack';
  onWorkspaceScopeChange?: (scope: 'all' | 'pack') => void;
  activePack?: Pack | null;
  activePackItemIds?: string[];
  onTogglePackItem?: (itemId: string) => void;
  packStats?: {
    itemCount: number;
    totalWeight: number;
    totalPriceLabel: string;
  } | null;
  packEditor?: {
    routeDraft: string;
    descriptionDraft: string;
    hasChanges: boolean;
    onRouteChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onReset: () => void;
    onSave: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
    onOpen: () => void;
  } | null;
  packManager?: {
    packs: Array<{ id: string; name: string }>;
    selectedPackId: string | null;
    showCreator: boolean;
    newPackName: string;
    newPackRouteName: string;
    newPackDescription: string;
    onSelectPack: (packId: string) => void;
    onToggleCreator: () => void;
    onCreatePack: (event: React.FormEvent) => void;
    onCreateSamplePack: () => void;
    onNewPackNameChange: (value: string) => void;
    onNewPackRouteNameChange: (value: string) => void;
    onNewPackDescriptionChange: (value: string) => void;
  } | null;
}

export default function InventoryWorkspace({
  appState,
  embedded = false,
  renderLoginModal = true,
  items,
  workspaceScope = 'all',
  onWorkspaceScopeChange,
  activePack = null,
  activePackItemIds = [],
  onTogglePackItem,
  packStats = null,
  packEditor = null,
  packManager = null
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
  const [showPackMenu, setShowPackMenu] = useState(false);
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

  useEffect(() => {
    setSelectedCategories([]);
  }, [scopedItems]);

  const chartData = useMemo(
    () => calculateChartData(scopedItems, quantityDisplayMode),
    [scopedItems, quantityDisplayMode]
  );
  const totals = useMemo(
    () => calculateTotals(scopedItems, quantityDisplayMode),
    [scopedItems, quantityDisplayMode]
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
            <div className="sticky top-0 z-20 mb-3 rounded-xl border border-gray-200/80 bg-white/88 p-3 backdrop-blur dark:border-slate-600/80 dark:bg-slate-800/88">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={[
                      'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                      workspaceScope === 'all'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'bg-gray-100/80 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300'
                    ].join(' ')}
                    onClick={() => onWorkspaceScopeChange?.('all')}
                  >
                    All Gear
                  </button>
                  {activePack && (
                    <button
                      type="button"
                      className={[
                        'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                        workspaceScope === 'pack'
                          ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
                          : 'bg-gray-100/80 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300'
                      ].join(' ')}
                      onClick={() => onWorkspaceScopeChange?.('pack')}
                    >
                      {`Pack: ${activePack.name}`}
                    </button>
                  )}
                  {packManager && (
                    <button
                      type="button"
                      className="h-8 px-3 rounded-lg text-xs font-medium transition-colors bg-gray-100/80 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      onClick={() => setShowPackMenu((prev) => !prev)}
                    >
                      + Packs
                    </button>
                  )}
                </div>

                {packManager && showPackMenu && (
                  <div className="rounded-lg border border-gray-200/70 dark:border-slate-600/70 bg-white/90 dark:bg-slate-800/90 p-3 shadow-sm">
                    {packManager.packs.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {packManager.packs.map((pack) => {
                          const isActive = packManager.selectedPackId === pack.id;
                          return (
                            <button
                              key={pack.id}
                              type="button"
                              className={[
                                'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                                isActive
                                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                  : 'bg-gray-100/80 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                              ].join(' ')}
                              onClick={() => {
                                packManager.onSelectPack(pack.id);
                                setShowPackMenu(false);
                              }}
                            >
                              {pack.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Packs がまだありません</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={packManager.onToggleCreator}>
                        New Pack
                      </button>
                      <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={packManager.onCreateSamplePack}>
                        Sample
                      </button>
                    </div>

                    {packManager.showCreator && (
                      <form onSubmit={packManager.onCreatePack} className="mt-3 grid gap-2 rounded-lg border border-gray-200/80 dark:border-slate-600/80 bg-white/55 dark:bg-slate-800/55 p-3">
                        <input
                          className="input w-full"
                          placeholder="Pack name"
                          value={packManager.newPackName}
                          onChange={(e) => packManager.onNewPackNameChange(e.target.value)}
                          required
                        />
                        <input
                          className="input w-full"
                          placeholder="Route"
                          value={packManager.newPackRouteName}
                          onChange={(e) => packManager.onNewPackRouteNameChange(e.target.value)}
                        />
                        <textarea
                          className="input w-full min-h-[72px]"
                          placeholder="Description"
                          value={packManager.newPackDescription}
                          onChange={(e) => packManager.onNewPackDescriptionChange(e.target.value)}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" className="btn-secondary" onClick={packManager.onToggleCreator}>
                            Cancel
                          </button>
                          <button type="submit" className="btn-primary">
                            Create
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {workspaceScope === 'pack' && activePack && packEditor && (
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="rounded-lg border border-gray-200/70 dark:border-slate-600/70 bg-white/45 dark:bg-slate-800/35 p-3">
                      <div className="grid gap-2">
                        <input
                          className="input h-9 w-full text-sm"
                          placeholder="Route not set"
                          value={packEditor.routeDraft}
                          onChange={(e) => packEditor.onRouteChange(e.target.value)}
                        />
                        <textarea
                          className="input w-full min-h-[72px] text-xs"
                          placeholder="Description"
                          value={packEditor.descriptionDraft}
                          onChange={(e) => packEditor.onDescriptionChange(e.target.value)}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={packEditor.onOpen}>
                            Open
                          </button>
                          <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={packEditor.onCopyLink}>
                            Copy Link
                          </button>
                          <button type="button" className="h-8 px-3 rounded-md text-xs text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-500/30" onClick={packEditor.onDelete}>
                            Delete
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-secondary h-8 px-3 text-xs"
                            onClick={packEditor.onReset}
                            disabled={!packEditor.hasChanges}
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            className="btn-primary h-8 px-3 text-xs"
                            onClick={packEditor.onSave}
                            disabled={!packEditor.hasChanges}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>

                    {packStats && (
                      <div className="grid grid-cols-3 gap-2 text-xs lg:grid-cols-1">
                        <div className="rounded-md bg-white/70 dark:bg-slate-700/70 px-3 py-2">
                          <p className="text-gray-500 dark:text-gray-400">Items</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{packStats.itemCount}</p>
                        </div>
                        <div className="rounded-md bg-white/70 dark:bg-slate-700/70 px-3 py-2">
                          <p className="text-gray-500 dark:text-gray-400">Weight</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{packStats.totalWeight.toLocaleString()}g</p>
                        </div>
                        <div className="rounded-md bg-white/70 dark:bg-slate-700/70 px-3 py-2">
                          <p className="text-gray-500 dark:text-gray-400">Cost</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{packStats.totalPriceLabel}</p>
                        </div>
                      </div>
                    )}
                  </div>
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
