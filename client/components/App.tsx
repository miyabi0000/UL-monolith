import React, { Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { calculateChartData, calculateTotals } from '../utils/chartHelpers';
import { COLORS, getMessageStyle } from '../utils/designSystem';
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
      className="min-h-screen py-2 flex transition-all duration-300 ease-in-out"
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
        className={`flex-grow transition-all duration-300 ease-in-out ${
          showChat ? 'mr-96' : ''
        }`}
      >
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
            style={getMessageStyle('success')}
          >
            <div className="flex items-center">
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
            style={getMessageStyle('error')}
          >
            <div className="flex items-center">
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.accent }}
              >
                {error}
              </p>
            </div>
          </div>
        )}


        {/* Main Dashboard - Full width container */}
        <div className="w-full">
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
    </div>
  );
}