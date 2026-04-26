import { useState, useEffect, useCallback, useMemo } from 'react';
import { GearItemWithCalculated, Category, WeightBreakdown, ULStatus } from '../utils/types';
import { GearApiService } from '../services/gearApiService';
import { GearService } from '../services/gearService';
import { CategoryApiService } from '../services/categoryApiService';

export const useAppState = () => {
  // UI state は showChat のみ (Chat bottom sheet の開閉)。
  // 過去の showForm / showAdvisor / showLogin / showCategoryManager /
  // showCheckboxes は ChatSidebar 一本化 + Landing 導入 + per-row 編集化で
  // 全て削除済み。復活させる場合は各機能の再統合を先に検討すること。
  const [showChat, setShowChat] = useState(false);

  // FloatingChatInput から送られた Advisor の初回プロンプト。
  // nonce は同じテキストの連続送信を別イベントとして扱うための識別子。
  const [pendingAdvisorPrompt, setPendingAdvisorPrompt] = useState<{ text: string; nonce: number } | null>(null);

  /** FloatingChatInput から Advisor を起動: ChatSidebar を開き、テキストを自動送信する */
  const launchAdvisor = useCallback((text: string) => {
    setPendingAdvisorPrompt({ text, nonce: Date.now() });
    setShowChat(true);
  }, []);

  /** ChatSidebar が消費したら呼び出してクリア */
  const consumePendingAdvisorPrompt = useCallback(() => {
    setPendingAdvisorPrompt(null);
  }, []);

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
  // どこかの fetch が throw しても isLoading が true のまま固定されないように、
  // 例外をトップレベルで握りつぶし finally で必ず isLoading=false に落とす。
  // 個別の fetch 関数も内部で setIsLoading(false) するが、
  // fetchCategories のように isLoading を触らない関数で throw されると
  // 永続スケルトン化するためここで保険をかける。
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCategories();
        await fetchGearItems();
        await fetchWeightBreakdown();
      } catch (err) {
        console.error('Initial data load failed:', err);
      } finally {
        setIsLoading(false);
      }
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

  // NOTE: カテゴリ CRUD handler はフロントの管理 UI が廃止された時点で
  // 呼び出し元ゼロとなったため削除済み。将来再導入する際は
  // `CategoryApiService` を直接使うか、専用 hook (useCategories 等) を新設
  // して useAppState を肥大化させないこと。

  return {
    // UI状態
    showChat, setShowChat,
    pendingAdvisorPrompt,
    launchAdvisor,
    consumePendingAdvisorPrompt,

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

    // カテゴリ (読み込みのみ、CRUD は UI 再導入時まで提供しない)
    refreshCategories: fetchCategories
  };
};
