import React, { Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import AppHeader from './AppHeader';
import AppSummary from './AppSummary';
import GearTable from './GearTable';
import GearChart from './GearChart';

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
    successMessage, setSuccessMessage,
    
    // データ状態
    gearItems,
    categories, setCategories,
    loading,
    error,
    
    // API操作関数
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    refreshGearItems
  } = useAppState();

  const chartData = calculateChartData(gearItems);
  const totals = calculateTotals(gearItems);

  const handleSaveGear = async (gearItem: any) => {
    try {
      if (editingGear) {
        await handleUpdateGear(editingGear.id, gearItem);
      } else {
        await handleCreateGear(gearItem);
      }
      
      setShowForm(false);
      setEditingGear(null);
    } catch (err) {
      console.error('Error saving gear:', err);
    }
  };

  const handleEditGear = (gear: any) => {
    setEditingGear(gear);
    setShowForm(true);
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      // 複数のアイテムを並列で削除
      await Promise.all(selectedIds.map(id => handleDeleteGear(id)));
    } catch (err) {
      console.error('Error bulk deleting gear:', err);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    login(userData);
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <AppHeader
          onShowForm={() => setShowForm(true)}
          onShowCategoryManager={() => setShowCategoryManager(true)}
          onShowLogin={() => setShowLogin(true)}
          onLogout={logout}
          onToggleChat={() => setShowChat(!showChat)}
          onToggleDropdown={() => setShowGearDropdown(!showGearDropdown)}
          onToggleCheckboxes={() => setShowCheckboxes(!showCheckboxes)}
          showGearDropdown={showGearDropdown}
          showCheckboxes={showCheckboxes}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
        />

        <AppSummary totals={totals} successMessage={successMessage} />

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-600 text-sm">読み込み中...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <GearChart data={chartData} totalWeight={totals.weight} />
                  </div>
          <div className="space-y-6">
            {/* Additional charts or widgets can go here */}
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
    </div>
  );
}