# MGreen - わが家の植物ノート

家族の植物をエリアごとに管理し、写真付きで成長を記録するウェブアプリ（Phase 1）。

## 機能（Phase 1）

- 家族アカウント（Supabase Auth）
- エリア管理（屋外・室内）
- 植物登録（ニックネーム・種類・植えた日）
- 写真付き成長記録とタイムライン表示
- 家族共有（同一世帯のデータを共有）

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase（Auth / Database / Storage）
- Vercel（デプロイ）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) で新しいプロジェクトを作成
2. SQL Editor で `supabase/migrations/001_initial_schema.sql` の内容を実行
3. Authentication → Providers で Email を有効化
4. （開発時）Authentication → Email で「Confirm email」を無効にすると、確認メールなしで登録できます

### 3. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に Supabase の URL と anon key を設定します。

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開き、アカウントを作成してログインします。

### スマホからアクセスする（開発時）

スマホのブラウザで `localhost` は **使えません**（スマホ自身を指してしまうため）。

1. PC とスマホを **同じ Wi-Fi** に接続する
2. PC で `npm run dev` を起動する（ターミナルに `Network: http://192.168.x.x:3000` と表示される）
3. スマホのブラウザで **その Network の URL** を開く（例: `http://192.168.0.20:3000`）

**Supabase の設定（ログインがうまくいかない場合）**

Supabase ダッシュボード → Authentication → URL Configuration に以下を追加:

- Site URL: `http://192.168.0.20:3000`（お使いの IP に合わせる）
- Redirect URLs: `http://192.168.0.20:3000/**`

`localhost` 用の URL も残しておくと、PC とスマホの両方で開発できます。

**接続できない場合**

- Mac のファイアウォールで Node.js の受信を許可する
- スマホがモバイルデータではなく Wi-Fi になっているか確認する

## 家族メンバーの追加

現時点では、別の家族メンバーが同じ世帯に参加する機能は未実装です。  
お父さん・お母さんが同じアカウントを共有するか、Phase 2 で世帯招待機能を追加する想定です。

## Vercel へのデプロイ

1. GitHub にリポジトリを push
2. Vercel でインポート
3. 環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`（本番 URL、例: `https://mgreen.vercel.app`）
4. Supabase の Authentication → URL Configuration に本番 URL を追加

## 今後の予定（Phase 2 以降）

- 植物マスターデータ（育て方・季節ケア）
- ルールベースのおすすめ表示
- 困ったときの対処ガイド
- 世帯招待（家族メンバー追加）

## プロジェクト構成

```
src/
  app/
    (app)/          # 認証後の画面
      page.tsx      # ダッシュボード
      areas/        # エリア管理
      plants/       # 植物詳細・成長記録
    login/          # ログイン・新規登録
    auth/callback/  # 認証コールバック
    actions/        # Server Actions
  components/       # UI コンポーネント
  lib/supabase/     # Supabase クライアント
  types/            # 型定義
supabase/
  migrations/       # DB スキーマ
```
