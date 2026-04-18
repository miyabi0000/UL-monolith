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

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout, login } = useAuth();
  const appState = useAppState();
  const {
    showLogin,
    setShowLogin,
    setShowChat,
  } = appState;

  const { messages, removeNotification, showSuccess } = useNotifications();

  const handleLoginSuccess = () => {
    showSuccess('ログインに成功しました');
    setShowLogin(false);
  };

  // URLハッシュによるスクロール
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
        <Route
          path="/"
          element={
            <PacksPage
              appState={appState}
              isAuthenticated={isAuthenticated}
              userName={user?.name}
              onShowLogin={() => setShowLogin(true)}
              onLogout={logout}
              onShowChat={() => setShowChat((prev) => !prev)}
            />
          }
        />
        <Route path="/all" element={<Navigate to="/" replace />} />
        <Route path="/packs" element={<Navigate to="/" replace />} />
        <Route path="/p/:packId" element={<PackDetailPage />} />
      </Routes>

      {/* PacksPage(/) 以外のルート（/p/:packId など）でのみ表示 */}
      {location.pathname !== '/' && (
        <AppDock
          onShowLogin={() => setShowLogin(true)}
          onLogout={logout}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          onShowChat={() => setShowChat((prev) => !prev)}
        />
      )}

      <Suspense fallback={null}>
        {showLogin && (
          <Login
            isOpen={showLogin}
            onLogin={login}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
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
