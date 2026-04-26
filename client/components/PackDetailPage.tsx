import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_CONFIG } from '../services/api.client';
import { formatPrice } from '../utils/formatters';
import { formatWeight, formatWeightLarge } from '../utils/weightUnit';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import CategoryBadge from './ui/CategoryBadge';
import EmptyState from './ui/EmptyState';

/** 公開パック取得 API のレスポンス（snake_case）。 */
interface PublicPackItemRow {
  id: string;
  name: string;
  brand: string | null;
  weight_grams: number | null;
  price_cents: number | null;
  required_quantity: number;
  image_url: string | null;
  product_url: string | null;
  category_name: string | null;
  category_color: string | null;
}

interface PublicPackResponse {
  id: string;
  name: string;
  description: string | null;
  route_name: string | null;
  is_public: boolean;
  author_name: string | null;
  author_handle: string | null;
  items: PublicPackItemRow[];
}

type FetchState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; pack: PublicPackResponse };

export default function PackDetailPage() {
  const { packId = '' } = useParams();
  const { unit } = useWeightUnit();
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  // 公開パックのみ取得（認証不要）。サーバー側で is_public=false は 404 を返す。
  useEffect(() => {
    if (!packId) {
      setState({ status: 'not-found' });
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.baseUrl}/packs/public/${encodeURIComponent(packId)}`,
          { signal: controller.signal },
        );

        if (response.status === 404) {
          setState({ status: 'not-found' });
          return;
        }
        if (!response.ok) {
          setState({ status: 'error', message: `HTTP ${response.status}` });
          return;
        }

        const json = (await response.json()) as { success: boolean; data?: PublicPackResponse; message?: string };
        if (!json.success || !json.data) {
          setState({ status: 'error', message: json.message ?? 'Failed to load pack' });
          return;
        }
        setState({ status: 'ready', pack: json.data });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load pack' });
      }
    })();

    return () => controller.abort();
  }, [packId]);

  const items = state.status === 'ready' ? state.pack.items : [];

  const totalWeight = useMemo(
    () => items.reduce((sum, item) => sum + (item.weight_grams ?? 0) * item.required_quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + (item.price_cents ?? 0) * item.required_quantity, 0),
    [items],
  );

  if (state.status === 'loading') {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-8">
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading pack...</p>
        </div>
      </main>
    );
  }

  if (state.status === 'not-found') {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-8">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pack not found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            This pack does not exist or is not public.
          </p>
          <Link to="/" className="inline-flex mt-4 h-9 items-center px-4 rounded-md btn-secondary text-sm">
            Back to Packs
          </Link>
        </div>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-8">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Could not load pack</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{state.message}</p>
          <Link to="/" className="inline-flex mt-4 h-9 items-center px-4 rounded-md btn-secondary text-sm">
            Back to Packs
          </Link>
        </div>
      </main>
    );
  }

  const { pack } = state;
  const authorLabel = pack.author_name ?? (pack.author_handle ? `@${pack.author_handle}` : null);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px] py-4">
      <section className="card p-4 mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Public Pack</p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">{pack.name}</h1>
        {authorLabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">by {authorLabel}</p>
        )}
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

      <section className="card p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200">
          <span>Item</span>
          <span>Weight</span>
          <span>Price</span>
        </div>
        {items.length === 0 && (
          <EmptyState
            compact
            title="このパックにはまだアイテムがありません"
            description="作成者がアイテムを追加するとここに表示されます。"
          />
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-sm border-b border-gray-200 last:[box-shadow:none]"
          >
            <span className="flex items-center gap-2 min-w-0">
              <img
                src={item.image_url || 'https://via.placeholder.com/56x56?text=No+Image'}
                alt={item.name}
                className="h-8 w-8 rounded object-cover"
                loading="lazy"
              />
              <span className="min-w-0">
                <span className="block text-gray-800 dark:text-gray-100 truncate">{item.name}</span>
                {item.category_name && (
                  <CategoryBadge
                    name={item.category_name}
                    color={item.category_color ?? undefined}
                    className="mt-0.5"
                  />
                )}
              </span>
            </span>
            <span className="text-gray-700 dark:text-gray-200">
              {formatWeight((item.weight_grams ?? 0) * item.required_quantity, unit)}
            </span>
            <span className="text-gray-700 dark:text-gray-200">
              {formatPrice((item.price_cents ?? 0) * item.required_quantity)}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
