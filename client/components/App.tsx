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
import Landing from './Landing';

// 遅延インポート（コード分割）
const GearAdvisorChat = React.lazy(() => import('./GearAdvisorChat'));

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout, loginWithEmail } = useAuth();
  const appState = useAppState();
  const {
    showAdvisor,
    setShowAdvisor,
    gearItems,
    weightBreakdown,
    ulStatus,
    handleUpdateGear,
  } = appState;

  const { messages, removeNotification } = useNotifications();

  // パック選択スコープ（PacksPage → アドバイザーへの連携）
  const [advisorScope, setAdvisorScope] = useState<AdvisorPackScope | null>(null);

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

  // 未認証時は CTA ランディングを表示して早期 return
  // (パスワードレス。Landing の onLogin で loginWithEmail を呼び、
  //  成功すると isAuthenticated が true になってこの分岐を抜ける)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Landing onLogin={loginWithEmail} />
        <NotificationPopup messages={messages} onRemove={removeNotification} />
      </div>
    );
  }

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
          onLogout={logout}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          onShowAdvisor={() => setShowAdvisor((prev) => !prev)}
        />
      )}

      <Suspense fallback={null}>
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
