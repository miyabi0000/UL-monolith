import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPopup from './NotificationPopup';
import PacksPage from './PacksPage';
import PackDetailPage from './PackDetailPage';
import AppDock from './AppDock';

// 遅延インポート（コード分割）
const Login = React.lazy(() => import('./Login'));
const GearAdvisorChat = React.lazy(() => import('./GearAdvisorChat'));

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout, login } = useAuth();
  const appState = useAppState();
  const {
    showLogin,
    setShowLogin,
    showAdvisor,
    setShowAdvisor,
    gearItems,
    weightBreakdown,
    ulStatus,
    handleUpdateGear,
  } = appState;

  const {
    messages,
    removeNotification,
    showSuccess,
  } = useNotifications();

  const handleLoginSuccess = (userData: any) => {
    showSuccess('ログインに成功しました');
    setShowLogin(false);
  };

  React.useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const element = document.getElementById(id);
    if (!element) return;
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      {/* ルーティング */}
      <Routes>
        <Route path="/" element={<PacksPage appState={appState} />} />
        <Route path="/all" element={<Navigate to="/" replace />} />
        <Route path="/packs" element={<Navigate to="/" replace />} />
        <Route path="/p/:packId" element={<PackDetailPage />} />
      </Routes>

      <AppDock
        onShowLogin={() => setShowLogin(true)}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onShowAdvisor={() => setShowAdvisor(true)}
      />

      <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
        {showLogin && (
          <Login
            isOpen={showLogin}
            onLogin={login}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
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
