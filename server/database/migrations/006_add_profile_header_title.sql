-- プロフィールの headerTitle カラム追加
-- ProfileSettings.headerTitle ("Packboard" 等の表示タイトル) に対応
-- 他のプロフィールカラム (display_name, handle, bio, header_image_url) は 005 で追加済み
ALTER TABLE users ADD COLUMN IF NOT EXISTS header_title VARCHAR(200);
