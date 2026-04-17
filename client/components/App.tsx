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

  const { messages, removeNotification, showSuccess, showError } = useNotifications();

  // クォータ超過の全局通知
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ plan?: string; message?: string }>).detail ?? {};
      const base = detail.message ?? '月の利用上限に達しました。';
      const suffix = detail.plan === 'free' ? ' Pro にアップグレードすると継続利用できます。' : '';
      showError(`${base}${suffix}`, 8000);
    };
    window.addEventListener('quota-exceeded', handler);
    return () => window.removeEventListener('quota-exceeded', handler);
  }, [showError]);

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
              isAuthenticated={isAuthenticated}
              userName={user?.name}
              onShowLogin={() => setShowLogin(true)}
              onLogout={logout}
              onShowAdvisor={() => setShowAdvisor((prev) => !prev)}
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
          onShowAdvisor={() => setShowAdvisor((prev) => !prev)}
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
