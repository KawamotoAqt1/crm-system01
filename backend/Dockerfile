# バックエンド用 Dockerfile
FROM node:18-alpine

# 作業ディレクトリ設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY prisma ./prisma/

# 依存関係インストール
RUN npm ci --only=production

# TypeScript と Prisma のセットアップ
RUN npm install -g typescript prisma
RUN npx prisma generate

# アプリケーションコードをコピー
COPY . .

# TypeScript ビルド
RUN npm run build

# アップロードディレクトリ作成
RUN mkdir -p uploads

# 本番用ユーザー作成（セキュリティ向上）
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# ファイル権限設定
RUN chown -R nodejs:nodejs /app
USER nodejs

# ポート公開
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# アプリケーション起動
CMD ["npm", "start"]