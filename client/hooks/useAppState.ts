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
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  
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
      setError('');
      const items = await GearApiService.getAllGear();

      // カテゴリ情報を付加（useCallbackで安定化）
      const enrichedItems = items.map(item => ({
        ...item,
        category: categories.find(cat => cat.id === item.categoryId) || { 
          id: '1', 
          name: 'Clothing', 
          path: ['Clothing'], 
          color: '#FF6B6B', 
          createdAt: new Date().toISOString() 
        }
      }));

      setGearItems(enrichedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gear items';
      setError(errorMessage);
      console.error('Error fetching gear items:', err);
    }
  }, [categories]); // categoriesが変更された時のみ再作成

  // 初回ロード
  useEffect(() => {
    fetchGearItems();
  }, []); // 空の依存配列で初回のみ実行

  // API操作関数
  const handleCreateGear = async (gearData: any) => {
    try {
      await GearApiService.createGear(gearData);
      await fetchGearItems(); // データを再取得
      setSuccessMessage('ギアが正常に追加されました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create gear item';
      setError(errorMessage);
    }
  };

  const handleUpdateGear = async (id: string, gearData: any) => {
    try {
      await GearApiService.updateGear(id, gearData);
      await fetchGearItems(); // データを再取得
      setSuccessMessage('ギアが正常に更新されました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update gear item';
      setError(errorMessage);
    }
  };

  const handleDeleteGear = async (id: string) => {
    try {
      await GearApiService.deleteGear(id);
      await fetchGearItems(); // データを再取得
      setSuccessMessage('ギアが正常に削除されました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete gear item';
      setError(errorMessage);
    }
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
    successMessage, setSuccessMessage,
    
    // データ状態
    gearItems,
    categories, setCategories,
    error,
    
    // API操作関数
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    refreshGearItems: fetchGearItems
  };
};