import { GearItemWithCalculated } from './types';
import { SortField, SortDirection } from '../components/GearTable/TableHeader';

/**
 * 季節の順序を定義する定数
 */
export const SEASON_ORDER: Record<string, number> = {
  'spring': 0,
  'summer': 1,
  'fall': 2,
  'winter': 3,
};

/**
 * ソートフィールドに基づいてアイテムの値を取得
 * @param item - ギアアイテム
 * @param sortField - ソートするフィールド
 * @returns ソート用の値
 */
export function getSortValue(item: GearItemWithCalculated, sortField: SortField): string | number {
  switch (sortField) {
    case 'name':
      return item.name.toLowerCase();
    case 'category':
      return item.category?.name || '';
    case 'weight':
      return item.totalWeight;
    case 'shortage':
      return item.shortage;
    case 'owned':
      return item.ownedQuantity;
    case 'required':
      return item.requiredQuantity;
    case 'priority':
      return item.priority;
    case 'price':
      return item.totalPrice;
    case 'season':
      return item.seasons
        ? Math.min(...item.seasons.map(s => SEASON_ORDER[s] || 999))
        : 999;
    default:
      return 0;
  }
}

/**
 * アイテムの配列をソートする
 * @param items - ソート対象のアイテム配列
 * @param sortField - ソートするフィールド
 * @param sortDirection - ソート方向（昇順/降順）
 * @returns ソートされたアイテム配列
 */
export function sortItems(
  items: GearItemWithCalculated[],
  sortField: SortField,
  sortDirection: SortDirection
): GearItemWithCalculated[] {
  return [...items].sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * アイテムをカテゴリでフィルタリング
 * @param items - フィルタ対象のアイテム配列
 * @param selectedCategories - 選択されたカテゴリ名の配列
 * @returns フィルタされたアイテム配列
 */
export function filterByCategories(
  items: GearItemWithCalculated[],
  selectedCategories: string[]
): GearItemWithCalculated[] {
  if (selectedCategories.length === 0) {
    return items;
  }
  return items.filter(item =>
    item.category && selectedCategories.includes(item.category.name)
  );
}

/**
 * アイテムの処理（フィルタリング+ソート）を一括で実行
 * @param items - 処理対象のアイテム配列
 * @param selectedCategories - 選択されたカテゴリ名の配列
 * @param sortField - ソートするフィールド
 * @param sortDirection - ソート方向
 * @returns 処理済みのアイテム配列
 */
export function processItems(
  items: GearItemWithCalculated[],
  selectedCategories: string[],
  sortField: SortField,
  sortDirection: SortDirection
): GearItemWithCalculated[] {
  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = filterByCategories(safeItems, selectedCategories);
  return sortItems(filteredItems, sortField, sortDirection);
}
