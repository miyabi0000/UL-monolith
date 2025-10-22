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
export const gearItems: GearItem[] = [];

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

export function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Category | null {
  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) return null;
  
  categories[index] = {
    ...categories[index],
    ...updates,
    updatedAt: new Date()
  };
  return categories[index];
}

export function deleteCategory(id: string): boolean {
  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) return false;
  
  // カテゴリを使用しているギアアイテムがあるか確認
  const hasItems = gearItems.some(item => item.categoryId === id);
  if (hasItems) {
    throw new Error('Cannot delete category with associated items');
  }
  
  categories.splice(index, 1);
  return true;
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
