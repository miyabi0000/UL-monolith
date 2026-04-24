import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';
import { normalizeBrand, extractBrandFromText, getBrandFromDomain } from '../utils/brandUtils.js';
import { CategoryMatcher } from './categoryMatcher.js';
import { extractJsonLd, extractOgp, extractMicrodata, OgpData, MicrodataProduct } from './scraping/headParsers.js';
import { extractWeight as extractWeightFromText } from '../utils/scrapingHelpers.js';
import { logger } from '../utils/logger.js';

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
      logger.error({ err: error }, `Scraping failed for ${url}:`);
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
   * JSON-LD / OGP / microdata を1回だけパースして各メソッドに渡す
   */
  private extractBasicInfo(html: string, url: string): LLMExtractionResult {
    const $ = cheerio.load(html);
    const extractedFields: string[] = [];

    // 構造化データを1回だけ抽出（キャッシュ）
    const jsonLd = extractJsonLd($);
    const ogp = extractOgp($);
    const microdata = extractMicrodata($);

    // 製品名（強化版）
    const name = this.extractName($, jsonLd, ogp, microdata);
    if (name) extractedFields.push('name');

    // ブランド（強化版）
    const brand = this.extractBrand($, url, jsonLd, ogp, microdata, name);
    if (brand) extractedFields.push('brand');

    // 価格（強化版）
    const priceCents = this.extractPrice($, jsonLd, ogp, microdata);
    if (priceCents) extractedFields.push('priceCents');

    // 重量（新規）: microdata の weight プロパティも試す
    const weightGrams = this.extractWeight($, microdata);
    if (weightGrams) extractedFields.push('weightGrams');

    // 画像URL
    const imageUrl = this.extractImage($, url, jsonLd, ogp, microdata);
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
   * 優先順: JSON-LD > microdata > OGP > HTML セレクタ
   */
  private extractName(
    $: cheerio.CheerioAPI,
    jsonLd: Record<string, unknown> | null,
    ogp: OgpData,
    microdata: MicrodataProduct,
  ): string | undefined {
    // 1. JSON-LD構造化データから取得
    if (jsonLd?.name && typeof jsonLd.name === 'string') {
      return jsonLd.name;
    }

    // 2. microdata から取得
    if (microdata.name && microdata.name.length > 3 && microdata.name.length < 300) {
      return microdata.name;
    }

    // 3. OGタグから取得
    if (ogp.title && ogp.title.length > 3 && ogp.title.length < 200) {
      return this.cleanTitle(ogp.title);
    }

    // 4. HTML要素から取得
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
   * 優先順: JSON-LD > microdata > ドメイン判定 > OGP > HTML セレクタ > 製品名からの推測
   */
  private extractBrand(
    $: cheerio.CheerioAPI,
    url: string,
    jsonLd: Record<string, unknown> | null,
    ogp: OgpData,
    microdata: MicrodataProduct,
    name?: string,
  ): string | undefined {
    // 1. JSON-LD構造化データから取得
    if (jsonLd?.brand) {
      const brand = jsonLd.brand as string | { name?: string };
      const brandName = typeof brand === 'string' ? brand : brand?.name;
      if (brandName) return brandName;
    }

    // 2. microdata から取得
    if (microdata.brand && microdata.brand.length > 1 && microdata.brand.length < 50) {
      return microdata.brand;
    }

    // 3. ドメインから判定
    const domainBrand = getBrandFromDomain(url);
    if (domainBrand) return domainBrand;

    // 4. OGPから取得
    if (ogp.brand && ogp.brand.length > 1 && ogp.brand.length < 50) {
      return ogp.brand;
    }

    // 5. HTML要素から取得
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

    // 6. 製品名から抽出
    if (name) {
      return extractBrandFromText(name);
    }
  }

  /**
   * 価格抽出（強化版）
   * 優先順: JSON-LD offers > microdata > OGP (product:price) > HTML セレクタ
   */
  private extractPrice(
    $: cheerio.CheerioAPI,
    jsonLd: Record<string, unknown> | null,
    ogp: OgpData,
    microdata: MicrodataProduct,
  ): number | undefined {
    // 1. JSON-LD構造化データから取得
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

    // 2. microdata から取得
    if (microdata.price) {
      const numPrice = parseFloat(microdata.price.replace(/[^0-9.]/g, ''));
      if (numPrice > 0) return Math.round(numPrice * 100);
    }

    // 3. OGP product:price:amount から取得
    if (ogp.priceAmount) {
      const numPrice = parseFloat(ogp.priceAmount);
      if (numPrice > 0) return Math.round(numPrice * 100);
    }

    // 4. HTML要素から取得
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
   * 優先: microdata の weight プロパティ → 通常のテキスト検索
   */
  private extractWeight($: cheerio.CheerioAPI, microdata: MicrodataProduct): number | undefined {
    // 1. microdata の weight から取得 (例: "230g" / "0.23 kg")
    if (microdata.weight) {
      const w = extractWeightFromText(microdata.weight);
      if (w) return w;
    }

    // 2. より広範囲から重量を検索
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
   * 優先順: JSON-LD > microdata > OGP > HTML セレクタ
   */
  private extractImage(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    jsonLd: Record<string, unknown> | null,
    ogp: OgpData,
    microdata: MicrodataProduct,
  ): string | undefined {
    // 1. JSON-LD構造化データから取得
    if (jsonLd?.image) {
      const image = jsonLd.image as string | string[];
      const imageUrl = Array.isArray(image) ? image[0] : image;
      if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        return imageUrl;
      }
    }

    // 2. microdata から取得
    if (microdata.image) {
      const normalized = this.normalizeUrl(microdata.image, baseUrl);
      if (normalized) return normalized;
    }

    // 3. OGPから取得（集約済み）
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
  private guessCategoryFromPage(name: string, $: cheerio.CheerioAPI): string {
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
