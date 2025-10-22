import { useState, useEffect, useCallback, useMemo } from 'react';
import { GearItemWithCalculated, Category } from '../utils/types';
import { GearApiService } from '../services/gearApiService';
import { CategoryApiService } from '../services/categoryApiService';

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

  // APIから取得した生のギアアイテム
  const [rawGearItems, setRawGearItems] = useState<any[]>([]);
  
  // カテゴリをAPIから取得
  const [categories, setCategories] = useState<Category[]>([]);

  // カテゴリ情報を結合したギアアイテム（useMemoで計算）
  const gearItems = useMemo(() => {
    return rawGearItems.map(item => ({
      ...item,
      category: categories.find(cat => cat.id === item.categoryId)
    })) as GearItemWithCalculated[];
  }, [rawGearItems, categories]);

  // ギアアイテムをAPIから取得（useCallbackで安定化）
  const fetchGearItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await GearApiService.getAllGear();
      setRawGearItems(items); // rawGearItemsに保存
    } catch (err) {
      console.error('Error fetching gear items:', err);
      throw err; // エラーを上位に委譲
    } finally {
      setIsLoading(false);
    }
  }, []);

  // カテゴリを取得
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await CategoryApiService.getAllCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching categories:', err);
      throw err;
    }
  }, []);

  // 初回ロード
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      await fetchGearItems();
    };
    loadInitialData();
  }, [fetchCategories, fetchGearItems]);

  // ギアAPI操作関数
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

  // カテゴリAPI操作関数
  const handleCreateCategory = async (name: string, color: string) => {
    await CategoryApiService.createCategory(name, color);
    await fetchCategories(); // データを再取得
  };

  const handleUpdateCategory = async (id: string, name: string, color: string) => {
    await CategoryApiService.updateCategory(id, name, color);
    await fetchCategories(); // データを再取得
  };

  const handleDeleteCategory = async (id: string) => {
    await CategoryApiService.deleteCategory(id);
    await fetchCategories(); // データを再取得
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

    // ギアAPI操作関数
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    refreshGearItems: fetchGearItems,

    // カテゴリAPI操作関数
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    refreshCategories: fetchCategories
  };
};