import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { formatPrice } from '../utils/formatters';
import { calculateChartData, getQuantityForDisplayMode } from '../utils/chartHelpers';
import CategoryBadge from './ui/CategoryBadge';
import CardGridView from './DetailPanel/CardGridView';
import HorizontalBarChart, { type BarItem } from './charts/HorizontalBarChart';

const fallbackUserId = 'local-user';
const PROFILE_STORAGE_KEY = 'ul_profile_settings_v1';

interface ProfileSettings {
  headerTitle: string;
  displayName: string;
  handle: string;
  bio: string;
}

const readProfile = (fallbackName?: string): ProfileSettings => {
  const defaultProfile: ProfileSettings = {
    headerTitle: 'Packboard',
    displayName: fallbackName || 'Guest',
    handle: fallbackName ? `@${fallbackName.toLowerCase().replace(/\s+/g, '')}` : '@guest',
    bio: 'Inventory / Packs を切り替えて山行ごとの装備をまとめる。'
  };

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
    return {
      headerTitle: parsed.headerTitle?.trim() || defaultProfile.headerTitle,
      displayName: parsed.displayName?.trim() || defaultProfile.displayName,
      handle: parsed.handle?.trim() || defaultProfile.handle,
      bio: parsed.bio?.trim() || defaultProfile.bio
    };
  } catch {
    return defaultProfile;
  }
};

