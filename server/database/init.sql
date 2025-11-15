-- データベース初期化スクリプト
-- PostgreSQL 15+ 対応

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザー管理
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 階層カテゴリ（効率化版）
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = グローバル
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    path TEXT[] NOT NULL, -- ['Clothing', 'Outerwear', 'Jacket']
    color VARCHAR(7) DEFAULT '#6B7280', -- HEX color for charts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ギア情報（最適化版）
CREATE TABLE IF NOT EXISTS gear_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    
    -- 基本情報
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    product_url TEXT,
    image_url TEXT, -- 商品画像URL
    
    -- 数量・重量
    required_quantity INTEGER DEFAULT 1 CHECK (required_quantity >= 0),
    owned_quantity INTEGER DEFAULT 0 CHECK (owned_quantity >= 0),
    weight_grams INTEGER CHECK (weight_grams >= 0), -- 単体重量
    
    -- 価格・メタ
    price_cents INTEGER CHECK (price_cents >= 0),
    season VARCHAR(20) CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'all')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1(高) - 5(低)
    
    -- LLM抽出データ
    llm_data JSONB, -- 生データ + 信頼度
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ギアリスト（オプション機能）
CREATE TABLE IF NOT EXISTS gear_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- リスト-ギア関連（オプション機能）
CREATE TABLE IF NOT EXISTS gear_list_items (
    gear_list_id UUID REFERENCES gear_lists(id) ON DELETE CASCADE,
    gear_id UUID REFERENCES gear_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
    PRIMARY KEY (gear_list_id, gear_id)
);

-- 履歴テーブル（監査ログ）
CREATE TABLE IF NOT EXISTS gear_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gear_id UUID NOT NULL, -- 削除されたアイテムも追跡するため外部キーなし
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'bulk_update', 'bulk_delete')),
    changes JSONB, -- 変更内容
    metadata JSONB, -- 追加情報
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== インデックス（パフォーマンス最適化） =====

-- 基本インデックス
CREATE INDEX IF NOT EXISTS idx_gear_items_user_id ON gear_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_category_id ON gear_items(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- 検索・フィルタリング用インデックス
CREATE INDEX IF NOT EXISTS idx_gear_items_season ON gear_items(season) WHERE season IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gear_items_priority ON gear_items(priority);
CREATE INDEX IF NOT EXISTS idx_gear_items_created_at ON gear_items(created_at);

-- 複合インデックス（よく使われる組み合わせ）
CREATE INDEX IF NOT EXISTS idx_gear_items_user_category ON gear_items(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_user_priority ON gear_items(user_id, priority);

-- 全文検索インデックス（名前・ブランド）
CREATE INDEX IF NOT EXISTS idx_gear_items_search ON gear_items 
USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '')));

-- 履歴用インデックス
CREATE INDEX IF NOT EXISTS idx_gear_history_gear_id ON gear_history(gear_id);
CREATE INDEX IF NOT EXISTS idx_gear_history_user_id ON gear_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gear_history_created_at ON gear_history(created_at);

-- ===== トリガー（自動更新） =====

-- updated_at の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gear_items_updated_at 
    BEFORE UPDATE ON gear_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== デフォルトデータ =====

-- グローバルカテゴリの挿入（重複回避）
INSERT INTO categories (id, user_id, name, parent_id, path, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', NULL, 'Clothing', NULL, ARRAY['Clothing'], '#FF6B6B'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 'Sleep', NULL, ARRAY['Sleep'], '#4ECDC4'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 'Pack', NULL, ARRAY['Pack'], '#FFE66D'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 'Electronics', NULL, ARRAY['Electronics'], '#4D96FF'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 'Hygiene', NULL, ARRAY['Hygiene'], '#A66DFF'),
('550e8400-e29b-41d4-a716-446655440006', NULL, 'Shelter', NULL, ARRAY['Shelter'], '#45B7D1'),
('550e8400-e29b-41d4-a716-446655440007', NULL, 'Cooking', NULL, ARRAY['Cooking'], '#F39C12'),
('550e8400-e29b-41d4-a716-446655440008', NULL, 'Water', NULL, ARRAY['Water'], '#27AE60'),
('550e8400-e29b-41d4-a716-446655440009', NULL, 'Safety', NULL, ARRAY['Safety'], '#E74C3C'),
('550e8400-e29b-41d4-a716-446655440010', NULL, 'Tools', NULL, ARRAY['Tools'], '#8E44AD'),
('550e8400-e29b-41d4-a716-446655440011', NULL, 'Other', NULL, ARRAY['Other'], '#9CA3AF')
ON CONFLICT (id) DO NOTHING;

-- デモユーザーの作成（開発用）
INSERT INTO users (id, email, password_hash, name) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'demo@example.com', '$2b$10$dummy.hash.for.demo.user', 'Demo User')
ON CONFLICT (email) DO NOTHING;

