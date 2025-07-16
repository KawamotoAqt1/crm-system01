# CRM システム API設計書

## 基本情報

- **ベースURL**: `http://localhost:3001/api/v1`
- **認証方式**: JWT Bearer Token
- **レスポンス形式**: JSON
- **文字コード**: UTF-8

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": {}, // またはデータ配列
  "message": "操作が成功しました"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {} // 詳細情報（オプション）
  }
}
```

### ページネーション付きレスポンス
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 認証・認可 API

### POST /auth/login
ユーザーログイン

**リクエスト**:
```json
{
  "username": "user123",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "user123",
      "role": "EMPLOYEE",
      "employee": {
        "id": "uuid",
        "firstName": "太郎",
        "lastName": "田中"
      }
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### POST /auth/refresh
トークンリフレッシュ

### POST /auth/logout
ログアウト

### GET /auth/me
現在のユーザー情報取得

## 社員管理 API

### GET /employees
社員一覧取得

**クエリパラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `search`: 検索キーワード（名前、メール）
- `departmentId`: 部署ID
- `positionId`: 役職ID
- `employmentType`: 雇用形態
- `sortBy`: ソート項目（firstName, lastName, hireDate等）
- `sortOrder`: ソート順（asc, desc）

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "EMP001",
      "firstName": "太郎",
      "lastName": "田中",
      "email": "tanaka@company.com",
      "department": {
        "id": "uuid",
        "name": "営業部"
      },
      "position": {
        "id": "uuid",
        "name": "課長",
        "level": 7
      },
      "hireDate": "2023-04-01",
      "employmentType": "REGULAR"
    }
  ],
  "pagination": {...}
}
```

### GET /employees/:id
社員詳細取得

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "EMP001",
    "firstName": "太郎",
    "lastName": "田中",
    "firstNameKana": "タロウ",
    "lastNameKana": "タナカ",
    "email": "tanaka@company.com",
    "phone": "090-1234-5678",
    "department": {
      "id": "uuid",
      "name": "営業部"
    },
    "position": {
      "id": "uuid",
      "name": "課長",
      "level": 7
    },
    "hireDate": "2023-04-01",
    "employmentType": "REGULAR",
    "birthDate": "1990-01-01",
    "address": "東京都渋谷区...",
    "emergencyContact": "田中花子 090-9876-5432",
    "education": "○○大学経済学部卒業",
    "workHistory": "前職：△△会社（2020-2023）",
    "skills": "営業、プレゼンテーション、Excel",
    "photoUrl": "/uploads/photos/emp001.jpg",
    "notes": "営業成績優秀",
    "createdAt": "2023-04-01T00:00:00Z",
    "updatedAt": "2023-04-01T00:00:00Z"
  }
}
```

### POST /employees
社員新規登録

**リクエスト**:
```json
{
  "employeeId": "EMP002",
  "firstName": "花子",
  "lastName": "佐藤",
  "firstNameKana": "ハナコ",
  "lastNameKana": "サトウ",
  "email": "sato@company.com",
  "phone": "090-2345-6789",
  "departmentId": "uuid",
  "positionId": "uuid",
  "hireDate": "2024-04-01",
  "employmentType": "REGULAR",
  "birthDate": "1992-03-15",
  "address": "東京都新宿区...",
  "emergencyContact": "佐藤太郎 090-8765-4321",
  "education": "△△大学法学部卒業",
  "skills": "法務、契約書作成"
}
```

### PUT /employees/:id
社員情報更新

### DELETE /employees/:id
社員削除（論理削除）

### GET /employees/:id/photo
社員写真取得

### POST /employees/:id/photo
社員写真アップロード

## 部署管理 API

### GET /departments
部署一覧取得

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "営業部",
      "description": "営業活動を担当する部署",
      "employeeCount": 15,
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### GET /departments/:id
部署詳細取得

### POST /departments
部署新規作成

### PUT /departments/:id
部署情報更新

### DELETE /departments/:id
部署削除

## 役職管理 API

### GET /positions
役職一覧取得

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "課長",
      "level": 7,
      "description": "課の責任者",
      "employeeCount": 8,
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### GET /positions/:id
役職詳細取得

### POST /positions
役職新規作成

### PUT /positions/:id
役職情報更新

### DELETE /positions/:id
役職削除

## データエクスポート API

### GET /employees/export
社員データエクスポート

**クエリパラメータ**:
- `format`: エクスポート形式（csv, excel）
- `fields`: 出力フィールド指定
- `filters`: フィルター条件

**レスポンス**: ファイルダウンロード

### GET /departments/export
部署データエクスポート

### GET /positions/export
役職データエクスポート

## 検索・統計 API

### GET /search
全体検索

**クエリパラメータ**:
- `q`: 検索キーワード
- `type`: 検索対象（employees, departments, positions）

### GET /stats/dashboard
ダッシュボード統計情報

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "totalEmployees": 150,
    "totalDepartments": 8,
    "totalPositions": 12,
    "employmentTypeStats": {
      "REGULAR": 120,
      "CONTRACT": 20,
      "TEMPORARY": 8,
      "PART_TIME": 2
    },
    "departmentStats": [
      {
        "departmentName": "営業部",
        "employeeCount": 35
      }
    ],
    "recentHires": [
      {
        "id": "uuid",
        "firstName": "太郎",
        "lastName": "田中",
        "hireDate": "2024-07-01"
      }
    ]
  }
}
```

## エラーコード一覧

| コード | メッセージ | 説明 |
|--------|------------|------|
| AUTH_001 | 認証が必要です | 未認証 |
| AUTH_002 | 権限がありません | 認可エラー |
| AUTH_003 | トークンが無効です | JWT無効 |
| VALID_001 | バリデーションエラー | 入力値検証エラー |
| NOT_FOUND_001 | リソースが見つかりません | 指定されたリソース不存在 |
| CONFLICT_001 | データが既に存在します | 重複エラー |
| SERVER_001 | サーバーエラーが発生しました | 内部サーバーエラー |

## HTTP ステータスコード

- **200**: OK（取得成功）
- **201**: Created（作成成功）
- **204**: No Content（削除成功）
- **400**: Bad Request（バリデーションエラー）
- **401**: Unauthorized（認証エラー）
- **403**: Forbidden（認可エラー）
- **404**: Not Found（リソース不存在）
- **409**: Conflict（重複エラー）
- **500**: Internal Server Error（サーバーエラー）