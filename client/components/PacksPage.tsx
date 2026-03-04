import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { formatPrice } from '../utils/formatters';
import CategoryBadge from './ui/CategoryBadge';

const fallbackUserId = 'local-user';

export default function PacksPage() {
  const { user } = useAuth();
  const { gearItems, isLoading } = useAppState();
  const { packs, createPack, deletePack, toggleItemInPack } = usePacks(user?.id ?? fallbackUserId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-4">
      <section className="glass-surface p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create Pack</h2>
        <form onSubmit={handleCreatePack} className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <input
            className="h-9 rounded-md border border-gray-300/70 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 text-sm"
            placeholder="Pack name (e.g. Alps 2D1N)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="h-9 rounded-md border border-gray-300/70 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 px-3 text-sm"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" className="h-9 px-4 rounded-md btn-primary text-sm">
            Add Pack
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {packSummaries.map(({ pack, items, totalWeight, totalPrice }) => (
          <article key={pack.id} className="glass-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pack.name}</h3>
                {pack.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{pack.description}</p>
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

            <div className="mt-3 flex items-center gap-2">
              <Link to={`/p/${pack.id}`} className="h-8 px-3 rounded-md btn-secondary text-xs inline-flex items-center">
                Open Public Page
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
                {expandedPackId === pack.id ? 'Close Items' : 'Edit Items'}
              </button>
            </div>

            {items.length > 0 && (
              <div className="mt-3 flex -space-x-2 overflow-hidden">
                {items.slice(0, 5).map((item) => (
                  <img
                    key={item.id}
                    src={item.imageUrl || 'https://via.placeholder.com/80x80?text=No+Image'}
                    alt={item.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white/80 dark:ring-slate-800/80"
                    loading="lazy"
                  />
                ))}
                {items.length > 5 && (
                  <span className="h-8 min-w-[32px] px-2 rounded-full bg-white/70 dark:bg-slate-700/70 ring-2 ring-white/80 dark:ring-slate-800/80 text-[11px] font-medium flex items-center justify-center text-gray-700 dark:text-gray-200">
                    +{items.length - 5}
                  </span>
                )}
              </div>
            )}

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
            Packs are empty. Create your first trip pack above.
          </div>
        )}
      </section>
    </main>
  );
}
