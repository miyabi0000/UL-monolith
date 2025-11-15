# UL Gear デザインシステム

## 📐 設計思想

### コンセプト
**ミニマルモノクロームデザイン**
- 白ベースのモノクローム配色
- ボーダーレス（シャドウのみで境界を表現）
- 白銀比（√2 = 1.414）による調和のとれたスケール

---

## 🎨 カラーパレット

### ベースカラー（モノクローム）

```typescript
COLORS = {
  white: '#FFFFFF',
  gray: {
    50:  '#FAFAFA',  // 背景
    100: '#F5F5F5',  // 選択・ホバー
    200: '#E5E5E5',  // ボーダー
    300: '#D4D4D4',  // 無効状態
    400: '#A3A3A3',  // 低優先度、補助テキスト
    500: '#737373',  // セカンダリテキスト
    600: '#525252',  // セカンダリテキスト
    700: '#404040',  // プライマリアクション、選択状態
    800: '#262626',  // ホバー時のプライマリ
    900: '#171717',  // プライマリテキスト
  }
}
```

### アクセントカラー（インタラクション専用）

```typescript
accent: {
  primary: '#404040',  // リンク、プライマリアクション (gray.700)
  red:     '#EF4444',  // エラー、削除アクション
}
```

### セマンティックカラー

```typescript
background: '#FAFAFA',    // ページ背景 (gray.50)
surface:    '#FFFFFF',    // カード、モーダル
text: {
  primary:   '#171717',   // メインテキスト (gray.900)
  secondary: '#525252',   // サブテキスト (gray.600)
  muted:     '#A3A3A3',   // 補助テキスト (gray.400)
}
error: '#EF4444',         // エラーメッセージ
```

### 状態別カラー使用例

| 状態 | カラー | 用途 |
|------|--------|------|
| **デフォルト** | `gray.700` | ボタン、リンク |
| **ホバー** | `gray.800` | インタラクティブ要素 |
| **選択中** | `gray.700` + シャドウ | チャート、リストアイテム |
| **無効** | `gray.300` | 非活性ボタン |
| **エラー** | `red` | エラーメッセージ、削除 |
| **背景** | `gray.50` | ページ全体 |
| **サーフェス** | `white` | カード、モーダル |

---

## 📏 スケールシステム

### 白銀比スケール（スペーシング）

```typescript
SPACING_SCALE = {
  xs:   4px,   // 0.5 unit
  sm:   6px,   // 0.75 unit
  base: 8px,   // 1 unit (BASE_UNIT)
  md:   12px,  // 1.5 unit
  lg:   16px,  // 2 unit
  xl:   23px,  // 2.875 unit (16 × 1.414)
  2xl:  32px,  // 4 unit
  3xl:  46px,  // 5.75 unit (32 × 1.414)
  4xl:  64px,  // 8 unit
}
```

### タイポグラフィ（3サイズのみ）

```typescript
FONT_SCALE = {
  sm:   12px,  // キャプション、ラベル
  base: 14px,  // ボディ、入力フィールド
  lg:   18px,  // 見出し
}

LINE_HEIGHT_SCALE = {
  xs:  17px,   // 12 × 1.414
  sm:  24px,   // 17 × 1.414
  base: 34px,  // 24 × 1.414
  lg:  48px,   // 34 × 1.414
  xl:  68px,   // 48 × 1.414
  2xl: 96px,   // 68 × 1.414
}
```

### 角丸スケール

```typescript
RADIUS_SCALE = {
  none: 0px,
  xs:   2px,   // 極小
  sm:   4px,   // 小
  base: 6px,   // 基本
  md:   8px,   // 中（6 × 1.414 ≈ 8）
  lg:   12px,  // 大（8 × 1.414 ≈ 12）
  xl:   16px,  // 特大（12 × 1.414 ≈ 17）
  2xl:  24px,  // 超特大（16 × 1.414 ≈ 23）
  full: 9999px, // 完全な円
}
```

---

## 🎭 コンポーネントバリアント

### ボタン

#### Primary
- **背景**: `gray.700`
- **テキスト**: `white`
- **シャドウ**: 標準シャドウ
- **ホバー**: `gray.800` + シャドウ強化

