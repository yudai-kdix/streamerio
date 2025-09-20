# フロントエンド (viewer-frontend)

視聴者向け Web ページ。Next.js (App Router) ＋ Tailwind CSS を使用しています。

必須環境: Node.js 20.x（.nvmrc と engines に準拠）

## セットアップ
1. 依存関係をインストール（Tailwind/ESLint9 を含む）

```bash
npm i
```

2. 環境変数を設定

`.env.example` を参考に `.env.local` を作成し、バックエンドの URL を設定します。

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## 開発サーバの起動
```bash
npm run dev
```

## 仕様の要点
- ページ表示時に `GET /get_viewer_id` を呼び出し、`viewer_id` を取得・Cookie 保存。
- `streamer_id` はクエリパラメータを最優先し Cookie に保存。既存 Cookie と異なる場合は `viewer_id` を再取得。
- ボタン押下で `POST /api/rooms/{streamer_id}/events` に以下の JSON を送信します。

```json
{
  "button_name": "enemy1 | enemy2 | enemy3 | skill1 | skill2 | skill3",
  "streamer_id": "...",
  "viewer_id": "..."
}
```

## ディレクトリ
- `src/app` … ページ本体とグローバルスタイル（Tailwind 読み込み）

## Lint
- ESLint 9 系に更新済みです。以下でチェックできます。

```bash
npm run lint
```
- `src/components` … ボタンレイアウト
- `src/lib` … Cookie/API ユーティリティ
- `assets` … 背景・ボタン画像（既存）

## 注意
- `rooms/{id}` の `{id}` は `streamer_id` を利用する想定です。相違がある場合は `src/app/page.tsx` 内の指定を変更してください。
