import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { useProfile } from '../hooks/useProfile';
import InventoryWorkspace from './InventoryWorkspace';
import ProfileHeader from './ProfileHeader';
import ProfileEditorModal from './ProfileEditorModal';
import PackSettingsModal from './PackSettingsModal';
import { GearItemWithCalculated } from '../utils/types';

const fallbackUserId = 'local-user';

export interface AdvisorPackScope {
  /** アドバイザーに渡すアイテム一覧（パック選択中はそのパックのみ） */
  items: GearItemWithCalculated[];
  /** 選択中パック名（null = 全ギアスコープ） */
  packName: string | null;
}

interface PacksPageProps {
  appState: ReturnType<typeof useAppState>;
  /** パック選択状態が変わったときに呼ばれるコールバック（アドバイザーのスコープ連携用） */
  onAdvisorScopeChange?: (scope: AdvisorPackScope) => void;
  onShowLogin?: () => void;
  onLogout?: () => void;
}

export default function PacksPage({ appState, onAdvisorScopeChange, onShowLogin, onLogout }: PacksPageProps) {
  const { user } = useAuth();
  const { gearItems } = appState;
  const { packs, createPack, updatePack, deletePack, toggleItemInPack, addItemsToPack } = usePacks(user?.id ?? fallbackUserId);
  const { profile, updateField, showEditor, setShowEditor } = useProfile(user?.name);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showPackSettings, setShowPackSettings] = useState(false);

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

  // アドバイザーのスコープを親に通知（パック選択変更時）
  const activePackItems = useMemo(
    () =>
      selectedPack
        ? gearItems.filter((item) => selectedPack.itemIds.includes(item.id))
        : null,
    [selectedPack, gearItems]
  );

  useEffect(() => {
    onAdvisorScopeChange?.({
      items: activePackItems ?? gearItems,
      packName: selectedPack?.name ?? null,
    });
  }, [activePackItems, gearItems, selectedPack, onAdvisorScopeChange]);

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

  return (
    <main id="inventory-overview" className="max-w-6xl mx-auto min-h-screen px-3 pt-16 pb-6 sm:px-6 md:px-8 lg:px-[16px]">
      <div className="flex min-h-0 flex-col gap-3">
        <ProfileHeader
          profile={profile}
          onEditProfile={() => setShowEditor(true)}
          isAuthenticated={!!user}
          userName={user?.name}
          onShowLogin={onShowLogin}
          onLogout={onLogout}
        />

        <div className="min-h-0 flex-1">
          <InventoryWorkspace
            appState={appState}
            embedded
            renderLoginModal={false}
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
            onOpenPackSettings={selectedPack ? () => setShowPackSettings(true) : undefined}
          />
        </div>
      </div>

      {showEditor && (
        <ProfileEditorModal
          profile={profile}
          onUpdate={updateField}
          onClose={() => setShowEditor(false)}
        />
      )}

      {showPackSettings && selectedPack && (
        <PackSettingsModal
          pack={selectedPack}
          onSave={(updates) => updatePack(selectedPack.id, updates)}
          onDelete={() => deletePack(selectedPack.id)}
          onCopyLink={() => copyPublicLink(selectedPack.id)}
          onOpen={() => window.open(`/p/${selectedPack.id}`, '_blank', 'noopener,noreferrer')}
          onClose={() => setShowPackSettings(false)}
        />
      )}
    </main>
  );
}
