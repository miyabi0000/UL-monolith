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
      className="min-h-screen p-2"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="max-w-7xl mx-auto">
        <AppHeader
          onShowLogin={() => setShowLogin(true)}
          onLogout={logout}
          onToggleChat={() => setShowChat(!showChat)}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
        />

        {/* Success/Error Messages */}
        {successMessage && (
          <div 
            className="mb-2 p-2 rounded border"
            style={{
              backgroundColor: COLORS.primary.light,
              borderColor: COLORS.primary.medium
            }}
          >
            <p 
              className="text-sm font-medium"
              style={{ color: COLORS.primary.dark }}
            >
              ✓ {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div 
            className="mb-2 p-2 rounded border"
            style={{
              backgroundColor: COLORS.primary.light,
              borderColor: COLORS.accent
            }}
          >
            <p 
              className="text-sm font-medium"
              style={{ color: COLORS.accent }}
            >
              ! {error}
            </p>
          </div>
        )}

        {loading && (
          <div 
            className="mb-2 p-2 rounded border"
            style={{
              backgroundColor: COLORS.primary.light,
              borderColor: COLORS.primary.medium
            }}
          >
            <p 
              className="text-sm font-medium"
              style={{ color: COLORS.primary.dark }}
            >
              ... LOADING
            </p>
          </div>
        )}

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-3">
          <div className="lg:col-span-3">
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