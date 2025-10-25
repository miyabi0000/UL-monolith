import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { COLORS, SPACING_SCALE } from '../utils/designSystem';
import { ChartViewMode } from '../utils/types';
import AppHeader from './AppHeader';
import ViewSwitcher from './ViewSwitcher';
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

export default function App() {
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
  
  // ギア表示モード（table/card切り替え）
  const [gearViewMode, setGearViewMode] = useState<'table' | 'card'>(() => {
    const saved = localStorage.getItem('gearViewMode');
    return (saved === 'table' || saved === 'card') ? saved : 'table';
  });
  
  // 選択中のカテゴリ（グラフフィルタ用）
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // gearViewModeの変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('gearViewMode', gearViewMode);
  }, [gearViewMode]);

  // チャートデータと合計を useMemo でメモ化（無駄な再計算を防止）
  const chartData = useMemo(() => calculateChartData(gearItems), [gearItems]);
  const totals = useMemo(() => calculateTotals(gearItems), [gearItems]);

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

  const handleUpdateItem = async (id: string, field: string, value: any) => {
    try {
      const updates = { [field]: value };
      await handleUpdateGear(id, updates);
      await refreshGearItems();
    } catch (err) {
      showError('アイテムの更新に失敗しました');
      console.error('Error updating item:', err);
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    const loadingId = showLoading(`${selectedIds.length}個のアイテムを削除中...`);

    try {
      // 複数のアイテムを並列で削除
      await Promise.all(selectedIds.map(id => handleDeleteGear(id)));
      showSuccess(`${selectedIds.length}個のアイテムが正常に削除されました`);
    } catch (err) {
      showError('アイテムの一括削除に失敗しました');
      console.error('Error bulk deleting gear:', err);
    } finally {
      removeNotification(loadingId);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    showSuccess('ログインに成功しました');
    setShowLogin(false);
  };

  return (
    <div
      className="min-h-screen py-2 flex"
      style={{
        backgroundColor: COLORS.background,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      <div className="flex-1" style={{ minWidth: '48px' }}></div>
      <div
        className="flex-grow transition-all duration-150 ease-out"
        style={{
          marginRight: showChat ? '384px' : '0px', // 24rem = 384px
        }}
      >
        <AppHeader
          onShowLogin={() => setShowLogin(true)}
          onLogout={logout}
          onToggleChat={() => setShowChat(!showChat)}
          onShowCategoryManager={() => setShowCategoryManager(true)}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
        />


        {/* Main Dashboard - Full width container */}
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
            // データ読み込み完了後の実際のコンテンツ
            <>
              {/* チャート */}
              <div style={{ marginBottom: `${SPACING_SCALE.md}px` }}>
                <GearChart
                  data={chartData}
                  totalWeight={totals.weight}
                  totalCost={totals.price}
                  viewMode={viewMode}
                  selectedCategories={selectedCategories}
                  onCategorySelect={setSelectedCategories}
                  onViewModeChange={setViewMode}
                />
              </div>

              {/* ビュー切替 */}
              <div style={{ marginBottom: `${SPACING_SCALE.md}px` }}>
                <ViewSwitcher
                  currentView={gearViewMode}
                  onViewChange={setGearViewMode}
                />
              </div>

              {/* ギアテーブル or カードビュー */}
              <div style={{ marginBottom: `${SPACING_SCALE['4xl']}px` }}>
                {gearViewMode === 'table' ? (
                  <GearTable
                    items={gearItems}
                    categories={categories}
                    filteredByCategory={selectedCategories}
                    onEdit={handleEditGear}
                    onDelete={(ids) => ids.forEach(id => handleDeleteGear(id))}
                    onSave={handleSaveGear}
                    onUpdateItem={handleUpdateItem}
                    showCheckboxes={showCheckboxes}
                    onShowForm={() => setShowForm(true)}
                  />
                ) : (
                  <GearView
                    items={gearItems}
                    categories={categories}
                    filteredByCategory={selectedCategories}
                    onEdit={handleEditGear}
                    onDelete={(ids) => ids.forEach(id => handleDeleteGear(id))}
                    showCheckboxes={showCheckboxes}
                    onShowForm={() => setShowForm(true)}
                  />
                )}
              </div>
            </>
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
              gearItems={gearItems}
              categories={categories}
              onGearExtracted={handleSaveGear}
            />
          )}
        </Suspense>

        {/* フッター */}
        <footer
          className="py-4 text-center border-t mt-8"
          style={{
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.primary.medium,
            color: COLORS.text.secondary
          }}
        >
          <div className="text-sm">
            <p>UL Gear Manager © 2024</p>
            <p className="text-xs mt-1">Ultralight Hiking Gear Management System</p>
          </div>
        </footer>
          </div>
      <div className="flex-1" style={{ minWidth: '48px' }}></div>

      {/* 右端通知ポップアップ */}
      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </div>
  );
}