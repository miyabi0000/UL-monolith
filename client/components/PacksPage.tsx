import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { formatPrice } from '../utils/formatters';
import CategoryBadge from './ui/CategoryBadge';
import CardGridView from './DetailPanel/CardGridView';

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
  const { packs, createPack, deletePack, toggleItemInPack } = usePacks(user?.id ?? fallbackUserId);

  const [profile, setProfile] = useState<ProfileSettings>(() => readProfile(user?.name));
  const [showPackEditor, setShowPackEditor] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const packSummaries = useMemo(
    () =>
      packs.map((pack) => {
        const items = gearItems.filter((item) => pack.itemIds.includes(item.id));
        const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
        const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        return { pack, items, totalWeight, totalPrice };
      }),
    [packs, gearItems]
  );

  const handleCreatePack = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createPack(trimmed, description);
    setName('');
    setDescription('');
    setShowPackEditor(false);
  };

  const copyPublicLink = async (packId: string) => {
    const url = `${window.location.origin}/p/${packId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this public link', url);
    }
  };

  const userInitial = (profile.displayName?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 lg:px-[16px] py-4">
      <section className="glass-surface p-4 sm:p-5 mb-4">
        <p className="text-[11px] tracking-wide uppercase text-gray-500 dark:text-gray-400 text-center">{profile.headerTitle}</p>
        <div className="mt-2 flex flex-col items-center text-center">
          <span className="h-14 w-14 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-lg font-semibold inline-flex items-center justify-center shadow-sm">
            {userInitial}
          </span>
          <h2 className="mt-2 text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">{profile.displayName}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{profile.handle}</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-xl">{profile.bio}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="h-8 px-3 rounded-md btn-secondary text-xs"
            onClick={() => setShowPackEditor(true)}
          >
            EDIT PACKS
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded-md btn-secondary text-xs"
            onClick={() => setShowProfileEditor(true)}
          >
            EDIT PROFILE
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {packSummaries.map(({ pack, items, totalWeight, totalPrice }) => (
          <article key={pack.id} className="glass-surface p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{pack.name}</h3>
                {pack.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{pack.description}</p>
                )}
              </div>
              <button
                className="text-xs text-red-600 dark:text-red-400"
                onClick={() => deletePack(pack.id)}
                type="button"
              >
                Delete
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-1.5">
                <p className="text-gray-500 dark:text-gray-400">Items</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{items.length}</p>
              </div>
              <div className="rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-1.5">
                <p className="text-gray-500 dark:text-gray-400">Weight</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{totalWeight.toLocaleString()}g</p>
              </div>
              <div className="rounded-md bg-white/55 dark:bg-slate-800/60 px-2 py-1.5">
                <p className="text-gray-500 dark:text-gray-400">Cost</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(totalPrice)}</p>
              </div>
            </div>

            <div className="mt-3 rounded-md border border-gray-200/70 dark:border-slate-600 bg-white/35 dark:bg-slate-800/35 max-h-[220px] overflow-auto">
              <CardGridView
                items={items}
                viewMode="weight"
                quantityDisplayMode="all"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link to={`/p/${pack.id}`} className="h-8 px-3 rounded-md btn-secondary text-xs inline-flex items-center">
                Open
              </Link>
              <button
                type="button"
                className="h-8 px-3 rounded-md btn-secondary text-xs"
                onClick={() => copyPublicLink(pack.id)}
              >
                Copy Link
              </button>
              <button
                type="button"
                className="h-8 px-3 rounded-md btn-secondary text-xs"
                onClick={() => setExpandedPackId((prev) => (prev === pack.id ? null : pack.id))}
              >
                {expandedPackId === pack.id ? 'Close Edit' : 'Edit Items'}
              </button>
            </div>

            {expandedPackId === pack.id && (
              <div className="mt-3 max-h-64 overflow-auto rounded-md border border-gray-200/70 dark:border-slate-600 p-2">
                {isLoading && <p className="text-xs text-gray-500">Loading gear...</p>}
                {!isLoading && gearItems.length === 0 && <p className="text-xs text-gray-500">No gear yet.</p>}
                {!isLoading &&
                  gearItems.map((item) => {
                    const checked = pack.itemIds.includes(item.id);
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
                          onChange={() => toggleItemInPack(pack.id, item.id)}
                          className="h-4 w-4"
                        />
                      </label>
                    );
                  })}
              </div>
            )}
          </article>
        ))}

        {packSummaries.length === 0 && (
          <div className="glass-surface p-8 text-center text-sm text-gray-600 dark:text-gray-300">
            Packs are empty. Press EDIT PACKS to create your first pack.
          </div>
        )}
      </section>

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