export default function PacksPage() {
  const { user } = useAuth();
  const { gearItems, isLoading } = useAppState();
  const { packs, createPack, updatePack, deletePack, toggleItemInPack } = usePacks(user?.id ?? fallbackUserId);

  const [profile, setProfile] = useState<ProfileSettings>(() => readProfile(user?.name));
  const [showPackEditor, setShowPackEditor] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [name, setName] = useState('');
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [selectedOverviewCategories, setSelectedOverviewCategories] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!packs.length) {
      setSelectedPackId(null);
      return;
    }
    if (!selectedPackId || !packs.some((pack) => pack.id === selectedPackId)) {
      setSelectedPackId(packs[0].id);
    }
  }, [packs, selectedPackId]);

  useEffect(() => {
    setSelectedOverviewCategories([]);
  }, [selectedPackId]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.profile-menu-wrap')) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileMenuOpen]);

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

  const overviewChartData = useMemo<BarItem[]>(() => {
    if (!selectedSummary) return [];
    const raw = calculateChartData(selectedSummary.items, 'all');
    const totalWeight = selectedSummary.totalWeight;

    return raw
      .map((entry) => {
        const value = entry.weight;
        return {
          id: entry.name,
          name: entry.name,
          value,
          color: entry.color,
          percentage: totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0,
          unit: 'g'
        };
      })
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [selectedSummary]);

  const handleOverviewCategoryClick = (name: string) => {
    setSelectedOverviewCategories((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleCreatePack = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = createPack(trimmed, description, routeName);
    setSelectedPackId(next.id);
    setName('');
    setRouteName('');
    setDescription('');
    setShowPackEditor(false);
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

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 lg:px-[16px] py-4">
      <section className="glass-surface p-4 sm:p-5 mb-3 relative max-w-[760px] mx-auto">
        <div className="profile-menu-wrap absolute top-3 right-3">
          <button
            type="button"
            className="glass-header-chip h-8 w-8 inline-flex items-center justify-center text-gray-600 dark:text-gray-200"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-label="Profile menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
            </svg>
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-lg py-1 z-30 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => {
                  setShowProfileEditor(true);
                  setProfileMenuOpen(false);
                }}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] tracking-wide uppercase text-gray-500 dark:text-gray-400 text-center">{profile.headerTitle}</p>
        <div className="mt-2 flex flex-col items-center text-center">
          <span className="h-12 w-12 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-base font-semibold inline-flex items-center justify-center">
            {(profile.displayName?.trim()?.charAt(0) || 'U').toUpperCase()}
          </span>
          <h2 className="mt-2 text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">{profile.displayName}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{profile.handle}</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-xl">{profile.bio}</p>
        </div>
      </section>

      {packs.length > 0 && (
        <section className="p-0 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <div className="max-w-[760px] mx-auto flex items-end justify-between gap-2">
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1 min-w-max">
                  {packSummaries.map(({ pack }) => {
                    const isActive = selectedPackId === pack.id;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        className={[
                          'h-8 px-3 rounded-t-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-white/85 dark:bg-slate-700/75 text-gray-900 dark:text-gray-100'
                            : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-slate-700/30'
                        ].join(' ')}
                        onClick={() => {
                          setSelectedPackId(pack.id);
                          setShowItemEditor(false);
                        }}
                      >
                        {pack.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                onClick={() => setShowPackEditor(true)}
                aria-label="New pack"
                title="New pack"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {selectedSummary && (
            <article className="p-3 sm:p-4 max-w-[760px] mx-auto">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{selectedSummary.pack.name}</h3>
                </div>
                <button
                  className="text-xs text-red-600 dark:text-red-400"
                  onClick={() => deletePack(selectedSummary.pack.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>

              <div className="mt-3 rounded-md border border-gray-200/70 dark:border-slate-600 bg-white/35 dark:bg-slate-800/35 p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Route</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedSummary.pack.routeName || 'Route not set'}
                </p>
              </div>

              <div className="mt-3 rounded-md border border-gray-200/70 dark:border-slate-600 bg-white/35 dark:bg-slate-800/35 p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Overview</p>
                {selectedSummary.pack.description && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{selectedSummary.pack.description}</p>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-1.5">
                  <p className="text-gray-500 dark:text-gray-400">Items</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedSummary.items.length}</p>
                </div>
                <div className="rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-1.5">
                  <p className="text-gray-500 dark:text-gray-400">Weight</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedSummary.totalWeight.toLocaleString()}g</p>
                </div>
                <div className="rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-1.5">
                  <p className="text-gray-500 dark:text-gray-400">Cost</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(selectedSummary.totalPrice)}</p>
                </div>
              </div>
                {overviewChartData.length > 0 && (
                  <div className="mt-3 rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-2">
                    <HorizontalBarChart
                      data={overviewChartData}
                      totalValue={selectedSummary.totalWeight}
                      viewMode="weight"
                      selectedCategories={selectedOverviewCategories}
                      onCategoryClick={handleOverviewCategoryClick}
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-md border border-gray-200/70 dark:border-slate-600 bg-white/35 dark:bg-slate-800/35">
                <div className="px-3 pt-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Gear</p>
                </div>
                <CardGridView
                  items={selectedSummary.items}
                  viewMode="weight"
                  quantityDisplayMode="all"
                  disableSort={showItemEditor}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link to={`/p/${selectedSummary.pack.id}`} className="h-8 px-3 rounded-md btn-secondary text-xs inline-flex items-center">
                  Open
                </Link>
                <button
                  type="button"
                  className="h-8 px-3 rounded-md btn-secondary text-xs"
                  onClick={() => copyPublicLink(selectedSummary.pack.id)}
                >
                  Copy Link
                </button>
                <button
                  type="button"
                  className="h-8 px-3 rounded-md btn-secondary text-xs"
                  onClick={() => setShowItemEditor((prev) => !prev)}
                >
                  {showItemEditor ? 'Close Edit' : 'Edit Items'}
                </button>
              </div>

              {showItemEditor && (
                <div className="mt-3 max-h-64 overflow-auto rounded-md border border-gray-200/70 dark:border-slate-600 p-2">
                  {isLoading && <p className="text-xs text-gray-500">Loading gear...</p>}
                  {!isLoading && gearItems.length === 0 && <p className="text-xs text-gray-500">No gear yet.</p>}
                  {!isLoading &&
                    gearItems.map((item) => {
                      const checked = selectedSummary.pack.itemIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100/70 dark:hover:bg-slate-700/50"
                        >
                          <img
                            src={item.imageUrl || 'https://via.placeholder.com/48x48?text=No+Image'}
                            alt={item.name}
                            className="h-7 w-7 rounded object-cover"
                            loading="lazy"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs text-gray-700 dark:text-gray-200 truncate">{item.name}</span>
                            {item.category && (
                              <CategoryBadge name={item.category.name} color={item.category.color} className="mt-0.5" />
                            )}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItemInPack(selectedSummary.pack.id, item.id)}
                            className="h-4 w-4"
                          />
                        </label>
                      );
                    })}
                </div>
              )}
            </article>
          )}
        </section>
      )}

      {packs.length === 0 && (
        <section className="glass-surface p-6 sm:p-8 text-center">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Packs がまだありません</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">まずは 1 つ作成して、山行ごとに装備を分けましょう。</p>
          <div className="mt-4 text-left max-w-md mx-auto">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">作成手順</p>
            <ol className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1 list-decimal pl-4">
              <li>`+ New Pack` を押す</li>
              <li>Pack名を入力して作成</li>
              <li>`Edit Items` でギアを選択</li>
              <li>`Copy Link` で公開リンク共有</li>
            </ol>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button type="button" className="h-9 px-4 rounded-md btn-primary text-sm" onClick={() => setShowPackEditor(true)}>
              + New Pack
            </button>
            <button type="button" className="h-9 px-4 rounded-md btn-secondary text-sm" onClick={handleCreateSamplePack}>
              Sample を作成
            </button>
          </div>
        </section>
      )}

      {showPackEditor && (
        <div className="modal-overlay" onClick={() => setShowPackEditor(false)}>
          <div className="modal-panel-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Pack</h3>
              <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setShowPackEditor(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePack} className="p-6 space-y-3">
              <input
                className="input w-full"
                placeholder="Pack name (e.g. Alps 2D1N)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="input w-full"
                placeholder="Route (e.g. Mt. Fuji Yoshida Trail)"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
              />
              <textarea
                className="input w-full min-h-[84px]"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" className="btn-secondary" onClick={() => setShowPackEditor(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileEditor && (
        <div className="modal-overlay" onClick={() => setShowProfileEditor(false)}>
          <div className="modal-panel-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
              <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setShowProfileEditor(false)}>✕</button>
            </div>
            <div className="p-6 space-y-3">
              <input
                className="input w-full"
                placeholder="Header title"
                value={profile.headerTitle}
                onChange={(e) => setProfile((prev) => ({ ...prev, headerTitle: e.target.value }))}
              />
              <input
                className="input w-full"
                placeholder="Display name"
                value={profile.displayName}
                onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
              />
              <input
                className="input w-full"
                placeholder="@handle"
                value={profile.handle}
                onChange={(e) => setProfile((prev) => ({ ...prev, handle: e.target.value }))}
              />
              <textarea
                className="input w-full min-h-[84px]"
                placeholder="Bio"
                value={profile.bio}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" className="btn-primary" onClick={() => setShowProfileEditor(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