#### Secondary
- **背景**: `white`
- **テキスト**: `gray.900`
- **シャドウ**: 標準シャドウ
- **ホバー**: `gray.50` + シャドウ強化

#### Danger
- **背景**: `red`
- **テキスト**: `white`
- **シャドウ**: 標準シャドウ
- **ホバー**: `#DC2626` + シャドウ強化

### インプット

#### Default
- **背景**: `white`
- **テキスト**: `gray.900`
- **シャドウ**: 標準シャドウ
- **ボーダー**: なし

#### Focus
- **シャドウ**: `0 0 0 3px rgba(0, 0, 0, 0.05)`

#### Error
- **シャドウ**: `0 0 0 3px rgba(239, 68, 68, 0.1)`
- **背景**: `#FEF2F2`

### カード

#### Default
- **背景**: `white`
- **シャドウ**: 標準シャドウ
- **ボーダー**: なし

#### Hover
- **背景**: `white`
- **シャドウ**: 強化シャドウ

### テーブル

#### Header
- **背景**: `gray.50`
- **テキスト**: `gray.600`

#### Row
- **デフォルト**: `white`
- **選択中**: `gray.50`
- **ホバー**: `gray.50`

---

## 🎯 インタラクション状態

### 選択状態の視覚表現

#### チャート（GearChart）
- **カテゴリ選択時**:
  - ストローク: `gray.700`（4px幅）
  - グロウエフェクト: `drop-shadow(0 0 6px rgba(64, 64, 64, 0.5))`
  - トランジション: `all 0.2s ease`

- **アイテム選択時**:
  - ストローク: `gray.700`（4px幅）
  - グロウエフェクト: `drop-shadow(0 0 8px rgba(64, 64, 64, 0.6))`
  - オパシティ: `1.0`

- **中央クリック時**:
  - パルスアニメーション（600ms）
  - 背景: `rgba(64, 64, 64, 0.1)`
  - シャドウ: `0 0 20px rgba(64, 64, 64, 0.3)`
  - スケール: `1.1`

#### サイドパネル（CategoryItem）
- **選択時**:
  - 背景: `gray.100`
  - ボーダー: `2px solid gray.700`
  - シャドウ: `0 0 8px rgba(64, 64, 64, 0.2)`

#### テーブル・リスト
- **ホバー**: `gray.50` 背景
- **選択**: `gray.100` 背景 + `gray.700` ボーダー

---

## 🌓 シャドウシステム

### 標準シャドウ
```css
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
            0 1px 2px -1px rgba(0, 0, 0, 0.1);
```

### 強化シャドウ（ホバー時）
```css
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
            0 2px 4px -2px rgba(0, 0, 0, 0.1);
```

### フォーカスシャドウ
```css
box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
```

### エラーシャドウ
```css
box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
```

---

## 🎨 特殊スタイル

### Glass Morphism
```typescript
getGlassStyle(intensity: 'light' | 'medium' | 'heavy')
```

- **Light**: `rgba(255, 255, 255, 0.1)` + `blur(4px)`
- **Medium**: `rgba(255, 255, 255, 0.2)` + `blur(8px)`
- **Heavy**: `rgba(255, 255, 255, 0.3)` + `blur(12px)`

### Priority Color
```typescript
getPriorityColor(priority: number)
```

| Priority | Color | 意味 |
|----------|-------|------|
| 1-2 | `red` | 高優先度 |
| 3 | `#F59E0B` (yellow) | 中優先度 |
| 4-5 | `gray.400` | 低優先度 |

---

## 📱 レスポンシブデザイン

### ブレークポイント

| サイズ | 幅 | チャート半径（外） | チャート半径（内） | チャート高さ |
|--------|----|--------------------|-------------------|--------------|
| **Mobile** | < 768px | 120px | 85px | 350px |
| **Tablet** | 768-1024px | 160px | 115px | 450px |
| **Desktop** | > 1024px | 200px | 140px | 500px |

### レスポンシブ原則
- モバイルファースト
- タッチターゲット最小44px
- グリッドは1/2/3/4カラムに自動調整
- フォントサイズは固定（デバイスに依存しない）

