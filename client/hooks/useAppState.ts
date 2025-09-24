import { useState, useEffect, useCallback } from 'react';
import { GearItemWithCalculated, Category } from '../utils/types';
import { GearApiService } from '../services/gearApiService';

export const useAppState = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItemWithCalculated | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showGearDropdown, setShowGearDropdown] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  // データ読み込み状態
  const [isLoading, setIsLoading] = useState(true);

  // APIから取得したギアアイテム（計算済み）
  const [gearItems, setGearItems] = useState<GearItemWithCalculated[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Clothing', path: ['Clothing'], color: '#FF6B6B', createdAt: new Date().toISOString() },
    { id: '2', name: 'Sleep', path: ['Sleep'], color: '#4ECDC4', createdAt: new Date().toISOString() },
    { id: '3', name: 'Pack', path: ['Pack'], color: '#FFE66D', createdAt: new Date().toISOString() },
    { id: '4', name: 'Electronics', path: ['Electronics'], color: '#4D96FF', createdAt: new Date().toISOString() },
    { id: '5', name: 'Hygiene', path: ['Hygiene'], color: '#A66DFF', createdAt: new Date().toISOString() },
  ]);

  // ギアアイテムをAPIから取得（useCallbackで安定化）
  const fetchGearItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await GearApiService.getAllGear();

      // N+1問題解消: 事前にカテゴリマップ作成
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
      const defaultCategory = {
        id: '1',
        name: 'Clothing',
        path: ['Clothing'],
        color: '#FF6B6B',
        createdAt: new Date().toISOString()
      };

      const enrichedItems = items.map(item => ({
        ...item,
        category: categoryMap.get(item.categoryId) || defaultCategory
      }));

      setGearItems(enrichedItems);
    } catch (err) {
      console.error('Error fetching gear items:', err);
      throw err; // エラーを上位に委譲
    } finally {
      setIsLoading(false);
    }
  }, [categories]); // categoriesが変更された時のみ再作成

  // 初回ロード
  useEffect(() => {
    fetchGearItems();
  }, []); // 空の依存配列で初回のみ実行

  // API操作関数（エラー・成功処理は上位コンポーネントで実装）
  const handleCreateGear = async (gearData: any) => {
    await GearApiService.createGear(gearData);
    await fetchGearItems(); // データを再取得
  };

  const handleUpdateGear = async (id: string, gearData: any) => {
    await GearApiService.updateGear(id, gearData);
    await fetchGearItems(); // データを再取得
  };

  const handleDeleteGear = async (id: string) => {
    await GearApiService.deleteGear(id);
    await fetchGearItems(); // データを再取得
  };

  return {
    // UI状態
    showForm, setShowForm,
    editingGear, setEditingGear,
    showLogin, setShowLogin,
    showCategoryManager, setShowCategoryManager,
    showChat, setShowChat,
    showGearDropdown, setShowGearDropdown,
    showCheckboxes, setShowCheckboxes,

    // データ状態
    gearItems,
    categories, setCategories,
    isLoading,

    // API操作関数
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    refreshGearItems: fetchGearItems
  };
};