import { useState, useEffect, useCallback, useMemo } from 'react';
import { GearItemWithCalculated, Category, WeightBreakdown, ULStatus } from '../utils/types';
import { GearApiService } from '../services/gearApiService';
import { GearService } from '../services/gearService';
import { CategoryApiService } from '../services/categoryApiService';

export const useAppState = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItemWithCalculated | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showGearDropdown, setShowGearDropdown] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  // データ読み込み状態
  const [isLoading, setIsLoading] = useState(true);

  // APIから取得した生のギアアイテム
  const [rawGearItems, setRawGearItems] = useState<any[]>([]);
  
  // カテゴリをAPIから取得
  const [categories, setCategories] = useState<Category[]>([]);

  // Weight Breakdown（データモデル仕様準拠）
  const [weightBreakdown, setWeightBreakdown] = useState<WeightBreakdown | null>(null);
  const [ulStatus, setULStatus] = useState<ULStatus | null>(null);

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

  // Weight Breakdownを取得
  const fetchWeightBreakdown = useCallback(async () => {
    try {
      const result = await GearService.getWeightBreakdown();
      setWeightBreakdown(result.breakdown);
      setULStatus(result.ulStatus);
    } catch (err) {
      console.error('Error fetching weight breakdown:', err);
      // Weight Breakdownはオプショナルなのでエラーは無視
    }
  }, []);

  // 初回ロード
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      await fetchGearItems();
      await fetchWeightBreakdown();
    };
    loadInitialData();
  }, [fetchCategories, fetchGearItems, fetchWeightBreakdown]);

  // ギアAPI操作関数
  const handleCreateGear = async (gearData: any) => {
    await GearApiService.createGear(gearData);
    await fetchGearItems(); // データを再取得
    await fetchWeightBreakdown(); // Weight Breakdown更新
  };

  const handleUpdateGear = async (id: string, gearData: any) => {
    // 楽観的UI更新: API呼び出し前にローカル状態を更新
    setRawGearItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, ...gearData } : item
      )
    );

    try {
      await GearApiService.updateGear(id, gearData);
      // 成功時は再取得しない（既にローカル状態を更新済み）
    } catch (err) {
      // エラー時のみデータを再取得してロールバック
      await fetchGearItems();
      throw err;
    }
  };

  const handleDeleteGear = async (id: string) => {
    // 楽観的UI更新: API呼び出し前にローカル状態から削除
    const previousItems = rawGearItems;
    setRawGearItems(prevItems => prevItems.filter(item => item.id !== id));

    try {
      await GearApiService.deleteGear(id);
      // 成功時はWeight Breakdownのみ更新
      await fetchWeightBreakdown();
    } catch (err) {
      // エラー時のみロールバック
      setRawGearItems(previousItems);
      throw err;
    }
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
    showAdvisor, setShowAdvisor,
    showGearDropdown, setShowGearDropdown,
    showCheckboxes, setShowCheckboxes,

    // データ状態
    gearItems,
    categories, setCategories,
    isLoading,
    weightBreakdown,
    ulStatus,

    // ギアAPI操作関数
    handleCreateGear,
    handleUpdateGear,
    handleDeleteGear,
    refreshGearItems: fetchGearItems,
    refreshWeightBreakdown: fetchWeightBreakdown,

    // カテゴリAPI操作関数
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    refreshCategories: fetchCategories
  };
};