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
    showForm, setShowForm,
    editingGear, setEditingGear,
    showLogin, setShowLogin,
    showCategoryManager, setShowCategoryManager,
    showChat, setShowChat,
    gearData, setGearData,
    showGearDropdown, setShowGearDropdown,
    showCheckboxes, setShowCheckboxes,
    successMessage, setSuccessMessage,
    categories, setCategories,
    gearItems
  } = useAppState();

  const chartData = calculateChartData(gearItems);
  const totals = calculateTotals(gearItems);

  const handleSaveGear = (gearItem: any) => {
    if (editingGear) {
      const updatedData = gearData.map((item: any) =>
        item.id === editingGear.id ? { ...item, ...gearItem } : item
      );
      setGearData(updatedData);
      setSuccessMessage('ギアが正常に更新されました');
    } else {
      const newGear = { ...gearItem, id: `gear-${Date.now()}` };
      setGearData([...gearData, newGear]);
      setSuccessMessage('新しいギアが正常に追加されました');
    }
    
    setShowForm(false);
    setEditingGear(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEditGear = (gear: any) => {
    setEditingGear(gear);
    setShowForm(true);
  };

  const handleDeleteGear = (gearId: string) => {
    setGearData(gearData.filter((item: any) => item.id !== gearId));
    setSuccessMessage('ギアが正常に削除されました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setGearData(gearData.filter((item: any) => !selectedIds.includes(item.id)));
    setSuccessMessage(`${selectedIds.length}個のギアが削除されました`);
    setTimeout(() => setSuccessMessage(''), 3000);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <GearChart data={chartData} />
          </div>
          <div className="space-y-6">
            {/* Additional charts or widgets can go here */}
          </div>
        </div>

        <GearTable
          gearItems={gearItems}
          categories={categories}
          onEdit={handleEditGear}
          onDelete={handleDeleteGear}
          onBulkDelete={handleBulkDelete}
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