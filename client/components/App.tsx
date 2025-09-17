import React, { Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { COLORS } from '../utils/colors';
import AppHeader from './AppHeader';
import CompactSummary from './CompactSummary';
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
    <div 
      className="min-h-screen py-2 flex"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="flex-1" style={{ minWidth: '48px' }}></div>
      <div className="flex-grow max-w-4xl xl:max-w-5xl">
        <AppHeader
          onShowLogin={() => setShowLogin(true)}
          onLogout={logout}
          onToggleChat={() => setShowChat(!showChat)}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
        />

        {/* Enhanced Status Messages */}
        {successMessage && (
          <div
            className="mb-4 p-4 rounded-lg border-l-4 backdrop-blur-sm transition-all duration-300 animate-pulse"
            style={{
              backgroundColor: COLORS.primary.light,
              borderLeftColor: COLORS.primary.dark,
              borderColor: COLORS.primary.medium
            }}
          >
            <div className="flex items-center">
              <span className="text-lg mr-2">✅</span>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.primary.dark }}
              >
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-4 rounded-lg border-l-4 backdrop-blur-sm transition-all duration-300"
            style={{
              backgroundColor: '#fef2f2',
              borderLeftColor: COLORS.accent,
              borderColor: COLORS.accent
            }}
          >
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.accent }}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div
            className="mb-4 p-4 rounded-lg border backdrop-blur-sm transition-all duration-300"
            style={{
              backgroundColor: COLORS.primary.light,
              borderColor: COLORS.primary.medium
            }}
          >
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-3"></div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.primary.dark }}
              >
                Loading...
              </p>
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <GearChart
              data={chartData}
              totalWeight={totals.weight}
              onShowGearManager={() => setShowForm(true)}
            />
          </div>
          <div className="space-y-2 order-1 lg:order-2">
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
    </div>
  );
}