import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';
import { normalizeBrand } from '../utils/brandUtils.js';

/**
 * Amazon専用スクレイピングサービス - 最適化版
 */
export class AmazonScraper {
  private readonly amazonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  };

  private readonly delayRange = { min: 1000, max: 3000 }; // 1-3秒のランダム遅延

  /**
   * Amazon商品ページから情報を抽出
   */
  async scrapeAmazonProduct(url: string): Promise<LLMExtractionResult> {
    try {
      // リクエスト前の遅延（レート制限対策）
      await this.randomDelay();
      
      const html = await this.fetchAmazonHTML(url);
      const $ = cheerio.load(html);
      
      return this.extractAmazonData($, url);
    } catch (error) {
      console.error(`Amazon scraping failed for ${url}:`, error);
      return this.createAmazonFallback(url);
    }
  }

  /**
   * Amazon HTML取得（専用ヘッダー）
   */
  private async fetchAmazonHTML(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: this.amazonHeaders,
      timeout: 15000
    });
    
    return response.data as string;
  }

  /**
   * Amazon特化データ抽出
   */
  private extractAmazonData($: cheerio.Root, url: string): LLMExtractionResult {
    const extractedFields: string[] = [];

    // 製品名抽出（Amazon特有のセレクタ）
    const name = this.extractAmazonTitle($);
    if (name) extractedFields.push('name');

    // ブランド抽出
    const brand = this.extractAmazonBrand($);
    if (brand) extractedFields.push('brand');

    // 価格抽出（複数価格パターン対応）
    const priceCents = this.extractAmazonPrice($);
    if (priceCents) extractedFields.push('priceCents');

    // 画像URL抽出
    const imageUrl = this.extractAmazonImage($);
    if (imageUrl) extractedFields.push('imageUrl');

    // 重量・寸法抽出（商品詳細から）
    const specs = this.extractAmazonSpecs($);
    if (specs.weightGrams) extractedFields.push('weightGrams');

    // カテゴリ推測（パンくずリスト活用）
    const suggestedCategory = this.extractAmazonCategory($);
    if (suggestedCategory !== 'Other') extractedFields.push('suggestedCategory');

    // 評価・レビュー数
    const ratings = this.extractAmazonRatings($);

    return {
      name: name || 'Amazon Product',
      brand,
      productUrl: url,
      imageUrl,
      weightGrams: specs.weightGrams,
      priceCents,
      suggestedCategory,

      // Amazon特有の情報
      ...ratings,

      // ギアリスト用デフォルト
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',

      extractedFields,
      source: 'web_scraping'
    };
  }

  /**
   * Amazon製品名抽出（複数パターン対応）
   */
  private extractAmazonTitle($: cheerio.Root): string | undefined {
    const titleSelectors = [
      '#productTitle',
      '.product-title',
      '[data-automation-id="product-title"]',
      'h1.a-size-large',
      'h1#title',
      '.pdp-product-name'
    ];
    
    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5 && title.length < 300) {
        return this.cleanAmazonTitle(title);
      }
    }
  }

  /**
   * Amazonブランド抽出（改良版）
   */
  private extractAmazonBrand($: cheerio.Root): string | undefined {
    const brandSelectors = [
      '[data-brand]',
      '#bylineInfo',
      '.po-brand .po-break-word',
      '[data-automation-id="product-brand"]',
      '.a-link-normal[href*="/stores/"]',
      '#bylineInfo_feature_div a'
    ];
    
    for (const selector of brandSelectors) {
      let brand = $(selector).first().text().trim();
      
      // "ブランド: " などのプレフィックスを除去
      brand = brand
        .replace(/^(ブランド|Brand|訪問:|Visit\s+the\s+|から|のストアを表示)/i, '')
        .replace(/\s*のストアを表示.*$/i, '')
        .replace(/\s*ストア.*$/i, '')
        .trim();
      
      if (brand && brand.length > 1 && brand.length < 50 && !brand.includes('Amazon')) {
        return normalizeBrand(brand);
      }
    }
  }


  /**
   * Amazon画像URL抽出
   */
  private extractAmazonImage($: cheerio.Root): string | undefined {
    const imageSelectors = [
      '#landingImage',
      '#imgBlkFront',
      '[data-old-hires]',
      '.a-dynamic-image',
      '#main-image',
      '#ebooksImgBlkFront'
    ];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      // data-old-hires属性（高解像度画像）を優先
      const hires = element.attr('data-old-hires');
      if (hires && hires.startsWith('http')) {
        return hires;
      }
      // 通常のsrc属性
      const src = element.attr('src');
      if (src && src.startsWith('http')) {
        return src;
      }
    }
    return undefined;
  }

  /**
   * Amazon価格抽出（複数価格タイプ対応）
   */
  private extractAmazonPrice($: cheerio.Root): number | undefined {
    const priceSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '[data-automation-id="product-price"]',
      '.a-price-current',
      '#apex_desktop .a-price .a-offscreen'
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      const price = this.parseAmazonPrice(priceText);
      if (price) return price;
    }
  }

  /**
   * Amazon仕様抽出（重量・寸法）
   */
  private extractAmazonSpecs($: cheerio.Root): { weightGrams?: number } {
    const specs: { weightGrams?: number } = {};
    
    // 商品詳細テーブルから重量を抽出
    $('#feature-bullets li, .a-unordered-list li, .pdTab .a-row').each((_, element) => {
      const text = $(element).text().toLowerCase();
      
      // 重量パターン
      const weightMatch = text.match(/重量[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)/i) ||
                         text.match(/weight[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|lbs|pounds)/i);
      
      if (weightMatch && !specs.weightGrams) {
        const value = parseFloat(weightMatch[1]);
        const unit = weightMatch[2].toLowerCase();
        
        if (unit.includes('k')) {
          specs.weightGrams = Math.round(value * 1000);
        } else if (unit.includes('lb')) {
          specs.weightGrams = Math.round(value * 453.592); // lbs to grams
        } else {
          specs.weightGrams = Math.round(value);
        }
      }
    });
    
    return specs;
  }

  /**
   * Amazonカテゴリ抽出（パンくずリスト活用）
   */
  private extractAmazonCategory($: cheerio.Root): string {
    // パンくずリストから判定
    const breadcrumbs = $('#wayfinding-breadcrumbs_feature_div, .a-breadcrumb').text().toLowerCase();
    
    const categoryMap = {
      'Backpack': /バッグ|リュック|backpack|bag|鞄/,
      'Clothing': /服|ウェア|ファッション|clothing|apparel|jacket|shirt/,
      'Cooking': /キッチン|調理|クッキング|kitchen|cooking|stove/,
      'Safety': /安全|セーフティ|safety|first.?aid|emergency/,
      'Shelter': /テント|シェルター|tent|shelter|tarp/
    };
    
    for (const [category, pattern] of Object.entries(categoryMap)) {
      if (pattern.test(breadcrumbs)) {
        return category;
      }
    }
    
    return 'Other';
  }

  /**
   * Amazon評価・レビュー情報
   */
  private extractAmazonRatings($: cheerio.Root): { rating?: number; reviewCount?: number } {
    const rating = parseFloat($('[data-hook="average-star-rating"] .a-offscreen').first().text().replace(/[^\d.]/g, '')) || undefined;
    const reviewCountText = $('[data-hook="total-review-count"]').first().text();
    const reviewCount = reviewCountText ? parseInt(reviewCountText.replace(/[^\d]/g, '')) : undefined;
    
    return { rating, reviewCount };
  }

  /**
   * ユーティリティメソッド
   */
  private cleanAmazonTitle(title: string): string {
    return title
      .replace(/\s*\[.*?\]\s*/g, '') // [並行輸入品] などを除去
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseAmazonPrice(priceText: string): number | undefined {
    if (!priceText) return undefined;
    
    // 日本円の場合
    const jpyMatch = priceText.match(/￥?([0-9,]+)/);
    if (jpyMatch) {
      return parseInt(jpyMatch[1].replace(/,/g, '')) * 100; // セント単位
    }
    
    // USD の場合
    const usdMatch = priceText.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
    if (usdMatch) {
      return Math.round(parseFloat(usdMatch[1].replace(/,/g, '')) * 100);
    }
    
    return undefined;
  }


  private async randomDelay(): Promise<void> {
    const delay = Math.random() * (this.delayRange.max - this.delayRange.min) + this.delayRange.min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private createAmazonFallback(url: string): LLMExtractionResult {
    return {
      name: 'Amazon Product (Failed to Extract)',
      productUrl: url,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields: [],
      source: 'fallback'
    };
  }
}

export const amazonScraper = new AmazonScraper();
