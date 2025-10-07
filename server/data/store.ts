import { GearItem, Category } from '../models/types';

/**
 * インメモリデータストア
 * 開発用の簡易データベース代替
 */

// カテゴリデータ
export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Backpack',
    color: '#3B82F6',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-2', 
    name: 'Shelter',
    color: '#10B981',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-3',
    name: 'Sleep System',
    color: '#8B5CF6',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-4',
    name: 'Cooking',
    color: '#F59E0B',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-5',
    name: 'Water',
    color: '#06B6D4',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-6',
    name: 'Clothing',
    color: '#EC4899',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-7',
    name: 'Navigation',
    color: '#84CC16',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-8',
    name: 'Safety',
    color: '#EF4444',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-9',
    name: 'Tools',
    color: '#6B7280',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat-10',
    name: 'Electronics',
    color: '#F97316',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// ギアアイテムデータ
export const gearItems: GearItem[] = [
  {
    id: 'gear-1',
    name: 'Osprey Atmos AG 65',
    brand: 'Osprey',
    categoryId: 'cat-1',
    weightGrams: 2100,
    priceCents: 25000,
    requiredQuantity: 1,
    ownedQuantity: 1,
    priority: 1,
    season: 'all',
    productUrl: 'https://www.osprey.com/us/en/product/atmos-ag-65-ATMOS65.html',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'gear-2',
    name: 'Big Agnes Copper Spur HV UL2',
    brand: 'Big Agnes',
    categoryId: 'cat-2',
    weightGrams: 1360,
    priceCents: 45000,
    requiredQuantity: 1,
    ownedQuantity: 0,
    priority: 1,
    season: 'all',
    productUrl: 'https://www.bigagnes.com/copper-spur-hv-ul2',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'gear-3',
    name: 'Western Mountaineering UltraLite',
    brand: 'Western Mountaineering',
    categoryId: 'cat-3',
    weightGrams: 680,
    priceCents: 35000,
    requiredQuantity: 1,
    ownedQuantity: 1,
    priority: 1,
    season: 'summer',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: 'gear-4',
    name: 'Jetboil Flash',
    brand: 'Jetboil',
    categoryId: 'cat-4',
    weightGrams: 371,
    priceCents: 10000,
    requiredQuantity: 1,
    ownedQuantity: 1,
    priority: 2,
    season: 'all',
    productUrl: 'https://jetboil.com/flash',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'gear-5',
    name: 'Sawyer Squeeze',
    brand: 'Sawyer',
    categoryId: 'cat-5',
    weightGrams: 57,
    priceCents: 3500,
    requiredQuantity: 1,
    ownedQuantity: 1,
    priority: 1,
    season: 'all',
    productUrl: 'https://sawyer.com/products/sawyer-squeeze-filter',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19')
  }
];

/**
 * データストア操作関数
 */

// ギアアイテム操作
export function getAllGearItems(): GearItem[] {
  return [...gearItems];
}

export function getGearItemById(id: string): GearItem | undefined {
  return gearItems.find(item => item.id === id);
}

export function addGearItem(item: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>): GearItem {
  const newItem: GearItem = {
    ...item,
    id: `gear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  gearItems.push(newItem);
  return newItem;
}

export function updateGearItem(id: string, updates: Partial<Omit<GearItem, 'id' | 'createdAt'>>): GearItem | null {
  const index = gearItems.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  gearItems[index] = {
    ...gearItems[index],
    ...updates,
    updatedAt: new Date()
  };
  return gearItems[index];
}

export function deleteGearItem(id: string): boolean {
  const index = gearItems.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  gearItems.splice(index, 1);
  return true;
}

// カテゴリ操作
export function getAllCategories(): Category[] {
  return [...categories];
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find(cat => cat.id === id);
}

export function addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
  const newCategory: Category = {
    ...category,
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  categories.push(newCategory);
  return newCategory;
}

// 統計情報
export function getGearStats() {
  const totalItems = gearItems.length;
  const ownedItems = gearItems.filter(item => item.ownedQuantity > 0).length;
  const totalWeight = gearItems
    .filter(item => item.ownedQuantity > 0 && item.weightGrams)
    .reduce((sum, item) => sum + (item.weightGrams! * item.ownedQuantity), 0);
  const totalValue = gearItems
    .filter(item => item.ownedQuantity > 0 && item.priceCents)
    .reduce((sum, item) => sum + (item.priceCents! * item.ownedQuantity), 0);

  return {
    totalItems,
    ownedItems,
    totalWeight,
    totalValue,
    categories: categories.length
  };
}
