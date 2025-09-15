-- 簡素化されたデータベーススキーマ

-- ユーザー管理
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 階層カテゴリ（シンプル化）
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = グローバル
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    path TEXT[] NOT NULL, -- ['Clothing', 'Outerwear', 'Jacket']
    color VARCHAR(7) DEFAULT '#6B7280', -- HEX color for charts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ギア情報（9項目に簡素化）
CREATE TABLE gear_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    
    -- 基本情報
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    product_url TEXT,
    
    -- 数量・重量
    required_quantity INTEGER DEFAULT 1,
    owned_quantity INTEGER DEFAULT 0,
    weight_grams INTEGER, -- 単体重量
    
    -- 価格・メタ
    price_cents INTEGER,
    season VARCHAR(20), -- 'spring', 'summer', 'autumn', 'winter', 'all'
    priority INTEGER DEFAULT 3, -- 1(高) - 5(低)
    
    -- LLM抽出データ（簡素化）
    llm_data JSONB, -- 生データ + 信頼度
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ギアリスト（オプション機能）
CREATE TABLE gear_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- リスト-ギア関連（オプション機能）
CREATE TABLE gear_list_items (
    gear_list_id UUID REFERENCES gear_lists(id) ON DELETE CASCADE,
    gear_id UUID REFERENCES gear_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    PRIMARY KEY (gear_list_id, gear_id)
);

-- インデックス
CREATE INDEX idx_gear_items_user_id ON gear_items(user_id);
CREATE INDEX idx_gear_items_category_id ON gear_items(category_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- デフォルトカテゴリ
INSERT INTO categories (id, user_id, name, parent_id, path, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', NULL, 'Clothing', NULL, ARRAY['Clothing'], '#FF6B6B'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 'Sleep', NULL, ARRAY['Sleep'], '#4ECDC4'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 'Pack', NULL, ARRAY['Pack'], '#FFE66D'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 'Electronics', NULL, ARRAY['Electronics'], '#4D96FF'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 'Hygiene', NULL, ARRAY['Hygiene'], '#A66DFF');











