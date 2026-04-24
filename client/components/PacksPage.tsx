import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { useProfile } from '../hooks/useProfile';
import InventoryWorkspace from './InventoryWorkspace';
import ProfileHeader from './ProfileHeader';
import SettingsModal from './SettingsModal';

const fallbackUserId = 'local-user';

interface PacksPageProps {
  appState: ReturnType<typeof useAppState>;
  // ProfileHeader に渡すコントロール
  isAuthenticated: boolean;
  userName?: string;
  onLogout: () => void;
  onShowChat?: () => void;
}

export default function PacksPage({
  appState,
  isAuthenticated,
  userName,
  onLogout,
  onShowChat,
}: PacksPageProps) {
  const { user } = useAuth();
  const { gearItems } = appState;
  const { packs, createPack, updatePack, deletePack, toggleItemInPack, addItemsToPack } = usePacks(user?.id ?? fallbackUserId);
  const { profile, updateField, plan } = useProfile(user?.name);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // 選択中のパックが削除された場合のみリセット（nullはALLモードとして有効）
  useEffect(() => {
    if (selectedPackId && !packs.some((p) => p.id === selectedPackId)) {
      setSelectedPackId(null);
    }
  }, [packs, selectedPackId]);

  const selectedPack = useMemo(
    () => packs.find((p) => p.id === selectedPackId) ?? null,
    [packs, selectedPackId]
  );

  const activePackItems = useMemo(
    () =>
      selectedPack
        ? gearItems.filter((item) => selectedPack.itemIds.includes(item.id))
        : null,
    [selectedPack, gearItems]
  );

  const handleCreatePack = (name: string) => {
    const next = createPack(name);
    setSelectedPackId(next.id);
  };

  const copyPublicLink = async (packId: string) => {
    const url = `${window.location.origin}/p/${packId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this public link', url);
    }
  };

  // Chat は bottom sheet 化したため、右余白を確保する必要はなし。
  // main content は常時フル幅。

  return (
    <main
      id="inventory-overview"
      className="max-w-6xl mx-auto min-h-screen px-1.5 pt-3 pb-4 sm:px-4 md:px-6 lg:px-4"
    >
      <div className="flex min-h-0 flex-col gap-3">
        <ProfileHeader
          profile={profile}
          onOpenSettings={() => setSettingsOpen(true)}
          onShowChat={onShowChat}
        />

        <div className="min-h-0 flex-1">
          <InventoryWorkspace
            appState={appState}
            embedded
            items={gearItems}
            activePack={selectedPack}
            activePackItemIds={selectedPack?.itemIds ?? []}
            onTogglePackItem={selectedPack ? (itemId) => toggleItemInPack(selectedPack.id, itemId) : undefined}
            onAddItemsToPack={selectedPack ? (itemIds) => addItemsToPack(selectedPack.id, itemIds) : undefined}
            packList={packs.map((p) => ({ id: p.id, name: p.name }))}
            selectedPackId={selectedPackId}
            onSelectPack={setSelectedPackId}
            onCreatePack={handleCreatePack}
            onDeletePack={(packId) => { deletePack(packId); setSelectedPackId(null); }}
            onUpdatePack={selectedPack ? (updates) => updatePack(selectedPack.id, updates) : undefined}
            onCopyPackLink={selectedPack ? () => copyPublicLink(selectedPack.id) : undefined}
            onOpenPackPublic={selectedPack ? () => window.open(`/p/${selectedPack.id}`, '_blank', 'noopener,noreferrer') : undefined}
          />
        </div>
      </div>

      {settingsOpen && (
        <SettingsModal
          profile={profile}
          onUpdate={updateField}
          onClose={() => setSettingsOpen(false)}
          plan={plan}
          isAuthenticated={isAuthenticated}
          userName={userName}
          onLogout={onLogout}
        />
      )}
    </main>
  );
}
