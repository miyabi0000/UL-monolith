import React, { Suspense, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import AppHeader from './AppHeader';
import HomePage from './HomePage';
import NotificationPopup from './NotificationPopup';

// 遅延インポート（コード分割）
const Login = React.lazy(() => import('./Login'));
const ChatPopup = React.lazy(() => import('./ChatPopup'));
const CategoryManager = React.lazy(() => import('./CategoryManager'));
const GearAdvisorChat = React.lazy(() => import('./GearAdvisorChat'));

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    showLogin, setShowLogin,
    showCategoryManager, setShowCategoryManager,
    showChat, setShowChat,
    showAdvisor, setShowAdvisor,
    categories,
    gearItems,
    weightBreakdown,
    ulStatus,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleUpdateGear,
  } = useAppState();

  const {
    messages,
    removeNotification,
    showSuccess
  } = useNotifications();

  const handleLoginSuccess = (userData: any) => {
    showSuccess('ログインに成功しました');
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen">
      <AppHeader
        onShowLogin={() => setShowLogin(true)}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onShowAdvisor={() => setShowAdvisor(true)}
      />

      {/* ルーティング */}
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>

      <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
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
            onGearExtracted={(gearItem) => {
              // ChatPopupからのギア抽出はHomePageで処理する必要があるため
              // 将来的にはコンテキストAPIで管理するか、状態を上位に引き上げる
              console.log('Gear extracted from chat:', gearItem);
            }}
          />
        )}

        {showAdvisor && (
          <GearAdvisorChat
            isOpen={showAdvisor}
            onClose={() => setShowAdvisor(false)}
            gearContext={{ items: gearItems, weightBreakdown, ulStatus }}
            onApplyEdit={async (gearId, field, value) => {
              await handleUpdateGear(gearId, { [field]: value });
            }}
          />
        )}
      </Suspense>

      {/* 右端通知ポップアップ */}
      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </div>
  );
}
