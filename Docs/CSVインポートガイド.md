# CSVインポートガイド

## 概要
このガイドでは、従業員データをCSVファイルからシステムにインポートする方法について説明します。

## ファイル構成

### 1. 修正済みCSVファイル
- `employee_template_corrected.csv` - システム対応済みの従業員データ

### 2. マッピングファイル
- `department_position_mapping.csv` - 部署・役職のIDマッピング

## カラム仕様

| カラム名 | 説明 | 必須 | 形式 | 例 |
|---------|------|------|------|-----|
| 社員ID | 社員ID | × | 文字列 | EMP001 |
| 姓 | 姓 | ○ | 文字列 | 田中 |
| 名 | 名 | ○ | 文字列 | 太郎 |
| フリガナ姓 | フリガナ姓 | ○ | 文字列 | タナカ |
| フリガナ名 | フリガナ名 | ○ | 文字列 | タロウ |
| 部署 | 部署名 | ○ | 文字列 | 総務部 |
| 役職 | 役職名 | ○ | 文字列 | 代表取締役 |
| 雇用形態 | 雇用形態 | ○ | 列挙値 | 正社員 |
| 入社日 | 入社日 | ○ | YYYY-MM-DD | 2020-04-01 |
| メールアドレス | メールアドレス | ○ | メール形式 | tanaka@example.com |
| 電話番号 | 電話番号 | × | 文字列 | 090-1234-5678 |
| 生年月日 | 生年月日 | × | YYYY-MM-DD | 1980-01-01 |
| 住所 | 住所 | × | 文字列 | 東京都渋谷区 |

## 雇用形態の値

| 日本語 | システム値 |
|--------|-----------|
| 正社員 | REGULAR |
| 契約社員 | CONTRACT |
| 派遣 | TEMPORARY |
| アルバイト | PART_TIME |

## 部署・役職名

### 利用可能な部署名
- 総務部
- 営業部
- 開発部
- 企画部
- 品質管理部

### 利用可能な役職名
- 代表取締役 (レベル10)
- 取締役 (レベル9)
- 部長 (レベル8)
- 課長 (レベル7)
- 主任 (レベル6)
- 主席 (レベル5)
- senior (レベル4)
- 一般職 (レベル1)

## データ品質チェック

インポート前に以下の点を確認してください：

1. **必須フィールドの入力**
   - 姓, 名, フリガナ姓, フリガナ名, 部署, 役職, 雇用形態, 入社日, メールアドレス

2. **データ形式の確認**
   - 日付形式: YYYY-MM-DD
   - メールアドレスの形式
   - 雇用形態の値が正しいか

3. **重複チェック**
   - 社員IDの重複（指定した場合）
   - メールアドレスの重複

4. **部署・役職の存在確認**
   - 指定した部署名、役職名が存在するか

## エラーハンドリング

インポート時に以下のエラーが発生する可能性があります：

- **必須フィールド未入力**: 該当フィールドを入力してください
- **無効な雇用形態**: 正社員, 契約社員, 派遣, アルバイトのいずれかを指定
- **無効な日付形式**: YYYY-MM-DD形式で入力
- **重複する社員ID**: 一意の社員IDを指定
- **重複するメールアドレス**: 一意のメールアドレスを指定
- **存在しない部署名**: 有効な部署名を指定
- **存在しない役職名**: 有効な役職名を指定

## サンプルデータ

```csv
社員ID,姓,名,フリガナ姓,フリガナ名,部署,役職,雇用形態,入社日,メールアドレス,電話番号,生年月日,住所
EMP001,田中,太郎,タナカ,タロウ,総務部,代表取締役,正社員,2020-04-01,tanaka@example.com,090-1234-5678,1980-01-01,東京都渋谷区
EMP002,佐藤,花子,サトウ,ハナコ,開発部,一般職,契約社員,2021-07-01,sato@example.com,090-9876-5432,1985-05-15,東京都新宿区
```

## 注意事項

1. **文字エンコーディング**: UTF-8で保存してください
2. **改行コード**: LF（Unix形式）またはCRLF（Windows形式）に対応
3. **ファイルサイズ**: 大量データの場合は分割インポートを推奨
4. **バックアップ**: インポート前に既存データのバックアップを取得
5. **部署・役職名**: システムに登録されている部署名・役職名と完全に一致している必要があります 