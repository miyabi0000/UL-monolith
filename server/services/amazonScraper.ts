import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';
import { normalizeBrand } from '../utils/brandUtils.js';
import { 
  extractJsonLd, 
  extractWeight, 
  cleanBrandText, 
  guessCategory
} from '../utils/scrapingHelpers.js';

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
   * Amazon特化データ抽出（最適化版）
   */
  private extractAmazonData($: cheerio.Root, url: string): LLMExtractionResult {
    const extractedFields: string[] = [];
    
    // JSON-LDを1回だけ取得（キャッシュ）
    const jsonLd = extractJsonLd($);

    // 製品名抽出（JSON-LD優先）
    const name = this.extractAmazonTitle($, jsonLd);
    if (name) extractedFields.push('name');

    // ブランド抽出
    const brand = this.extractAmazonBrand($);
    if (brand) extractedFields.push('brand');

    // 価格抽出
    const priceCents = this.extractAmazonPrice($);
    if (priceCents) extractedFields.push('priceCents');

    // 画像URL抽出（JSON-LD優先）
    const imageUrl = this.extractAmazonImage($, jsonLd);
    if (imageUrl) extractedFields.push('imageUrl');

    // 重量抽出
    const specs = this.extractAmazonSpecs($);
    if (specs.weightGrams) extractedFields.push('weightGrams');

    // カテゴリ推測（軽量版）
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
      ...ratings,
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields,
      source: 'web_scraping'
    };
  }

  /**
   * Amazon製品名抽出（JSON-LDキャッシュ対応）
   */
  private extractAmazonTitle($: cheerio.Root, jsonLd: any): string | undefined {
    // 1. JSON-LD構造化データから取得（最優先）
    if (jsonLd?.name && typeof jsonLd.name === 'string' && jsonLd.name.length > 5) {
      return this.cleanAmazonTitle(jsonLd.name);
    }

    // 2. HTML要素から抽出（主要セレクタのみ）
    const titleSelectors = ['#productTitle', 'h1[class*="product"]', 'span#productTitle'];
    
    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5 && title.length < 300) {
        return this.cleanAmazonTitle(title);
      }
    }
    
    return undefined;
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
      const rawBrand = $(selector).first().text().trim();
      const brand = cleanBrandText(rawBrand);
      
      if (brand && brand.length > 1 && brand.length < 50 && !brand.includes('Amazon')) {
        return normalizeBrand(brand);
      }
    }
  }


  /**
   * Amazon画像URL抽出（JSON-LDキャッシュ対応）
   */
  private extractAmazonImage($: cheerio.Root, jsonLd: any): string | undefined {
    // 1. JSON-LD構造化データから取得（最優先）
    if (jsonLd?.image) {
      const imageUrl = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
      if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        return imageUrl;
      }
    }

    // 2. 画像要素から抽出（主要セレクタのみ）
    const imageSelectors = ['#landingImage', '[data-old-hires]', '.a-dynamic-image'];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      
      // data-old-hires属性（高解像度画像）を優先
      const hires = element.attr('data-old-hires');
      if (hires && hires.startsWith('http')) {
        return hires;
      }
      
      // data-a-dynamic-image属性（JSON形式の画像リスト）
      const dynamicImage = element.attr('data-a-dynamic-image');
      if (dynamicImage) {
        try {
          const imageObj = JSON.parse(dynamicImage);
          const imageUrls = Object.keys(imageObj);
          if (imageUrls.length > 0 && imageUrls[0].startsWith('http')) {
            return imageUrls[0];
          }
        } catch (e) {
          // JSONパース失敗
        }
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
   * Amazon仕様抽出（重量・寸法）- 複数セクションから抽出
   */
  private extractAmazonSpecs($: cheerio.Root): { weightGrams?: number } {
    // Amazon商品ページの各セクションから重量情報を検索
    const sections = [
      { name: 'productDescription', selector: '#productDescription, .product-description, #aplus' },
      { name: 'featureBullets', selector: '#feature-bullets li, #feature-bullets-btf li' },
      { name: 'prodDetails', selector: '#prodDetails, #detailBullets_feature_div' },
      { name: 'techSpecs', selector: '#productDetails_techSpec_section_1, #productDetails_detailBullets_sections1, .pdTab' }
    ];
    
    for (const { selector } of sections) {
      const text = $(selector).text();
      const weight = extractWeight(text);
      
      if (weight) {
        return { weightGrams: weight };
      }
    }
    
    return {};
  }

  /**
   * Amazonカテゴリ抽出（軽量版）
   */
  private extractAmazonCategory($: cheerio.Root): string {
    // タイトルとパンくずリストのみ（高速化）
    const title = $('#productTitle').text();
    const breadcrumbs = $('#wayfinding-breadcrumbs_feature_div, .a-breadcrumb').text();
    
    return guessCategory(title + ' ' + breadcrumbs);
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
