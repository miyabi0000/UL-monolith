-- スクレイピング結果のキャッシュテーブル
-- 正規化されたURLをキーとして、スクレイピング結果をJSONBで保存
-- SCRAPE_CACHE=1 環境変数でオーケストレータ側から有効化

CREATE TABLE IF NOT EXISTS scrape_cache (
  normalized_url TEXT PRIMARY KEY,
  payload_json   JSONB NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ttl_expires_at TIMESTAMPTZ NULL
);

-- TTL期限切れレコードの効率的な一括削除用
CREATE INDEX IF NOT EXISTS idx_scrape_cache_ttl ON scrape_cache (ttl_expires_at)
  WHERE ttl_expires_at IS NOT NULL;
