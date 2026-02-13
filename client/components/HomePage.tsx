import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import { useBulkGearExtraction } from '../hooks/useBulkGearExtraction';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { COLORS, SPACING_SCALE } from '../utils/designSystem';
import { ChartViewMode, QuantityDisplayMode, GearFieldValue } from '../utils/types';
import GearTable from './GearTable';
import GearView from './GearView';
import GearChart from './GearChart';
import NotificationPopup from './NotificationPopup';
import SkeletonLoader from './ui/SkeletonLoader';

// 遅延インポート（コード分割）
const GearForm = React.lazy(() => import('./GearForm'));
const CategoryManager = React.lazy(() => import('./CategoryManager'));
const Login = React.lazy(() => import('./Login'));
const ChatPopup = React.lazy(() => import('./ChatPopup'));
const UrlBulkImportModal = React.lazy(() => import('./gear-input/UrlBulkImportModal'));
const GearInputModal = React.lazy(() => import('./gear-input/GearInputModal'));

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const {
    // UI状態
    showForm, setShowForm,
    editingGear, setEditingGear,
    showLogin, setShowLogin,
    showCategoryManager, setShowCategoryManager,
    showChat, setShowChat,
    showGearDropdown, setShowGearDropdown,
    showCheckboxes, setShowCheckboxes,

    // データ状態
    gearItems,
    categories, setCategories,
    isLoading,
    weightBreakdown,
    ulStatus,

    // API操作関数
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    refreshGearItems,

    // カテゴリAPI操作関数
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory
  } = useAppState();

  const {
    messages,
    removeNotification,
    showSuccess,
    showError,
    showLoading
  } = useNotifications();

  // ビューモード状態（Weight/Cost切り替え）
  const [viewMode, setViewMode] = useState<ChartViewMode>('weight');

  // 数量表示モード（owned/need/all）
  const [quantityDisplayMode, setQuantityDisplayMode] = useState<QuantityDisplayMode>('owned');

  // ギア表示モード（table/card/compare切り替え）
  const [gearViewMode, setGearViewMode] = useState<'table' | 'card' | 'compare'>(() => {
    const saved = localStorage.getItem('gearViewMode');
    return (saved === 'table' || saved === 'card' || saved === 'compare') ? saved : 'table';
  });

  // 選択中のカテゴリ（グラフフィルタ用）
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // URL一括追加用の状態
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showBulkReview, setShowBulkReview] = useState(false);

  // URL一括抽出フック
  const {
    extractGears,
    extractedGears,
    failedUrls,
    isExtracting,
    progress,
    reset: resetExtraction
  } = useBulkGearExtraction();

  // gearViewModeの変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('gearViewMode', gearViewMode);
  }, [gearViewMode]);

  // チャートデータと合計を useMemo でメモ化（無駄な再計算を防止）
  const chartData = useMemo(() => calculateChartData(gearItems, quantityDisplayMode), [gearItems, quantityDisplayMode]);
  const totals = useMemo(() => calculateTotals(gearItems, quantityDisplayMode), [gearItems, quantityDisplayMode]);

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
      const updates = { [field]: value };
      await handleUpdateGear(id, updates);
      // handleUpdateGear内で既にfetchGearItemsを呼んでいるので、ここでは不要
    } catch (err) {
      showError('Failed to update item');
      console.error('Error updating item:', err);
    }
  }, [handleUpdateGear, showError]);

  const handleBulkDelete = async (selectedIds: string[]) => {
    const loadingId = showLoading(`Deleting ${selectedIds.length} items...`);

    try {
      // 複数のアイテムを並列で削除
      await Promise.all(selectedIds.map(id => handleDeleteGear(id)));
      showSuccess(`${selectedIds.length} items deleted successfully`);
    } catch (err) {
      showError('Failed to delete items');
      console.error('Error bulk deleting gear:', err);
    } finally {
      removeNotification(loadingId);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    showSuccess('Login successful');
    setShowLogin(false);
  };

  // URL一括追加: URLを抽出してレビューモードへ
  const handleExtractUrls = async (urls: string[]) => {
    const loadingId = showLoading(`Extracting ${urls.length} URLs...`);

    try {
      await extractGears(urls, categories);
      removeNotification(loadingId);

      // 抽出完了後の処理は後で実行
    } catch (err) {
      showError('Failed to extract gear information');
      console.error('Error extracting URLs:', err);
      removeNotification(loadingId);
    }
  };

  // URL一括追加: 抽出完了後に一括レビューモードを開く
  const handleProceedToReview = () => {
    setShowUrlImport(false);
    setShowBulkReview(true);
  };

  // URL一括追加: 一括レビュー完了
  const handleBulkReviewComplete = (savedCount: number, skippedCount: number) => {
    setShowBulkReview(false);
    resetExtraction();
    showSuccess(`${savedCount} items added, ${skippedCount} skipped`);
  };

  return (
    <>
      {/* Main Dashboard - Centered container */}
      <main
        className="max-w-6xl mx-auto transition-all duration-150 ease-out px-4 sm:px-6 md:px-8 lg:px-[16px]"
        style={{
          paddingTop: `${SPACING_SCALE.md}px`,
          paddingBottom: `${SPACING_SCALE.md}px`,
          paddingRight: showChat ? '400px' : undefined, // Chat offset
        }}
      >
        <div className="w-full">
          {isLoading ? (
            // ローディング中のスケルトン表示
            <>
              <SkeletonLoader variant="card" count={3} />
              <div className="mt-3">
                <SkeletonLoader variant="chart" />
              </div>
              <SkeletonLoader variant="table" />
            </>
          ) : (
            // データ読み込み完了後の実際のコンテンツ - チャート中心UI
            <div className="mb-16">
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
                items={gearItems}
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
                weightBreakdown={weightBreakdown}
                ulStatus={ulStatus}
              />
            </div>
          )}
        </div>
      </main>

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

        {showLogin && (
          <Login
            isOpen={showLogin}
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

        {/* URL一括追加モーダル */}
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

        {/* 一括レビューモーダル */}
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

      {/* 右端通知ポップアップ */}
      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </>
  );
}
