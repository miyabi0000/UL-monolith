import * as cheerio from 'cheerio';

/**
 * JSON-LD / OGP / microdata 抽出の集約モジュール
 *
 * 優先順（精度順）:
 *   1. JSON-LD (schema.org Product) — 最も構造化されており信頼度高
 *   2. microdata (itemprop / itemtype) — HTML に埋め込まれた構造化データ
 *   3. OGP (og:*) — SNS プレビュー用途だが商品系にも広く使われる
 *   4. 素の HTML セレクタ (呼び出し側) — 最後の手段
 */

export interface OgpData {
  title?: string;
  description?: string;
  image?: string;
  imageSecure?: string;
  twitterImage?: string;
  brand?: string;
  priceAmount?: string;
  priceCurrency?: string;
}

export interface MicrodataProduct {
  name?: string;
  brand?: string;
  image?: string;
  price?: string;
  priceCurrency?: string;
  description?: string;
  weight?: string;
}

/** JSON-LD構造化データを抽出
 *  複数 `<script type="application/ld+json">` が存在する場合、schema.org/Product を優先。 */
export function extractJsonLd($: cheerio.CheerioAPI): Record<string, unknown> | null {
  const scripts = $('script[type="application/ld+json"]').toArray();
  const candidates: Record<string, unknown>[] = [];

  for (const script of scripts) {
    const raw = $(script).html();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      // 配列で返される場合 (複数 @graph など) をフラット化
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object') candidates.push(item as Record<string, unknown>);
        }
      } else if (parsed && typeof parsed === 'object') {
        // @graph ネスト対応
        const graph = (parsed as Record<string, unknown>)['@graph'];
        if (Array.isArray(graph)) {
          for (const item of graph) {
            if (item && typeof item === 'object') candidates.push(item as Record<string, unknown>);
          }
        } else {
          candidates.push(parsed as Record<string, unknown>);
        }
      }
    } catch {
      // 個別パース失敗は無視して次へ
    }
  }

  // Product を最優先
  const productLike = candidates.find((c) => {
    const type = c['@type'];
    if (typeof type === 'string') return type === 'Product' || type.endsWith('Product');
    if (Array.isArray(type)) return type.some((t) => typeof t === 'string' && (t === 'Product' || t.endsWith('Product')));
    return false;
  });
  if (productLike) return productLike;

  // なければ最初の候補
  return candidates[0] ?? null;
}

/** OGPメタタグを一括抽出 */
export function extractOgp($: cheerio.CheerioAPI): OgpData {
  return {
    title: $('meta[property="og:title"]').attr('content') || undefined,
    description:
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      undefined,
    image: $('meta[property="og:image"]').attr('content') || undefined,
    imageSecure: $('meta[property="og:image:secure_url"]').attr('content') || undefined,
    twitterImage: $('meta[name="twitter:image"]').attr('content') || undefined,
    brand: $('meta[property="og:brand"]').attr('content') || undefined,
    priceAmount: $('meta[property="product:price:amount"]').attr('content') || undefined,
    priceCurrency: $('meta[property="product:price:currency"]').attr('content') || undefined,
  };
}

/** microdata (schema.org itemprop) を抽出
 *  [itemtype*="Product"] スコープ内の itemprop を優先、なければページ全体の itemprop を探す。
 *  楽天・ユニクロ等、JSON-LD を埋めず HTML 属性で構造化情報を出しているサイトで有効。 */
export function extractMicrodata($: cheerio.CheerioAPI): MicrodataProduct {
  const productScope = $('[itemtype*="Product"]').first();
  const scoped = productScope.length > 0;

  const getProp = (prop: string): string | undefined => {
    const el = scoped
      ? productScope.find(`[itemprop="${prop}"]`).first()
      : $(`[itemprop="${prop}"]`).first();
    if (el.length === 0) return undefined;
    // content 属性（meta/link）を優先、なければテキスト
    const content = el.attr('content') || el.attr('href') || el.attr('src');
    if (content) return content.trim();
    const text = el.text().trim();
    return text.length > 0 ? text : undefined;
  };

  // offers の中にある price
  const offersScope = scoped
    ? productScope.find('[itemprop="offers"]').first()
    : $('[itemprop="offers"]').first();
  const offersGet = (prop: string): string | undefined => {
    if (offersScope.length === 0) return undefined;
    const el = offersScope.find(`[itemprop="${prop}"]`).first();
    if (el.length === 0) return undefined;
    return el.attr('content') || el.text().trim() || undefined;
  };

  return {
    name: getProp('name'),
    brand: getProp('brand'),
    image: getProp('image'),
    description: getProp('description'),
    weight: getProp('weight'),
    price: offersGet('price') || getProp('price'),
    priceCurrency: offersGet('priceCurrency') || getProp('priceCurrency'),
  };
}
