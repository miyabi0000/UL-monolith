import React, { Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { COLORS } from '../utils/designSystem';
import AppHeader from './AppHeader';
import CompactSummary from './CompactSummary';
import GearTable from './GearTable';
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
    refreshGearItems
  } = useAppState();

  const {
    messages,
    removeNotification,
    showSuccess,
    showError,
    showLoading
  } = useNotifications();

  const chartData = calculateChartData(gearItems);
  const totals = calculateTotals(gearItems);

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
          isAuthenticated={isAuthenticated}
          userName={user?.name}
        />


        {/* Main Dashboard - Full width container */}
        <div className="w-full">
          {isLoading ? (
            // ローディング中のスケルトン表示
            <>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
                <div className="lg:col-span-4">
                  <SkeletonLoader variant="chart" />
                </div>
                <div className="space-y-2">
                  <SkeletonLoader variant="card" count={3} />
                </div>
              </div>
              <SkeletonLoader variant="table" />
            </>
          ) : (
            // データ読み込み完了後の実際のコンテンツ
            <>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
                <div className="lg:col-span-4">
                  <GearChart
                    data={chartData}
                    totalWeight={totals.weight}
                    onShowGearManager={() => setShowForm(true)}
                  />
                </div>
                <div className="space-y-2">
                  <CompactSummary totals={totals} />
                </div>
              </div>

              <GearTable
                items={gearItems}
                onEdit={handleEditGear}
                onDelete={(ids) => ids.forEach(id => handleDeleteGear(id))}
                onSave={handleSaveGear}
                onUpdateItem={() => {}} // TODO: implement if needed
                showCheckboxes={showCheckboxes}
              />
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
              isOpen={showCategoryManager}
              onClose={() => setShowCategoryManager(false)}
              categories={categories}
              onCategoriesUpdate={setCategories}
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