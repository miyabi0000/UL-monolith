import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { useProfile } from '../hooks/useProfile';
import { formatPrice } from '../utils/formatters';
import { getQuantityForDisplayMode } from '../utils/chartHelpers';
import InventoryWorkspace from './InventoryWorkspace';
import ProfileHeader from './ProfileHeader';
import ProfileEditorModal from './ProfileEditorModal';

const fallbackUserId = 'local-user';

interface PacksPageProps {
  appState: ReturnType<typeof useAppState>;
}

export default function PacksPage({ appState }: PacksPageProps) {
  const { user } = useAuth();
  const { gearItems } = appState;
  const { packs, createPack, updatePack, deletePack, toggleItemInPack } = usePacks(user?.id ?? fallbackUserId);
  const { profile, updateField, showEditor, setShowEditor } = useProfile(user?.name);

  const [showPackCreator, setShowPackCreator] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [newPackRouteName, setNewPackRouteName] = useState('');
  const [newPackDescription, setNewPackDescription] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [workspaceScope, setWorkspaceScope] = useState<'all' | 'pack'>('all');
  const [packRouteDraft, setPackRouteDraft] = useState('');
  const [packDescriptionDraft, setPackDescriptionDraft] = useState('');

  useEffect(() => {
    if (!packs.length) {
      setSelectedPackId(null);
      return;
    }
    if (!selectedPackId || !packs.some((pack) => pack.id === selectedPackId)) {
      setSelectedPackId(packs[0].id);
    }
  }, [packs, selectedPackId]);

  const packSummaries = useMemo(
    () =>
      packs.map((pack) => {
        const items = gearItems.filter((item) => pack.itemIds.includes(item.id));
        const totalWeight = items.reduce(
          (sum, item) => sum + (item.weightGrams || 0) * getQuantityForDisplayMode(item, 'all'),
          0
        );
        const totalPrice = items.reduce(
          (sum, item) => sum + (item.priceCents || 0) * getQuantityForDisplayMode(item, 'all'),
          0
        );
        return { pack, items, totalWeight, totalPrice };
      }),
    [packs, gearItems]
  );

  const selectedSummary = useMemo(
    () => packSummaries.find((summary) => summary.pack.id === selectedPackId) || null,
    [packSummaries, selectedPackId]
  );

  useEffect(() => {
    if (workspaceScope === 'pack' && !selectedSummary) {
      setWorkspaceScope('all');
    }
  }, [workspaceScope, selectedSummary]);

  useEffect(() => {
    setPackRouteDraft(selectedSummary?.pack.routeName || '');
    setPackDescriptionDraft(selectedSummary?.pack.description || '');
  }, [selectedSummary]);

  const scopedItems = workspaceScope === 'pack' ? selectedSummary?.items ?? [] : gearItems;

  const handleCreatePack = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newPackName.trim();
    if (!trimmed) return;
    const next = createPack(trimmed, newPackDescription, newPackRouteName);
    setSelectedPackId(next.id);
    setNewPackName('');
    setNewPackRouteName('');
    setNewPackDescription('');
    setShowPackCreator(false);
    setWorkspaceScope('pack');
  };

  const handleCreateSamplePack = () => {
    const sample = createPack('Sample: 1泊2日', 'テンプレートとして使えるサンプルパック', '高尾山 6.2km loop');
    updatePack(sample.id, {
      itemIds: gearItems.slice(0, Math.min(8, gearItems.length)).map((item) => item.id)
    });
    setSelectedPackId(sample.id);
  };

  const copyPublicLink = async (packId: string) => {
    const url = `${window.location.origin}/p/${packId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this public link', url);
    }
  };

  const handleUpdateSelectedPack = () => {
    if (!selectedSummary) return;
    updatePack(selectedSummary.pack.id, {
      routeName: packRouteDraft,
      description: packDescriptionDraft
    });
  };

  const hasSelectedPackChanges = selectedSummary
    ? packRouteDraft !== (selectedSummary.pack.routeName || '') ||
      packDescriptionDraft !== (selectedSummary.pack.description || '')
    : false;

  return (
    <main id="inventory-overview" className="max-w-6xl mx-auto min-h-screen px-3 pt-16 pb-6 sm:px-6 md:px-8 lg:px-[16px]">
      <div className="flex min-h-0 flex-col gap-3">
        <ProfileHeader profile={profile} onEditProfile={() => setShowEditor(true)} />

        <div className="min-h-0 flex-1">
          <InventoryWorkspace
            appState={appState}
            embedded
            renderLoginModal={false}
            items={scopedItems}
            workspaceScope={workspaceScope}
            onWorkspaceScopeChange={setWorkspaceScope}
            activePack={selectedSummary ? selectedSummary.pack : null}
            activePackItemIds={selectedSummary?.pack.itemIds ?? []}
            onTogglePackItem={selectedSummary ? (itemId: string) => toggleItemInPack(selectedSummary.pack.id, itemId) : undefined}
            packStats={selectedSummary ? {
              itemCount: selectedSummary.items.length,
              totalWeight: selectedSummary.totalWeight,
              totalPriceLabel: formatPrice(selectedSummary.totalPrice)
            } : null}
            packEditor={selectedSummary ? {
              routeDraft: packRouteDraft,
              descriptionDraft: packDescriptionDraft,
              hasChanges: hasSelectedPackChanges,
              onRouteChange: setPackRouteDraft,
              onDescriptionChange: setPackDescriptionDraft,
              onReset: () => {
                setPackRouteDraft(selectedSummary.pack.routeName || '');
                setPackDescriptionDraft(selectedSummary.pack.description || '');
              },
              onSave: handleUpdateSelectedPack,
              onDelete: () => deletePack(selectedSummary.pack.id),
              onCopyLink: () => copyPublicLink(selectedSummary.pack.id),
              onOpen: () => window.open(`/p/${selectedSummary.pack.id}`, '_blank', 'noopener,noreferrer')
            } : null}
            packManager={{
              packs: packSummaries.map(({ pack }) => ({ id: pack.id, name: pack.name })),
              selectedPackId,
              showCreator: showPackCreator,
              newPackName,
              newPackRouteName,
              newPackDescription,
              onSelectPack: (packId: string) => {
                setSelectedPackId(packId);
                setWorkspaceScope('pack');
              },
              onToggleCreator: () => setShowPackCreator((prev) => !prev),
              onCreatePack: handleCreatePack,
              onCreateSamplePack: handleCreateSamplePack,
              onNewPackNameChange: setNewPackName,
              onNewPackRouteNameChange: setNewPackRouteName,
              onNewPackDescriptionChange: setNewPackDescription
            }}
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
    </main>
  );
}
