-- パック管理テーブル（localStorage → DB 移行）
CREATE TABLE IF NOT EXISTS packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    route_name VARCHAR(200),
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pack_items (
    pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
    gear_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    PRIMARY KEY (pack_id, gear_id)
);

CREATE INDEX IF NOT EXISTS idx_packs_user_id ON packs(user_id);
CREATE INDEX IF NOT EXISTS idx_packs_public ON packs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_pack_items_gear_id ON pack_items(gear_id);

-- packs の updated_at 自動更新
CREATE TRIGGER update_packs_updated_at
    BEFORE UPDATE ON packs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- users テーブル拡張（プロフィール + 設定）
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS header_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(2) DEFAULT 'g';
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'ja';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_sub VARCHAR(128) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- cognito_sub でユーザー検索するインデックス
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub) WHERE cognito_sub IS NOT NULL;

-- users の updated_at 自動更新
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AIアドバイザーの会話永続化
CREATE TABLE IF NOT EXISTS advisor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES packs(id) ON DELETE SET NULL,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advisor_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES advisor_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    suggested_edits JSONB,
    gear_refs JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advisor_sessions_user_id ON advisor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_session_id ON advisor_messages(session_id);

CREATE TRIGGER update_advisor_sessions_updated_at
    BEFORE UPDATE ON advisor_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
