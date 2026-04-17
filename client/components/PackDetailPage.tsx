import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { usePacks } from '../hooks/usePacks';
import { formatPrice } from '../utils/formatters';
import { getQuantityForDisplayMode } from '../utils/chartHelpers';
import { formatWeight, formatWeightLarge } from '../utils/weightUnit';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import CategoryBadge from './ui/CategoryBadge';

const fallbackUserId = 'local-user';

export default function PackDetailPage() {
  const { packId = '' } = useParams();
  const { gearItems, isLoading } = useAppState();
  const { getPackById } = usePacks(fallbackUserId);
  const { unit } = useWeightUnit();
  const pack = getPackById(packId);

  const items = useMemo(
    () => (pack ? gearItems.filter((item) => pack.itemIds.includes(item.id)) : []),
    [pack, gearItems]
  );

  const totalWeight = useMemo(
    () => items.reduce((sum, item) => sum + (item.weightGrams || 0) * getQuantityForDisplayMode(item, 'all'), 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + (item.priceCents || 0) * getQuantityForDisplayMode(item, 'all'), 0),
    [items]
  );

  if (!pack) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-8">
        <div className="glass-surface p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pack not found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            This pack may have been removed from local storage.
          </p>
          <Link to="/" className="inline-flex mt-4 h-9 items-center px-4 rounded-md btn-secondary text-sm">
            Back to Packs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-4">
      <section className="glass-surface p-4 mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Public Pack</p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">{pack.name}</h1>
        {pack.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{pack.description}</p>}

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md px-2 py-2 bg-gray-50">
            <p className="text-gray-500 dark:text-gray-400">Items</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{items.length}</p>
          </div>
          <div className="rounded-md px-2 py-2 bg-gray-50">
            <p className="text-gray-500 dark:text-gray-400">Weight</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{formatWeightLarge(totalWeight, unit)}</p>
          </div>
          <div className="rounded-md px-2 py-2 bg-gray-50">
            <p className="text-gray-500 dark:text-gray-400">Cost</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(totalPrice)}</p>
          </div>
        </div>
      </section>

      <section className="glass-surface p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200">
          <span>Item</span>
          <span>Weight</span>
          <span>Price</span>
        </div>
        {isLoading && <p className="px-4 py-4 text-sm text-gray-500">Loading gear...</p>}
        {!isLoading && items.length === 0 && (
          <p className="px-4 py-4 text-sm text-gray-500">No items in this pack.</p>
        )}
        {!isLoading &&
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-sm border-b border-gray-200 last:[box-shadow:none]"
            >
              <span className="flex items-center gap-2 min-w-0">
                <img
                  src={item.imageUrl || 'https://via.placeholder.com/56x56?text=No+Image'}
                  alt={item.name}
                  className="h-8 w-8 rounded object-cover"
                  loading="lazy"
                />
                <span className="min-w-0">
                  <span className="block text-gray-800 dark:text-gray-100 truncate">{item.name}</span>
                  {item.category && (
                    <CategoryBadge
                      name={item.category.name}
                      color={item.category.color}
                      className="mt-0.5"
                    />
                  )}
                </span>
              </span>
              <span className="text-gray-700 dark:text-gray-200">{formatWeight((item.weightGrams || 0) * getQuantityForDisplayMode(item, 'all'), unit)}</span>
              <span className="text-gray-700 dark:text-gray-200">{formatPrice((item.priceCents || 0) * getQuantityForDisplayMode(item, 'all'))}</span>
            </div>
          ))}
      </section>
    </main>
  );
}
