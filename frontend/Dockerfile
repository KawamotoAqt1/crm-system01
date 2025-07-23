# フロントエンド用 Dockerfile

# Build stage
FROM node:18-alpine as build

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係インストール
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# 本番用ビルド
RUN npm run build

# Production stage
FROM nginx:alpine

# ビルド済みファイルをNginxに配置
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx設定ファイル
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート公開
EXPOSE 80

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx起動
CMD ["nginx", "-g", "daemon off;"]