---

## ⚡ アニメーション

### トランジション
```css
transition: all 0.2s ease;  /* 標準 */
transition: all 0.3s ease;  /* やや遅め */
```

### 特殊アニメーション

#### パルスエフェクト（中央クリック）
```typescript
duration: 600ms
scale: 1.0 → 1.1 → 1.0
backgroundColor: transparent → rgba(64,64,64,0.1) → transparent
boxShadow: none → 0 0 20px rgba(64,64,64,0.3) → none
```

#### カードリフト（ホバー時）
```css
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
transition: all 0.2s ease;
```

---

## 🔧 ユーティリティ関数

### カラー生成
```typescript
generateItemColor(baseColor: string, index: number, total: number): string
```
カテゴリの基本色から、アイテムごとの色を生成（彩度と明度を調整）

### テキスト省略
```typescript
getTruncatedTextStyle(maxWidth: string = '200px')
```
テキストオーバーフロー時に`...`を表示

### カテゴリバッジ
```typescript
getCategoryBadgeStyle(categoryColor?: string)
```
カテゴリカラーの20%透明度背景 + 同色テキスト

---

## 📦 使用例

### ボタン
```typescript
import { getButtonStyle, COLORS } from './utils/designSystem'

<button style={{
  ...getButtonStyle('primary'),
  padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.xl}px`,
  borderRadius: `${RADIUS_SCALE.md}px`,
}}>
  保存
</button>
```

### カード
```typescript
import { getCardStyle, SHADOW } from './utils/designSystem'

<div style={{
  ...getCardStyle('default'),
  padding: SPACING_SCALE.lg,
  borderRadius: RADIUS_SCALE.lg,
}}>
  コンテンツ
</div>
```

### 選択状態のリストアイテム
```typescript
import { COLORS, SELECTED_COLOR } from './utils/designSystem'

<div style={{
  backgroundColor: isSelected ? COLORS.gray[100] : 'transparent',
  border: isSelected ? `2px solid ${SELECTED_COLOR}` : '1px solid transparent',
  boxShadow: isSelected ? '0 0 8px rgba(64, 64, 64, 0.2)' : 'none',
  transition: 'all 0.2s ease',
}}>
  {content}
</div>
```

---

## 🎯 デザイン原則

### 1. ミニマリズム
- 不要な装飾を排除
- 情報の階層を明確に
- 余白を効果的に活用

### 2. 一貫性
- 全コンポーネントで同じスケールを使用
- シャドウのみで境界を表現（ボーダーレス）
- グレースケールを基本とした配色

### 3. アクセシビリティ
- コントラスト比4.5:1以上を確保
- フォーカス状態を明示
- タッチターゲットサイズ44px以上

### 4. パフォーマンス
- CSSトランジションを優先
- 複雑なアニメーションは避ける
- レンダリングコストを最小化

---

## 🚀 実装ガイド

### 新規コンポーネント作成時のチェックリスト

- [ ] `designSystem.ts`からカラーとスケールをインポート
- [ ] ハードコードされた色を使わない
- [ ] 標準シャドウを使用（ボーダーは使わない）
- [ ] 白銀比スケールでスペーシングを設定
- [ ] ホバー・フォーカス状態を実装
- [ ] レスポンシブ対応を確認
- [ ] アクセシビリティを確認（コントラスト、フォーカス）

### デバッグ時の確認項目

1. **カラー**: すべて`COLORS`オブジェクトから取得しているか？
2. **スペーシング**: `SPACING_SCALE`を使用しているか？
3. **シャドウ**: `SHADOW`定数を使用しているか？
4. **トランジション**: `transition: all 0.2s ease`を設定したか？
5. **レスポンシブ**: モバイル/タブレット/デスクトップで表示確認したか？

---

## 📚 関連ドキュメント

- [アーキテクチャ](./architecture.md)
- [API統合](./api-integration.md)
- [起動ガイド](./startup-guide.md)
- [要件定義](./requirements.md)

---

**最終更新**: 2025-10-25  
**バージョン**: 1.0.0  
**メンテナー**: UL Gear Team

