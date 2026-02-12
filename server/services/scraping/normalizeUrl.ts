/**
 * URL正規化モジュール
 * キャッシュキーの一貫性を保つため、不要なクエリパラメータや末尾スラッシュを除去
 */

/** 除去対象のクエリパラメータ接頭辞 */
const STRIP_PARAM_PREFIXES = ['utm_', 'ref', 'tag', 'fbclid', 'gclid', 'gad_source'];

/**
 * URLを正規化してキャッシュキーとして使えるようにする
 */
export function normalizeUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw; // パース不能ならそのまま返す
  }

  // Amazon専用の正規化
  if (url.hostname.includes('amazon.')) {
    return normalizeAmazonUrl(url);
  }

  // 汎用の正規化
  stripTrackingParams(url);
  stripTrailingSlash(url);

  return url.toString();
}

// ==================== Amazon ====================

/**
 * Amazon URLを /dp/ASIN 形式に正規化
 * 例: https://www.amazon.co.jp/gp/product/B08XYZ/ref=... → https://www.amazon.co.jp/dp/B08XYZ
 */
function normalizeAmazonUrl(url: URL): string {
  // ASIN抽出パターン: /dp/ASIN, /gp/product/ASIN, /gp/aw/d/ASIN
  const asinMatch = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
  if (asinMatch) {
    return `${url.protocol}//${url.hostname}/dp/${asinMatch[1]}`;
  }

  // ASINが取れなければ汎用正規化にフォールバック
  stripTrackingParams(url);
  stripTrailingSlash(url);
  return url.toString();
}

// ==================== 共通ヘルパー ====================

function stripTrackingParams(url: URL): void {
  const keysToDelete: string[] = [];
  url.searchParams.forEach((_value, key) => {
    if (STRIP_PARAM_PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix))) {
      keysToDelete.push(key);
    }
  });
  for (const key of keysToDelete) {
    url.searchParams.delete(key);
  }
}

function stripTrailingSlash(url: URL): void {
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
}
