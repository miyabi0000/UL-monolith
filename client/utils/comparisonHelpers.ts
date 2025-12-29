/**
 * ギア比較機能のヘルパー関数
 */

import { GearItemWithCalculated, ComparisonMetrics } from './types';

/**
 * 効率指標（g/¥）を計算
 * 値が小さいほど効率が良い
 */
export function calculateEfficiency(item: GearItemWithCalculated): number {
  if (!item.weightGrams || !item.priceCents || item.priceCents === 0) {
    return Infinity;
  }

  const priceYen = item.priceCents / 100;
  return item.weightGrams / priceYen;
}

/**
 * 比較メトリクスを計算
 */
export function calculateComparisonMetrics(item: GearItemWithCalculated): ComparisonMetrics {
  const efficiency = calculateEfficiency(item);

  return {
    efficiency,
    categorySpecific: {
      // 将来的にカテゴリ固有の指標を追加
      // volumeToWeight: item.volume / item.weightGrams
      // warmthToWeight: item.warmthRating / item.weightGrams
    }
  };
}

/**
 * アイテムが同じカテゴリかチェック
 */
export function isSameCategory(item1: GearItemWithCalculated, item2: GearItemWithCalculated): boolean {
  return item1.categoryId === item2.categoryId;
}

/**
 * 比較可能かチェック（同一カテゴリ制約）
 */
export function canCompare(items: GearItemWithCalculated[]): {
  canCompare: boolean;
  reason?: string;
} {
  if (items.length < 2) {
    return { canCompare: false, reason: 'もう1件追加してください' };
  }

  if (items.length > 4) {
    return { canCompare: false, reason: '比較は最大4件までです' };
  }

  const categoryId = items[0].categoryId;
  const allSameCategory = items.every(item => item.categoryId === categoryId);

  if (!allSameCategory) {
    return { canCompare: false, reason: '同一カテゴリ内で比較してください' };
  }

  return { canCompare: true };
}

/**
 * ソートキーに応じてアイテムを比較
 * 昇順でソート（小さい方が良い）
 */
export function compareItems(
  a: GearItemWithCalculated,
  b: GearItemWithCalculated,
  sortKey: 'price' | 'weight' | 'efficiency'
): number {
  if (sortKey === 'price') {
    const aPrice = a.priceCents || Infinity;
    const bPrice = b.priceCents || Infinity;
    return aPrice - bPrice;
  }

  if (sortKey === 'weight') {
    const aWeight = a.weightGrams || Infinity;
    const bWeight = b.weightGrams || Infinity;
    return aWeight - bWeight;
  }

  if (sortKey === 'efficiency') {
    const aEff = calculateEfficiency(a);
    const bEff = calculateEfficiency(b);
    return aEff - bEff;
  }

  return 0;
}

/**
 * 最良のアイテムを取得
 */
export function getBestItem(
  items: GearItemWithCalculated[],
  sortKey: 'price' | 'weight' | 'efficiency'
): GearItemWithCalculated | null {
  if (items.length === 0) {
    return null;
  }

  return items.reduce((best, current) => {
    return compareItems(current, best, sortKey) < 0 ? current : best;
  }, items[0]);
}

/**
 * 差分ハイライト用の値取得
 * 優位な差（10%以上）がある場合のみ、最良値を緑ハイライト
 */
export function getValueHighlight(
  value: number,
  allValues: number[],
  lowerIsBetter: boolean = true
): 'good' | 'neutral' {
  if (allValues.length <= 1) {
    return 'neutral';
  }

  const validValues = allValues.filter(v => isFinite(v) && v > 0);
  if (validValues.length === 0) {
    return 'neutral';
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  // 同値の場合はハイライトしない
  if (min === max) {
    return 'neutral';
  }

  // 差が10%未満ならハイライトしない
  const threshold = 0.10; // 10%
  const range = max - min;
  if (range / max < threshold) {
    return 'neutral';
  }

  // 最良値のみ緑ハイライト
  if (lowerIsBetter) {
    return value === min ? 'good' : 'neutral';
  } else {
    return value === max ? 'good' : 'neutral';
  }
}

/**
 * 総重量・総コストの差分を計算
 */
export function calculateDelta(
  currentItem: GearItemWithCalculated | null,
  newItem: GearItemWithCalculated
): {
  deltaWeight: number;
  deltaCost: number;
} {
  if (!currentItem) {
    return {
      deltaWeight: newItem.weightGrams || 0,
      deltaCost: newItem.priceCents || 0
    };
  }

  return {
    deltaWeight: (newItem.weightGrams || 0) - (currentItem.weightGrams || 0),
    deltaCost: (newItem.priceCents || 0) - (currentItem.priceCents || 0)
  };
}

/**
 * 価格をフォーマット（円表示）
 */
export function formatPrice(priceCents: number | undefined): string {
  if (priceCents === undefined || priceCents === null) {
    return '—';
  }

  const priceYen = Math.round(priceCents / 100);
  return `¥${priceYen.toLocaleString()}`;
}

/**
 * 重量をフォーマット（g表示）
 */
export function formatWeight(weightGrams: number | undefined): string {
  if (weightGrams === undefined || weightGrams === null) {
    return '—';
  }

  return `${weightGrams}g`;
}

/**
 * 効率をフォーマット（g/¥表示）
 */
export function formatEfficiency(efficiency: number): string {
  if (!isFinite(efficiency)) {
    return '—';
  }

  return `${efficiency.toFixed(2)} g/¥`;
}
