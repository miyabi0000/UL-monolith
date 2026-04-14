# UL Gear Manager — Railway 用マルチステージビルド
# フロント + バックを単一の Express プロセスで配信する

# === Stage 1: ビルダー (フロント + バック両方をビルド) ===
FROM node:20-alpine AS builder

WORKDIR /app

# 依存解決（lockfile を含めてキャッシュ最適化）
COPY package.json package-lock.json ./
RUN npm ci

# ソースコピー
COPY . .

# フロント (vite) → /app/dist
RUN npm run build

# バック (tsc) → /app/server/dist (app.ts + scripts/migrate.ts 含む)
RUN npm run server:build

# === Stage 2: ランタイム ===
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# 本番依存のみ
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ビルド成果物 + マイグレーション SQL 本体
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/database ./server/database

EXPOSE 8000

# 起動: マイグレーション → サーバー起動 (両方とも compiled JS を node で実行)
CMD ["sh", "-c", "node server/dist/scripts/migrate.js && node server/dist/app.js"]
