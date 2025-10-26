/**
 * 統一カテゴリマッチングサービス
 * 
 * カテゴリの判定ロジックを一箇所に集約し、
 * 複数の情報源から最適なカテゴリを判定する
 */

export interface CategoryMatchContext {
  productName?: string;
  url?: string;
  llmSuggestion?: string;
  scrapedText?: string;
}

/**
 * カテゴリマッチング用キーワード定義
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Shelter': [
    'tent', 'tarp', 'bivy', 'shelter',
    'テント', 'タープ', 'ビビィ', 'シェルター'
  ],
  'Sleep': [
    'bag', 'sleeping', 'pad', 'quilt', 'mattress', 'pillow',
    'シュラフ', '寝袋', 'マット', 'キルト', '枕'
  ],
  'Clothing': [
    'jacket', 'pants', 'shirt', 'gloves', 'hat', 'socks', 'clothing', 'wear',
    'ジャケット', 'パンツ', 'シャツ', '手袋', '帽子', '靴下', 'ウェア'
  ],
  'Cooking': [
    'stove', 'pot', 'pan', 'cook', 'kettle', 'fuel', 'utensil',
    'ストーブ', '調理', 'クッカー', '鍋', 'ケトル', '燃料'
  ],
  'Water': [
    'filter', 'bottle', 'bladder', 'purifier', 'hydration',
    '浄水', 'フィルター', 'ボトル', 'ブラダー', '水筒'
  ],
  'Backpack': [
    'backpack', 'pack', 'bag', 'rucksack',
    'バックパック', 'ザック', 'リュック'
  ],
  'Electronics': [
    'light', 'headlamp', 'battery', 'charger', 'gps', 'phone',
    'ライト', 'ヘッドランプ', '電池', '充電器'
  ],
  'Safety': [
    'first aid', 'emergency', 'whistle', 'knife', 'fire',
    '救急', 'ファーストエイド', '笛', 'ナイフ', '火'
  ],
  'Hygiene': [
    'toilet', 'towel', 'soap', 'toothbrush',
    'トイレ', 'タオル', '石鹸', '歯ブラシ'
  ]
};

export class CategoryMatcher {
  /**
   * 統一カテゴリマッチング
   * 
   * 優先順位：
   * 1. LLM提案との完全/部分一致
   * 2. 商品名からのキーワードマッチング
   * 3. URLからのヒント
   * 4. デフォルト（最初のカテゴリまたは"Other"）
   */
  static matchCategory(
    context: CategoryMatchContext,
    userCategories: string[]
  ): string {
    // カテゴリが空の場合
    if (!userCategories || userCategories.length === 0) {
      return 'Other';
    }

    // 優先度1: LLM提案とのマッチング
    if (context.llmSuggestion) {
      const matched = this.fuzzyMatch(context.llmSuggestion, userCategories);
      if (matched) return matched;
    }

    // 優先度2: 商品名からのキーワードマッチング
    if (context.productName) {
      const matched = this.keywordMatch(context.productName, userCategories);
      if (matched) return matched;
    }

    // 優先度3: URLドメイン/パスからのヒント
    if (context.url) {
      const matched = this.urlHintMatch(context.url, userCategories);
      if (matched) return matched;
    }

    // 優先度4: スクレイピングテキストからのキーワードマッチング
    if (context.scrapedText) {
      const matched = this.keywordMatch(context.scrapedText, userCategories);
      if (matched) return matched;
    }

    // デフォルト: "Other" カテゴリを探す
    const otherCategory = userCategories.find(cat => 
      cat.toLowerCase() === 'other' || cat.toLowerCase() === 'その他'
    );
    
    if (otherCategory) {
      return otherCategory;
    }

    // "Other" カテゴリが存在しない場合は、"Other" という文字列を返す
    return 'Other';
  }

  /**
   * あいまいマッチング（LLM提案とユーザーカテゴリの照合）
   */
  private static fuzzyMatch(suggestion: string, categories: string[]): string | null {
    const normalized = suggestion.toLowerCase().trim();

    // 完全一致
    const exact = categories.find(cat => cat.toLowerCase() === normalized);
    if (exact) return exact;

    // 部分一致（両方向）
    const partial = categories.find(cat => {
      const catLower = cat.toLowerCase();
      return catLower.includes(normalized) || normalized.includes(catLower);
    });
    if (partial) return partial;

    // 複数単語の場合、各単語でマッチング試行
    const words = normalized.split(/[\s-_]+/);
    for (const word of words) {
      if (word.length < 3) continue; // 短い単語はスキップ
      
      const matched = categories.find(cat => 
        cat.toLowerCase().includes(word) || word.includes(cat.toLowerCase())
      );
      if (matched) return matched;
    }

    return null;
  }

  /**
   * キーワードベースのマッチング
   */
  private static keywordMatch(text: string, categories: string[]): string | null {
    const lower = text.toLowerCase();

    // ユーザーカテゴリに対して、定義済みキーワードでマッチング
    for (const category of categories) {
      const keywords = CATEGORY_KEYWORDS[category] || [];
      
      // カテゴリ名自体もキーワードとして追加
      const allKeywords = [...keywords, category.toLowerCase()];
      
      // キーワードのいずれかが含まれているかチェック
      if (allKeywords.some(keyword => lower.includes(keyword))) {
        return category;
      }
    }

    // カテゴリ名の部分一致
    for (const category of categories) {
      const catLower = category.toLowerCase();
      if (lower.includes(catLower) || catLower.includes(lower)) {
        return category;
      }
    }

    return null;
  }

  /**
   * URLからのヒントマッチング
   */
  private static urlHintMatch(url: string, categories: string[]): string | null {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      // URLパスからキーワードマッチング
      return this.keywordMatch(path, categories);
    } catch {
      return null;
    }
  }

  /**
   * カテゴリキーワードの追加（拡張用）
   */
  static addKeywords(category: string, keywords: string[]): void {
    if (!CATEGORY_KEYWORDS[category]) {
      CATEGORY_KEYWORDS[category] = [];
    }
    CATEGORY_KEYWORDS[category].push(...keywords);
  }

  /**
   * デバッグ用：マッチング結果の詳細を返す
   */
  static matchCategoryWithDetails(
    context: CategoryMatchContext,
    userCategories: string[]
  ): { category: string; method: string; confidence: number } {
    if (!userCategories || userCategories.length === 0) {
      return { category: 'Other', method: 'default', confidence: 0 };
    }

    // LLM提案
    if (context.llmSuggestion) {
      const matched = this.fuzzyMatch(context.llmSuggestion, userCategories);
      if (matched) return { category: matched, method: 'llm-fuzzy', confidence: 0.9 };
    }

    // 商品名
    if (context.productName) {
      const matched = this.keywordMatch(context.productName, userCategories);
      if (matched) return { category: matched, method: 'product-keyword', confidence: 0.8 };
    }

    // URL
    if (context.url) {
      const matched = this.urlHintMatch(context.url, userCategories);
      if (matched) return { category: matched, method: 'url-hint', confidence: 0.6 };
    }

    // スクレイピングテキスト
    if (context.scrapedText) {
      const matched = this.keywordMatch(context.scrapedText, userCategories);
      if (matched) return { category: matched, method: 'scraped-keyword', confidence: 0.7 };
    }

    // デフォルト: "Other" カテゴリを探す
    const otherCategory = userCategories.find(cat => 
      cat.toLowerCase() === 'other' || cat.toLowerCase() === 'その他'
    );
    
    return { 
      category: otherCategory || 'Other', 
      method: 'default', 
      confidence: 0.3 
    };
  }
}

