import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';
import { normalizeBrand, extractBrandFromText, getBrandFromDomain } from '../utils/brandUtils.js';
import { CategoryMatcher } from './categoryMatcher.js';
import { extractJsonLd, extractOgp, OgpData } from './scraping/headParsers.js';
import { extractWeight as extractWeightFromText } from '../utils/scrapingHelpers.js';

/**
 * 汎用Web Scraping Service - 最小限実装
 */
export class WebScrapingService {
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  /**
   * 汎用スクレイピング（Amazon以外）
   * Amazon判定はオーケストレータ側で行う
   */
  async scrapeGeneric(url: string): Promise<{ data: LLMExtractionResult; html: string }> {
    try {
      const html = await this.fetchHTML(url);
      const result = this.extractBasicInfo(html, url);

      if (result.imageUrl || result.extractedFields.length > 0) {
        return { data: result, html };
      }

      return { data: this.createFallback(url), html };
    } catch (error) {
      console.error(`Scraping failed for ${url}:`, error);
      return { data: this.createFallback(url), html: '' };
    }
  }

  /**
   * HTML取得
   */
  private async fetchHTML(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: this.headers,
      timeout: 10000
    });
    return response.data as string;
  }

  /**
   * 基本情報抽出（強化版）
   * JSON-LD / OGP を1回だけパースして各メソッドに渡す
   */
  private extractBasicInfo(html: string, url: string): LLMExtractionResult {
    const $ = cheerio.load(html);
    const extractedFields: string[] = [];

    // JSON-LD / OGP を1回だけ抽出（キャッシュ）
    const jsonLd = extractJsonLd($);
    const ogp = extractOgp($);

    // 製品名（強化版）
    const name = this.extractName($, jsonLd, ogp);
    if (name) extractedFields.push('name');

    // ブランド（強化版）
    const brand = this.extractBrand($, url, jsonLd, ogp, name);
    if (brand) extractedFields.push('brand');

    // 価格（強化版）
    const priceCents = this.extractPrice($, jsonLd);
    if (priceCents) extractedFields.push('priceCents');

    // 重量（新規）
    const weightGrams = this.extractWeight($);
    if (weightGrams) extractedFields.push('weightGrams');

    // 画像URL
    const imageUrl = this.extractImage($, url, jsonLd, ogp);
    if (imageUrl) extractedFields.push('imageUrl');

    // カテゴリ
    const suggestedCategory = this.guessCategoryFromPage(name || '', $);

    return {
      name: name || 'Unknown Product',
      brand: brand ? normalizeBrand(brand) : undefined,
      productUrl: url,
      imageUrl,
      weightGrams,
      priceCents,
      suggestedCategory,
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,

      extractedFields,
      source: 'web_scraping'
    };
  }

  /**
   * 製品名抽出（強化版）
   */
  private extractName($: cheerio.Root, jsonLd: Record<string, unknown> | null, ogp: OgpData): string | undefined {
    // JSON-LD構造化データから取得
    if (jsonLd?.name && typeof jsonLd.name === 'string') {
      return jsonLd.name;
    }

    // OGタグから取得
    if (ogp.title && ogp.title.length > 3 && ogp.title.length < 200) {
      return this.cleanTitle(ogp.title);
    }

    // HTML要素から取得
    const selectors = [
      'h1',
      '.product-title',
      '.product-name',
      '[class*="product"][class*="title"]',
      '[class*="productTitle"]',
      'title'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 3 && text.length < 300) {
        return selector === 'title' ? this.cleanTitle(text) : text;
      }
    }
  }

  /**
   * ブランド抽出（統合版）
   */
  private extractBrand($: cheerio.Root, url: string, jsonLd: Record<string, unknown> | null, ogp: OgpData, name?: string): string | undefined {
    // JSON-LD構造化データから取得
    if (jsonLd?.brand) {
      const brand = jsonLd.brand as string | { name?: string };
      const brandName = typeof brand === 'string' ? brand : brand?.name;
      if (brandName) return brandName;
    }

    // ドメインから判定
    const domainBrand = getBrandFromDomain(url);
    if (domainBrand) return domainBrand;

    // OGPから取得
    if (ogp.brand && ogp.brand.length > 1 && ogp.brand.length < 50) {
      return ogp.brand;
    }

    // HTML要素から取得
    const selectors = [
      '[itemprop="brand"]',
      '.brand-name',
      '.product-brand',
      '[class*="brand"]',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      const brand = element.attr('content') || element.text().trim();
      if (brand && brand.length > 1 && brand.length < 50) {
        return brand;
      }
    }

    // 製品名から抽出
    if (name) {
      return extractBrandFromText(name);
    }
  }

  /**
   * 価格抽出（強化版）
   */
  private extractPrice($: cheerio.Root, jsonLd: Record<string, unknown> | null): number | undefined {
    // JSON-LD構造化データから取得
    if (jsonLd) {
      const offers = jsonLd.offers as Record<string, unknown> | undefined;
      const price = offers?.price ?? jsonLd.price;
      if (price) {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price as number;
        if (numPrice) {
          return Math.round(numPrice * 100);
        }
      }
    }

    // HTML要素から取得
    const selectors = [
      '.price',
      '.product-price',
      '[itemprop="price"]',
      '[class*="price"]',
      'meta[property="product:price:amount"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      const priceText = element.attr('content') || element.text().trim();
      
      // 価格パターン: ¥3,850 / $38.50 / 3850円
      const match = priceText.match(/[¥$]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        return Math.round(value * 100);
      }
    }
  }

  /**
   * 重量抽出（強化版）
   */
  private extractWeight($: cheerio.Root): number | undefined {
    // より広範囲から重量を検索
    const searchSelectors = [
      '.product-description',
      '[class*="description"]',
      '[class*="spec"]',
      '[class*="detail"]',
      '[class*="info"]',
      '.product-detail',
      '.product-info',
      'table',
      'dl',
      'ul li',  // リスト項目
      '.accordion',  // アコーディオンメニュー
      '[role="tabpanel"]',  // タブコンテンツ
      'body'  // 最後の手段：ページ全体
    ];

    for (const selector of searchSelectors) {
      const text = $(selector).text();
      const weight = extractWeightFromText(text);
      if (weight) return weight;
    }
  }

  /**
   * 画像URL抽出（強化版）
   */
  private extractImage($: cheerio.Root, baseUrl: string, jsonLd: Record<string, unknown> | null, ogp: OgpData): string | undefined {
    // JSON-LD構造化データから取得
    if (jsonLd?.image) {
      const image = jsonLd.image as string | string[];
      const imageUrl = Array.isArray(image) ? image[0] : image;
      if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        return imageUrl;
      }
    }

    // OGPから取得（集約済み）
    const ogpImages = [ogp.image, ogp.twitterImage, ogp.imageSecure];
    for (const src of ogpImages) {
      if (src) {
        return this.normalizeUrl(src, baseUrl);
      }
    }

    // HTML要素から取得
    const imageSelectors = [
      '.product-image img',
      '.main-image img',
      '[itemprop="image"]',
      '[class*="product"][class*="image"] img',
      'img[alt*="product"]',
      'img[alt*="商品"]',
      'img[data-src]',
      'img[data-lazy]'
    ];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      const src = element.attr('data-src') || element.attr('data-lazy') || element.attr('src');
      
      if (src) {
        const normalized = this.normalizeUrl(src, baseUrl);
        if (normalized) return normalized;
      }
    }
  }

  /**
   * URL正規化（相対パス対応）
   */
  private normalizeUrl(src: string, baseUrl: string): string | undefined {
    if (!src) return undefined;

    if (src.startsWith('http')) {
      return src;
    } else if (src.startsWith('//')) {
      return 'https:' + src;
    } else if (src.startsWith('/')) {
      try {
        const url = new URL(baseUrl);
        return `${url.protocol}//${url.host}${src}`;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * カテゴリ推測（強化版）
   */
  private guessCategoryFromPage(name: string, $: cheerio.Root): string {
    // より関連性の高いテキストを優先
    const title = $('h1').text();
    const breadcrumbs = $('[class*="breadcrumb"]').text();
    const category = $('[class*="category"]').text();
    const description = $('.product-description').first().text().substring(0, 500);
    
    const combinedText = [name, title, breadcrumbs, category, description].join(' ');
    return CategoryMatcher.matchCategory(
      { scrapedText: combinedText },
      ['Backpack', 'Shelter', 'Clothing', 'Cooking', 'Water', 'Sleep', 'Electronics', 'Safety', 'Hygiene']
    );
  }

  /**
   * タイトルクリーニング
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s*[-|]\s*(通販|販売|Amazon|楽天).*$/i, '')
      .replace(/【.*?】/g, '')
      .trim();
  }

  /**
   * フォールバック（URL保持）
   */
  private createFallback(url: string): LLMExtractionResult {
    // Try to extract domain name for better UX
    let domainName = 'Unknown Product';
    try {
      const urlObj = new URL(url);
      domainName = urlObj.hostname.replace('www.', '').split('.')[0];
      domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Product';
    } catch {
      // Keep default if URL parsing fails
    }

    return {
      name: domainName,
      productUrl: url,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,

      extractedFields: [],
      source: 'fallback',
      confidence: 0.2
    };
  }
}

export const webScrapingService = new WebScrapingService();
