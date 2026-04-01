import React, { Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import { useGearFocus } from '../hooks/useGearFocus';
import NotificationPopup from './NotificationPopup';
import PacksPage, { AdvisorPackScope } from './PacksPage';
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

  const { messages, removeNotification, showSuccess } = useNotifications();

  // パック選択スコープ（PacksPage → アドバイザーへの連携）
  const [advisorScope, setAdvisorScope] = useState<AdvisorPackScope | null>(null);

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

  const handleFocusGear = useGearFocus();

  // アドバイザーに渡すコンテキスト（パック選択中はそのスコープを使用）
  const advisorGearContext = {
    items: advisorScope?.items ?? gearItems,
    weightBreakdown,
    ulStatus,
    packName: advisorScope?.packName ?? null,
  };

  return (
    <div className="min-h-screen">
      {/* ルーティング */}
      <Routes>
        <Route
          path="/"
          element={
            <PacksPage
              appState={appState}
              onAdvisorScopeChange={setAdvisorScope}
            />
          }
        />
        <Route path="/all" element={<Navigate to="/" replace />} />
        <Route path="/packs" element={<Navigate to="/" replace />} />
        <Route path="/p/:packId" element={<PackDetailPage />} />
      </Routes>

      <AppDock
        onShowLogin={() => setShowLogin(true)}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onShowAdvisor={() => setShowAdvisor((prev) => !prev)}
      />

      <Suspense fallback={null}>
        {showLogin && (
          <Login
            isOpen={showLogin}
            onLogin={login}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        <GearAdvisorChat
          isOpen={showAdvisor}
          onClose={() => setShowAdvisor(false)}
          gearContext={advisorGearContext}
          onApplyEdit={async (gearId, field, value) => {
            await handleUpdateGear(gearId, { [field]: value });
          }}
          onFocusGear={handleFocusGear}
        />
      </Suspense>

      {/* 右端通知ポップアップ */}
      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </div>
  );
}
